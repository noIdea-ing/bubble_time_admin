import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import AdminHome from './pages/AdminHome'
import Login from './pages/login'

// Define ProtectedRoute component
const ProtectedRoute: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const isAuthenticated = !!sessionStorage.getItem('userId');
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/adminHome"
          element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/adminHome" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
