import React, { useState } from 'react';
import { X, Zap, Calculator, Calendar, FileSpreadsheet, Settings as SettingsIcon, ChevronDown, TestTube, Trash2, RotateCw, Play, StopCircle, AlertCircle, CheckCircle, Sun, Moon } from 'lucide-react';

/**
 * Sliding Dev Tools Panel
 * Contains all development and testing tools in organized sections
 *
 * @param {boolean} isOpen - Whether the panel is currently open
 * @param {Function} onClose - Handler for closing the panel
 * @param {Object} props - All dev tool props and handlers
 */
export default function DevToolsPanel({
  isOpen,
  onClose,
  // Environment props
  env,
  onEnvChange,
  // Children sections (we'll pass actual dev tool content as children)
  children,
  ...props
}) {
  const [lightMode, setLightMode] = useState(false);

  // Creative color schemes
  const theme = lightMode ? {
    // ✨ Light mode - Dreamy gradient with soft pastels
    background: 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #ddd6fe 100%)',
    headerBg: 'rgba(255, 255, 255, 0.95)',
    headerBorder: '#f3e8ff',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    cardBg: 'rgba(255, 255, 255, 0.7)',
    cardBorder: 'rgba(147, 51, 234, 0.2)',
    iconGradient: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)',
    iconColor: 'white',
    shadowColor: 'rgba(147, 51, 234, 0.15)',
  } : {
    // 🌙 Dark mode - Original cyberpunk style
    background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)',
    headerBg: 'rgba(17, 24, 39, 0.95)',
    headerBorder: '#374151',
    textPrimary: 'white',
    textSecondary: '#9ca3af',
    cardBg: 'rgba(31, 41, 55, 0.5)',
    cardBorder: 'rgba(55, 65, 81, 0.5)',
    iconGradient: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
    iconColor: 'white',
    shadowColor: 'rgba(147, 51, 234, 0.2)',
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 998,
            transition: 'opacity 0.3s ease',
            opacity: isOpen ? 1 : 0,
          }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel with Genie Effect (Desktop) / Slide Effect (Mobile) */}
      <div
        style={{
          position: 'fixed',
          zIndex: 999,
          overflowY: 'auto',
          overflowX: 'hidden',
          background: theme.background,

          // Desktop: Genie effect from gear icon (floating panel)
          ...(window.innerWidth >= 768 ? {
            left: '24px',
            top: 0, // Start from top to cover Manager View button
            bottom: '104px', // Above gear icon (24px + 56px gear + 24px margin)
            width: '420px',
            borderRadius: '16px',
            transformOrigin: 'bottom left', // Grow from gear icon position
            transform: isOpen ? 'scale(1)' : 'scale(0)',
            opacity: isOpen ? 1 : 0,
            boxShadow: isOpen
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 40px rgba(147, 51, 234, 0.2)'
              : 'none',
            transition: isOpen
              ? 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' // Genie pop-in with bounce
              : 'all 0.3s cubic-bezier(0.4, 0, 0.6, 1)', // Smooth collapse
          } : {
            // Mobile: Slide from left (existing behavior)
            left: 0,
            top: 0,
            height: '100%',
            width: '100%',
            borderRadius: 0,
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            transition: isOpen
              ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'transform 0.3s cubic-bezier(0.4, 0, 1, 1)',
          }),
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: theme.headerBg,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${theme.headerBorder}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: theme.iconGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${theme.shadowColor}`,
                }}
              >
                <Zap size={20} color={theme.iconColor} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: theme.textPrimary, margin: 0 }}>
                  Dev Tools
                </h2>
                <p style={{ fontSize: '12px', color: theme.textSecondary, margin: 0 }}>
                  Development & Testing
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Light/Dark Mode Toggle */}
              <button
                onClick={() => setLightMode(!lightMode)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: lightMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(147, 51, 234, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = lightMode ? 'rgba(251, 191, 36, 0.3)' : 'rgba(147, 51, 234, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.1) rotate(10deg)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = lightMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(147, 51, 234, 0.2)';
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                }}
                aria-label={lightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {lightMode ? <Moon size={16} color="#f59e0b" /> : <Sun size={16} color="#a78bfa" />}
              </button>
              {/* Close Button */}
              <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = lightMode ? 'rgba(0, 0, 0, 0.05)' : '#1f2937';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              aria-label="Close Dev Tools"
            >
              <X size={20} color={theme.textSecondary} />
            </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {/* Environment Toggle Section */}
          <ToolSection
            icon={<SettingsIcon size={20} />}
            title="Environment"
            description="Switch between dev and production"
            lightMode={lightMode}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <EnvironmentButton
                active={env === 'dev'}
                onClick={() => onEnvChange && onEnvChange('dev')}
                label="Development"
                color="blue"
              />
              <EnvironmentButton
                active={env === 'prod'}
                onClick={() => onEnvChange && onEnvChange('prod')}
                label="Production"
                color="green"
              />
            </div>
            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: env === 'dev' ? '#3b82f6' : '#10b981',
                }}
              />
              Currently using:{' '}
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: theme.textPrimary }}>
                {env}
              </span>
            </div>
          </ToolSection>

          {/* Children content (all dev tools sections will be passed here) */}
          {React.Children.map(children, child =>
            React.isValidElement(child)
              ? React.cloneElement(child, { lightMode })
              : child
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: theme.headerBg,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: `1px solid ${theme.headerBorder}`,
            padding: '16px',
          }}
        >
          <div style={{ textAlign: 'center', fontSize: '12px', color: theme.textSecondary }}>
            DevAdmin Mode • Press <kbd style={{
              padding: '2px 6px',
              background: lightMode ? 'rgba(0, 0, 0, 0.1)' : '#374151',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: theme.textPrimary
            }}>Esc</kbd> to close
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Reusable Tool Section Component
 * Provides consistent styling for each dev tool section
 */
export function ToolSection({ icon, title, description, children, defaultOpen = true, lightMode = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const theme = lightMode ? {
    cardBg: 'rgba(255, 255, 255, 0.7)',
    cardBorder: 'rgba(147, 51, 234, 0.2)',
    cardHover: 'rgba(147, 51, 234, 0.1)',
    iconBg: 'rgba(147, 51, 234, 0.1)',
    iconColor: '#8b5cf6',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
  } : {
    cardBg: 'rgba(31, 41, 55, 0.5)',
    cardBorder: 'rgba(55, 65, 81, 0.5)',
    cardHover: 'rgba(55, 65, 81, 0.3)',
    iconBg: 'rgba(55, 65, 81, 0.5)',
    iconColor: '#a78bfa',
    textPrimary: 'white',
    textSecondary: '#9ca3af',
  };

  return (
    <div
      style={{
        background: theme.cardBg,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '12px',
        border: `1px solid ${theme.cardBorder}`,
        overflow: 'hidden',
        marginTop: '16px',
        boxShadow: lightMode ? '0 4px 12px rgba(147, 51, 234, 0.08)' : 'none',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = theme.cardHover;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: theme.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.iconColor,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <h3 style={{ fontWeight: '600', color: theme.textPrimary, margin: 0, fontSize: '16px' }}>
              {title}
            </h3>
            <p style={{ fontSize: '12px', color: theme.textSecondary, margin: '4px 0 0 0' }}>
              {description}
            </p>
          </div>
        </div>
        <ChevronDown
          size={20}
          color={theme.textSecondary}
          style={{
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isOpen && (
        <div style={{ padding: '0 16px 16px 16px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Environment Toggle Button
 * Styled button for switching between dev/prod environments
 */
function EnvironmentButton({ active, onClick, label, color }) {
  const colors = {
    blue: {
      active: { background: '#3b82f6', color: 'white' },
      inactive: { background: '#1f2937', color: '#9ca3af' },
      hover: '#1f2937',
    },
    green: {
      active: { background: '#10b981', color: 'white' },
      inactive: { background: '#1f2937', color: '#9ca3af' },
      hover: '#1f2937',
    },
  };

  const style = active ? colors[color].active : colors[color].inactive;

  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        fontWeight: '500',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: active ? 'scale(1.05)' : 'scale(1)',
        boxShadow: active ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : 'none',
        ...style,
      }}
      onMouseOver={(e) => {
        if (!active) {
          e.currentTarget.style.background = colors[color].hover;
        }
      }}
      onMouseOut={(e) => {
        if (!active) {
          e.currentTarget.style.background = colors[color].inactive.background;
        }
      }}
    >
      {label}
    </button>
  );
}
