import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setLoading(true); setError('');
    try {
      await authAPI.resetPassword(token, { password: form.password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    }
    setLoading(false);
  };

  return (
    <div className="full-page-center" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem' }}>🔒</div>
          <h2 style={{ color: 'var(--navy)' }}>Dib u Deji Password</h2>
        </div>
        {success ? (
          <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 10, padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--green)', fontWeight: 600 }}>✅ Password la beddelay! Login-ka aad u wareegaysaa...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.88rem' }}>{error}</div>}
            {['password','confirm'].map(f => (
              <div key={f} style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.4rem', fontSize: '0.9rem' }}>{f === 'password' ? 'Password Cusub' : 'Xaqiiji Password'}</label>
                <input type="password" value={form[f]} onChange={e => setForm(p => ({...p, [f]: e.target.value}))} required
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }} />
              </div>
            ))}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Min 8 chars, uppercase, lowercase, number, special char (@$!%*?&#)</p>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.85rem' }}>
              {loading ? 'Waa la beddelayaa...' : '🔒 Deji Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
