import React from 'react';

const LoadingAnimation = ({ isVisible, size = 100, isDarkMode = false }) => {
  if (!isVisible) return null;

  return (
    <div style={{
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
      padding: '20px',
    }}>
      <div style={{
        background: isDarkMode ? '#1e293b' : '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '300px',
        width: '100%',
        boxShadow: isDarkMode 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
          : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb',
        position: 'relative',
        animation: 'modalSlideIn 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '120px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '16px',
          border: '2px solid transparent',
          borderRadius: '50%',
          background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
        }}>
          <span style={{
            fontSize: '48px',
            animation: 'spin 1s linear infinite',
            display: 'inline-block',
            lineHeight: '1'
          }}>
            ⏳
          </span>
        </div>
        <div style={{
          color: isDarkMode ? '#f1f5f9' : '#1f2937',
          fontSize: '16px',
          lineHeight: '1.5',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          Loading...
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation; 