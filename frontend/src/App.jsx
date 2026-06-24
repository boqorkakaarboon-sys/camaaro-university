import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Teacher from './pages/Teacher';
import Student from './pages/Student';
import Library from './pages/Library';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import AIChatbot from './pages/AIChatbot';
import Transcript from './pages/Transcript';
import Attendance from './pages/Attendance';
import Assignments from './pages/Assignments';
import Discussions from './pages/Discussions';
import QuestionBank from './pages/QuestionBank';
import Settings from './pages/Settings';
import Leaderboard from './pages/Leaderboard';
import Timetable from './pages/Timetable';
import MyCertificates from './pages/MyCertificates';
import CourseMaterials from './pages/CourseMaterials';
import MyProgress from './pages/MyProgress';
import StudentProgress from './pages/StudentProgress';
import ExamStatistics from './pages/ExamStatistics';
import { CertificateVerifier } from './components/CertificateView';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="full-page-center">
      <div className="spinner" />
      <p>Loading Camaaro University...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-visible' : 'sidebar-hidden'}`}>
      <Navbar onToggleSidebar={() => setSidebarOpen((p) => !p)} />
      <div className="layout-body">
        <Sidebar isOpen={sidebarOpen} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify/:code" element={<CertificateVerifier />} />
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/*" element={<ProtectedRoute roles={['admin']}><AppLayout><Admin /></AppLayout></ProtectedRoute>} />
      <Route path="/teacher/*" element={<ProtectedRoute roles={['teacher']}><AppLayout><Teacher /></AppLayout></ProtectedRoute>} />
      <Route path="/student/*" element={<ProtectedRoute roles={['student']}><AppLayout><Student /></AppLayout></ProtectedRoute>} />
      <Route path="/library/*" element={<ProtectedRoute><AppLayout><Library /></AppLayout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute roles={['admin']}><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><AppLayout><AIChatbot /></AppLayout></ProtectedRoute>} />
      <Route path="/student/transcript" element={<ProtectedRoute roles={['student']}><AppLayout><Transcript /></AppLayout></ProtectedRoute>} />
      <Route path="/student/attendance" element={<ProtectedRoute roles={['student']}><AppLayout><Attendance /></AppLayout></ProtectedRoute>} />
      <Route path="/student/assignments" element={<ProtectedRoute roles={['student']}><AppLayout><Assignments /></AppLayout></ProtectedRoute>} />
      <Route path="/teacher/attendance" element={<ProtectedRoute roles={['teacher']}><AppLayout><Attendance /></AppLayout></ProtectedRoute>} />
      <Route path="/teacher/assignments" element={<ProtectedRoute roles={['teacher']}><AppLayout><Assignments /></AppLayout></ProtectedRoute>} />
      <Route path="/teacher/qbank" element={<ProtectedRoute roles={['teacher','admin']}><AppLayout><QuestionBank /></AppLayout></ProtectedRoute>} />
      <Route path="/discussions" element={<ProtectedRoute><AppLayout><Discussions /></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><AppLayout><Leaderboard /></AppLayout></ProtectedRoute>} />
      <Route path="/timetable" element={<ProtectedRoute><AppLayout><Timetable /></AppLayout></ProtectedRoute>} />
      <Route path="/student/certificates" element={<ProtectedRoute roles={['student']}><AppLayout><MyCertificates /></AppLayout></ProtectedRoute>} />
      <Route path="/student/progress" element={<ProtectedRoute roles={['student']}><AppLayout><MyProgress /></AppLayout></ProtectedRoute>} />
      <Route path="/materials" element={<ProtectedRoute><AppLayout><CourseMaterials /></AppLayout></ProtectedRoute>} />
      <Route path="/teacher/student-progress" element={<ProtectedRoute roles={['teacher','admin']}><AppLayout><StudentProgress /></AppLayout></ProtectedRoute>} />
      <Route path="/teacher/exam-stats" element={<ProtectedRoute roles={['teacher','admin']}><AppLayout><ExamStatistics /></AppLayout></ProtectedRoute>} />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
