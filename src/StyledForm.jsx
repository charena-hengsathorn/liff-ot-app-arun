import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./components/ui/select";
import LoadingAnimation from './components/LoadingAnimation';
import { useDevAdminContext } from './contexts/DevAdminContext';
import { getSafeEnvironment } from './utils/envGuard';
import DevToolsButton from './components/DevToolsButton';
import DevToolsPanel, { ToolSection } from './components/DevToolsPanel';
import DevToolsSections from './components/DevToolsSections';
import { FileSpreadsheet, Calendar, Calculator, TestTube, Trash2, RotateCw, Play, StopCircle, AlertCircle, CheckCircle } from 'lucide-react';

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

function isIPhoneSE() {
  if (typeof window === "undefined") return false;
  // iPhone SE has screen width of 375px and height of 667px (portrait) or 375px (landscape)
  const width = window.screen.width;
  const height = window.screen.height;
  const isIPhone = /iPhone/.test(navigator.userAgent);
  
  // iPhone SE dimensions: 375x667 (portrait) or 667x375 (landscape)
  return isIPhone && ((width === 375 && height === 667) || (width === 667 && height === 375));
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

const clearCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Driver-specific cookie functions
const setDriverCookie = (driverName, field, value, days = 1) => {
  const cookieName = `${driverName}_${field}`;
  setCookie(cookieName, value, days);
};

const getDriverCookie = (driverName, field) => {
  const cookieName = `${driverName}_${field}`;
  return getCookie(cookieName);
};

const clearDriverCookie = (driverName, field) => {
  const cookieName = `${driverName}_${field}`;
  clearCookie(cookieName);
};

const clearAllDriverCookies = (driverName) => {
  clearDriverCookie(driverName, 'clockIn');
  clearDriverCookie(driverName, 'clockOut');
  clearDriverCookie(driverName, 'comments');
};

// Environment helper functions (defined before use)
const isProdPreview = () => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/prod';
};

const getEffectiveEnv = () => {
  // If we're in prod preview mode, always use 'dev' for API calls
  if (isProdPreview()) {
    return 'dev';
  }
  // Otherwise use normal environment detection
  return import.meta.env.DEV ? 'dev' : 'prod';
};

const getEffectiveUIEnv = () => {
  // If we're in prod preview mode, show prod UI but use dev backend
  if (isProdPreview()) {
    return 'prod';
  }
  // Check the UI environment cookie first
  const uiEnv = getCookie('uiEnvironment');
  if (uiEnv === 'dev' || uiEnv === 'prod') {
    return uiEnv;
  }
  // Otherwise use normal environment detection
  return import.meta.env.DEV ? 'dev' : 'prod';
};

const labels = {
  en: {
    driverName: "Driver Name",
    clockIn: "Clock In",
    clockOut: "Clock Out",
    comments: "Additional Comments",
    submit: "Submit Attendance",
    previous: "Previous OT Requests",
    title: "Attendance Form",
    selectYourName: "Select your name",
    // Alert messages
    noDataToAutoSubmit: "❌ No data to auto-submit. Please fill in some fields first.",
    testAutoSubmitSuccess: "🧪 Test auto-submission successful!",
    testAutoSubmitSuccessWithOT: "🧪 Test auto-submission successful!",
    testAutoSubmitFailed: "❌ Test auto-submission failed:",
    testAutoSubmitError: "❌ Error in test auto-submission:",
    enterDriverNameFirst: "❌ Please enter driver name first",
    addCommentsBeforeClockOut: "❌ Please add comments before clocking out",
    clockOutBefore4PM: "❌ Cannot clock out before 4:00 PM",
    foundExistingData: "✅ Found existing data for",
    today: "today:",
    notSet: "Not set",
    none: "None",
    fillRequiredFields: "❌ Please fill in all required fields marked in red.",
    duplicateEntry: "❌ An entry for this driver and date already exists in Google Sheets. Cannot submit duplicate.",
    dataSavedSuccessfully: "✅ Data saved successfully to Google Sheets!",
    clockInLabel: "🕒 Clock In:",
    clockOutLabel: "🕔 Clock Out:",
    commentsLabel: "📝 Comments:",
    dateLabel: "📅 Date:",
    dayOfWeekLabel: "📆 Day of Week:",
    driverLabel: "👤 Driver:",
    errorSavingData: "❌ Error saving data:",
    newOTRequest: "🆕 New OT Request:",
    submittedAt: "🆔 Submitted at:",
    approveOrDeny: "✅ Approve or ❌ Deny (w/reason)?",
    previousOTRequests: "📄 Previous OT Requests:",
    checkLineNotification: "Check LINE notification and Google Sheets.",
    checkGoogleSheets: "Check Google Sheets.",
    otHours: "OT Hours:",
    hours: "hours",
    ok: "OK",
    clockInSuccess: "✅ Clocked in successfully!",
    clockInSuccessMessage: "Clocked in successfully!",
  },
  th: {
    driverName: "ชื่อคนขับ",
    clockIn: "เวลาเข้างาน",
    clockOut: "เวลาเลิกงาน",
    comments: "หมายเหตุเพิ่มเติม",
    submit: "ยืนยัน",
    previous: "ดูรายการ OT",
    title: "บันทึกการเข้างาน",
    selectYourName: "เลือกชื่อของคุณ",
    // Alert messages
    noDataToAutoSubmit: "❌ ไม่มีข้อมูลสำหรับการส่งอัตโนมัติ กรุณากรอกข้อมูลบางส่วนก่อน",
    testAutoSubmitSuccess: "🧪 การทดสอบการส่งอัตโนมัติสำเร็จ!",
    testAutoSubmitSuccessWithOT: "🧪 การทดสอบการส่งอัตโนมัติสำเร็จ!",
    testAutoSubmitFailed: "❌ การทดสอบการส่งอัตโนมัติล้มเหลว:",
    testAutoSubmitError: "❌ เกิดข้อผิดพลาดในการทดสอบการส่งอัตโนมัติ:",
    enterDriverNameFirst: "❌ กรุณากรอกชื่อคนขับก่อน",
    addCommentsBeforeClockOut: "❌ กรุณาเพิ่มหมายเหตุก่อนการเลิกงาน",
    clockOutBefore4PM: "❌ ไม่สามารถเลิกงานก่อน 16:00 น.",
    foundExistingData: "✅ พบข้อมูลที่มีอยู่สำหรับ",
    today: "วันนี้:",
    notSet: "ยังไม่ได้ตั้งค่า",
    none: "ไม่มี",
    fillRequiredFields: "❌ กรุณากรอกข้อมูลในช่องที่จำเป็นทั้งหมดที่แสดงด้วยสีแดง",
    duplicateEntry: "❌ มีรายการสำหรับคนขับและวันที่นี้ใน Google Sheets แล้ว ไม่สามารถส่งข้อมูลซ้ำได้",
    dataSavedSuccessfully: "✅ บันทึกข้อมูลลงใน Google Sheets สำเร็จ!",
    clockInLabel: "🕒 เวลาเข้างาน:",
    clockOutLabel: "🕔 เวลาเลิกงาน:",
    commentsLabel: "📝 หมายเหตุ:",
    dateLabel: "📅 วันที่:",
    dayOfWeekLabel: "📆 วันในสัปดาห์:",
    driverLabel: "👤 คนขับ:",
    errorSavingData: "❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล:",
    newOTRequest: "🆕 คำขอ OT ใหม่:",
    submittedAt: "🆔 ส่งเมื่อ:",
    approveOrDeny: "✅ อนุมัติ หรือ ❌ ปฏิเสธ (พร้อมเหตุผล)?",
    previousOTRequests: "📄 คำขอ OT ก่อนหน้า:",
    checkLineNotification: "ตรวจสอบการแจ้งเตือน LINE และ Google Sheets",
    checkGoogleSheets: "ตรวจสอบ Google Sheets",
    otHours: "ชั่วโมง OT:",
    hours: "ชั่วโมง",
    ok: "ตกลง",
    clockInSuccess: "✅ บันทึกเวลาเข้างานสำเร็จ!",
    clockInSuccessMessage: "บันทึกเวลาเข้างานสำเร็จ!",
  }
};

function StyledForm() {
  const navigate = useNavigate();
  const location = useLocation();
  // DevAdmin context for conditional dev tools rendering
  const { isDevAdmin, loading: devAdminLoading } = useDevAdminContext();

  // Dev Tools Panel state
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  
  // Add CSS animation for modal
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@100;200;300;400;500;600;700;800;900&display=swap');

      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .noto-sans-thai {
        font-family: "Noto Sans Thai", sans-serif;
        font-optical-sizing: auto;
        font-weight: 400;
        font-style: normal;
        font-variation-settings: "wdth" 100;
      }

      .noto-sans-thai-light {
        font-family: "Noto Sans Thai", sans-serif;
        font-optical-sizing: auto;
        font-weight: 300;
        font-style: normal;
        font-variation-settings: "wdth" 100;
      }

      .noto-sans-thai-medium {
        font-family: "Noto Sans Thai", sans-serif;
        font-optical-sizing: auto;
        font-weight: 500;
        font-style: normal;
        font-variation-settings: "wdth" 100;
      }

      .noto-sans-thai-bold {
        font-family: "Noto Sans Thai", sans-serif;
        font-optical-sizing: auto;
        font-weight: 700;
        font-style: normal;
        font-variation-settings: "wdth" 100;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Keyboard shortcuts for Dev Tools Panel
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Escape to close dev panel
      if (e.key === 'Escape' && isDevPanelOpen) {
        setIsDevPanelOpen(false);
      }
      // Ctrl/Cmd + K to toggle dev panel (DevAdmin only)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && isDevAdmin) {
        e.preventDefault();
        setIsDevPanelOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDevPanelOpen, isDevAdmin]);

  // Remove OT Start/End from formData
  const [formData, setFormData] = useState({
    driverName: '',
    clockIn: '',
    clockOut: '',
    comments: ''
  });

  // Add day of week state
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [invalidFields, setInvalidFields] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSubmitted, setIsAutoSubmitted] = useState(false);
  const [originalData, setOriginalData] = useState(null); // Track original data from Google Sheets
  const [changedFields, setChangedFields] = useState({}); // Track which fields have been changed
  const [isLoadingData, setIsLoadingData] = useState(false); // Loading state for data fetching
  const [isSavingComments, setIsSavingComments] = useState(false); // Loading state for comments saving
  const [approvalEnabled, setApprovalEnabled] = useState(false); // Approval system toggle
  
  // Manual OT calculation state
  const [manualOTEnv, setManualOTEnv] = useState('dev'); // Environment for manual OT calculation
  const [manualOTData, setManualOTData] = useState({
    driverName: '',
    thaiDate: '',
    clockIn: '',
    clockOut: '',
    rowNumber: ''
  });
  const [isCalculatingOT, setIsCalculatingOT] = useState(false); // Loading state for OT calculation
  const [manualOTResult, setManualOTResult] = useState(null); // Results from manual OT calculation
  
  // Enhanced OT calculation state
  const [otCalculationData, setOtCalculationData] = useState({
    environment: 'dev',
    selectedSheet: '',
    availableSheets: []
  });
  const [isReadingRow, setIsReadingRow] = useState(false); // Loading state for reading row data

  // Load available sheets when environment changes
  useEffect(() => {
    if (getEffectiveUIEnv() === 'dev') {
      fetchOTSheets(otCalculationData.environment);
    }
  }, [otCalculationData.environment]);

  // Auto-read row data when row number is entered and sheet is selected
  useEffect(() => {
    if (otCalculationData.selectedSheet && manualOTData.rowNumber && manualOTData.rowNumber.length > 0) {
      const timeoutId = setTimeout(() => {
        readRowData();
      }, 500); // Debounce for 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [otCalculationData.selectedSheet, manualOTData.rowNumber]);

  // Load saved data from cookies on component mount
  useEffect(() => {
    const today = getThaiDateString();
    const savedDate = getCookie('savedDate');
    if (savedDate && savedDate !== today) {
      // Date has changed, clear all related cookies
      clearCookie('driverName');
      clearCookie('clockIn');
      clearCookie('clockOut');
      clearCookie('comments');
      clearCookie('savedDate');

      setIsSubmitted(false);
      // Clear validation errors when date changes
      setInvalidFields({});
      return;
    }
    
    // Submit button status is managed by state, not cookies
    setIsSubmitted(false);
    
    // Don't auto-load cookies on mount - wait for driver selection
    setFormData({
      driverName: '',
      clockIn: '',
      clockOut: '',
      comments: ''
    });
    
    // Auto-populate day of week based on current date
    const dayOfWeekValue = getDayOfWeekFromThaiDate(today);
    setDayOfWeek(translateDayOfWeek(dayOfWeekValue, browserLang));
    
    // Clear validation errors when form is reset
    setInvalidFields({});

    // Set up automatic submission at 11:59 PM
    const setupAutoSubmit = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const autoSubmitTime = new Date(today.getTime() + (23 * 60 + 59) * 60 * 1000); // 11:59 PM
      
      // If it's already past 11:59 PM, set for tomorrow
      if (now > autoSubmitTime) {
        autoSubmitTime.setDate(autoSubmitTime.getDate() + 1);
      }
      
      const timeUntilAutoSubmit = autoSubmitTime.getTime() - now.getTime();
      
      console.log(`Auto-submit scheduled for ${autoSubmitTime.toLocaleString()}`);
      
      setTimeout(() => {
        handleAutoSubmit();
      }, timeUntilAutoSubmit);
    };

    setupAutoSubmit();
  }, []);

  const handleAutoSubmit = async () => {
    // Get data from driver-specific cookies
    const savedDriverName = getCookie('driverName');
    let savedClockIn = '';
    let savedClockOut = '';
    let savedComments = '';
    
    if (savedDriverName) {
      savedClockIn = getDriverCookie(savedDriverName, 'clockIn') || '';
      savedClockOut = getDriverCookie(savedDriverName, 'clockOut') || '';
      savedComments = getDriverCookie(savedDriverName, 'comments') || '';
    }
    
    // Check if there's data to submit
    if (!savedDriverName && !savedClockIn && !savedClockOut && !savedComments) {
      showAlert(labels[browserLang].noDataToAutoSubmit, 'error');
      return;
    }

    try {
      console.log('Auto-submitting form at 11:59 PM...');
      console.log('Saved data:', { savedDriverName, savedClockIn, savedClockOut, savedComments });
      
      const payload = {
        driverName: savedDriverName || 'Unknown Driver',
        thaiDate: getThaiDateString(),
        clockIn: savedClockIn || '',
        clockOut: savedClockOut || '',
        comments: savedComments || 'Auto-submitted at 11:59 PM',
        submittedAt: getBangkokTimeString(),
        env: getEffectiveEnv(),
        action: 'submitWithClockTimes',
        isAutoSubmitted: true,
        language: browserLang
      };

      const response = await fetch(`${API_BASE_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Auto-submission successful');
        
        // Send LINE notification about auto-submission to dev group
        const notificationPayload = {
          message: `🤖 AUTO-SUBMISSION ALERT\n\n👤 Driver: ${savedDriverName || 'Unknown'}\n📅 Date: ${getThaiDateString()}\n🕒 Clock In: ${savedClockIn || 'Not set'}\n🕔 Clock Out: ${savedClockOut || 'Not set'}\n💬 Comments: ${savedComments || 'None'}\n⏰ Auto-submitted at 11:59 PM\n\n⚠️ This form was automatically submitted because the user forgot to submit it manually.\n\n📊 Google Sheets updated\n\n📄 View in Google Sheets:\n${sheetUrl}`,
          env: 'dev'
        };

        await fetch(`${API_BASE_URL}/notify-line`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notificationPayload),
        });

        // Clear form data
        clearCookie('driverName');
        if (savedDriverName) {
          clearAllDriverCookies(savedDriverName);
        }
        clearCookie('savedDate');
        
        setFormData({
          driverName: '',
          clockIn: '',
          clockOut: '',
          comments: ''
        });
        
        setInvalidFields({});
        
      } else {
        console.error('Auto-submission failed:', result.error);
      }

    } catch (error) {
      console.error('Error in auto-submission:', error);
    }
  };

  // Test function for auto-submission (remove in production)
  const testAutoSubmit = () => {
    console.log('🧪 Testing auto-submission...');
    
    // Get data from driver-specific cookies
    const savedDriverName = getCookie('driverName');
    let savedClockIn = '';
    let savedClockOut = '';
    let savedComments = '';
    
    if (savedDriverName) {
      savedClockIn = getDriverCookie(savedDriverName, 'clockIn') || '';
      savedClockOut = getDriverCookie(savedDriverName, 'clockOut') || '';
      savedComments = getDriverCookie(savedDriverName, 'comments') || '';
    }
    
    // Check if there's data to submit
    if (!savedDriverName && !savedClockIn && !savedClockOut && !savedComments) {
      alert(labels[browserLang].noDataToAutoSubmit);
      return;
    }

    // For test mode, always allow submission regardless of previous submission
    console.log('🧪 Test auto-submission data:', { savedDriverName, savedClockIn, savedClockOut, savedComments });
    
    // For testing purposes, if no clock-out time is set, generate one
    if (!savedClockOut && savedClockIn) {
      // Generate a clock-out time 3 hours after clock-in for testing
      const clockInTime = savedClockIn.split(':');
      const clockInHour = parseInt(clockInTime[0]);
      const clockInMinute = parseInt(clockInTime[1]);
      
      let clockOutHour = clockInHour + 3;
      let clockOutMinute = clockInMinute;
      
      // Handle minute overflow
      if (clockOutMinute >= 60) {
        clockOutMinute = 0;
        clockOutHour += 1;
      }
      
      // Format the time
      savedClockOut = `${String(clockOutHour).padStart(2, '0')}:${String(clockOutMinute).padStart(2, '0')}`;
      console.log('🧪 Generated test clock-out time:', savedClockOut);
    }
    
    // Call a test version of auto-submit that bypasses the "already submitted" check
    handleTestAutoSubmit();
  };

  // Test version of auto-submit that always submits
  const handleTestAutoSubmit = async () => {
    // Get data from driver-specific cookies
    const savedDriverName = getCookie('driverName');
    let savedClockIn = '';
    let savedClockOut = '';
    let savedComments = '';
    
    if (savedDriverName) {
      savedClockIn = getDriverCookie(savedDriverName, 'clockIn') || '';
      savedClockOut = getDriverCookie(savedDriverName, 'clockOut') || '';
      savedComments = getDriverCookie(savedDriverName, 'comments') || '';
    }
    
    // Check if there's data to submit
    if (!savedDriverName && !savedClockIn && !savedClockOut && !savedComments) {
      console.log('No data to auto-submit');
      return;
    }

    try {
      console.log('🧪 Test auto-submitting form with OT calculations...');
      console.log('Saved data:', { savedDriverName, savedClockIn, savedClockOut, savedComments });
      
      // For testing purposes, if no clock-out time is set, generate one
      if (!savedClockOut && savedClockIn) {
        // Generate a clock-out time 3 hours after clock-in for testing
        const clockInTime = savedClockIn.split(':');
        const clockInHour = parseInt(clockInTime[0]);
        const clockInMinute = parseInt(clockInTime[1]);
        
        let clockOutHour = clockInHour + 3;
        let clockOutMinute = clockInMinute;
        
        // Handle minute overflow
        if (clockOutMinute >= 60) {
          clockOutMinute = 0;
          clockOutHour += 1;
        }
        
        // Format the time
        savedClockOut = `${String(clockOutHour).padStart(2, '0')}:${String(clockOutMinute).padStart(2, '0')}`;
        console.log('🧪 Generated test clock-out time:', savedClockOut);
      }
      
      // First, submit clock in if available
      if (savedClockIn) {
        const clockInPayload = {
          action: 'clockEvent',
          driverName: savedDriverName || 'Unknown Driver',
          thaiDate: getThaiDateString(),
          type: 'clockIn',
          timestamp: savedClockIn,
          comments: savedComments || 'Test auto-submitted',
          submittedAt: getBangkokTimeString(),
          env: getEffectiveEnv(),
          isTestAutoSubmit: true, // Flag to identify test auto-submit
          language: browserLang
        };

        const clockInResponse = await fetch(`${API_BASE_URL}/clock-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clockInPayload),
        });

        const clockInResult = await clockInResponse.json();
        console.log('Clock In result:', clockInResult);
      }

      // Then, submit clock out if available (this will trigger OT calculations)
      if (savedClockOut) {
        const clockOutPayload = {
          action: 'clockEvent',
          driverName: savedDriverName || 'Unknown Driver',
          thaiDate: getThaiDateString(),
          type: 'clockOut',
          timestamp: savedClockOut,
          comments: savedComments || 'Test auto-submitted',
          submittedAt: getBangkokTimeString(),
          env: getEffectiveEnv(),
          isTestAutoSubmit: true, // Flag to identify test auto-submit
          bypassClockOutRestriction: true, // Allow test auto-submit to override clock-out time restrictions
          language: browserLang
        };

        const clockOutResponse = await fetch(`${API_BASE_URL}/clock-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clockOutPayload),
        });

        const clockOutResult = await clockOutResponse.json();
        console.log('Clock Out result:', clockOutResult);
        
        if (clockOutResult.success) {
          console.log('🧪 Test auto-submission with OT calculations successful');
          
          // Get OT hours from backend response if available
          let otStart = '';
          let otEnd = '';
          let otHours = clockOutResult.otHours || '';
          
          // Calculate OT hours for notification if not provided by backend
          if (!otHours && savedClockOut) {
            const clockOutTime = new Date(`2000-01-01T${savedClockOut}:00`);
            const otStartTime = new Date(`2000-01-01T17:00:00`);
            
            if (clockOutTime > otStartTime) {
              otStart = '17:00';
              otEnd = savedClockOut;
              
              const diffMs = clockOutTime.getTime() - otStartTime.getTime();
              const diffHours = diffMs / (1000 * 60 * 60);
              otHours = diffHours.toFixed(2);
            }
          }
      
          // Send LINE notification about test auto-submission with OT calculations
          const notificationPayload = {
            message: `🧪 TEST AUTO-SUBMISSION WITH OT CALCULATIONS\n\n👤 Driver: ${savedDriverName || 'Unknown'}\n📅 Date: ${getThaiDateString()}\n🕒 Clock In: ${savedClockIn || 'Not set'}\n🕔 Clock Out: ${savedClockOut || 'Not set'}\n💬 Comments: ${savedComments || 'None'}${otHours ? `\n⏰ OT Hours: ${otHours} hours\n🕕 OT Start: 17:00\n🕖 OT End: ${savedClockOut}` : '\n❌ No OT hours (clock out before 17:00)'}\n\n🧮 Backend OT Calculation: ${clockOutResult.otHours ? '✅ Working' : '❌ Not calculated'}\n📊 Google Sheets: ✅ Updated\n📄 View in Google Sheets:\n${sheetUrl}`,
            env: getEffectiveEnv()
          };

          await fetch(`${API_BASE_URL}/notify-line`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notificationPayload),
          });

          showAlert(`🧪 Test Auto-Submission Successful!\n\n⏰ OT Hours: ${otHours || 'None (clock out before 17:00)'}\n🧮 Backend Calculation: ${clockOutResult.otHours ? '✅ Working' : '❌ Not calculated'}\n📱 LINE notification sent\n📊 Google Sheets updated`, 'success');
        } else {
          console.error('Test auto-submission failed:', clockOutResult.error);
          showAlert(`${labels[browserLang].testAutoSubmitFailed} ${clockOutResult.error}`, 'error');
        }
      } else {
        // If no clock out, just submit the basic data
        const payload = {
          driverName: savedDriverName || 'Unknown Driver',
          thaiDate: getThaiDateString(),
          clockIn: savedClockIn || '',
          clockOut: savedClockOut || '',
          comments: savedComments || 'Test auto-submitted',
          submittedAt: getBangkokTimeString(),
          env: getEffectiveEnv(),
          action: 'submitWithClockTimes',
          isAutoSubmitted: true,
          isTestAutoSubmit: true, // Flag to identify test auto-submit
          bypassClockOutRestriction: true, // Allow test auto-submit to override clock-out time restrictions
          language: browserLang
        };

        const response = await fetch(`${API_BASE_URL}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        
        if (result.success) {
          console.log('🧪 Test auto-submission successful (no clock out)');
          showAlert(`${labels[browserLang].testAutoSubmitSuccess} ${labels[browserLang].checkGoogleSheets}`, 'success');
        } else {
          console.error('Test auto-submission failed:', result.error);
          showAlert(`${labels[browserLang].testAutoSubmitFailed} ${result.error}`, 'error');
        }
      }

    } catch (error) {
      console.error('Error in test auto-submission:', error);
      showAlert(`${labels[browserLang].testAutoSubmitError} ${error.message}`, 'error');
    }
  };

  // Refs for the hidden inputs
  const clockInRef = useRef(null);
  const clockOutRef = useRef(null);
  const commentsRef = useRef(null);

  const [showClockInDropdown, setShowClockInDropdown] = useState(false);
  const [showClockOutDropdown, setShowClockOutDropdown] = useState(false);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  // Manual testing form state
  const [manualTestData, setManualTestData] = useState({
    testDate: '',
    testUser: '',
    testClockIn: '',
    testClockOut: '',
    testComments: '',
    testEnvironment: 'dev',
    testSpreadsheet: '',
    availableSheets: []
  });
  const [isManualTesting, setIsManualTesting] = useState(false);

  // Day of Week update form state
  const [dayOfWeekUpdateData, setDayOfWeekUpdateData] = useState({
    environment: 'dev',
    selectedSheet: '',
    availableSheets: []
  });
  const [isUpdatingDayOfWeek, setIsUpdatingDayOfWeek] = useState(false);

  // Load available sheets for manual testing when environment changes
  useEffect(() => {
    // Always fetch sheets when test environment changes (works for both dev and prod UI)
    if (manualTestData.testEnvironment) {
      fetchManualTestSheets(manualTestData.testEnvironment);
    }
  }, [manualTestData.testEnvironment]);

  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hour = String(Math.floor(i / 4)).padStart(2, '0');
    const min = String((i % 4) * 15).padStart(2, '0');
    return `${hour}:${min}`;
  });

  const handleClockEvent = async (type) => {
    // Prevent double submission
    if (isSubmitting) {
      console.log('⚠️ Clock event already in progress, ignoring...');
      return;
    }
    
    if (!formData.driverName.trim()) {
      showAlert(labels[browserLang].enterDriverNameFirst, 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    // Add timeout protection to prevent stuck flag
    const timeoutId = setTimeout(() => {
      setIsSubmitting(false);
    }, 15000); // Reset after 15 seconds

    // Require comments when clocking out
    if (type === 'clockOut' && !formData.comments.trim()) {
      showAlert(labels[browserLang].addCommentsBeforeClockOut, 'error');
      setIsSubmitting(false); // Reset flag on validation error
      return;
    }

    // Prevent clock out before 4 PM
    if (type === 'clockOut') {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const fourPMInMinutes = 16 * 60; // 4 PM = 16:00
      
      if (currentTimeInMinutes < fourPMInMinutes) {
        showAlert(labels[browserLang].clockOutBefore4PM, 'error');
        setIsSubmitting(false); // Reset flag on validation error
        return;
      }
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // Update form data
    const updatedFormData = {
      ...formData,
      [type === 'clockIn' ? 'clockIn' : 'clockOut']: timestamp
    };
    setFormData(updatedFormData);
    
    // Clear validation error when clock-in is set
    if (type === 'clockIn' && invalidFields.clockIn) {
      setInvalidFields(prev => ({ ...prev, clockIn: false }));
    }

    // Save to driver-specific cookies
    setCookie('driverName', updatedFormData.driverName);
    if (updatedFormData.clockIn) setDriverCookie(updatedFormData.driverName, 'clockIn', updatedFormData.clockIn);
    if (updatedFormData.clockOut) setDriverCookie(updatedFormData.driverName, 'clockOut', updatedFormData.clockOut);
    if (updatedFormData.comments) setDriverCookie(updatedFormData.driverName, 'comments', updatedFormData.comments);
    setCookie('savedDate', getThaiDateString());

    // Check if row already exists in Google Sheets
    try {
      const checkResponse = await fetch(`${API_BASE_URL}/check-existing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkExisting',
          driverName: updatedFormData.driverName,
          thaiDate: getThaiDateString(),
          env: getEffectiveEnv()
        }),
      });

      const checkResult = await checkResponse.json();
      
      if (checkResult.exists) {
        // Row exists, update it with the new clock time
        console.log(`Row exists, updating ${type} time to ${timestamp}`);
        
        const updateResponse = await fetch(`${API_BASE_URL}/clock-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'clockEvent',
            driverName: updatedFormData.driverName,
            thaiDate: getThaiDateString(),
            type: type,
            timestamp: timestamp,
            comments: updatedFormData.comments || '',
            submittedAt: getBangkokTimeString(),
            env: getEffectiveEnv(),
            language: browserLang
          }),
        });

        const updateResult = await updateResponse.json();
        
        if (updateResult.success) {
          console.log(`✅ ${type === 'clockIn' ? 'Clock In' : 'Clock Out'} time updated to ${timestamp}`);
          
          // Show success dialog for clock in
          if (type === 'clockIn') {
            const successMessage = browserLang === 'th' 
              ? `บันทึกเวลาเข้างานสำเร็จที่ ${timestamp}`
              : `Successfully clocked in at ${timestamp}`;
            showAlert(successMessage, 'success');
          }
          
          // Send LINE notification for clock out
          if (type === 'clockOut') {
            // Calculate OT hours if clock out time is after 17:00
            let otStart = '';
            let otEnd = '';
            let otHours = '';
            
            const clockOutTime = new Date(`2000-01-01T${timestamp}:00`);
            const otStartTime = new Date(`2000-01-01T17:00:00`);
            
            if (clockOutTime > otStartTime) {
              otStart = '17:00';
              otEnd = timestamp;
              
              // Calculate hours between 17:00 and clock out time
              const diffMs = clockOutTime.getTime() - otStartTime.getTime();
              const diffHours = diffMs / (1000 * 60 * 60);
              otHours = diffHours.toFixed(2); // Round to 2 decimal places
            }
            
            const notificationPayload = {
              message: `🕔 CLOCK OUT\n\n👤 Driver: ${updatedFormData.driverName}\n📅 Date: ${getThaiDateString()}\n🕒 Clock In: ${updatedFormData.clockIn || 'Not set'}\n🕔 Clock Out: ${timestamp}\n💬 Comments: ${updatedFormData.comments || 'None'}${otHours ? `\n⏰ OT Hours: ${otHours} hours\n🕕 OT Start: ${otStart}\n🕖 OT End: ${otEnd}` : ''}\n\n📊 Google Sheets updated\n\n📄 View in Google Sheets:\n${sheetUrl}`,
              env: getEffectiveEnv()
            };

            await fetch(`${API_BASE_URL}/notify-line`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(notificationPayload),
            });
          }
        } else {
          console.error(`❌ Error updating ${type === 'clockIn' ? 'Clock In' : 'Clock Out'} time: ${updateResult.error}`);
          // Reset isSubmitting flag on error so user can retry
          setIsSubmitting(false);
          showAlert(`Failed to update ${type === 'clockIn' ? 'Clock In' : 'Clock Out'} time. Please try again.`, 'error');
          return;
        }
      } else {
        // Row doesn't exist, create new row
        console.log(`No existing row found, creating new row with ${type} time ${timestamp}`);
        
        const createResponse = await fetch(`${API_BASE_URL}/clock-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'clockEvent',
            driverName: updatedFormData.driverName,
            thaiDate: getThaiDateString(),
            type: type,
            timestamp: timestamp,
            comments: updatedFormData.comments || '',
            submittedAt: getBangkokTimeString(),
            env: getEffectiveEnv(),
            language: browserLang
          }),
        });

        const createResult = await createResponse.json();
        
        if (createResult.success) {
          console.log(`✅ ${type === 'clockIn' ? 'Clock In' : 'Clock Out'} time set to ${timestamp}`);
          
          // Show success dialog for clock in
          if (type === 'clockIn') {
            const successMessage = browserLang === 'th' 
              ? `บันทึกเวลาเข้างานสำเร็จที่ ${timestamp}`
              : `Successfully clocked in at ${timestamp}`;
            showAlert(successMessage, 'success');
          }
          
          // Send LINE notification for clock out
          if (type === 'clockOut') {
            // Calculate OT hours if clock out time is after 17:00
            let otStart = '';
            let otEnd = '';
            let otHours = '';
            
            const clockOutTime = new Date(`2000-01-01T${timestamp}:00`);
            const otStartTime = new Date(`2000-01-01T17:00:00`);
            
            if (clockOutTime > otStartTime) {
              otStart = '17:00';
              otEnd = timestamp;
              
              // Calculate hours between 17:00 and clock out time
              const diffMs = clockOutTime.getTime() - otStartTime.getTime();
              const diffHours = diffMs / (1000 * 60 * 60);
              otHours = diffHours.toFixed(2); // Round to 2 decimal places
            }
            
            const notificationPayload = {
              message: `🕔 CLOCK OUT\n\n👤 Driver: ${updatedFormData.driverName}\n📅 Date: ${getThaiDateString()}\n🕒 Clock In: ${updatedFormData.clockIn || 'Not set'}\n🕔 Clock Out: ${timestamp}\n💬 Comments: ${updatedFormData.comments || 'None'}${otHours ? `\n⏰ OT Hours: ${otHours} hours\n🕕 OT Start: ${otStart}\n🕖 OT End: ${otEnd}` : ''}\n\n📊 Google Sheets updated\n\n📄 View in Google Sheets:\n${sheetUrl}`,
              env: getEffectiveEnv()
            };

            await fetch(`${API_BASE_URL}/notify-line`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(notificationPayload),
            });
          }
        } else {
          console.error(`❌ Error setting ${type === 'clockIn' ? 'Clock In' : 'Clock Out'} time: ${createResult.error}`);
          // Reset isSubmitting flag on error so user can retry
          setIsSubmitting(false);
          showAlert(`Failed to set ${type === 'clockIn' ? 'Clock In' : 'Clock Out'} time. Please try again.`, 'error');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking/updating Google Sheets:', error);
      // Reset isSubmitting flag on any error so user can retry
      setIsSubmitting(false);
      showAlert('Network error occurred. Please try again.', 'error');
    } finally {
      clearTimeout(timeoutId); // Clear the timeout
      setIsSubmitting(false);
    }
  };


  // Remove OT time options and dropdowns
  // Only allow work times up to and including 17:00
  const workTimeOptions = timeOptions.filter(t => {
    const [h, m] = t.split(":").map(Number);
    return h < 17 || (h === 17 && m === 0);
  });

  const dateTimeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const now = new Date();
    now.setHours(Math.floor(i / 4), (i % 4) * 15, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    return formatted;
  });

  const [drivers, setDrivers] = useState([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  
  // Add Driver Modal State
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    age: '',
    photo: null,
    photoPreview: null
  });
  const [isAddingDriver, setIsAddingDriver] = useState(false);

  // Debounce function for Google Sheets updates
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Debounced function to update Google Sheets (comments only)
  const debouncedUpdateGoogleSheets = debounce(async (field, value) => {
    if (formData.driverName && formData.driverName.trim()) {
      setIsSavingComments(true); // Show saving indicator
      
      try {
        // Use the existing updateFieldInGoogleSheets function which handles both
        // updating existing rows and creating new ones if needed
        await updateFieldInGoogleSheets(field, value);
      } catch (error) {
        console.error('Error saving comments:', error);
      } finally {
        setIsSavingComments(false); // Hide saving indicator
      }
    }
    setCookie('tempComments', value); // Always save to cookies
  }, 100); // 100ms delay for near real-time updates

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Track changes from original data
    if (originalData && originalData[name] !== value) {
      setChangedFields(prev => ({ ...prev, [name]: true }));
    } else if (originalData && originalData[name] === value) {
      setChangedFields(prev => ({ ...prev, [name]: false }));
    }
    
    // Save to driver-specific cookies
    if (name === 'driverName') {
      setCookie('driverName', value);
      // Reset submitted state when driver changes
      setIsSubmitted(false);
      // Clear existing entry cache when driver changes
      setExistingEntryCache({});
      
      // Clear all fields when driver name changes
      setFormData(prev => ({
        driverName: value, // Keep the new driver name
        clockIn: '',
        clockOut: '',
        comments: ''
      }));
      
      // Clear original data and changed fields
      setOriginalData(null);
      setChangedFields({});
      
      // Clear validation errors
      setInvalidFields({});
      
      // Check if data exists in Google Sheets for this driver and date
      if (value.trim()) {
        // Use setTimeout to ensure form clearing happens first
        setTimeout(() => {
          checkExistingDataForDriver(value.trim());
        }, 0);
      }
    } else if (name === 'clockIn') {
      if (formData.driverName) {
        setDriverCookie(formData.driverName, 'clockIn', value);
      }
    } else if (name === 'clockOut') {
      if (formData.driverName) {
        setDriverCookie(formData.driverName, 'clockOut', value);
      }
    } else if (name === 'comments') {
      if (formData.driverName) {
        setDriverCookie(formData.driverName, 'comments', value);
        // Auto-update Google Sheets for comments field only
        debouncedUpdateGoogleSheets('comments', value);
      }
      // Always save comments to cookies even if no driver selected yet
      setCookie('tempComments', value);
    }
    setCookie('savedDate', getThaiDateString());

    // Clear validation error when field is filled
    if (invalidFields[name]) {
      setInvalidFields(prev => ({ ...prev, [name]: false }));
    }
  };

  // Function to check and auto-fill existing data for a driver (OPTIMIZED - single API call)
  const checkExistingDataForDriver = async (driverName) => {
    try {
      setIsLoadingData(true); // Start loading
      console.log(`🔄 Loading animation started for driver: ${driverName}`);
      
      // Optimized: Single API call that checks existence AND gets row data
      const response = await fetch(`${API_BASE_URL}/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkAndGetRow',
          driverName: driverName,
          thaiDate: getThaiDateString(),
          env: getEffectiveEnv(),
          language: browserLang
        }),
      });

      const result = await response.json();
      
      if (result.exists && result.row) {
          const [driver, date, dayOfWeek, clockIn, clockOut, otStart, otEnd, comments, submittedAt, approval] = result.row;
           
           // Auto-fill the form with existing data
           const updatedFormData = {
             driverName: driver || '',
             clockIn: clockIn || '',
             clockOut: clockOut || '',
             comments: comments || ''
           };
           
          setFormData(updatedFormData);
          
          // Set day of week from existing data (already translated by server) or calculate and translate from date
          const dayOfWeekValue = dayOfWeek || translateDayOfWeek(getDayOfWeekFromThaiDate(date), browserLang);
          setDayOfWeek(dayOfWeekValue);
          
          // Store original data for change tracking
           setOriginalData(updatedFormData);
           setChangedFields({}); // Reset changed fields
           
           // Reset submitted state when loading existing data
           setIsSubmitted(false);
           
           // Clear validation errors when form is populated with existing data
           setInvalidFields({});
           
           // Update driver-specific cookies
           setDriverCookie(driverName, 'clockIn', updatedFormData.clockIn);
           setDriverCookie(driverName, 'clockOut', updatedFormData.clockOut);
           setDriverCookie(driverName, 'comments', updatedFormData.comments);
           
           // Failsafe: Close dropdown when data is populated
           closeAllDropdowns();
           
           console.log('Auto-filled form with existing data:', updatedFormData);
           
           // Show alert in development, log to console in production
           if (getEffectiveUIEnv() === 'dev') {
             showAlert(`${labels[browserLang].foundExistingData} ${driverName} ${labels[browserLang].today}\n${labels[browserLang].clockInLabel} ${clockIn || labels[browserLang].notSet}\n${labels[browserLang].clockOutLabel} ${clockOut || labels[browserLang].notSet}\n${labels[browserLang].commentsLabel} ${comments || labels[browserLang].none}`, 'info');
           } else {
             console.log(`✅ Found existing data for ${driverName} today:`, {
               clockIn: clockIn || 'Not set',
               clockOut: clockOut || 'Not set', 
               comments: comments || 'None'
             });
           }
      } else {
        // No existing data found - clear form to original state
        console.log(`No existing data found for driver: ${driverName}`);
        setFormData({
          driverName: driverName,
          clockIn: '',
          clockOut: '',
          comments: ''
        });
        setOriginalData(null);
        setChangedFields({});
        setInvalidFields({});
        
        // Failsafe: Close dropdown when no data exists
        closeAllDropdowns();
      }
    } catch (error) {
      console.error('Error checking existing data:', error);
    } finally {
      setIsLoadingData(false); // Stop loading
      console.log('✅ Loading animation stopped');
    }
  };

  // Format for display
  const formatDateTime = (value) => {
    if (!value) return "Set Time";
    const date = new Date(value);
    return date.toLocaleString();
  };
  const formatTime = (value) => value ? value : "Set Time";
  const formatComments = (value) => value ? value : "Add Comments";

  // API Configuration - Heroku backend
  // Only use localhost if we're actually running on localhost (for local development)
  // The environment toggle (DEV/PROD button) should NOT affect backend URL, only which spreadsheet to use
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE_URL = isLocalDev
    ? 'http://localhost:3001'
    : 'https://liff-ot-app-arun-d0ff4972332c.herokuapp.com';

  // Function to fetch drivers from Strapi
  const fetchDrivers = async () => {
    setIsLoadingDrivers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }

      const result = await response.json();
      
      // Extract driver names from Strapi response
      // Strapi v5 returns data in result.data array, each item has attributes.name
      const driverNames = result.data?.map(driver => 
        driver.attributes?.name || driver.name
      ).filter(Boolean) || [];

      console.log('Fetched drivers from Strapi:', driverNames);
      setDrivers(driverNames.sort());
    } catch (error) {
      console.error('Error fetching drivers:', error);
      // Fallback to empty array or show error
      setDrivers([]);
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to handle adding new driver
  const handleAddDriver = async () => {
    if (!newDriver.name.trim()) {
      alert(browserLang === 'th' ? 'กรุณากรอกชื่อ' : 'Please enter a name');
      return;
    }

    setIsAddingDriver(true);
    
    try {
      let photoId = null;

      // Upload photo to Strapi first if provided
      if (newDriver.photo) {
        const formData = new FormData();
        formData.append('files', newDriver.photo);

        console.log('Uploading photo to Strapi:', newDriver.photo.name, newDriver.photo.type);

        const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          body: formData
        });

        const uploadResult = await uploadResponse.json();

        console.log('Upload response status:', uploadResponse.status);
        console.log('Upload response data:', uploadResult);

        if (uploadResponse.ok && uploadResult) {
          // Strapi returns array of uploaded files
          // Handle both array and single object responses
          const uploadedFile = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;
          
          if (uploadedFile) {
            // Strapi v5 returns media with 'id' field
            photoId = uploadedFile.id || uploadedFile.data?.id || uploadedFile.data?.attributes?.id;
            console.log('Photo uploaded successfully, ID:', photoId);
            
            if (!photoId) {
              console.warn('Photo uploaded but ID not found in response:', uploadedFile);
            }
          } else {
            console.warn('Photo upload response was empty');
          }
        } else {
          console.error('Photo upload failed:', uploadResponse.status, uploadResult);
          console.warn('Continuing to create driver without photo');
        }
      }

      // Create driver in Strapi with photo, name, and age
      const driverData = {
        name: newDriver.name.trim(),
        age: newDriver.age ? parseInt(newDriver.age) : null,
        status: 'active'
      };

      // Add photo if uploaded successfully (Strapi expects media ID for single media field)
      if (photoId) {
        // For single media field in Strapi v5, pass the ID directly
        driverData.photo = photoId;
        console.log('Linking photo to driver:', photoId);
      } else {
        console.log('No photo ID available, creating driver without photo');
      }

      const response = await fetch(`${API_BASE_URL}/api/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: driverData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Driver creation failed:', {
          status: response.status,
          statusText: response.statusText,
          result: result
        });
        
        // Better error messages for common issues
        let errorMessage = 'Failed to create driver';
        if (response.status === 403) {
          errorMessage = 'Permission denied. Please check Strapi permissions - ensure "Public" role has "create" permission for Driver.';
        } else if (result.error) {
          errorMessage = result.error.message || result.error.error?.message || result.error.error || JSON.stringify(result.error);
        } else if (result.data?.error) {
          errorMessage = result.data.error.message || JSON.stringify(result.data.error);
        } else {
          errorMessage = JSON.stringify(result) || `Server error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      console.log('Driver created successfully:', result);

      // Refresh drivers list from Strapi to get the latest data
      await fetchDrivers();

      // Get the driver name for auto-selection
      const driverName = result.data?.attributes?.name || result.data?.name || newDriver.name;

      // Reset form and close modal
      setNewDriver({
        name: '',
        age: '',
        photo: null,
        photoPreview: null
      });
      setShowAddDriverModal(false);

      // Show success message
      alert(browserLang === 'th' 
        ? `เพิ่ม ${driverName} สำเร็จ` 
        : `Successfully added ${driverName}`);

      // Auto-select the newly added driver
      setFormData(prev => ({ ...prev, driverName }));
      setCookie('driverName', driverName);

    } catch (error) {
      console.error('Error adding driver:', error);
      alert(browserLang === 'th' 
        ? `เกิดข้อผิดพลาด: ${error.message}` 
        : `Error: ${error.message}`);
    } finally {
      setIsAddingDriver(false);
    }
  };

  // Handle photo selection
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewDriver(prev => ({ ...prev, photo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDriver(prev => ({ ...prev, photoPreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const sheetId = getEffectiveUIEnv() === 'dev'
    ? import.meta.env.VITE_GOOGLE_SHEET_ID_DEV
    : import.meta.env.VITE_GOOGLE_SHEET_ID_PROD;
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing`;

  function getBangkokTimeString() {
    const now = new Date();
    // Convert to Bangkok time (UTC+7)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bangkok = new Date(utc + (7 * 60 * 60 * 1000));
    // Format as yyyy-MM-dd'T'HH:mm:ss+07:00
    const pad = n => String(n).padStart(2, '0');
    return (
      bangkok.getFullYear() + '-' +
      pad(bangkok.getMonth() + 1) + '-' +
      pad(bangkok.getDate()) + 'T' +
      pad(bangkok.getHours()) + ':' +
      pad(bangkok.getMinutes()) + ':' +
      pad(bangkok.getSeconds()) + '+07:00'
    );
  }

  // Function to check Google Sheets for existing entry (with caching)
  const [existingEntryCache, setExistingEntryCache] = useState({});
  
  // Function to clear the existing entry cache
  const clearExistingEntryCache = () => {
    console.log('🧹 Clearing existing entry cache');
    setExistingEntryCache({});
  };
  
  const checkGoogleSheetsForExistingEntry = async (forceCheck = false) => {
    const cacheKey = `${formData.driverName}-${getThaiDateString()}`;
    
    console.log('🔍 Checking existing entry with cache key:', cacheKey);
    console.log('📅 Current Thai date:', getThaiDateString());
    
    // Return cached result if available and not forcing a check
    if (!forceCheck && existingEntryCache[cacheKey] !== undefined) {
      console.log('📋 Using cached result:', existingEntryCache[cacheKey]);
      return existingEntryCache[cacheKey];
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/check-existing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName: formData.driverName,
          thaiDate: getThaiDateString(),
          env: getEffectiveEnv()
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache the result
      setExistingEntryCache(prev => ({
        ...prev,
        [cacheKey]: result.exists
      }));
      
      return result.exists;
    } catch (error) {
      console.error('Error checking Google Sheets:', error);
      return false; // Default to false if check fails
    }
  };

  // Enhanced submit function with Google Sheets verification
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) {
      console.log('⚠️ Form submission already in progress, ignoring...');
      return;
    }

    // Basic validation - require driver name and clock in
    const newInvalidFields = {};
    if (!formData.driverName.trim()) {
      newInvalidFields.driverName = true;
    }
    if (!formData.clockIn) {
      newInvalidFields.clockIn = true;
    }
    
    // If user is already clocked in, require clock-out and comments
    if (formData.clockIn && !formData.clockOut) {
      newInvalidFields.clockOut = true;
      console.log('Clock-out required - user has clock-in but no clock-out');
    }
    if (formData.clockIn && !formData.comments.trim()) {
      newInvalidFields.comments = true;
      console.log('Comments required - user has clock-in but no comments');
    }
    
    console.log('Form state check:', {
      hasClockIn: !!formData.clockIn,
      hasClockOut: !!formData.clockOut,
      hasComments: !!formData.comments.trim(),
      willRequireComments: formData.clockIn && formData.clockOut && !formData.comments.trim()
    });
    
    setInvalidFields(newInvalidFields);
    
    console.log('Validation state:', {
      clockIn: formData.clockIn,
      clockOut: formData.clockOut,
      comments: formData.comments,
      invalidFields: newInvalidFields
    });
    
    if (Object.keys(newInvalidFields).length > 0) {
      showAlert(labels[browserLang].fillRequiredFields, 'error');
      return;
    }

    // Optional: Check Google Sheets for existing entry (can be skipped for faster submission)
    const skipDuplicateCheck = true; // Skip duplicate check for both dev and prod for faster submission
    if (!skipDuplicateCheck) {
      const existingEntry = await checkGoogleSheetsForExistingEntry();
      if (existingEntry) {
        showAlert(labels[browserLang].duplicateEntry, 'error');
        setIsSubmitted(true); // Disable submit button
        return;
      }
    }

    try {
      // Send both clock times to Google Sheets
      const payload = {
        driverName: formData.driverName,
        thaiDate: getThaiDateString(),
        clockIn: formData.clockIn || '',
        clockOut: formData.clockOut || '',
        comments: formData.comments || '',
      submittedAt: getBangkokTimeString(),
        env: getEffectiveEnv(),
        action: 'submitWithClockTimes', // New action to handle clock times on submit
        language: browserLang
    };

      console.log('Submitting form with clock times:', payload);

      const response = await fetch(`${API_BASE_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error from server');
      }

      console.log('Form submitted successfully:', result);
      
      // Different behavior based on whether clock-out is present
      if (formData.clockOut) {
        // Clock-out is present - this is a complete submission
        let successMessage = `${labels[browserLang].dataSavedSuccessfully}\n\n`;
        successMessage += `${labels[browserLang].clockInLabel} ${formData.clockIn}\n`;
        successMessage += `${labels[browserLang].clockOutLabel} ${formData.clockOut}\n`;
        successMessage += `${labels[browserLang].commentsLabel} ${formData.comments}\n`;
        successMessage += `${labels[browserLang].dateLabel} ${getThaiDateString()}\n`;
        successMessage += `${labels[browserLang].driverLabel} ${formData.driverName}`;
        
        showAlert(successMessage, 'success');

        // Send LINE notification for complete submission (only in production)
        if (getEffectiveUIEnv() === 'prod') {
          const message = `${labels[browserLang].newOTRequest}\n` +
              `${labels[browserLang].driverLabel} ${formData.driverName}\n` +
              `${labels[browserLang].clockInLabel} ${formData.clockIn}\n` +
              `${labels[browserLang].clockOutLabel} ${formData.clockOut}\n` +
              `${labels[browserLang].commentsLabel} ${formData.comments}\n` +
              `${labels[browserLang].submittedAt} ${payload.submittedAt}\n\n` +
              `${labels[browserLang].approveOrDeny}\n` +
              `\n${labels[browserLang].previousOTRequests} ${sheetUrl}`;

          console.log('Sending LINE notification to production');
          await fetch(`${API_BASE_URL}/notify-line`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message, env: 'prod' }),
            });
        }
      } else {
        // Only clock-in is present - just show success message, no LINE notification
        let successMessage = `${labels[browserLang].dataSavedSuccessfully}\n\n`;
        successMessage += `${labels[browserLang].clockInLabel} ${formData.clockIn}\n`;
        successMessage += `${labels[browserLang].dateLabel} ${getThaiDateString()}\n`;
        successMessage += `${labels[browserLang].driverLabel} ${formData.driverName}`;
        
        showAlert(successMessage, 'success');
      }

      // Clear driver-specific cookies after successful submission
      if (formData.driverName) {
        clearAllDriverCookies(formData.driverName);
      }
      clearCookie('driverName');
      clearCookie('savedDate');
      
      // Submit button status managed by state, not cookies

      // Reset form and validation
      setFormData({
        driverName: '',
        clockIn: '',
        clockOut: '',
        comments: ''
      });
      setInvalidFields({});
      setIsSubmitted(true); // Disable submit button after successful submission

    } catch (error) {
      console.error('Error submitting form:', error);
      showAlert(`${labels[browserLang].errorSavingData} ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual OT calculation handler
  const handleManualOTCalculation = async () => {
    if (isCalculatingOT) return;
    
    setIsCalculatingOT(true);
    setManualOTResult(null);
    
    try {
      console.log('🧮 Starting manual OT calculation:', manualOTData);
      
      const response = await fetch(`${API_BASE_URL}/calculate-ot-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName: manualOTData.driverName,
          thaiDate: manualOTData.thaiDate,
          clockIn: manualOTData.clockIn,
          clockOut: manualOTData.clockOut,
          env: manualOTEnv
        }),
      });

      const result = await response.json();
      
      console.log('🧮 Manual OT calculation result:', result);
      setManualOTResult(result);
      
      if (result.success) {
        console.log(`✅ OT calculation completed: ${result.totalOTHours} hours total`);
      } else {
        console.error(`❌ OT calculation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error in manual OT calculation:', error);
      setManualOTResult({
        success: false,
        error: `Network error: ${error.message}`
      });
    } finally {
      setIsCalculatingOT(false);
    }
  };

  // Read row data and update OT Hours handler
  const handleReadAndUpdateOT = async () => {
    if (isCalculatingOT) return;
    
    setIsCalculatingOT(true);
    setManualOTResult(null);
    
    try {
      console.log('📖 Starting read and update OT:', { 
        driverName: manualOTData.driverName, 
        thaiDate: manualOTData.thaiDate, 
        rowNumber: manualOTData.rowNumber,
        env: manualOTEnv 
      });
      
      // Choose endpoint based on whether row number is provided
      const endpoint = manualOTData.rowNumber ? '/read-and-update-ot-by-row' : '/read-and-update-ot';
      const requestBody = manualOTData.rowNumber 
        ? {
            rowNumber: manualOTData.rowNumber,
            thaiDate: manualOTData.thaiDate,
            env: manualOTEnv
          }
        : {
            driverName: manualOTData.driverName,
            thaiDate: manualOTData.thaiDate,
            env: manualOTEnv
          };
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      console.log('📖 Read and update OT result:', result);
      setManualOTResult(result);
      
      if (result.success) {
        console.log(`✅ Successfully updated OT Hours: ${result.calculatedOT.totalOTHours} hours`);
        // Update the form with the clock times from the sheet
        setManualOTData(prev => ({
          ...prev,
          driverName: result.driverName || prev.driverName,
          clockIn: result.clockIn,
          clockOut: result.clockOut
        }));
      } else {
        console.error(`❌ Read and update OT failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error in read and update OT:', error);
      setManualOTResult({
        success: false,
        error: `Network error: ${error.message}`
      });
    } finally {
      setIsCalculatingOT(false);
    }
  };

  // Fetch available sheets for OT calculation (similar to Day of Week section)
  const fetchOTSheets = async (environment) => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment })
      });
      
      if (response.ok) {
        const result = await response.json();
        setOtCalculationData(prev => ({
          ...prev,
          availableSheets: result.sheets || [],
          selectedSheet: '' // Clear selection when environment changes
        }));
        // Clear form data when sheets change
        setManualOTData(prev => ({ ...prev, driverName: '', thaiDate: '', clockIn: '', clockOut: '', rowNumber: '' }));
      } else {
        showAlert('❌ Failed to fetch available sheets', 'error');
      }
    } catch (error) {
      showAlert(`❌ Error fetching sheets: ${error.message}`, 'error');
    }
  };

  // Handle OT calculation data changes
  const handleOTCalculationChange = (field, value) => {
    setOtCalculationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Read row data and auto-populate fields with OT preview
  const readRowData = async () => {
    if (isReadingRow || !otCalculationData.selectedSheet || !manualOTData.rowNumber) return;
    
    setIsReadingRow(true);
    setManualOTResult(null); // Clear previous results
    
    try {
      console.log('📖 Reading row data:', { sheetName: otCalculationData.selectedSheet, rowNumber: manualOTData.rowNumber, env: otCalculationData.environment });
      
      const response = await fetch(`${API_BASE_URL}/read-row-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName: otCalculationData.selectedSheet,
          rowNumber: manualOTData.rowNumber,
          env: otCalculationData.environment
        }),
      });

      const result = await response.json();
      
      console.log('📖 Row data result:', result);
      
      if (result.success) {
        // Auto-populate the form fields
        setManualOTData(prev => ({
          ...prev,
          driverName: result.data.driverName,
          thaiDate: result.data.thaiDate,
          clockIn: result.data.clockIn,
          clockOut: result.data.clockOut
        }));
        
        console.log(`✅ Auto-populated fields from row ${result.rowNumber}`);
        
        // Now calculate OT preview
        await calculateOTPreview(result.data);
        
      } else {
        console.error(`❌ Failed to read row data: ${result.error}`);
        showAlert(`❌ Failed to read row data: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('❌ Error reading row data:', error);
      showAlert(`❌ Error reading row data: ${error.message}`, 'error');
    } finally {
      setIsReadingRow(false);
    }
  };

  // Calculate OT preview after auto-population
  const calculateOTPreview = async (rowData) => {
    try {
      console.log('🧮 Calculating OT preview for:', rowData);
      
      const response = await fetch(`${API_BASE_URL}/calculate-ot-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName: rowData.driverName,
          thaiDate: rowData.thaiDate,
          clockIn: rowData.clockIn,
          clockOut: rowData.clockOut,
          env: otCalculationData.environment
        }),
      });

      const result = await response.json();
      
      console.log('🧮 OT preview result:', result);
      
      if (result.success) {
        // Show preview result
        setManualOTResult({
          ...result,
          isPreview: true,
          rowNumber: parseInt(manualOTData.rowNumber),
          sheetName: otCalculationData.selectedSheet,
          driverName: rowData.driverName,
          clockIn: rowData.clockIn,
          clockOut: rowData.clockOut,
          calculatedOT: {
            totalOTHours: result.totalOTHours,
            morningOTHours: result.morningOTHours,
            eveningOTHours: result.eveningOTHours,
            otPeriod: result.calculation?.totalOTPeriod,
            businessRule: result.businessRule
          }
        });
        
        console.log('✅ OT preview calculated successfully');
        showAlert(`✅ Auto-populated fields and calculated OT preview: ${result.totalOTHours} hours`, 'success');
      } else {
        console.error(`❌ Failed to calculate OT preview: ${result.error}`);
        setManualOTResult({
          success: false,
          error: result.error,
          isPreview: true
        });
        showAlert(`❌ Failed to calculate OT preview: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('❌ Error calculating OT preview:', error);
      setManualOTResult({
        success: false,
        error: error.message,
        isPreview: true
      });
      showAlert(`❌ Error calculating OT preview: ${error.message}`, 'error');
    }
  };

  // Update spreadsheet OT Hours column directly
  const updateSpreadsheetOT = async (otHours) => {
    try {
      console.log(`📝 Updating spreadsheet OT Hours to: ${otHours} for row ${manualOTData.rowNumber}`);
      
      // Use the new direct update endpoint
      const response = await fetch(`${API_BASE_URL}/update-ot-hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName: otCalculationData.selectedSheet,
          rowNumber: manualOTData.rowNumber,
          otHours: otHours,
          env: otCalculationData.environment
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Successfully updated spreadsheet OT Hours`);
        // Update the result to include the updated column info
        setManualOTResult(prev => ({
          ...prev,
          updatedColumn: result.updatedColumn || 'J',
          isPreview: false // Mark as final result, not preview
        }));
      } else {
        console.error(`❌ Failed to update spreadsheet: ${result.error}`);
        showAlert(`❌ Failed to update spreadsheet: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('❌ Error updating spreadsheet:', error);
      showAlert(`❌ Error updating spreadsheet: ${error.message}`, 'error');
    }
  };

  // Enhanced OT calculation handler that updates the spreadsheet
  const handleEnhancedOTCalculation = async () => {
    if (isCalculatingOT) return;
    
    setIsCalculatingOT(true);
    setManualOTResult(null);
    
    try {
      console.log('🧮 Starting enhanced OT calculation:', { 
        sheetName: otCalculationData.selectedSheet,
        rowNumber: manualOTData.rowNumber,
        driverName: manualOTData.driverName,
        thaiDate: manualOTData.thaiDate,
        clockIn: manualOTData.clockIn,
        clockOut: manualOTData.clockOut,
        env: otCalculationData.environment 
      });
      
      // Use the manual calculation endpoint with the form data
      const response = await fetch(`${API_BASE_URL}/calculate-ot-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName: manualOTData.driverName,
          thaiDate: manualOTData.thaiDate,
          clockIn: manualOTData.clockIn,
          clockOut: manualOTData.clockOut,
          env: otCalculationData.environment
        }),
      });

      const result = await response.json();
      
      console.log('🧮 Enhanced OT calculation result:', result);
      setManualOTResult(result);
      
      if (result.success) {
        console.log(`✅ OT calculation completed: ${result.totalOTHours} hours`);
        
        // Now update the spreadsheet with the calculated OT
        await updateSpreadsheetOT(result.totalOTHours);
        
        // Update the result to include spreadsheet update info while preserving calculation details
        setManualOTResult(prev => ({
          ...prev,
          rowNumber: parseInt(manualOTData.rowNumber),
          sheetName: otCalculationData.selectedSheet,
          driverName: manualOTData.driverName,
          clockIn: manualOTData.clockIn,
          clockOut: manualOTData.clockOut,
          calculatedOT: {
            totalOTHours: result.totalOTHours,
            morningOTHours: result.morningOTHours,
            eveningOTHours: result.eveningOTHours,
            otPeriod: result.calculation?.totalOTPeriod,
            businessRule: result.businessRule
          }
        }));
        
        showAlert(`✅ Successfully calculated and updated OT Hours: ${result.totalOTHours} hours`, 'success');
      } else {
        console.error(`❌ Enhanced OT calculation failed: ${result.error}`);
        showAlert(`❌ Enhanced OT calculation failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('❌ Error in enhanced OT calculation:', error);
      setManualOTResult({
        success: false,
        error: `Network error: ${error.message}`
      });
      showAlert(`❌ Error in enhanced OT calculation: ${error.message}`, 'error');
    } finally {
      setIsCalculatingOT(false);
    }
  };

  const handlePreviousForms = () => {
    console.log('Environment:', getEffectiveUIEnv() === 'dev' ? 'DEV' : 'PROD');
    console.log('API Environment:', getEffectiveEnv());
    console.log('Prod Preview Mode:', isProdPreview());
    console.log('Sheet ID:', sheetId);
    console.log('Sheet URL:', sheetUrl);
    window.open(sheetUrl, '_blank');
  };

  // Create new monthly sheet for dev
  const handleCreateSheet = async () => {
    if (isCreatingSheet) return;
    
    setIsCreatingSheet(true);
    try {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const monthName = monthNames[selectedMonth];
      const sheetName = `${monthName} ${selectedYear} Attendance`;
      
      const response = await fetch(`${API_BASE_URL}/create-monthly-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env: 'dev', // Force dev environment for safety
          force: true,
          month: selectedMonth,
          year: selectedYear
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        showAlert(`✅ Successfully created DEV sheet: ${sheetName}`, 'success');
      } else {
        showAlert(`❌ Failed to create DEV sheet: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error creating DEV sheet:', error);
      showAlert(`❌ Error creating DEV sheet: ${error.message}`, 'error');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Create new monthly sheet for production
  const handleCreateProdSheet = async () => {
    if (isCreatingSheet) return;
    
    setIsCreatingSheet(true);
    try {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const monthName = monthNames[selectedMonth];
      const sheetName = `${monthName} ${selectedYear} Attendance`;
      
      const requestBody = {
        env: 'prod', // Create production sheet
        force: true,
        month: selectedMonth,
        year: selectedYear
      };
      
      console.log('🚀 Sending PROD sheet creation request:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/create-monthly-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (result.success) {
        showAlert(`✅ Successfully created PROD sheet: ${sheetName}`, 'success');
      } else {
        showAlert(`❌ Failed to create PROD sheet: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error creating PROD sheet:', error);
      showAlert(`❌ Error creating PROD sheet: ${error.message}`, 'error');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Handle manual testing form submission
  const handleManualTestSubmit = async () => {
    if (isManualTesting) return;
    
    // Validate required fields
    if (!manualTestData.testDate || !manualTestData.testUser || !manualTestData.testClockIn || !manualTestData.testSpreadsheet) {
      showAlert('❌ Please fill in Date, User, Clock In, and select a Spreadsheet for manual testing', 'error');
      return;
    }
    
    setIsManualTesting(true);
    try {
      const payload = {
        driverName: manualTestData.testUser,
        thaiDate: manualTestData.testDate,
        clockIn: manualTestData.testClockIn,
        clockOut: manualTestData.testClockOut || '',
        comments: manualTestData.testComments || 'Manual test entry',
        submittedAt: getBangkokTimeString(),
        env: manualTestData.testEnvironment || 'dev',
        action: 'submitWithClockTimes',
        language: browserLang,
        isManualTest: true, // Flag to identify manual test entries
        targetSheetName: manualTestData.testSpreadsheet || null // Pass selected sheet name for manual tests
      };

      console.log('🧪 Sending manual test data:', payload);

      const response = await fetch(`${API_BASE_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.success) {
        const otMessage = result.otHours ? `\n⏰ OT Hours: ${result.otHours}` : '\n🚫 No OT Hours (business rule or clock out before 17:00)';
        const businessRuleMessage = otCalculation.businessRuleBlocked ? '\n🚫 Business Rule: OT calculation disabled (25th-31st)' : '';
        showAlert(`✅ Manual test successful!\n👤 User: ${manualTestData.testUser}\n📅 Date: ${manualTestData.testDate}\n🕒 Clock In: ${manualTestData.testClockIn}\n🕔 Clock Out: ${manualTestData.testClockOut || 'Not set'}${otMessage}${businessRuleMessage}\n\n📊 Data saved to Google Sheets`, 'success');

        // Send LINE notification for manual submission (respect UI environment)
        try {
          const message = `🧪 MANUAL TEST SUBMISSION\n\n👤 User: ${manualTestData.testUser}\n📅 Date: ${manualTestData.testDate}\n🕒 Clock In: ${manualTestData.testClockIn}\n🕔 Clock Out: ${manualTestData.testClockOut || 'Not set'}${otMessage}${businessRuleMessage}`;
          await fetch(`${API_BASE_URL}/notify-line`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, env: getEffectiveUIEnv() })
          });
        } catch (e) {
          console.warn('LINE notify failed for manual test (non-blocking):', e.message);
        }
        
        // Clear the form
        setManualTestData({
          testDate: '',
          testUser: '',
          testClockIn: '',
          testClockOut: '',
          testComments: ''
        });
      } else {
        showAlert(`❌ Manual test failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error in manual test:', error);
      showAlert(`❌ Error in manual test: ${error.message}`, 'error');
    } finally {
      setIsManualTesting(false);
    }
  };

  // Handle manual test form changes
  const handleManualTestChange = (field, value) => {
    setManualTestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear manual test form
  const clearManualTest = () => {
    setManualTestData(prev => ({
      ...prev,
      testDate: '',
      testUser: '',
      testClockIn: '',
      testClockOut: '',
      testComments: ''
      // Keep testEnvironment, testSpreadsheet, and availableSheets
    }));
  };

  // Calculate OT hours for manual testing (frontend calculation)
  const calculateManualTestOT = () => {
    const { testDate, testClockOut } = manualTestData;
    
    // Check if we have required data
    if (!testDate || !testClockOut) {
      return {
        otHours: '',
        otStart: '',
        otEnd: '',
        businessRuleBlocked: false,
        reason: 'Missing date or clock-out time'
      };
    }

    // Check business rule: No OT calculation from 25th to end of month
    try {
      const parts = testDate.split('/');
      if (parts.length !== 3) {
        return {
          otHours: '',
          otStart: '',
          otEnd: '',
          businessRuleBlocked: false,
          reason: 'Invalid date format'
        };
      }
      
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const thaiYear = parseInt(parts[2]);
      
      // Business rule: No OT calculation from 25th to end of month
      if (day >= 25) {
        return {
          otHours: '0.00',
          otStart: '',
          otEnd: '',
          businessRuleBlocked: true,
          reason: `Business rule: Day ${day} is on or after 25th of month ${month}/${thaiYear}`
        };
      }
      
      // Calculate OT hours if clock out time is after 17:00
      const clockOutTime = new Date(`2000-01-01T${testClockOut}:00`);
      const otStartTime = new Date(`2000-01-01T17:00:00`);
      
      if (clockOutTime > otStartTime) {
        const diffMs = clockOutTime.getTime() - otStartTime.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        
        return {
          otHours: diffHours.toFixed(2),
          otStart: '17:00',
          otEnd: testClockOut,
          businessRuleBlocked: false,
          reason: `OT calculated: ${diffHours.toFixed(2)} hours from 17:00 to ${testClockOut}`
        };
      } else {
        return {
          otHours: '0.00',
          otStart: '',
          otEnd: '',
          businessRuleBlocked: false,
          reason: `No OT: Clock out time ${testClockOut} is not after 17:00`
        };
      }
    } catch (error) {
      return {
        otHours: '',
        otStart: '',
        otEnd: '',
        businessRuleBlocked: false,
        reason: `Error: ${error.message}`
      };
    }
  };

  // Handle Day of Week update form changes
  const handleDayOfWeekUpdateChange = (field, value) => {
    setDayOfWeekUpdateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch available sheets based on environment
  const fetchAvailableSheets = async (environment) => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment })
      });
      
      if (response.ok) {
        const result = await response.json();
        handleDayOfWeekUpdateChange('availableSheets', result.sheets || []);
      } else {
        showAlert('❌ Failed to fetch available sheets', 'error');
      }
    } catch (error) {
      showAlert(`❌ Error fetching sheets: ${error.message}`, 'error');
    }
  };

  // Fetch available sheets for manual testing
  const fetchManualTestSheets = async (environment) => {
    try {
      console.log(`📋 Fetching sheets for ${environment} environment...`);
      const response = await fetch(`${API_BASE_URL}/get-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Fetched ${result.sheets?.length || 0} sheets for ${environment}:`, result.sheets);
        setManualTestData(prev => ({
          ...prev,
          availableSheets: result.sheets || [],
          testSpreadsheet: '' // Clear selection when environment changes
        }));
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`❌ Failed to fetch sheets for ${environment}:`, errorData);
        showAlert(`❌ Failed to fetch available sheets for ${environment}: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error(`❌ Error fetching sheets for ${environment}:`, error);
      showAlert(`❌ Error fetching sheets for ${environment}: ${error.message}`, 'error');
    }
  };

  // Handle Day of Week update submission
  const handleDayOfWeekUpdateSubmit = async () => {
    if (isUpdatingDayOfWeek) return;
    
    // Validate required fields
    if (!dayOfWeekUpdateData.selectedSheet) {
      showAlert('❌ Please select a sheet to update', 'error');
      return;
    }
    
    setIsUpdatingDayOfWeek(true);
    try {
      const response = await fetch(`${API_BASE_URL}/update-day-of-week`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: dayOfWeekUpdateData.environment,
          sheetName: dayOfWeekUpdateData.selectedSheet
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        showAlert(`✅ Day of Week update completed!\n\n📊 Updated sheet: ${dayOfWeekUpdateData.selectedSheet}\n📝 ${result.message || 'Success'}`, 'success');
      } else {
        const errorData = await response.json();
        showAlert(`❌ Update failed: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showAlert(`❌ Error updating Day of Week: ${error.message}`, 'error');
    } finally {
      setIsUpdatingDayOfWeek(false);
    }
  };

  // Get real-time OT calculation for display
  const otCalculation = calculateManualTestOT();

  // Auto-fetch sheets for dev environment on component mount
  useEffect(() => {
    if (getEffectiveUIEnv() === 'dev') {
      fetchAvailableSheets('dev');
    }
  }, []);

  // Check if all required fields are filled for auto-submit state
  const areAllRequiredFieldsFilled = () => {
    // Basic required fields
    if (!formData.driverName.trim() || !formData.clockIn) {
      return false;
    }
    
    // If user has clock-in, require clock-out and comments
    if (formData.clockIn && (!formData.clockOut || !formData.comments.trim())) {
      return false;
    }
    
    return true;
  };

  // Update a field in Google Sheets
  const updateFieldInGoogleSheets = async (field, value) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateField',
          driverName: formData.driverName,
          thaiDate: getThaiDateString(),
          field: field,
          value: value,
          env: getEffectiveEnv(),
          language: browserLang
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Updated ${field} in Google Sheets:`, value);
      } else {
        console.error(`❌ Failed to update ${field}:`, result.error);
      }
      
      return result.success;
    } catch (error) {
      console.error(`Error updating ${field} in Google Sheets:`, error);
      return false;
    }
  };

  // Helper to render a custom dropdown for mobile
  function MobileDropdown({ options, value, onSelect, show, formatOption, allowCustomInput, customValue, onCustomChange }) {
    // Check if customValue is a valid time and not in options
    const isCustomValid = isValidTime(customValue);
    const customNotInOptions = isCustomValid && !options.includes(customValue);
    // Build the options list: custom value first if needed
    const displayOptions = customNotInOptions ? [customValue, ...options] : options;
    return (
      show && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            background: isDarkMode ? "#27272a" : "#fff",
            border: isDarkMode ? "1px solid #334155" : "1px solid #ccc",
            borderRadius: "4px",
            zIndex: 9999,
            maxHeight: 260,
            overflowY: "auto",
            padding: 0,
          }}
        >
          {displayOptions.map((opt) => (
            <div
              key={opt}
              style={{
                padding: "10px",
                cursor: "pointer",
                background: value === opt ? (isDarkMode ? "#e0e7ff" : "#e0e7ff") : (isDarkMode ? "#27272a" : "#fff"),
                color: value === opt
                  ? (isDarkMode ? "#000" : "#000")
                  : (isDarkMode ? "#f1f5f9" : "#000"),
                fontWeight: value === opt ? 600 : 400,
                fontFamily: browserLang && browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
              }}
              onClick={() => {
                onSelect(opt);
              }}
            >
              {formatOption ? formatOption(opt) : opt}
            </div>
          ))}
        </div>
      )
    );
  }

  // Helper to validate HH:mm
  function isValidTime(str) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(str);
  }

  // Get the current local date string based on selected language
  const getTodayString = () => {
    return new Date().toLocaleDateString(browserLang === 'th' ? 'th-TH' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  };

  // Helper to close all dropdowns
  function closeAllDropdowns() {
    setShowDriverDropdown(false);
  }

  function getThaiDateString() {
    return new Date().toLocaleDateString('th-TH');
  }

  function getDayOfWeekFromThaiDate(thaiDate) {
    try {
      const parts = thaiDate.split('/');
      if (parts.length !== 3) {
        console.log('⚠️ Invalid Thai date format, using current date');
        return new Date().toLocaleDateString(browserLang === 'th' ? 'th-TH' : 'en-US', { weekday: 'long' });
      }
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const thaiYear = parseInt(parts[2]);
      const gregorianYear = thaiYear - 543;
      const date = new Date(gregorianYear, month - 1, day);
      const dayOfWeek = date.toLocaleDateString(browserLang === 'th' ? 'th-TH' : 'en-US', { weekday: 'long' });
      console.log(`📅 Date: ${thaiDate} -> Day: ${dayOfWeek}`);
      return dayOfWeek;
    } catch (error) {
      console.log('⚠️ Error calculating day of week:', error.message);
      return 'Unknown';
    }
  }

  function translateDayOfWeek(dayOfWeek, language) {
    const dayTranslations = {
      en: {
        'Monday': 'Monday',
        'Tuesday': 'Tuesday', 
        'Wednesday': 'Wednesday',
        'Thursday': 'Thursday',
        'Friday': 'Friday',
        'Saturday': 'Saturday',
        'Sunday': 'Sunday'
      },
      th: {
        'Monday': 'วันจันทร์',
        'Tuesday': 'วันอังคาร',
        'Wednesday': 'วันพุธ', 
        'Thursday': 'วันพฤหัสบดี',
        'Friday': 'วันศุกร์',
        'Saturday': 'วันเสาร์',
        'Sunday': 'วันอาทิตย์'
      }
    };
    
    return dayTranslations[language]?.[dayOfWeek] || dayOfWeek;
  }



  // Get language preference from URL path, then browser language
  const getLanguagePreference = () => {
    // Check URL path first
    const path = window.location.pathname;
    
    if (path === '/th' || path.startsWith('/th/')) {
      return 'th';
    }
    
    if (path === '/en' || path.startsWith('/en/')) {
      return 'en';
    }
    
    // For /prod path, check cookie first, then browser language
    if (path === '/prod') {
      const savedLang = getCookie('preferredLanguage');
      if (savedLang === 'th' || savedLang === 'en') {
        return savedLang;
      }
      // Fallback to browser language
      if (navigator.language.startsWith('th')) {
        return 'th';
      } else {
        return 'en';
      }
    }
    
    // For root path (/), use browser language detection
    if (path === '/') {
      if (navigator.language.startsWith('th')) {
        return 'th';
      } else {
        return 'en';
      }
    }
    
    // Default to Thai for any other path
    return 'th';
  };
  
  const [browserLang, setBrowserLang] = useState(() => getLanguagePreference()); // Initialize with actual language preference

  // Update language when path changes (for routes like /th, /en)
  useEffect(() => {
    const currentLang = getLanguagePreference();
    if (currentLang !== browserLang) {
      setBrowserLang(currentLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info'); // 'info', 'success', 'error'

  // Custom alert function
  const showAlert = (message, type = 'info') => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  // Custom modal component
  const Modal = ({ isOpen, message, type, onClose }) => {
    if (!isOpen) return null;

    const getModalStyle = () => {
      const baseStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      };

      const contentStyle = {
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
      };

      const iconStyle = {
        fontSize: '48px',
        textAlign: 'center',
        marginBottom: '16px',
      };

      const messageStyle = {
        color: isDarkMode ? '#f1f5f9' : '#1f2937',
        fontSize: '16px',
        lineHeight: '1.5',
        textAlign: 'center',
        marginBottom: '24px',
        whiteSpace: 'pre-line',
        fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
      };

      const buttonStyle = {
        background: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        width: '100%',
        transition: 'all 0.2s',
        fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
      };

      return { baseStyle, contentStyle, iconStyle, messageStyle, buttonStyle };
    };

    const styles = getModalStyle();
    const getIcon = () => {
      switch (type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
      }
    };

    return (
      <div style={styles.baseStyle} onClick={onClose}>
        <div style={styles.contentStyle} onClick={(e) => e.stopPropagation()}>
          <div style={styles.iconStyle}>{getIcon()}</div>
          <div style={styles.messageStyle}>{message}</div>
          <button 
            style={styles.buttonStyle}
            onMouseOver={(e) => {
              e.target.style.opacity = '0.9';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.opacity = '1';
              e.target.style.transform = 'translateY(0)';
            }}
            onClick={onClose}
          >
            {labels[browserLang].ok}
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const match = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(match.matches);
    const handler = (e) => setIsDarkMode(e.matches);
    match.addEventListener('change', handler);
    return () => match.removeEventListener('change', handler);
  }, []);

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
      onClick={closeAllDropdowns}
    >
      <form
        style={{
          width: "80vw",
          maxWidth: 500,
          margin: "0 auto",
          border: isDarkMode ? "1px solid #334155" : "1px solid #ccc",
          borderRadius: "18px",
          boxShadow: isDarkMode
            ? "0 4px 24px 0 rgba(0,0,0,0.32)"
            : "0 4px 24px 0 rgba(0,0,0,0.08)",
          padding: "40px 24px 20px 24px",
          background: isDarkMode ? "#18181b" : "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          color: isDarkMode ? "#f1f5f9" : undefined,
          minHeight: isMobile() ? "85vh" : "auto",
          position: "relative",
        }}
        autoComplete="off"
        onSubmit={handleSubmit}
      >
        {/* Language Switcher Button */}
        <div style={{ 
          position: 'absolute', 
          top: '17px', 
          right: '20px',
          zIndex: 1000
        }}>
          <button
            type="button"
            onClick={() => {
              const newLang = browserLang === 'th' ? 'en' : 'th';
              // Preserve current path (like /prod) and just update language state
              const currentPath = window.location.pathname;
              
              // If on /prod, stay on /prod and just update language via state
              if (currentPath === '/prod') {
                setBrowserLang(newLang);
                // Store language preference in cookie/localStorage for persistence
                setCookie('preferredLanguage', newLang, 365);
              } else {
                // For other paths, navigate to language-specific path
                const newPath = newLang === 'th' ? '/th' : '/en';
                navigate(newPath, { replace: true });
              }
            }}
            style={{
              padding: '8px 12px',
              fontSize: '16px',
              borderRadius: '17px',
              //border: '1px solid #ccc',
              background: isDarkMode ? '#27272a' : '#fff',
              color: isDarkMode ? '#f1f5f9' : '#333',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            {browserLang === 'th' ? '🇹🇭' : '🇺🇸'}
          </button>
        </div>
        
        <h1 style={{ 
          textAlign: "center", 
          marginBottom: 10, 
          fontWeight: 700, 
          fontSize: 28, 
          color: isDarkMode ? "#f1f5f9" : undefined,
          fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
        }}>
          {labels[browserLang].title}
        </h1>
        <div style={{ 
          textAlign: "center", 
          marginBottom: 20, 
          color: isDarkMode ? '#cbd5e1' : '#555', 
          fontSize: 18,
          fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
        }}>
          {getTodayString()}
        </div>

        {/* Day of Week Display */}
        {dayOfWeek && (
          <div style={{ 
            textAlign: "center", 
            marginBottom: 16, 
            color: isDarkMode ? '#94a3b8' : '#666', 
            fontSize: 16,
            fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
          }}>
            {labels[browserLang]?.dayOfWeekLabel || "📆 Day of Week:"} {dayOfWeek}
          </div>
        )}

        {/* Driver Name Dropdown */}
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ 
              fontWeight: 500, 
              color: isDarkMode ? "#f1f5f9" : undefined,
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}>
              {labels[browserLang]?.driverName || "Driver Name"} *
            </label>
            <button
              type="button"
              onClick={() => setShowAddDriverModal(true)}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              + {browserLang === 'th' ? "เพิ่ม" : "Add"}
            </button>
          </div>
          <div>
            {/* Use custom dropdown for both mobile and desktop */}
            <>
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "4px",
                  border: invalidFields.driverName ? "2px solid #ef4444" : isDarkMode ? "1px solid #334155" : "1px solid #ccc",
                  borderRadius: "4px",
                  background: isDarkMode ? "#27272a" : "#f9f9f9",
                  fontSize: "16px",
                  textAlign: "left",
                  color: isDarkMode ? "#f1f5f9" : undefined,
                  cursor: "pointer",
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (showDriverDropdown) {
                    closeAllDropdowns();
                  } else {
                    closeAllDropdowns();
                    setShowDriverDropdown(true);
                  }
                }}
              >
                {formData.driverName || (labels[browserLang]?.selectYourName || "Select your name")}
              </button>
              <MobileDropdown
                options={drivers}
                value={formData.driverName}
                onSelect={opt => {
                  setFormData(prev => ({ ...prev, driverName: opt }));
                  setCookie('driverName', opt);
                  // Auto-populate day of week based on current date
                  const currentDate = getThaiDateString();
                  const dayOfWeekValue = getDayOfWeekFromThaiDate(currentDate);
                  setDayOfWeek(translateDayOfWeek(dayOfWeekValue, browserLang));
                  // Clear validation errors when driver is selected
                  setInvalidFields({});
                  // Close dropdown immediately after selection
                  closeAllDropdowns();
                  // Check if data exists in Google Sheets for this driver and date
                  setTimeout(() => {
                  if (opt.trim()) {
                    checkExistingDataForDriver(opt.trim());
                  }
                  }, 100); // Small delay to ensure dropdown closes first
                }}
                show={showDriverDropdown}
                formatOption={opt => <span style={{ color: isDarkMode ? '#f1f5f9' : undefined }}>{opt}</span>}
              />
            </>
          </div>
        </div>

        {/* Add Driver Modal */}
        {showAddDriverModal && (
          <div
            style={{
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
            }}
            onClick={() => !isAddingDriver && setShowAddDriverModal(false)}
          >
            <div
              style={{
                background: isDarkMode ? '#1e293b' : '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                boxSizing: 'border-box',
                overflowX: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: 600, color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                {browserLang === 'th' ? 'เพิ่มคนขับใหม่' : 'Add New Driver'}
              </h2>

              {/* Photo Upload */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: isDarkMode ? '#cbd5e1' : '#374151' }}>
                  {browserLang === 'th' ? 'รูปภาพ' : 'Photo'}
                </label>
                {newDriver.photoPreview && (
                  <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                    <img src={newDriver.photoPreview} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px', objectFit: 'cover' }} />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isAddingDriver}
                  style={{ width: '100%', padding: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#d1d5db'}`, borderRadius: '6px', background: isDarkMode ? '#0f172a' : '#ffffff', color: isDarkMode ? '#f1f5f9' : '#111827', fontSize: '14px' }}
                />
              </div>

              {/* Name Field */}
              <div style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: isDarkMode ? '#cbd5e1' : '#374151' }}>
                  {browserLang === 'th' ? 'ชื่อ' : 'Name'} *
                </label>
                <input
                  type="text"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={browserLang === 'th' ? 'กรอกชื่อ' : 'Enter name'}
                  disabled={isAddingDriver}
                  style={{ width: '100%', padding: '12px', border: `1px solid ${isDarkMode ? '#334155' : '#d1d5db'}`, borderRadius: '6px', background: isDarkMode ? '#0f172a' : '#ffffff', color: isDarkMode ? '#f1f5f9' : '#111827', fontSize: '16px', fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined, boxSizing: 'border-box', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                />
              </div>

              {/* Age Field */}
              <div style={{ marginBottom: '24px', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: isDarkMode ? '#cbd5e1' : '#374151' }}>
                  {browserLang === 'th' ? 'อายุ' : 'Age'}
                </label>
                <input
                  type="number"
                  value={newDriver.age}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, age: e.target.value }))}
                  placeholder={browserLang === 'th' ? 'กรอกอายุ' : 'Enter age'}
                  disabled={isAddingDriver}
                  min="0"
                  style={{ width: '100%', padding: '12px', border: `1px solid ${isDarkMode ? '#334155' : '#d1d5db'}`, borderRadius: '6px', background: isDarkMode ? '#0f172a' : '#ffffff', color: isDarkMode ? '#f1f5f9' : '#111827', fontSize: '16px', fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined, boxSizing: 'border-box', maxWidth: '100%', overflow: 'hidden' }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDriverModal(false);
                    setNewDriver({ name: '', age: '', photo: null, photoPreview: null });
                  }}
                  disabled={isAddingDriver}
                  style={{ flex: 1, padding: '12px', background: isDarkMode ? '#334155' : '#e5e7eb', color: isDarkMode ? '#f1f5f9' : '#111827', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 500, cursor: isAddingDriver ? 'not-allowed' : 'pointer', fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined }}
                >
                  {browserLang === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleAddDriver}
                  disabled={isAddingDriver || !newDriver.name.trim()}
                  style={{ flex: 1, padding: '12px', background: isAddingDriver || !newDriver.name.trim() ? (isDarkMode ? '#475569' : '#9ca3af') : '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 500, cursor: isAddingDriver || !newDriver.name.trim() ? 'not-allowed' : 'pointer', fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined }}
                >
                  {isAddingDriver ? (browserLang === 'th' ? 'กำลังเพิ่ม...' : 'Adding...') : (browserLang === 'th' ? 'เพิ่ม' : 'Add')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading Animation */}
        <LoadingAnimation isVisible={isLoadingData} size={60} isDarkMode={isDarkMode} />
        
        {/* Clock In/Out Row */}
        <div style={{ display: "flex", gap: 8 }}>
          {/* Clock In */}
          <div style={{ flex: 1, position: "relative" }}>
            <label style={{ 
              color: isDarkMode ? "#f1f5f9" : undefined,
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}>
              {labels[browserLang]?.clockIn || "Clock In"} *
              <button
                type="button"
                disabled={!!formData.clockIn}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "4px",
                  border: invalidFields.clockIn ? "2px solid #ef4444" : 
                         changedFields.clockIn ? "2px solid #f59e0b" : 
                         isDarkMode ? "1px solid #334155" : "1px solid #ccc",
                  borderRadius: "4px",
                  background: formData.clockIn 
                    ? (isDarkMode ? "#374151" : "#f3f4f6") 
                    : (isDarkMode ? "#27272a" : "#f9f9f9"),
                  fontSize: "16px",
                  color: formData.clockIn 
                    ? (isDarkMode ? "#9ca3af" : "#6b7280") 
                    : (isDarkMode ? "#f1f5f9" : undefined),
                  cursor: formData.clockIn ? "not-allowed" : "pointer",
                  opacity: formData.clockIn ? 0.7 : 1,
                  position: "relative",
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}
                onClick={() => {
                  if (formData.clockIn) {
                    return;
                  }
                  handleClockEvent('clockIn');
                }}
              >
                {formData.clockIn ? formData.clockIn : (labels[browserLang]?.clockIn || "Clock In")}
                {changedFields.clockIn && (
                  <span style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    background: "#f59e0b",
                    color: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold"
                  }}>
                    ✏️
                  </span>
                )}
              </button>
            </label>
          </div>
          {/* Clock Out */}
          <div style={{ flex: 1, position: "relative" }}>
            <label style={{ 
              color: isDarkMode ? "#f1f5f9" : undefined,
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}>
              {labels[browserLang].clockOut} *
              <button
                type="button"
                disabled={!!formData.clockOut}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "4px",
                  border: invalidFields.clockOut ? "2px solid #ef4444" : 
                         changedFields.clockOut ? "2px solid #f59e0b" : 
                         isDarkMode ? "1px solid #334155" : "1px solid #ccc",
                  borderRadius: "4px",
                  background: formData.clockOut 
                    ? (isDarkMode ? "#374151" : "#f3f4f6") 
                    : (isDarkMode ? "#27272a" : "#f9f9f9"),
                  fontSize: "16px",
                  color: formData.clockOut 
                    ? (isDarkMode ? "#9ca3af" : "#6b7280") 
                    : (isDarkMode ? "#f1f5f9" : undefined),
                  cursor: formData.clockOut ? "not-allowed" : "pointer",
                  opacity: formData.clockOut ? 0.7 : 1,
                  position: "relative",
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}
                onClick={() => {
                  if (formData.clockOut) {
                    return;
                  }
                  handleClockEvent('clockOut');
                }}
              >
                {formData.clockOut ? formData.clockOut : labels[browserLang].clockOut}
                {changedFields.clockOut && (
                  <span style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    background: "#f59e0b",
                    color: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold"
                  }}>
                    ✏️
                  </span>
                )}
              </button>
            </label>
          </div>
        </div>
        {/* Comments Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <label style={{ 
            fontWeight: 500, 
            color: isDarkMode ? "#f1f5f9" : undefined,
            fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
          }}>
            {labels[browserLang].comments}
            
            {/* Weather Emojis */}
            <div style={{
              marginTop: "4px",
              marginBottom: "8px",
              display: "flex",
              gap: "0px",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%"
            }}>
              {['☀️', '🌤️', '☁️', '🌦️', '🌧️', '🌩️','⚡'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    const newComments = formData.comments + emoji;
                    setFormData(prev => ({ ...prev, comments: newComments }));
                    setChangedFields(prev => ({ ...prev, comments: true }));
                  }}
                  style={{
                    fontSize: "24px",
                    padding: "8px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    borderRadius: "6px",
                    transition: "background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "1",
                    height: "40px"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = isDarkMode ? "#374151" : "#e5e7eb";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "transparent";
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            <div style={{ position: "relative" }}>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              onBlur={async () => {
                if (changedFields.comments) {
                  // Update Google Sheets with the new comments value
                  await updateFieldInGoogleSheets('comments', formData.comments);
                  // Remove the orange border
                  setChangedFields(prev => ({ ...prev, comments: false }));
                }
              }}
              style={{
                  width: "100%",
                display: "block",
                margin: "0 auto",
                  padding: "16px",
                  marginTop: "8px",
                  border: invalidFields.comments ? "2px solid #ef4444" : 
                         changedFields.comments ? "2px solid #f59e0b" : 
                         isDarkMode ? "1px solid #334155" : "1px solid #ccc",
                  borderRadius: "8px",
                fontSize: "16px",
                  minHeight: isMobile() ? (isIPhoneSE() ? "15vh" : "20vh") : "120px",
                  maxHeight: isMobile() ? "25vh" : "200px",
                background: isDarkMode ? "#27272a" : "#fff",
                color: isDarkMode ? "#f1f5f9" : undefined,
                  resize: "none",
                  boxSizing: "border-box",
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}
              />
              {changedFields.comments && (
                <span style={{
                  position: "absolute",
                  top: "0px",
                  right: "0px",
                  background: "#f59e0b",
                  color: "white",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold"
                }}>
                  ✏️
                </span>
              )}
              {isSavingComments && (
                <span style={{
                  position: "absolute",
                  top: "0px",
                  right: changedFields.comments ? "25px" : "0px",
                  background: "#10b981",
                  color: "white",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  animation: "spin 1s linear infinite"
                }}>
                  💾
                </span>
              )}
            </div>
          </label>
        </div>
        
        {/* Change Summary Indicator */}
        {originalData && Object.values(changedFields).some(changed => changed) && (
          <div style={{
            marginTop: 16,
            padding: "12px",
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "8px",
            color: "#92400e",
            fontSize: "14px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
          }}>
            <span>⚠️</span>
            <span>You have modified data loaded from Google Sheets.</span>
          </div>
        )}
        
        {/* Submit and Previous Forms Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          {/* Submit button - show for both dev and prod */}
          <button
            type="submit"
            disabled={isSubmitted}
            style={{
              flex: 1,
              background: isSubmitted 
                ? (isDarkMode ? '#6b7280' : '#9ca3af')
                : areAllRequiredFieldsFilled()
                  ? '#f59e0b' // Yellow for auto-submit state
                  : (isDarkMode ? '#2563eb' : '#3b82f6'),
              color: '#fff',
              opacity: isSubmitted ? 0.6 : 1,
              pointerEvents: isSubmitted ? 'none' : 'auto',
              border: isSubmitted 
                ? (isDarkMode ? '1px solid #6b7280' : '1px solid #9ca3af')
                : areAllRequiredFieldsFilled()
                  ? '1px solid #f59e0b' // Yellow border for auto-submit state
                  : (isDarkMode ? '1px solid #2563eb' : '1px solid #3b82f6'),
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
              padding: '14px',
              boxShadow: isDarkMode ? '0 2px 8px 0 rgba(0,0,0,0.24)' : '0 2px 8px 0 rgba(0,0,0,0.04)',
              transition: 'background 0.2s',
              cursor: isSubmitted ? 'not-allowed' : 'pointer',
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}
          >
            {isSubmitted ? '✅ Submitted' : areAllRequiredFieldsFilled() ? '🚀 Auto Submit Ready' : labels[browserLang].submit}
          </button>
          
          <button
            type="button"
            style={{ 
              flex: 1, 
              color: isDarkMode ? '#f1f5f9' : undefined, 
              background: isDarkMode ? '#27272a' : undefined, 
              border: isDarkMode ? '1px solid #334155' : '1px solid #ccc',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
              padding: '14px',
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}
            onClick={handlePreviousForms}
          >
            {labels[browserLang].previous}
          </button>
        </div>

                {/* Month/Year Selector and Create Sheet - DevAdmin Only */}
                {isDevAdmin && getEffectiveUIEnv() === 'dev' && (
          <div style={{ 
            marginBottom: 20,
            border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            background: isDarkMode ? '#1f2937' : '#f9fafb'
          }}>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '12px'
            }}>
              {/* Month Selector */}
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isDarkMode ? '#f1f5f9' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: isDarkMode ? '#374151' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#374151',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}
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

              {/* Year Selector */}
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isDarkMode ? '#f1f5f9' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: isDarkMode ? '#374151' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#374151',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Create Sheet Buttons - Dev Only */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Create Dev Sheet Button */}
              <button
                type="button"
                onClick={handleCreateSheet}
                disabled={isCreatingSheet}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: isCreatingSheet 
                    ? (isDarkMode ? '#6b7280' : '#9ca3af')
                    : (isDarkMode ? '#3b82f6' : '#2563eb'),
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isCreatingSheet ? 'not-allowed' : 'pointer',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (!isCreatingSheet) {
                    e.target.style.background = isDarkMode ? '#2563eb' : '#1d4ed8';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isCreatingSheet) {
                    e.target.style.background = isDarkMode ? '#3b82f6' : '#2563eb';
                  }
                }}
              >
                {isCreatingSheet ? '🔄 Creating...' : '📅 Create Dev Sheet'}
              </button>

              {/* Create Prod Sheet Button */}
              <button
                type="button"
                onClick={handleCreateProdSheet}
                disabled={isCreatingSheet}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: isCreatingSheet 
                    ? (isDarkMode ? '#6b7280' : '#9ca3af')
                    : (isDarkMode ? '#dc2626' : '#ef4444'),
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isCreatingSheet ? 'not-allowed' : 'pointer',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (!isCreatingSheet) {
                    e.target.style.background = isDarkMode ? '#b91c1c' : '#dc2626';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isCreatingSheet) {
                    e.target.style.background = isDarkMode ? '#dc2626' : '#ef4444';
                  }
                }}
              >
                {isCreatingSheet ? '🔄 Creating...' : '📅 Create Prod Sheet'}
              </button>
            </div>
          </div>
        )}

        {/* Manual Testing Section - DevAdmin Only */}
        {isDevAdmin && getEffectiveUIEnv() === 'dev' && (
          <div style={{ 
            marginBottom: 20,
            border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            background: isDarkMode ? '#1f2937' : '#f9fafb',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ 
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: isDarkMode ? '#f1f5f9' : '#374151',
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}>
              🧪 Manual Testing
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              {/* Environment Selection */}
              <div style={{ width: '100%' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isDarkMode ? '#f1f5f9' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  🌍 Test Environment
                </label>
                <select
                  value={manualTestData.testEnvironment || 'dev'}
                  onChange={(e) => handleManualTestChange('testEnvironment', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: isDarkMode ? '#374151' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#374151',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="dev">Development</option>
                  <option value="prod">Production</option>
                </select>
              </div>
              
              {/* Spreadsheet Selection */}
              <div style={{ width: '100%' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isDarkMode ? '#f1f5f9' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  📊 Test Spreadsheet
                </label>
                <select
                  value={manualTestData.testSpreadsheet || ''}
                  onChange={(e) => handleManualTestChange('testSpreadsheet', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: isDarkMode ? '#374151' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#374151',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select a spreadsheet...</option>
                  {manualTestData.availableSheets?.map((sheetName) => (
                    <option key={sheetName} value={sheetName}>
                      {sheetName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Test Date */}
              <div style={{ width: '100%' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isDarkMode ? '#f1f5f9' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  Test Date (Thai format: DD/MM/YYYY) *
                </label>
                <input
                  type="text"
                  placeholder="e.g., 25/9/2568"
                  value={manualTestData.testDate}
                  onChange={(e) => handleManualTestChange('testDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: isDarkMode ? '#374151' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#374151',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Test User */}
              <div style={{ width: '100%' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isDarkMode ? '#f1f5f9' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  Test User *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Jean"
                  value={manualTestData.testUser}
                  onChange={(e) => handleManualTestChange('testUser', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: isDarkMode ? '#374151' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#374151',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Clock In/Out Row */}
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                {/* Test Clock In */}
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: isDarkMode ? '#f1f5f9' : '#374151',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}>
                    Clock In *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 08:00"
                    value={manualTestData.testClockIn}
                    onChange={(e) => handleManualTestChange('testClockIn', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: isDarkMode ? '#374151' : '#ffffff',
                      color: isDarkMode ? '#f1f5f9' : '#374151',
                      fontSize: '14px',
                      fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Test Clock Out */}
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: isDarkMode ? '#f1f5f9' : '#374151',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}>
                    Clock Out
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 18:00"
                    value={manualTestData.testClockOut}
                    onChange={(e) => handleManualTestChange('testClockOut', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: isDarkMode ? '#374151' : '#ffffff',
                      color: isDarkMode ? '#f1f5f9' : '#374151',
                      fontSize: '14px',
                      fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Test Comments */}
              <div style={{ width: '100%' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isDarkMode ? '#f1f5f9' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  Comments
                </label>
                <input
                  type="text"
                  placeholder="e.g., Manual test for business rule"
                  value={manualTestData.testComments}
                  onChange={(e) => handleManualTestChange('testComments', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: isDarkMode ? '#374151' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#374151',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* OT Calculation Preview */}
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                background: otCalculation.businessRuleBlocked 
                  ? (isDarkMode ? '#fef2f2' : '#fef2f2')
                  : otCalculation.otHours && parseFloat(otCalculation.otHours) > 0
                    ? (isDarkMode ? '#f0fdf4' : '#f0fdf4')
                    : (isDarkMode ? '#f9fafb' : '#f9fafb'),
                border: otCalculation.businessRuleBlocked 
                  ? '1px solid #fca5a5'
                  : otCalculation.otHours && parseFloat(otCalculation.otHours) > 0
                    ? '1px solid #86efac'
                    : '1px solid #d1d5db'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: otCalculation.businessRuleBlocked 
                    ? '#dc2626'
                    : otCalculation.otHours && parseFloat(otCalculation.otHours) > 0
                      ? '#16a34a'
                      : '#6b7280',
                  marginBottom: '8px',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  📊 OT Calculation Preview
                </div>
                
                {otCalculation.reason ? (
                  <div style={{
                    fontSize: '13px',
                    color: otCalculation.businessRuleBlocked 
                      ? '#dc2626'
                      : otCalculation.otHours && parseFloat(otCalculation.otHours) > 0
                        ? '#16a34a'
                        : '#6b7280',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}>
                    {otCalculation.reason}
                  </div>
                ) : null}

                {otCalculation.otHours && parseFloat(otCalculation.otHours) > 0 && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    color: '#16a34a',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}>
                    ⏰ OT Hours: <strong>{otCalculation.otHours}</strong> | 
                    🕕 Start: <strong>{otCalculation.otStart}</strong> | 
                    🕖 End: <strong>{otCalculation.otEnd}</strong>
                  </div>
                )}

                {otCalculation.businessRuleBlocked && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    color: '#dc2626',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}>
                    🚫 <strong>Business Rule Active:</strong> OT calculation disabled from 25th to end of month
                  </div>
                )}
              </div>

              {/* Quick Test Presets */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setManualTestData({
                      testDate: '15/9/2568',
                      testUser: 'Jean',
                      testClockIn: '08:00',
                      testClockOut: '18:00',
                      testComments: 'Test: Normal OT calculation (before 25th)'
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #10b981',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: '#10b981',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#10b981';
                    e.target.style.color = '#ffffff';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#10b981';
                  }}
                >
                  ✅ Before 25th
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManualTestData({
                      testDate: '25/9/2568',
                      testUser: 'Jean',
                      testClockIn: '08:00',
                      testClockOut: '18:00',
                      testComments: 'Test: Business rule blocks OT (on 25th)'
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#ef4444';
                    e.target.style.color = '#ffffff';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#ef4444';
                  }}
                >
                  🚫 On/After 25th
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManualTestData({
                      testDate: '1/10/2568',
                      testUser: 'Jean',
                      testClockIn: '08:00',
                      testClockOut: '18:00',
                      testComments: 'Test: Resume OT calculation (1st of next month)'
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: '#3b82f6',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#3b82f6';
                    e.target.style.color = '#ffffff';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#3b82f6';
                  }}
                >
                  🔄 1st Next Month
                </button>
              </div>

              {/* Manual Test Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setManualTestData({
                      testDate: '',
                      testUser: '',
                      testClockIn: '',
                      testClockOut: '',
                      testComments: '',
                      testEnvironment: 'dev',
                      testSpreadsheet: '',
                      availableSheets: []
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #6b7280',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: '#6b7280',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#6b7280';
                    e.target.style.color = '#ffffff';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#6b7280';
                  }}
                >
                  🧹 Clear
                </button>
                <button
                  type="button"
                  onClick={handleManualTestSubmit}
                  disabled={isManualTesting}
                  style={{
                    flex: 2,
                    padding: '12px',
                    border: 'none',
                    borderRadius: '6px',
                    background: isManualTesting 
                      ? (isDarkMode ? '#6b7280' : '#9ca3af')
                      : (isDarkMode ? '#10b981' : '#059669'),
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isManualTesting ? 'not-allowed' : 'pointer',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!isManualTesting) {
                      e.target.style.background = isDarkMode ? '#059669' : '#047857';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isManualTesting) {
                      e.target.style.background = isDarkMode ? '#10b981' : '#059669';
                    }
                  }}
                >
                  {isManualTesting ? '🔄 Testing...' : '🧪 Submit Manual Test'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Day of Week Update Section - DevAdmin Only */}
        {isDevAdmin && getEffectiveUIEnv() === 'dev' && (
          <div style={{ 
            marginBottom: 20,
            border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            background: isDarkMode ? '#1e293b' : '#ffffff'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}>
              📅 Day of Week Column Update
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              {/* Environment Selection */}
              <div style={{ width: '100%' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: isDarkMode ? '#cbd5e1' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  🌍 Environment
                </label>
                <select
                  value={dayOfWeekUpdateData.environment}
                  onChange={(e) => {
                    handleDayOfWeekUpdateChange('environment', e.target.value);
                    handleDayOfWeekUpdateChange('selectedSheet', ''); // Clear sheet selection
                    fetchAvailableSheets(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    background: isDarkMode ? '#374151' : '#ffffff',
                    color: isDarkMode ? '#f9fafb' : '#111827',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="dev">Development</option>
                  <option value="prod">Production</option>
                </select>
              </div>

              {/* Sheet Selection */}
              <div style={{ width: '100%' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: isDarkMode ? '#cbd5e1' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  📋 Select Sheet
                </label>
                <select
                  value={dayOfWeekUpdateData.selectedSheet}
                  onChange={(e) => handleDayOfWeekUpdateChange('selectedSheet', e.target.value)}
                  disabled={dayOfWeekUpdateData.availableSheets.length === 0}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    background: isDarkMode ? '#374151' : '#ffffff',
                    color: isDarkMode ? '#f9fafb' : '#111827',
                    boxSizing: 'border-box',
                    opacity: dayOfWeekUpdateData.availableSheets.length === 0 ? 0.5 : 1
                  }}
                >
                  <option value="">
                    {dayOfWeekUpdateData.availableSheets.length === 0 
                      ? 'Select environment first...' 
                      : 'Select a sheet...'}
                  </option>
                  {dayOfWeekUpdateData.availableSheets.map((sheet, index) => (
                    <option key={index} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setDayOfWeekUpdateData({
                      environment: 'dev',
                      selectedSheet: '',
                      availableSheets: []
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #6b7280',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: '#6b7280',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#6b7280';
                    e.target.style.color = '#ffffff';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#6b7280';
                  }}
                >
                  🧹 Clear
                </button>
                <button
                  type="button"
                  onClick={handleDayOfWeekUpdateSubmit}
                  disabled={isUpdatingDayOfWeek || !dayOfWeekUpdateData.selectedSheet}
                  style={{
                    flex: 2,
                    padding: '12px',
                    border: 'none',
                    borderRadius: '6px',
                    background: (isUpdatingDayOfWeek || !dayOfWeekUpdateData.selectedSheet)
                      ? (isDarkMode ? '#6b7280' : '#9ca3af')
                      : (isDarkMode ? '#f59e0b' : '#d97706'),
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (isUpdatingDayOfWeek || !dayOfWeekUpdateData.selectedSheet) ? 'not-allowed' : 'pointer',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!isUpdatingDayOfWeek && dayOfWeekUpdateData.selectedSheet) {
                      e.target.style.background = isDarkMode ? '#d97706' : '#b45309';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isUpdatingDayOfWeek && dayOfWeekUpdateData.selectedSheet) {
                      e.target.style.background = isDarkMode ? '#f59e0b' : '#d97706';
                    }
                  }}
                >
                  {isUpdatingDayOfWeek ? '🔄 Updating...' : '📅 Update Day of Week Column'}
                </button>
              </div>

              {/* Info Box */}
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                background: isDarkMode ? '#1f2937' : '#f3f4f6',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                color: isDarkMode ? '#d1d5db' : '#374151',
                fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>ℹ️ What this does:</div>
                <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                  <li>Adds "Day of Week" column after column B</li>
                  <li>Calculates Thai day names from dates in column B</li>
                  <li>Updates existing data with proper day names</li>
                  <li>Makes sheets compatible with new app structure</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Manual OT Calculation Section - Dev Only */}
        {isDevAdmin && getEffectiveUIEnv() === 'dev' && (
          <div style={{ 
            marginBottom: 20,
            border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            background: isDarkMode ? '#1e293b' : '#ffffff'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}>
              🧮 Manual OT Calculation
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              {/* Environment Selection */}
              <div style={{ width: '100%' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: isDarkMode ? '#cbd5e1' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  🌍 Environment
                </label>
                <select
                  value={otCalculationData.environment}
                  onChange={(e) => {
                    handleOTCalculationChange('environment', e.target.value);
                    handleOTCalculationChange('selectedSheet', ''); // Clear sheet selection
                    fetchOTSheets(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}
                >
                  <option value="dev">Development</option>
                  <option value="prod">Production</option>
                </select>
              </div>
              
              {/* Sheet Selection */}
              <div style={{ width: '100%' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: isDarkMode ? '#cbd5e1' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  📊 Select Sheet
                </label>
                <select
                  value={otCalculationData.selectedSheet}
                  onChange={(e) => {
                    handleOTCalculationChange('selectedSheet', e.target.value);
                    setManualOTData(prev => ({ ...prev, driverName: '', thaiDate: '', clockIn: '', clockOut: '', rowNumber: '' }));
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}
                >
                  <option value="">Select a sheet...</option>
                  {otCalculationData.availableSheets.map((sheetName) => (
                    <option key={sheetName} value={sheetName}>
                      {sheetName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Row Number */}
              <div style={{ width: '100%' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: isDarkMode ? '#cbd5e1' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  🔢 Row Number
                </label>
                <input
                  type="number"
                  value={manualOTData.rowNumber}
                  onChange={(e) => setManualOTData(prev => ({ ...prev, rowNumber: e.target.value }))}
                  placeholder="e.g., 5"
                  min="2"
                  disabled={!otCalculationData.selectedSheet}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: !otCalculationData.selectedSheet ? (isDarkMode ? '#374151' : '#f3f4f6') : (isDarkMode ? '#1e293b' : '#ffffff'),
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined,
                    opacity: !otCalculationData.selectedSheet ? 0.6 : 1
                  }}
                />
                <div style={{
                  fontSize: '11px',
                  color: isDarkMode ? '#94a3b8' : '#6b7280',
                  marginTop: '2px',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  {isReadingRow ? '⏳ Reading row data...' : 'Enter row number to auto-populate fields'}
                </div>
              </div>
              
              {/* Driver Name */}
              <div style={{ width: '100%' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: isDarkMode ? '#cbd5e1' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  👤 Driver Name
                </label>
                <input
                  type="text"
                  value={manualOTData.driverName}
                  onChange={(e) => setManualOTData(prev => ({ ...prev, driverName: e.target.value }))}
                  placeholder="Auto-populated from row"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}
                />
              </div>
              
              {/* Thai Date */}
              <div style={{ width: '100%' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: isDarkMode ? '#cbd5e1' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  📅 Thai Date (DD/MM/YYYY)
                </label>
                <input
                  type="text"
                  value={manualOTData.thaiDate}
                  onChange={(e) => setManualOTData(prev => ({ ...prev, thaiDate: e.target.value }))}
                  placeholder="Auto-populated from row"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}
                />
              </div>
              
              {/* Clock In */}
              <div style={{ width: '100%' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: isDarkMode ? '#cbd5e1' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  ⏰ Clock In (HH:MM)
                </label>
                <input
                  type="time"
                  value={manualOTData.clockIn}
                  onChange={(e) => setManualOTData(prev => ({ ...prev, clockIn: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}
                />
              </div>
              
              {/* Clock Out */}
              <div style={{ width: '100%' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: isDarkMode ? '#cbd5e1' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  ⏰ Clock Out (HH:MM)
                </label>
                <input
                  type="time"
                  value={manualOTData.clockOut}
                  onChange={(e) => setManualOTData(prev => ({ ...prev, clockOut: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    fontSize: '14px',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}
                />
              </div>
              
              {/* Enhanced Calculate Button */}
              <div style={{ width: '100%' }}>
                <button
                  type="button"
                  onClick={handleEnhancedOTCalculation}
                  disabled={isCalculatingOT || !otCalculationData.selectedSheet || !manualOTData.rowNumber || !manualOTData.driverName || !manualOTData.thaiDate || !manualOTData.clockIn || !manualOTData.clockOut}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: isCalculatingOT ? '#6b7280' : '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isCalculatingOT ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                    fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                  }}
                  onMouseOver={(e) => {
                    if (!isCalculatingOT) {
                      e.target.style.background = '#059669';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isCalculatingOT) {
                      e.target.style.background = '#10b981';
                    }
                  }}
                >
                  {isCalculatingOT ? '⏳ Calculating & Updating...' : '🧮 Calculate OT & Update Spreadsheet'}
                </button>
              </div>
              
              {/* Results Display */}
              {manualOTResult && (
                <div style={{
                  padding: '12px',
                  borderRadius: '6px',
                  background: manualOTResult.success ? (isDarkMode ? '#064e3b' : '#ecfdf5') : (isDarkMode ? '#7f1d1d' : '#fef2f2'),
                  border: manualOTResult.success ? (isDarkMode ? '1px solid #065f46' : '1px solid #a7f3d0') : (isDarkMode ? '1px solid #991b1b' : '1px solid #fecaca'),
                  fontSize: '12px',
                  color: isDarkMode ? '#d1d5db' : '#374151',
                  fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {manualOTResult.success ? 
                      (manualOTResult.isPreview ? '👁️ OT Calculation Preview' : '✅ OT Calculation Results') : 
                      '❌ Calculation Error'}
                  </div>
                  
                  {manualOTResult.success ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {/* Show different data based on operation type */}
                      {manualOTResult.calculatedOT ? (
                        // Preview or final result with calculated OT
                        <>
                          <div><strong>Row:</strong> Row {manualOTResult.rowNumber || manualOTResult.rowIndex} in {manualOTResult.sheetName}</div>
                          <div><strong>Driver:</strong> {manualOTResult.driverName}</div>
                          <div><strong>Clock In:</strong> {manualOTResult.clockIn}</div>
                          <div><strong>Clock Out:</strong> {manualOTResult.clockOut}</div>
                          <div><strong>Total OT Hours:</strong> {manualOTResult.calculatedOT.totalOTHours} hours</div>
                          <div><strong>Morning OT:</strong> {manualOTResult.calculatedOT.morningOTHours} hours</div>
                          <div><strong>Evening OT:</strong> {manualOTResult.calculatedOT.eveningOTHours} hours</div>
                          <div><strong>OT Period:</strong> {manualOTResult.calculatedOT.otPeriod || 'N/A'}</div>
                          <div><strong>Business Rule:</strong> {manualOTResult.calculatedOT.businessRule === 'enabled' ? '✅ Enabled' : '❌ Disabled'}</div>
                          {!manualOTResult.isPreview && manualOTResult.updatedColumn && (
                            <div><strong>Updated Column:</strong> {manualOTResult.updatedColumn}</div>
                          )}
                          {manualOTResult.isPreview && (
                            <div style={{ 
                              marginTop: '8px', 
                              padding: '8px', 
                              background: isDarkMode ? '#1f2937' : '#f3f4f6', 
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontStyle: 'italic',
                              border: '1px solid #d1d5db'
                            }}>
                              💡 This is a preview. Click "Calculate OT & Update Spreadsheet" to apply changes.
                            </div>
                          )}
                        </>
                      ) : (
                        // Manual calculation operation (fallback)
                        <>
                          <div><strong>Total OT Hours:</strong> {manualOTResult.totalOTHours} hours</div>
                          <div><strong>Morning OT:</strong> {manualOTResult.morningOTHours} hours</div>
                          <div><strong>Evening OT:</strong> {manualOTResult.eveningOTHours} hours</div>
                          <div><strong>OT Period:</strong> {manualOTResult.calculation?.totalOTPeriod || 'N/A'}</div>
                          <div><strong>Business Rule:</strong> {manualOTResult.businessRule === 'enabled' ? '✅ Enabled' : '❌ Disabled'}</div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: isDarkMode ? '#fca5a5' : '#dc2626' }}>
                      {manualOTResult.error}
                    </div>
                  )}
                </div>
              )}
              
              {/* Info Box */}
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                background: isDarkMode ? '#1f2937' : '#f3f4f6',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                color: isDarkMode ? '#d1d5db' : '#374151',
                fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>ℹ️ Enhanced Workflow:</div>
                <ol style={{ margin: '4px 0', paddingLeft: '16px' }}>
                  <li><strong>Select Environment:</strong> Choose dev or prod</li>
                  <li><strong>Load Sheets:</strong> Get available spreadsheets</li>
                  <li><strong>Select Sheet:</strong> Choose the specific sheet</li>
                  <li><strong>Enter Row Number:</strong> Fields auto-populate from spreadsheet</li>
                  <li><strong>Calculate & Update:</strong> OT is calculated and written to Column J</li>
                </ol>
                <div style={{ marginTop: '8px', fontSize: '11px', fontStyle: 'italic' }}>
                  Supports morning OT (before 8:00) + evening OT (after 17:00)
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Test Auto Submit Button - Dev Only */}
        {isDevAdmin && getEffectiveUIEnv() === 'dev' && (
          <button
            type="button"
            onClick={testAutoSubmit}
            style={{
              width: "100%",
              background: "#f59e0b",
              color: "#fff",
              fontWeight: 600,
              fontSize: "16px",
              padding: "14px",
              borderRadius: "8px",
              border: "none",
              marginTop: "16px",
              cursor: "pointer",
              transition: "background 0.2s",
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}
            onMouseOver={(e) => e.target.style.background = "#d97706"}
            onMouseOut={(e) => e.target.style.background = "#f59e0b"}
          >
            🧪 Test Auto Submit (Dev Only)
          </button>
        )}
        
        {/* Clear Cache Button - Dev Only */}
        {isDevAdmin && getEffectiveUIEnv() === 'dev' && (
          <button
            type="button"
            onClick={clearExistingEntryCache}
            style={{
              width: "100%",
              background: "#ef4444",
              color: "#fff",
              fontWeight: 600,
              fontSize: "16px",
              padding: "14px",
              borderRadius: "8px",
              border: "none",
              marginTop: "8px",
              cursor: "pointer",
              transition: "background 0.2s",
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}
            onMouseOver={(e) => e.target.style.background = "#dc2626"}
            onMouseOut={(e) => e.target.style.background = "#ef4444"}
          >
            🧹 Clear Cache (Dev Only)
          </button>
        )}
        
        {/* Test Loading Animation Button - Dev Only */}
        {isDevAdmin && getEffectiveUIEnv() === 'dev' && (
          <button
            type="button"
            onClick={() => {
              setIsLoadingData(!isLoadingData);
            }}
            style={{
              width: "100%",
              background: isLoadingData ? "#ef4444" : "#8b5cf6",
              color: "#fff",
              fontWeight: 600,
              fontSize: "16px",
              padding: "14px",
              borderRadius: "8px",
              border: "none",
              marginTop: "8px",
              cursor: "pointer",
              transition: "background 0.2s",
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}
            onMouseOver={(e) => e.target.style.background = isLoadingData ? "#dc2626" : "#7c3aed"}
            onMouseOut={(e) => e.target.style.background = isLoadingData ? "#ef4444" : "#8b5cf6"}
          >
            {isLoadingData ? "🛑 Stop Loading" : "🔄 Start Loading"}
          </button>
        )}
        
        {/* Reset Stuck Flag Button - Dev Only */}
        {isDevAdmin && getEffectiveUIEnv() === 'dev' && (
          <button
            type="button"
            onClick={() => {
              setIsSubmitting(false);
              console.log('🔄 Manually reset isSubmitting flag');
            }}
            style={{
              width: "100%",
              background: "#dc2626",
              color: "#fff",
              fontWeight: 600,
              fontSize: "16px",
              padding: "14px",
              borderRadius: "8px",
              border: "none",
              marginTop: "8px",
              cursor: "pointer",
              transition: "background 0.2s",
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}
            onMouseOver={(e) => e.target.style.background = "#b91c1c"}
            onMouseOut={(e) => e.target.style.background = "#dc2626"}
          >
            🔧 Reset Stuck Flag (Debug)
          </button>
        )}
        
        {/* Approval System Toggle - Dev Only */}
        {isDevAdmin && getEffectiveUIEnv() === 'dev' && (
          <button
            type="button"
            onClick={() => {
              setApprovalEnabled(!approvalEnabled);
              console.log(`🔄 Approval system ${!approvalEnabled ? 'enabled' : 'disabled'}`);
            }}
            style={{
              width: "100%",
              background: approvalEnabled ? "#10b981" : "#6b7280",
              color: "#fff",
              fontWeight: 600,
              fontSize: "16px",
              padding: "14px",
              borderRadius: "8px",
              border: "none",
              marginTop: "8px",
              cursor: "pointer",
              transition: "background 0.2s",
              fontFamily: browserLang === 'th' ? '"Noto Sans Thai", sans-serif' : undefined
            }}
            onMouseOver={(e) => e.target.style.background = approvalEnabled ? "#059669" : "#4b5563"}
            onMouseOut={(e) => e.target.style.background = approvalEnabled ? "#10b981" : "#6b7280"}
          >
            {approvalEnabled ? "✅ Approval System: ON" : "❌ Approval System: OFF"}
          </button>
        )}
        
      </form>
      <Modal
        isOpen={showModal}
        message={modalMessage}
        type={modalType}
        onClose={() => setShowModal(false)}
      />

      {/* Dev Tools (Only for DevAdmin) */}
      {isDevAdmin && (
        <>
          {/* Floating Gear Button */}
          <DevToolsButton
            onClick={() => setIsDevPanelOpen(true)}
            isOpen={isDevPanelOpen}
          />

          {/* Sliding Panel with Dev Tools */}
          <DevToolsPanel
            isOpen={isDevPanelOpen}
            onClose={() => setIsDevPanelOpen(false)}
            env={getEffectiveUIEnv()}
            onEnvChange={(newEnv) => {
              setCookie('uiEnvironment', newEnv, 7);
              window.location.reload();
            }}
          >
            {/* Dev Tools Sections */}
            {getEffectiveUIEnv() === 'dev' && (
              <DevToolsSections
                // Sheet Creator props
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                handleCreateSheet={handleCreateSheet}
                handleCreateProdSheet={handleCreateProdSheet}
                isCreatingSheet={isCreatingSheet}

                // Manual Testing props
                manualTestData={manualTestData}
                handleManualTestChange={handleManualTestChange}
                handleSubmitManualTest={handleManualTestSubmit}
                isSubmittingManualTest={isManualTesting}
                manualTestOTResult={otCalculation}
                clearManualTest={clearManualTest}

                // Dev Tool Buttons props
                testAutoSubmit={testAutoSubmit}
                clearExistingEntryCache={clearExistingEntryCache}
                isLoadingData={isLoadingData}
                setIsLoadingData={setIsLoadingData}
                setIsSubmitting={setIsSubmitting}
                approvalEnabled={approvalEnabled}
                setApprovalEnabled={setApprovalEnabled}

                // Other props
                browserLang={browserLang}
              />
            )}
          </DevToolsPanel>
        </>
      )}
    </div>
  );
}

export default StyledForm;

