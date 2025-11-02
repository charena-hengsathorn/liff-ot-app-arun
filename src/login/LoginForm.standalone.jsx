/**
 * Standalone LoginForm Component
 * Can be easily reused in other apps
 * 
 * Usage:
 * import LoginForm from './login/LoginForm.standalone';
 * 
 * Or with custom config:
 * import LoginForm from './login/LoginForm.standalone';
 * import { loginConfig } from './login/login.config';
 * 
 * <LoginForm config={loginConfig} />
 */

import { useState, useEffect } from "react";

// Default config - can be overridden via props
import { loginConfig } from './login.config.js';

// Helper functions (standalone - no dependencies)
function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

const setCookie = (name, value, days = 1) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const getBrowserLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  const lang = navigator.language || navigator.userLanguage;
  return lang.startsWith('th') ? 'th' : 'en';
};

// Loading component (minimal, self-contained)
const LoadingOverlay = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }}>⏳</div>
        <div style={{ marginTop: '16px', fontSize: '16px', fontWeight: '500' }}>Loading...</div>
      </div>
    </div>
  );
};

function LoginForm({ 
  config = loginConfig,
  onLoginSuccess = null,
  LoadingComponent = LoadingOverlay,
  className = '',
  style = {}
}) {
  const browserLang = getBrowserLanguage();
  const labels = config.labels[browserLang] || config.labels.en;
  const theme = config.theme;
  const API_BASE_URL = config.apiBaseURL();

  // State
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState({});

  // Load saved username
  useEffect(() => {
    const savedUsername = getCookie(config.cookieSettings.usernameCookieName);
    if (savedUsername) {
      setFormData(prev => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }
  }, [config.cookieSettings.usernameCookieName]);

  // Validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = labels.usernameRequired;
    }
    
    if (!formData.password.trim()) {
      errors.password = labels.passwordRequired;
    }
    
    setInvalidFields(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) setError('');
    if (invalidFields[name]) {
      setInvalidFields(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoggingIn(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          identifier: formData.username,
          password: formData.password,
          rememberMe: rememberMe
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || labels.loginError);
      }

      if (result.success || result.jwt) {
        // Save username if remember me
        if (rememberMe) {
          setCookie(config.cookieSettings.usernameCookieName, formData.username, config.cookieSettings.usernameCookieExpiry);
        } else {
          document.cookie = `${config.cookieSettings.usernameCookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        }

        // Store user info
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
        }

        // Custom success handler or default redirect
        if (onLoginSuccess) {
          onLoginSuccess(result);
        } else {
          const returnUrl = new URLSearchParams(window.location.search).get('return') || config.redirectAfterLogin();
          window.location.href = returnUrl;
        }
      } else {
        throw new Error(result.error || labels.invalidCredentials);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || labels.networkError);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div
      className={className}
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: theme.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
        ...style
      }}
    >
      <LoadingComponent isVisible={isLoggingIn} />

      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 400,
          background: theme.cardBackground,
          borderRadius: theme.borderRadius,
          padding: "32px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: "1px solid #e5e7eb"
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#1f2937",
            marginBottom: "8px",
            textAlign: "center",
            fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
          }}
        >
          {labels.title}
        </h1>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "12px",
              borderRadius: theme.inputBorderRadius,
              marginBottom: "20px",
              fontSize: "14px",
              border: "1px solid #fecaca"
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="username"
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}
          >
            {labels.username}
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={isLoggingIn}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: invalidFields.username
                ? `2px solid ${theme.errorColor}`
                : "1px solid #d1d5db",
              borderRadius: theme.inputBorderRadius,
              fontSize: "16px",
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
              boxSizing: "border-box",
              background: isLoggingIn ? "#f3f4f6" : "#ffffff",
              transition: "border-color 0.2s"
            }}
            placeholder="username"
          />
          {invalidFields.username && (
            <div style={{ color: theme.errorColor, fontSize: "12px", marginTop: "4px" }}>
              {invalidFields.username}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}
          >
            {labels.password}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoggingIn}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: invalidFields.password
                ? `2px solid ${theme.errorColor}`
                : "1px solid #d1d5db",
              borderRadius: theme.inputBorderRadius,
              fontSize: "16px",
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
              boxSizing: "border-box",
              background: isLoggingIn ? "#f3f4f6" : "#ffffff",
              transition: "border-color 0.2s"
            }}
            placeholder="••••••••"
          />
          {invalidFields.password && (
            <div style={{ color: theme.errorColor, fontSize: "12px", marginTop: "4px" }}>
              {invalidFields.password}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px"
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "14px",
              color: "#374151",
              cursor: "pointer",
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoggingIn}
              style={{
                marginRight: "8px",
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            {labels.rememberMe}
          </label>
          
          <a
            href="#"
            style={{
              fontSize: "14px",
              color: theme.primaryColor,
              textDecoration: "none"
            }}
            onClick={(e) => {
              e.preventDefault();
              alert("Forgot password feature coming soon");
            }}
          >
            {labels.forgotPassword}
          </a>
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
          style={{
            width: "100%",
            padding: "14px",
            background: isLoggingIn ? "#9ca3af" : theme.primaryColor,
            color: "#ffffff",
            border: "none",
            borderRadius: theme.inputBorderRadius,
            fontSize: "16px",
            fontWeight: "600",
            cursor: isLoggingIn ? "not-allowed" : "pointer",
            transition: "background 0.2s",
            fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
          }}
          onMouseOver={(e) => {
            if (!isLoggingIn) {
              e.target.style.background = theme.primaryHover;
            }
          }}
          onMouseOut={(e) => {
            if (!isLoggingIn) {
              e.target.style.background = theme.primaryColor;
            }
          }}
        >
          {isLoggingIn ? labels.loggingIn : labels.loginButton}
        </button>
      </form>
    </div>
  );
}

export default LoginForm;

