import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const unread = notifs.filter(n => !n.isRead).length;
  const roleColors = { admin: '#c0392b', teacher: '#1a6b3c', student: '#1a3a6b', librarian: '#8e44ad' };
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'U';

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try { const res = await authAPI.getNotifications(); setNotifs(res.data.notifications || []); } catch {}
    };
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleReadAll = async () => {
    try { await authAPI.readAllNotifs(); setNotifs(p => p.map(n => ({...n, isRead: true}))); } catch {}
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="menu-toggle" onClick={onToggleSidebar}><span/><span/><span/></button>
        <div className="navbar-brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-name">Camaaro University</span>
        </div>
      </div>
      <div className="navbar-right">
        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(p=>!p)}
            style={{ position: 'relative', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            🔔
            {unread > 0 && <span style={{ position: 'absolute', top: -2, right: -2, background: '#e74c3c', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>{unread > 9 ? '9+' : unread}</span>}
          </button>
          {showNotifs && (
            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 320, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid var(--border)', zIndex: 200, overflow: 'hidden' }}>
              <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.9rem' }}>🔔 Ogeysiisyada</span>
                {unread > 0 && <button onClick={handleReadAll} style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>Dhammaan akhri</button>}
              </div>
              <div style={{ maxHeight: 340, overflow: 'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Ogeysiis ma jiro</div>
                ) : notifs.slice(0,15).map((n, i) => (
                  <div key={i} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: n.isRead ? 'transparent' : '#f0f4ff', cursor: 'pointer' }}
                    onClick={() => { n.link && navigate(n.link); setShowNotifs(false); }}>
                    <div style={{ fontWeight: n.isRead ? 400 : 600, fontSize: '0.85rem', color: 'var(--text)' }}>{n.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{n.message}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="user-info">
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} />
            ) : (
              <div className="user-avatar" style={{ background: roleColors[user?.role] || 'var(--navy)' }}>{initials}</div>
            )}
          </Link>
          <div className="user-details" style={{ display: window.innerWidth < 640 ? 'none' : 'flex' }}>
            <span className="user-name">{user?.name}</span>
            <span className="user-role" style={{ color: roleColors[user?.role] ? '#aed6f1' : '#aed6f1' }}>{user?.role}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
