import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

function ManagerView() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', age: '' });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState(null);
  const [actionMode, setActionMode] = useState(null); // 'edit' or 'delete'
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info'); // 'info', 'success', 'error'
  const [pendingDeleteAction, setPendingDeleteAction] = useState(null);
  // Track which driver images failed to load
  const [failedImages, setFailedImages] = useState(new Set());

  // API Configuration
  // Only use localhost if we're actually running on localhost (for local development)
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE_URL = isLocalDev
    ? 'http://localhost:3001'
    : 'https://liff-ot-app-arun-d0ff4972332c.herokuapp.com';

  // Dark mode detection
  useEffect(() => {
    const match = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(match.matches);
    const handler = (e) => setIsDarkMode(e.matches);
    match.addEventListener('change', handler);
    return () => match.removeEventListener('change', handler);
  }, []);

  // Fetch drivers with manager view data
  const fetchDrivers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(`[ManagerView] Fetching from: ${API_BASE_URL}/api/drivers/manager-view`);
      const response = await fetch(`${API_BASE_URL}/api/drivers/manager-view`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ManagerView] Response error: ${response.status}`, errorText);
        throw new Error(`Failed to fetch drivers: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[ManagerView] Received data:`, result);
      console.log(`[ManagerView] Drivers count: ${result.data?.length || 0}`);
      setDrivers(result.data || []);
    } catch (err) {
      console.error('[ManagerView] Error fetching drivers:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Add CSS animation for modal
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Handle checkbox selection
  const handleSelectDriver = (driverId) => {
    setSelectedDrivers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(driverId)) {
        newSet.delete(driverId);
      } else {
        newSet.add(driverId);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedDrivers.size === drivers.length) {
      setSelectedDrivers(new Set());
    } else {
      setSelectedDrivers(new Set(drivers.map(d => d.id)));
    }
  };

  // Handle edit driver - enter selection mode
  const handleEditClick = () => {
    setActionMode('edit');
    setSelectedDrivers(new Set());
  };

  // Handle delete driver - enter selection mode
  const handleDeleteClick = () => {
    setActionMode('delete');
    setSelectedDrivers(new Set());
  };

  // Handle edit driver (legacy - for single edit)
  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setEditForm({
      name: driver.name,
      age: driver.age || ''
    });
    setIsEditing(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingDriver) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${editingDriver.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            name: editForm.name.trim(),
            age: editForm.age ? parseInt(editForm.age) : null
          }
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Failed to update driver');
      }

      setIsEditing(false);
      setEditingDriver(null);
      await fetchDrivers();
    } catch (err) {
      console.error('Error updating driver:', err);
      alert(`Error updating driver: ${err.message}`);
    }
  };

  // Show notification modal (same style as styled form)
  const showAlert = (message, type = 'info') => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    const driverIds = Array.from(selectedDrivers);
    if (driverIds.length === 0) {
      showAlert('Please select at least one driver to delete', 'error');
      return;
    }

    // Show confirmation modal first
    const driverNames = driverIds.map(id => {
      const driver = drivers.find(d => d.id === id);
      return driver?.name || 'Unknown';
    }).join(', ');

    // Store the action to execute after confirmation
    const deleteAction = async () => {
      try {
        await Promise.all(
          driverIds.map(id =>
            fetch(`${API_BASE_URL}/api/drivers/${id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              }
            })
          )
        );

        setSelectedDrivers(new Set());
        setActionMode(null);
        setPendingDeleteAction(null);
        await fetchDrivers();
        showAlert(`Successfully deleted ${driverIds.length} driver(s)`, 'success');
      } catch (err) {
        console.error('Error deleting drivers:', err);
        showAlert(`Error deleting driver(s): ${err.message}`, 'error');
      }
    };

    setPendingDeleteAction(() => deleteAction);
    showAlert(`Are you sure you want to delete ${driverIds.length} driver(s)?\n\n${driverNames}`, 'error');
  };

  // Execute pending delete action when modal is confirmed
  const executePendingDelete = async () => {
    if (pendingDeleteAction) {
      await pendingDeleteAction();
      setPendingDeleteAction(null);
    }
  };

  // Handle confirm edit
  const handleConfirmEdit = () => {
    const driverIds = Array.from(selectedDrivers);
    if (driverIds.length === 0) {
      showAlert('Please select at least one driver to edit', 'error');
      return;
    }

    if (driverIds.length > 1) {
      showAlert('Please select only one driver to edit', 'error');
      return;
    }

    // Open edit modal for the selected driver
    const driver = drivers.find(d => d.id === driverIds[0]);
    if (driver) {
      handleEdit(driver);
      setActionMode(null);
    }
  };

  // Handle delete driver(s) - legacy function
  const handleDelete = async (driverIds) => {
    try {
      await Promise.all(
        driverIds.map(id =>
          fetch(`${API_BASE_URL}/api/drivers/${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          })
        )
      );

      setSelectedDrivers(new Set());
      await fetchDrivers();
    } catch (err) {
      console.error('Error deleting drivers:', err);
      showAlert(`Error deleting driver(s): ${err.message}`, 'error');
    }
  };

  // Format date - handles both ISO dates and Thai date format (e.g., "4/11/2568")
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Check if it's a Thai date format (e.g., "4/11/2568")
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const thaiYear = parseInt(parts[2]);

          // Check if it's a Thai Buddhist year (>= 2400) or Gregorian year
          if (thaiYear >= 2400) {
            // Convert Thai Buddhist year to Gregorian year
            const gregorianYear = thaiYear - 543;
            const date = new Date(gregorianYear, month - 1, day);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            }
          } else {
            // Try parsing as Gregorian date
            const date = new Date(thaiYear, month - 1, day);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            }
          }
        }
      }

      // Try parsing as ISO date string
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }

      // If all parsing fails, return the original string
      return dateString;
    } catch (error) {
      // If all parsing fails, return the original string
      return dateString || 'N/A';
    }
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  return (
    <div
      className={isDarkMode ? 'dark-mode' : ''}
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: isDarkMode
          ? "linear-gradient(135deg, #18181b 0%, #1e293b 100%)"
          : "linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)",
        display: isMobile() ? "block" : "flex",
        alignItems: isMobile() ? "flex-start" : "center",
        justifyContent: isMobile() ? "flex-start" : "center",
        margin: 0,
        paddingTop: isMobile() ? "10px" : "0",
        paddingLeft: isMobile() ? "5px" : "0",
        paddingRight: isMobile() ? "5px" : "0",
        paddingBottom: isMobile() ? "10px" : "0",
        boxSizing: "border-box",
      }}
    >
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/prod')}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          padding: '8px 16px',
          borderRadius: '20px',
          border: 'none',
          background: isDarkMode ? '#334155' : '#e2e8f0',
          color: isDarkMode ? '#f1f5f9' : '#1f2937',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        }}
      >
        ← Back to Attendance
      </button>

      {/* Main Container */}
      <div
        style={{
          width: isMobile() ? "80vw" : "90vw",
          maxWidth: isMobile() ? 500 : 1200,
          margin: isMobile() ? "60px auto 20px" : "0 auto",
          border: isDarkMode ? "1px solid #334155" : "1px solid #ccc",
          borderRadius: "18px",
          boxShadow: isDarkMode
            ? "0 4px 24px 0 rgba(0,0,0,0.32)"
            : "0 4px 24px 0 rgba(0,0,0,0.08)",
          padding: isMobile() ? "40px 24px 20px 24px" : "40px 24px",
          background: isDarkMode ? "#18181b" : "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          color: isDarkMode ? "#f1f5f9" : undefined,
          minHeight: isMobile() ? "85vh" : "auto",
          position: "relative",
        }}
      >
        {/* Header */}
        <div>
          <h1 style={{
            textAlign: "center",
            marginBottom: 10,
            marginTop: 0,
            fontWeight: 700,
            fontSize: isMobile() ? 24 : 28,
            color: isDarkMode ? "#f1f5f9" : undefined
          }}>
            Driver Management
          </h1>
          <div style={{
            textAlign: "center",
            marginBottom: 20,
            color: isDarkMode ? '#cbd5e1' : '#555',
            fontSize: 14,
          }}>
            Review and manage drivers
          </div>
        </div>

        {/* Action Buttons - Top Right */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginBottom: actionMode ? '16px' : '0'
        }}>
          <button
            onClick={handleEditClick}
            style={{
              padding: '8px 16px',
              background: actionMode === 'edit' ? '#3b82f6' : (isDarkMode ? '#334155' : '#e2e8f0'),
              color: actionMode === 'edit' ? '#ffffff' : (isDarkMode ? '#f1f5f9' : '#1f2937'),
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (actionMode !== 'edit') {
                e.target.style.background = isDarkMode ? '#475569' : '#cbd5e1';
              }
            }}
            onMouseOut={(e) => {
              if (actionMode !== 'edit') {
                e.target.style.background = isDarkMode ? '#334155' : '#e2e8f0';
              }
            }}
          >
            {actionMode === 'edit' ? 'Edit Mode' : 'Edit'}
          </button>
          <button
            onClick={handleDeleteClick}
            style={{
              padding: '8px 16px',
              background: actionMode === 'delete' ? '#ef4444' : (isDarkMode ? '#334155' : '#e2e8f0'),
              color: actionMode === 'delete' ? '#ffffff' : (isDarkMode ? '#f1f5f9' : '#1f2937'),
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (actionMode !== 'delete') {
                e.target.style.background = isDarkMode ? '#475569' : '#cbd5e1';
              }
            }}
            onMouseOut={(e) => {
              if (actionMode !== 'delete') {
                e.target.style.background = isDarkMode ? '#334155' : '#e2e8f0';
              }
            }}
          >
            {actionMode === 'delete' ? 'Delete Mode' : 'Delete'}
          </button>
          {actionMode && (
            <button
              onClick={() => setActionMode(null)}
              style={{
                padding: '8px 16px',
                background: isDarkMode ? '#475569' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>
          )}
        </div>

        {/* Selection Info */}
        {actionMode && selectedDrivers.size > 0 && (
          <div style={{
            padding: '12px 16px',
            background: isDarkMode ? '#1e293b' : '#f0f9ff',
            border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
            borderRadius: '8px',
            color: isDarkMode ? '#f1f5f9' : '#0369a1',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {selectedDrivers.size} driver(s) selected
          </div>
        )}

        {/* Edit Modal */}
        {isEditing && editingDriver && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }} onClick={() => setIsEditing(false)}>
            <div style={{
              background: isDarkMode ? '#1e293b' : '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: isDarkMode
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
                : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb',
            }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginTop: 0, marginBottom: '20px', color: isDarkMode ? '#f1f5f9' : '#1f2937' }}>
                Edit Driver
              </h2>
              <div style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: isDarkMode ? '#cbd5e1' : '#374151' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDarkMode ? '#334155' : '#d1d5db'}`,
                    borderRadius: '6px',
                    background: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                />
              </div>
              <div style={{ marginBottom: '24px', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: isDarkMode ? '#cbd5e1' : '#374151' }}>
                  Age
                </label>
                <input
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDarkMode ? '#334155' : '#d1d5db'}`,
                    borderRadius: '6px',
                    background: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    maxWidth: '100%',
                    overflow: 'hidden'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: isDarkMode ? '#334155' : '#e2e8f0',
                    color: isDarkMode ? '#f1f5f9' : '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editForm.name.trim()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: !editForm.name.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    opacity: !editForm.name.trim() ? 0.5 : 1
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
              Loading drivers...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{
            padding: '16px',
            background: isDarkMode ? '#7f1d1d' : '#fee2e2',
            border: `1px solid ${isDarkMode ? '#991b1b' : '#fecaca'}`,
            borderRadius: '8px',
            color: isDarkMode ? '#fecaca' : '#991b1b',
            marginBottom: '16px'
          }}>
            Error: {error}
          </div>
        )}

        {/* Table/Card Container */}
        {!isLoading && !error && (
          <div style={{
            background: isDarkMode ? '#27272a' : '#f9fafb',
            borderRadius: '12px',
            overflow: isMobile() ? 'auto' : 'hidden',
            maxHeight: isMobile() ? 'calc(85vh - 200px)' : 'none',
            border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb'
          }}>
            {/* Desktop Table */}
            {!isMobile() && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{
                    background: isDarkMode ? '#0f172a' : '#f8fafc',
                    borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
                  }}>
                    {actionMode && (
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                        <input
                          type="checkbox"
                          checked={selectedDrivers.size === drivers.length && drivers.length > 0}
                          onChange={handleSelectAll}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                    )}
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#64748b' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#64748b' }}>Age</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#64748b' }}>Account Created</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#64748b' }}>Last Clock In</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#64748b' }}>Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.length === 0 ? (
                    <tr>
                      <td colSpan={actionMode ? "6" : "6"} style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                        No drivers found
                      </td>
                    </tr>
                  ) : (
                    drivers.map((driver) => (
                      <tr key={driver.id} style={{
                        borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                        background: selectedDrivers.has(driver.id)
                          ? (isDarkMode ? '#1e293b' : '#f0f9ff')
                          : 'transparent'
                      }}>
                        {actionMode && (
                          <td style={{ padding: '12px' }}>
                            <input
                              type="checkbox"
                              checked={selectedDrivers.has(driver.id)}
                              onChange={() => handleSelectDriver(driver.id)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                        )}
                        <td style={{ padding: '12px', fontWeight: 500, color: isDarkMode ? '#f1f5f9' : '#1f2937' }}>{driver.name}</td>
                        <td style={{ padding: '12px', color: isDarkMode ? '#cbd5e1' : '#64748b' }}>{driver.age || 'N/A'}</td>
                        <td style={{ padding: '12px', fontSize: '14px', color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
                          {driver.user?.createdAt ? formatDate(driver.user.createdAt) : (driver.createdAt ? formatDate(driver.createdAt) : 'N/A')}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
                          {driver.lastClockIn ? (
                            <div>
                              <div>{formatDate(driver.lastClockIn.date)}</div>
                              <div style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#9ca3af' }}>
                                {formatTime(driver.lastClockIn.time)}
                              </div>
                            </div>
                          ) : 'Never'}
                        </td>
                        <td style={{ padding: '12px', position: 'relative' }}>
                          {driver.photo?.url && !failedImages.has(driver.id) ? (
                            <img
                              src={driver.photo.url}
                              alt={driver.name}
                              style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: `2px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                                display: 'block'
                              }}
                              onError={(e) => {
                                console.error(`[ManagerView] Image failed to load for driver ${driver.id}:`, driver.photo.url);
                                setFailedImages(prev => new Set(prev).add(driver.id));
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log(`[ManagerView] Image loaded successfully for driver ${driver.id}:`, driver.photo.url);
                              }}
                            />
                          ) : null}
                          <div
                            style={{
                              display: (!driver.photo?.url || failedImages.has(driver.id)) ? 'flex' : 'none',
                              width: '50px',
                              height: '50px',
                              borderRadius: '8px',
                              background: isDarkMode ? '#334155' : '#e2e8f0',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isDarkMode ? '#94a3b8' : '#64748b',
                              fontSize: '20px',
                              fontWeight: 600,
                              border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                              position: 'relative'
                            }}
                          >
                            {driver.name ? driver.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* Mobile Card View */}
            {isMobile() && (
              <div style={{ padding: '16px' }}>
                {actionMode && (
                  <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedDrivers.size === drivers.length && drivers.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: isDarkMode ? '#f1f5f9' : '#1f2937' }}>
                      Select All ({selectedDrivers.size}/{drivers.length})
                    </span>
                  </div>
                )}
                {drivers.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                    No drivers found
                  </div>
                ) : (
                  drivers.map((driver) => (
                    <div
                      key={driver.id}
                      style={{
                        padding: '16px',
                        marginBottom: '12px',
                        background: isDarkMode ? '#0f172a' : '#ffffff',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                        boxShadow: isDarkMode
                          ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
                          : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
                        {actionMode && (
                          <input
                            type="checkbox"
                            checked={selectedDrivers.has(driver.id)}
                            onChange={() => handleSelectDriver(driver.id)}
                            style={{ cursor: 'pointer', marginTop: '4px' }}
                          />
                        )}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {driver.photo?.url && !failedImages.has(driver.id) ? (
                            <img
                              src={driver.photo.url}
                              alt={driver.name}
                              style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '10px',
                                objectFit: 'cover',
                                border: `2px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                                display: 'block'
                              }}
                              onError={(e) => {
                                console.error(`[ManagerView] Image failed to load for driver ${driver.id}:`, driver.photo.url);
                                setFailedImages(prev => new Set(prev).add(driver.id));
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log(`[ManagerView] Image loaded successfully for driver ${driver.id}:`, driver.photo.url);
                              }}
                            />
                          ) : null}
                          <div
                            style={{
                              display: (!driver.photo?.url || failedImages.has(driver.id)) ? 'flex' : 'none',
                              width: '60px',
                              height: '60px',
                              borderRadius: '10px',
                              background: isDarkMode ? '#334155' : '#e2e8f0',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isDarkMode ? '#94a3b8' : '#64748b',
                              fontSize: '24px',
                              fontWeight: 600,
                              border: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }}
                          >
                            {driver.name ? driver.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: isDarkMode ? '#f1f5f9' : '#1f2937' }}>
                            {driver.name}
                          </div>
                          <div style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                            Age: {driver.age || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '12px', paddingLeft: actionMode ? '28px' : '0' }}>
                        <div style={{ marginBottom: '4px' }}>
                          Account Created: {driver.user?.createdAt ? formatDate(driver.user.createdAt) : (driver.createdAt ? formatDate(driver.createdAt) : 'N/A')}
                        </div>
                        <div>
                          Last Clock In: {driver.lastClockIn ? `${formatDate(driver.lastClockIn.date)} ${formatTime(driver.lastClockIn.time)}` : 'Never'}
                        </div>
                      </div>
                      {!actionMode && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button
                            onClick={() => handleEdit(driver)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              background: '#3b82f6',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 500,
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = '#2563eb';
                              e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = '#3b82f6';
                              e.target.style.transform = 'translateY(0)';
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDrivers(new Set([driver.id]));
                              setActionMode('delete');
                              showAlert(`Are you sure you want to delete ${driver.name}?`, 'error');
                            }}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              background: '#ef4444',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 500,
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = '#dc2626';
                              e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = '#ef4444';
                              e.target.style.transform = 'translateY(0)';
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Confirm Button - Bottom Right */}
        {actionMode && selectedDrivers.size > 0 && (
          <button
            onClick={() => {
              if (actionMode === 'delete') {
                handleConfirmDelete();
              } else if (actionMode === 'edit') {
                handleConfirmEdit();
              }
            }}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
              padding: '12px 24px',
              background: actionMode === 'delete' ? '#ef4444' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            }}
          >
            {actionMode === 'delete' ? 'Confirm Delete' : 'Confirm Edit'}
          </button>
        )}

        {/* Notification Modal - Same style as StyledForm */}
        {showModal && (
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
              zIndex: 10000,
              padding: '20px',
            }}
            onClick={() => {
              setShowModal(false);
              setPendingDeleteAction(null);
            }}
          >
            <div
              style={{
                background: isDarkMode ? '#1e293b' : '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: isDarkMode
                  ? '0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
                  : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                position: 'relative',
                animation: 'modalSlideIn 0.3s ease-out',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                fontSize: '48px',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                {modalType === 'success' ? '✅' : modalType === 'error' ? '❌' : modalType === 'warning' ? '⚠️' : 'ℹ️'}
              </div>
              <div style={{
                color: isDarkMode ? '#f1f5f9' : '#1f2937',
                fontSize: '16px',
                lineHeight: '1.5',
                textAlign: 'center',
                marginBottom: '24px',
                whiteSpace: 'pre-line',
              }}>
                {modalMessage}
              </div>
              <button
                onClick={() => {
                  if (pendingDeleteAction && modalType === 'error') {
                    // Execute delete action
                    executePendingDelete();
                  }
                  setShowModal(false);
                  setPendingDeleteAction(null);
                }}
                style={{
                  background: modalType === 'error' ? '#ef4444' : modalType === 'success' ? '#10b981' : '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.opacity = '0.9';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {pendingDeleteAction && modalType === 'error' ? 'Confirm Delete' : 'OK'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerView;
