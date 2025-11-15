// Login Configuration - Make it reusable across apps
// Export this config and import it where needed

export const loginConfig = {
  // API Configuration
  apiBaseURL: () => {
    // Can be customized per app
    const isDev = import.meta.env.DEV;
    return isDev
      ? import.meta.env.VITE_API_BASE_URL_DEV || 'http://localhost:3001'
      : import.meta.env.VITE_API_BASE_URL_PROD || 'https://liff-ot-app-arun-d0ff4972332c.herokuapp.com';
  },

  // Styling customization
  theme: {
    background: "linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)",
    cardBackground: "#ffffff",
    primaryColor: "#3b82f6",
    primaryHover: "#2563eb",
    errorColor: "#ef4444",
    borderRadius: "16px",
    inputBorderRadius: "8px"
  },

  // Redirect after login
  redirectAfterLogin: (returnUrl) => {
    return returnUrl || '/';
  },

  // Cookie settings
  cookieSettings: {
    usernameCookieName: 'loginUsername',
    usernameCookieExpiry: 30, // days
  },

  // Custom labels can be overridden
  labels: {
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
  }
};

