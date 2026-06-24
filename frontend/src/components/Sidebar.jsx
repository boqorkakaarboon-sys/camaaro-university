import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = {
  admin: [
    { path: '/dashboard',    label: 'Dashboard',    icon: '⊞' },
    { path: '/admin',        label: 'Admin Panel',  icon: '⚙' },
    { path: '/admin/users',  label: 'Users',        icon: '👥' },
    { path: '/admin/courses',label: 'Courses',      icon: '📚' },
    { path: '/admin/exams',  label: 'Exams',        icon: '📝' },
    { path: '/admin/results',label: 'Results',      icon: '📊' },
    { path: '/materials',    label: 'Materials',    icon: '📁' },
    { path: '/timetable',    label: 'Timetable',    icon: '🗓' },
    { path: '/library',      label: 'Library',      icon: '📖' },
    { path: '/discussions',  label: 'Discussions',  icon: '💬' },
    { path: '/leaderboard',  label: 'Leaderboard',  icon: '🏆' },
    { path: '/analytics',    label: 'Analytics',    icon: '📈' },
    { path: '/ai-assistant', label: 'AI Assistant', icon: '🤖' },
    { path: '/settings',     label: 'Settings',     icon: '⚙️' },
    { path: '/profile',      label: 'My Profile',   icon: '👤' },
  ],
  teacher: [
    { path: '/dashboard',         label: 'Dashboard',      icon: '⊞' },
    { path: '/teacher',           label: 'My Overview',    icon: '🏫' },
    { path: '/teacher/courses',   label: 'My Courses',     icon: '📚' },
    { path: '/teacher/exams',     label: 'My Exams',       icon: '📝' },
    { path: '/teacher/assignments',label:'Assignments',    icon: '📋' },
    { path: '/teacher/attendance',label: 'Attendance',     icon: '✅' },
    { path: '/teacher/results',   label: 'Grade Students', icon: '📊' },
    { path: '/teacher/qbank',     label: 'Question Bank',  icon: '🗂' },
    { path: '/teacher/student-progress', label: 'Student Progress', icon: '📈' },
    { path: '/teacher/exam-stats',label: 'Exam Statistics',icon: '📉' },
    { path: '/materials',         label: 'Materials',      icon: '📁' },
    { path: '/timetable',         label: 'Timetable',      icon: '🗓' },
    { path: '/discussions',       label: 'Discussions',    icon: '💬' },
    { path: '/leaderboard',       label: 'Leaderboard',    icon: '🏆' },
    { path: '/library',           label: 'Library',        icon: '📖' },
    { path: '/ai-assistant',      label: 'AI Assistant',   icon: '🤖' },
    { path: '/settings',          label: 'Settings',       icon: '⚙️' },
    { path: '/profile',           label: 'My Profile',     icon: '👤' },
  ],
  student: [
    { path: '/dashboard',           label: 'Dashboard',       icon: '⊞' },
    { path: '/student',             label: 'My Overview',     icon: '🎒' },
    { path: '/student/courses',     label: 'My Courses',      icon: '📚' },
    { path: '/student/exams',       label: 'Upcoming Exams',  icon: '📝' },
    { path: '/student/assignments', label: 'Assignments',     icon: '📋' },
    { path: '/student/results',     label: 'My Results',      icon: '📊' },
    { path: '/student/attendance',  label: 'Attendance',      icon: '✅' },
    { path: '/student/transcript',  label: 'Transcript',      icon: '🎓' },
    { path: '/student/certificates',label: 'My Certificates', icon: '🏅' },
    { path: '/student/progress',    label: 'My Progress',     icon: '📈' },
    { path: '/materials',           label: 'Materials',       icon: '📁' },
    { path: '/timetable',           label: 'Timetable',       icon: '🗓' },
    { path: '/discussions',         label: 'Discussions',     icon: '💬' },
    { path: '/leaderboard',         label: 'Leaderboard',     icon: '🏆' },
    { path: '/library',             label: 'Library',         icon: '📖' },
    { path: '/ai-assistant',        label: 'AI Assistant',    icon: '🤖' },
    { path: '/settings',            label: 'Settings',        icon: '⚙️' },
    { path: '/profile',             label: 'My Profile',      icon: '👤' },
  ],
};

const Sidebar = ({ isOpen }) => {
  const { user } = useAuth();
  const items = navItems[user?.role] || [];

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">CU</div>
        <span className="sidebar-title">Navigation</span>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span>Camaaro University</span>
        <span>v2.0.0</span>
      </div>
    </aside>
  );
};

export default Sidebar;
