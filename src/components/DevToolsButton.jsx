import React from 'react';
import { Settings } from 'lucide-react';

/**
 * Floating Action Button for Dev Tools
 * Only visible to DevAdmin users
 *
 * @param {Function} onClick - Handler for button click
 * @param {boolean} isOpen - Whether the dev panel is currently open
 */
export default function DevToolsButton({ onClick, isOpen }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 1000,
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: !isOpen ? 'pulse-glow 2s infinite' : 'none',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 20px 35px -5px rgba(0, 0, 0, 0.4), 0 12px 15px -6px rgba(0, 0, 0, 0.3)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      aria-label="Open Dev Tools"
      title="Dev Tools (Ctrl+K)"
    >
      <Settings
        size={24}
        color="white"
        style={{
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
      />

      {/* Inline keyframes for pulse animation */}
      <style>
        {`
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2), 0 0 0 0 rgba(147, 51, 234, 0.7);
            }
            50% {
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2), 0 0 0 10px rgba(147, 51, 234, 0);
            }
          }
        `}
      </style>
    </button>
  );
}
