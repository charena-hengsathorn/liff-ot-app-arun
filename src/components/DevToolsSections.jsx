import React from 'react';
import { Calendar, Calculator, TestTube } from 'lucide-react';
import { ToolSection } from './DevToolsPanel';

/**
 * All Dev Tools Sections for the Sliding Panel
 * This component contains all dev tools moved from the main form
 */
export default function DevToolsSections({
  // Month/Year and Sheet Creation props
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  handleCreateSheet,
  handleCreateProdSheet,
  isCreatingSheet,

  // Manual Testing props
  manualTestData,
  handleManualTestChange,
  handleSubmitManualTest,
  isSubmittingManualTest,
  manualTestOTResult,
  clearManualTest,

  // Dev Tool Buttons props
  testAutoSubmit,
  clearExistingEntryCache,
  isLoadingData,
  setIsLoadingData,
  setIsSubmitting,
  approvalEnabled,
  setApprovalEnabled,

  // Other props
  browserLang
}) {
  // Panel dark theme styles
  const panelStyles = {
    label: {
      display: 'block',
      marginBottom: '6px',
      fontSize: '13px',
      fontWeight: '500',
      color: '#d1d5db',
      fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #374151',
      borderRadius: '6px',
      background: '#1f2937',
      color: '#f1f5f9',
      fontSize: '13px',
      fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '10px 14px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
    }
  };

  return (
    <>
      {/* Sheet Creator Section */}
      <ToolSection
        icon={<Calendar size={20} />}
        title="Sheet Creator"
        description="Create new monthly sheets"
        defaultOpen={false}
      >
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={panelStyles.label}>Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={panelStyles.input}
            >
              <option value={0}>January</option>
              <option value={1}>February</option>
              <option value={2}>March</option>
              <option value={3}>April</option>
              <option value={4}>May</option>
              <option value={5}>June</option>
              <option value={6}>July</option>
              <option value={7}>August</option>
              <option value={8}>September</option>
              <option value={9}>October</option>
              <option value={10}>November</option>
              <option value={11}>December</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={panelStyles.label}>Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={panelStyles.input}
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCreateSheet}
            disabled={isCreatingSheet}
            style={{
              ...panelStyles.button,
              flex: 1,
              background: isCreatingSheet ? '#6b7280' : '#3b82f6',
              color: '#ffffff'
            }}
            onMouseOver={(e) => !isCreatingSheet && (e.target.style.background = '#2563eb')}
            onMouseOut={(e) => !isCreatingSheet && (e.target.style.background = '#3b82f6')}
          >
            {isCreatingSheet ? '🔄 Creating...' : '📅 Create Dev Sheet'}
          </button>

          <button
            onClick={handleCreateProdSheet}
            disabled={isCreatingSheet}
            style={{
              ...panelStyles.button,
              flex: 1,
              background: isCreatingSheet ? '#6b7280' : '#dc2626',
              color: '#ffffff'
            }}
            onMouseOver={(e) => !isCreatingSheet && (e.target.style.background = '#b91c1c')}
            onMouseOut={(e) => !isCreatingSheet && (e.target.style.background = '#dc2626')}
          >
            {isCreatingSheet ? '🔄 Creating...' : '📅 Create Prod Sheet'}
          </button>
        </div>
      </ToolSection>

      {/* Manual Testing Section */}
      <ToolSection
        icon={<TestTube size={20} />}
        title="Manual Testing"
        description="Test form submissions"
        defaultOpen={true}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={panelStyles.label}>🌍 Test Environment</label>
            <select
              value={manualTestData?.testEnvironment || 'dev'}
              onChange={(e) => handleManualTestChange('testEnvironment', e.target.value)}
              style={panelStyles.input}
            >
              <option value="dev">Development</option>
              <option value="prod">Production</option>
            </select>
          </div>

          <div>
            <label style={panelStyles.label}>📊 Test Spreadsheet</label>
            <select
              value={manualTestData?.testSpreadsheet || ''}
              onChange={(e) => handleManualTestChange('testSpreadsheet', e.target.value)}
              style={panelStyles.input}
            >
              <option value="">Select a spreadsheet...</option>
              {manualTestData?.availableSheets?.map((sheetName) => (
                <option key={sheetName} value={sheetName}>{sheetName}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={panelStyles.label}>Test Date (DD/MM/YYYY) *</label>
            <input
              type="text"
              placeholder="e.g., 25/9/2568"
              value={manualTestData?.testDate || ''}
              onChange={(e) => handleManualTestChange('testDate', e.target.value)}
              style={panelStyles.input}
            />
          </div>

          <div>
            <label style={panelStyles.label}>Test User *</label>
            <input
              type="text"
              placeholder="e.g., Jean"
              value={manualTestData?.testUser || ''}
              onChange={(e) => handleManualTestChange('testUser', e.target.value)}
              style={panelStyles.input}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={panelStyles.label}>Clock In *</label>
              <input
                type="text"
                placeholder="e.g., 08:00"
                value={manualTestData?.clockIn || ''}
                onChange={(e) => handleManualTestChange('clockIn', e.target.value)}
                style={panelStyles.input}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={panelStyles.label}>Clock Out</label>
              <input
                type="text"
                placeholder="e.g., 18:00"
                value={manualTestData?.clockOut || ''}
                onChange={(e) => handleManualTestChange('clockOut', e.target.value)}
                style={panelStyles.input}
              />
            </div>
          </div>

          <div>
            <label style={panelStyles.label}>Comments</label>
            <input
              type="text"
              placeholder="e.g., Manual test for business rule"
              value={manualTestData?.comments || ''}
              onChange={(e) => handleManualTestChange('comments', e.target.value)}
              style={panelStyles.input}
            />
          </div>

          {manualTestOTResult && (
            <div style={{
              padding: '12px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#86efac'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>📊 OT Calculation Preview</div>
              <div>{manualTestOTResult.message || 'Missing date or clock-out time'}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={clearManualTest}
              style={{
                ...panelStyles.button,
                flex: 1,
                background: '#374151',
                color: '#d1d5db'
              }}
              onMouseOver={(e) => e.target.style.background = '#4b5563'}
              onMouseOut={(e) => e.target.style.background = '#374151'}
            >
              ✨ Clear
            </button>
            <button
              onClick={handleSubmitManualTest}
              disabled={isSubmittingManualTest}
              style={{
                ...panelStyles.button,
                flex: 2,
                background: isSubmittingManualTest ? '#6b7280' : '#10b981',
                color: '#ffffff'
              }}
              onMouseOver={(e) => !isSubmittingManualTest && (e.target.style.background = '#059669')}
              onMouseOut={(e) => !isSubmittingManualTest && (e.target.style.background = '#10b981')}
            >
              {isSubmittingManualTest ? '⏳ Submitting...' : '✏️ Submit Manual Test'}
            </button>
          </div>
        </div>
      </ToolSection>

      {/* Quick Actions Section */}
      <ToolSection
        icon={<TestTube size={20} />}
        title="Quick Actions"
        description="Development utilities"
        defaultOpen={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={testAutoSubmit}
            style={{
              ...panelStyles.button,
              background: '#f59e0b',
              color: '#ffffff'
            }}
            onMouseOver={(e) => e.target.style.background = '#d97706'}
            onMouseOut={(e) => e.target.style.background = '#f59e0b'}
          >
            🧪 Test Auto Submit
          </button>

          <button
            onClick={clearExistingEntryCache}
            style={{
              ...panelStyles.button,
              background: '#ef4444',
              color: '#ffffff'
            }}
            onMouseOver={(e) => e.target.style.background = '#dc2626'}
            onMouseOut={(e) => e.target.style.background = '#ef4444'}
          >
            🧹 Clear Cache
          </button>

          <button
            onClick={() => setIsLoadingData(!isLoadingData)}
            style={{
              ...panelStyles.button,
              background: isLoadingData ? '#ef4444' : '#8b5cf6',
              color: '#ffffff'
            }}
            onMouseOver={(e) => e.target.style.background = isLoadingData ? '#dc2626' : '#7c3aed'}
            onMouseOut={(e) => e.target.style.background = isLoadingData ? '#ef4444' : '#8b5cf6'}
          >
            {isLoadingData ? "🛑 Stop Loading" : "🔄 Start Loading"}
          </button>

          <button
            onClick={() => {
              setIsSubmitting(false);
              console.log('🔄 Manually reset isSubmitting flag');
            }}
            style={{
              ...panelStyles.button,
              background: '#dc2626',
              color: '#ffffff'
            }}
            onMouseOver={(e) => e.target.style.background = '#b91c1c'}
            onMouseOut={(e) => e.target.style.background = '#dc2626'}
          >
            🔧 Reset Stuck Flag
          </button>

          <button
            onClick={() => {
              setApprovalEnabled(!approvalEnabled);
              console.log(`🔄 Approval system ${!approvalEnabled ? 'enabled' : 'disabled'}`);
            }}
            style={{
              ...panelStyles.button,
              background: approvalEnabled ? '#10b981' : '#6b7280',
              color: '#ffffff'
            }}
            onMouseOver={(e) => e.target.style.background = approvalEnabled ? '#059669' : '#4b5563'}
            onMouseOut={(e) => e.target.style.background = approvalEnabled ? '#10b981' : '#6b7280'}
          >
            {approvalEnabled ? "✅ Approval System: ON" : "❌ Approval System: OFF"}
          </button>
        </div>
      </ToolSection>
    </>
  );
}
