import { useState, useEffect } from "react";
import LoadingAnimation from '../components/LoadingAnimation';

// Helper functions (defined before component, like StyledForm)
function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

// Cookie helper functions
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

// Environment helper functions
const getEffectiveEnv = () => {
  return import.meta.env.DEV ? 'dev' : 'prod';
};

// API Configuration - matches StyledForm pattern
const getAPIBaseURL = () => {
  const isDev = import.meta.env.DEV;
  return isDev
    ? 'http://localhost:3001'
    : 'https://liff-ot-app-arun-d0ff4972332c.herokuapp.com';
};

// Language detection
const getBrowserLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  const lang = navigator.language || navigator.userLanguage;
  return lang.startsWith('th') ? 'th' : 'en';
};

// Labels (following StyledForm pattern)
const labels = {
  en: {
    login: "Login",
    username: "Username",
    password: "Password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    loginButton: "Sign In",
    loggingIn: "Logging in...",
    loginSuccess: "Login successful!",
    loginError: "Login failed",
    invalidCredentials: "Invalid username or password",
    usernameRequired: "Username is required",
    passwordRequired: "Password is required",
    networkError: "Network error. Please check your connection.",
    title: "Login to Attendance System"
  },
  th: {
    login: "เข้าสู่ระบบ",
    username: "ชื่อผู้ใช้",
    password: "รหัสผ่าน",
    rememberMe: "จดจำการเข้าสู่ระบบ",
    forgotPassword: "ลืมรหัสผ่าน?",
    loginButton: "เข้าสู่ระบบ",
    loggingIn: "กำลังเข้าสู่ระบบ...",
    loginSuccess: "เข้าสู่ระบบสำเร็จ!",
    loginError: "เข้าสู่ระบบล้มเหลว",
    invalidCredentials: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
    usernameRequired: "กรุณากรอกชื่อผู้ใช้",
    passwordRequired: "กรุณากรอกรหัสผ่าน",
    networkError: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
    title: "เข้าสู่ระบบบันทึกการเข้างาน"
  }
};

function LoginForm() {
  const browserLang = getBrowserLanguage();
  const API_BASE_URL = getAPIBaseURL();

  // State management (following StyledForm pattern)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState({});

  // Load saved username from cookie if remember me was checked
  useEffect(() => {
    const savedUsername = getCookie('loginUsername');
    if (savedUsername) {
      setFormData(prev => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }
  }, []);

  // Validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = labels[browserLang].usernameRequired;
    }
    
    if (!formData.password.trim()) {
      errors.password = labels[browserLang].passwordRequired;
    }
    
    setInvalidFields(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (error) setError('');
    if (invalidFields[name]) {
      setInvalidFields(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle login submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoggingIn(true);
    setError('');

    try {
      // Call Express backend /login endpoint which proxies to Strapi
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for session management
        body: JSON.stringify({
          identifier: formData.username,
          password: formData.password,
          rememberMe: rememberMe
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || labels[browserLang].loginError);
      }

      if (result.success || result.jwt) {
        // Save username to cookie if remember me is checked
        if (rememberMe) {
          setCookie('loginUsername', formData.username, 30);
        } else {
          document.cookie = `loginUsername=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        }

        // Store user info if provided
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
        }

        // Redirect to attendance form or return URL
        const returnUrl = new URLSearchParams(window.location.search).get('return') || '/';
        window.location.href = returnUrl;
      } else {
        throw new Error(result.error || labels[browserLang].invalidCredentials);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || labels[browserLang].networkError);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      {/* Loading animation */}
      <LoadingAnimation isVisible={isLoggingIn} />

      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: "1px solid #e5e7eb"
        }}
      >
        {/* Title */}
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
          {labels[browserLang].title}
        </h1>

        {/* Error message */}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
              border: "1px solid #fecaca"
            }}
          >
            {error}
          </div>
        )}

        {/* Username field */}
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
            {labels[browserLang].username}
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
                ? "2px solid #ef4444"
                : "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              boxSizing: "border-box",
              background: isLoggingIn ? "#f3f4f6" : "#ffffff",
              color: "#1f2937",
              transition: "border-color 0.2s",
              ...(browserLang === 'th' && { fontFamily: '"Noto Sans Thai", sans-serif' })
            }}
            placeholder="Enter your username"
          />
          {invalidFields.username && (
            <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
              {invalidFields.username}
            </div>
          )}
        </div>

        {/* Password field */}
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
            {labels[browserLang].password}
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
                ? "2px solid #ef4444"
                : "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              boxSizing: "border-box",
              background: isLoggingIn ? "#f3f4f6" : "#ffffff",
              color: "#1f2937",
              transition: "border-color 0.2s",
              ...(browserLang === 'th' && { fontFamily: '"Noto Sans Thai", sans-serif' })
            }}
            placeholder="••••••••"
          />
          {invalidFields.password && (
            <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
              {invalidFields.password}
            </div>
          )}
        </div>

        {/* Remember me checkbox */}
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
            {labels[browserLang].rememberMe}
          </label>
          
          <a
            href="#"
            style={{
              fontSize: "14px",
              color: "#3b82f6",
              textDecoration: "none"
            }}
            onClick={(e) => {
              e.preventDefault();
              // TODO: Implement forgot password
              alert("Forgot password feature coming soon");
            }}
          >
            {labels[browserLang].forgotPassword}
          </a>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoggingIn}
          style={{
            width: "100%",
            padding: "14px",
            background: isLoggingIn ? "#9ca3af" : "#3b82f6",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: isLoggingIn ? "not-allowed" : "pointer",
            transition: "background 0.2s",
            fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
          }}
          onMouseOver={(e) => {
            if (!isLoggingIn) {
              e.target.style.background = "#2563eb";
            }
          }}
          onMouseOut={(e) => {
            if (!isLoggingIn) {
              e.target.style.background = "#3b82f6";
            }
          }}
        >
          {isLoggingIn ? labels[browserLang].loggingIn : labels[browserLang].loginButton}
        </button>

        {/* Styles for autofill handling */}
        <style>
          {`
            /* Fix autofill text color for all browsers */
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus,
            input:-webkit-autofill:active {
              -webkit-text-fill-color: #1f2937 !important;
              -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
              transition: background-color 5000s ease-in-out 0s;
            }

            /* Firefox autofill */
            input:-moz-autofill,
            input:-moz-autofill-preview {
              color: #1f2937 !important;
              background-color: #ffffff !important;
            }
          `}
        </style>
      </form>
    </div>
  );
}

export default LoginForm;

