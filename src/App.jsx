import { Routes, Route, Navigate } from 'react-router-dom';
import StyledForm from "./StyledForm";
import LoginForm from "./login/LoginForm.standalone";

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
              <StyledForm />
            </div>
          </ProtectedRoute>
        } 
      />
      {/* Fallback to login for any unmatched routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
