import { Routes, Route, Navigate } from 'react-router-dom';
import StyledForm from "./StyledForm";
import LoginForm from "./login/LoginForm.standalone";
import ManagerView from "./ManagerView";
import { DevAdminProvider } from "./contexts/DevAdminContext";

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user ? children : <Navigate to="/login" replace />;
};

// Shared protected component
const ProtectedForm = () => (
  <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <StyledForm />
    </div>
  </ProtectedRoute>
);

function App() {
  return (
    <DevAdminProvider>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        {/* Root path */}
        <Route path="/" element={<ProtectedForm />} />
        {/* Language-specific paths */}
        <Route path="/th" element={<ProtectedForm />} />
        <Route path="/en" element={<ProtectedForm />} />
        {/* Prod path */}
        <Route path="/prod" element={<ProtectedForm />} />
        {/* Manager view */}
        <Route path="/manager" element={<ProtectedRoute><ManagerView /></ProtectedRoute>} />
        {/* Fallback to login for any other unmatched routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </DevAdminProvider>
  );
}

export default App;
