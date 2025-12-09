import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import MyAttendancePage from './pages/MyAttendancePage';
import LeaveRequestPage from './pages/LeaveRequestPage';
import MyLeavePage from './pages/MyLeavePage';
import NoticePage from './pages/NoticePage';
import NoticeDetailPage from './pages/NoticeDetailPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import MemberManagement from './pages/admin/MemberManagement';
import AttendanceManagement from './pages/admin/AttendanceManagement';
import NoticeManagement from './pages/admin/NoticeManagement';
import LeaveManagement from './pages/admin/LeaveManagement';

import './App.css';

function AppLayout({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return children;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div style={{ paddingTop: '90px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppLayout>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected - User */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/attendance" element={
          <ProtectedRoute><AttendancePage /></ProtectedRoute>
        } />
        <Route path="/my-attendance" element={
          <ProtectedRoute><MyAttendancePage /></ProtectedRoute>
        } />
        <Route path="/leave-request" element={
          <ProtectedRoute><LeaveRequestPage /></ProtectedRoute>
        } />
        <Route path="/my-leaves" element={
          <ProtectedRoute><MyLeavePage /></ProtectedRoute>
        } />
        <Route path="/notices" element={
          <ProtectedRoute><NoticePage /></ProtectedRoute>
        } />
        <Route path="/notices/:id" element={
          <ProtectedRoute><NoticeDetailPage /></ProtectedRoute>
        } />

        {/* Protected - Admin */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/members" element={
          <ProtectedRoute adminOnly><MemberManagement /></ProtectedRoute>
        } />
        <Route path="/admin/attendances" element={
          <ProtectedRoute adminOnly><AttendanceManagement /></ProtectedRoute>
        } />
        <Route path="/admin/notices" element={
          <ProtectedRoute adminOnly><NoticeManagement /></ProtectedRoute>
        } />
        <Route path="/admin/leaves" element={
          <ProtectedRoute adminOnly><LeaveManagement /></ProtectedRoute>
        } />

        {/* Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

