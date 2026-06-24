import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', phone: user?.phone || '', bio: user?.bio || '' });
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'U';
  const roleColors = { admin:'#c0392b', teacher:'#1a6b3c', student:'#1a3a6b', librarian:'#8e44ad' };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile({ ...form, avatar });
      updateUser(res.data.user);
      showToast('Profile la cusboonaysiiyay!', 'success');
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
    setLoading(false);
  };

  const handleToggle2FA = async () => {
    try {
      const res = await authAPI.toggle2FA();
      updateUser({ ...user, twoFAEnabled: res.data.twoFAEnabled });
      showToast(res.data.message, 'success');
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ color: 'var(--navy)', marginBottom: '1.5rem' }}>👤 My Profile</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
        {[['profile','Profile'],['security','Security']].map(([t,l]) => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding: '0.6rem 1.25rem', border: 'none', borderBottom: `3px solid ${activeTab===t?'var(--navy)':'transparent'}`, background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: activeTab===t?700:400, color: activeTab===t?'var(--navy)':'var(--text-muted)', marginBottom: '-2px' }}>
            {l}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleSave}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              {avatar ? (
                <img src={avatar} alt="Avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--navy)' }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: roleColors[user?.role] || 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.75rem', fontWeight: 700 }}>{initials}</div>
              )}
              <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--navy)', color: '#fff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.85rem' }}>
                ✎<input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </label>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy)' }}>{user?.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>{user?.email}</div>
              <span style={{ display: 'inline-block', marginTop: '0.4rem', padding: '2px 12px', background: roleColors[user?.role] || 'var(--navy)', color: '#fff', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>{user?.role}</span>
              {user?.studentId && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>ID: {user.studentId}</div>}
            </div>
          </div>

          {/* Form fields */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {[['name','Full Name','text'],['department','Department','text'],['phone','Phone','tel']].map(([k,l,t]) => (
              <div key={k}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.35rem', fontSize: '0.9rem' }}>{l}</label>
                <input type={t} value={form[k]} onChange={e => setForm(p=>({...p,[k]:e.target.value}))}
                  style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.35rem', fontSize: '0.9rem' }}>Bio</label>
              <textarea value={form.bio} onChange={e => setForm(p=>({...p,bio:e.target.value}))} rows={3} maxLength={500} placeholder="Nafta ku saabsan wax ku qor..."
                style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{form.bio.length}/500</div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }}>
              {loading ? 'Waa la kaydiyaa...' : '💾 Kaydi Isbedelada'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'security' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 2FA Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg)', borderRadius: 10 }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>🔐 Two-Factor Authentication (2FA)</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Login-ka ka dib code email-kaaga ayaa lagu soo dirayaa</div>
              <div style={{ fontSize: '0.82rem', marginTop: '0.4rem', fontWeight: 600, color: user?.twoFAEnabled ? 'var(--green)' : 'var(--text-muted)' }}>
                {user?.twoFAEnabled ? '✅ Waa la shidday' : '⭕ Waa la damiyay'}
              </div>
            </div>
            <button onClick={handleToggle2FA}
              style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.88rem', background: user?.twoFAEnabled ? 'var(--red-light)' : 'var(--green-light)', color: user?.twoFAEnabled ? 'var(--red)' : 'var(--green)' }}>
              {user?.twoFAEnabled ? 'Dami 2FA' : 'Shid 2FA'}
            </button>
          </div>

          {/* Password */}
          <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: 10 }}>
            <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '0.4rem' }}>🔑 Password Bedel</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Beddelka password-ka waxaad ka samayn kartaa "Forgot Password" page-ka</div>
            <a href="/forgot-password" style={{ display: 'inline-block', padding: '0.6rem 1.25rem', background: 'var(--navy)', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem' }}>
              → Forgot Password Page
            </a>
          </div>

          {/* Account Info */}
          <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: 10 }}>
            <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '0.75rem' }}>ℹ️ Account Info</div>
            {[['Email', user?.email],['Role', user?.role],['Department', user?.department || '-'],['Email Verified', user?.isEmailVerified ? '✅ Yes' : '❌ No'],['Account Created', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-']].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
