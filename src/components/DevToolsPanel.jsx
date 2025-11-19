import React, { useState } from 'react';
import { X, Zap, Calculator, Calendar, FileSpreadsheet, Settings as SettingsIcon, ChevronDown, TestTube, Trash2, RotateCw, Play, StopCircle, AlertCircle, CheckCircle } from 'lucide-react';

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

      {/* Sliding Panel */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100%',
          width: window.innerWidth < 640 ? '100%' : '400px',
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: isOpen
            ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' // Bounce in (genie effect)
            : 'transform 0.3s cubic-bezier(0.4, 0, 1, 1)', // Ease out
          zIndex: 999,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid #374151',
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
                  background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={20} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                  Dev Tools
                </h2>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                  Development & Testing
                </p>
              </div>
            </div>
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
                e.currentTarget.style.background = '#1f2937';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              aria-label="Close Dev Tools"
            >
              <X size={20} color="#9ca3af" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {/* Environment Toggle Section */}
          <ToolSection
            icon={<SettingsIcon size={20} />}
            title="Environment"
            description="Switch between dev and production"
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
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'white' }}>
                {env}
              </span>
            </div>
          </ToolSection>

          {/* Children content (all dev tools sections will be passed here) */}
          {children}
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid #374151',
            padding: '16px',
          }}
        >
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
            DevAdmin Mode • Press <kbd style={{
              padding: '2px 6px',
              background: '#374151',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '11px'
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
export function ToolSection({ icon, title, description, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        background: 'rgba(31, 41, 55, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '12px',
        border: '1px solid rgba(55, 65, 81, 0.5)',
        overflow: 'hidden',
        marginTop: '16px',
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
          e.currentTarget.style.background = 'rgba(55, 65, 81, 0.3)';
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
              background: 'rgba(55, 65, 81, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a78bfa',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <h3 style={{ fontWeight: '600', color: 'white', margin: 0, fontSize: '16px' }}>
              {title}
            </h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
              {description}
            </p>
          </div>
        </div>
        <ChevronDown
          size={20}
          color="#9ca3af"
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
