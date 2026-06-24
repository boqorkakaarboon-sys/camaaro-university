import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    }
    setLoading(false);
  };

  return (
    <div className="full-page-center" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem' }}>🔑</div>
          <h2 style={{ color: 'var(--navy)', marginTop: '0.5rem' }}>Forgot Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Email-kaaga geli, link dib u dejinta ayaanu kuu diri doonaa</p>
        </div>
        {sent ? (
          <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 10, padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <p style={{ color: 'var(--green)', fontWeight: 600 }}>Link la diray!</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.5rem' }}>Email-kaaga hubi. Haddaadan helin, spam-ka eeg.</p>
            <Link to="/login" style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--navy)', fontWeight: 600 }}>← Ku noqo Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.88rem' }}>{error}</div>}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@camaaro.edu"
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.85rem' }}>
              {loading ? 'Dirinaaya...' : '📧 Dir Link-ka Reset'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/login" style={{ color: 'var(--navy)', fontSize: '0.88rem' }}>← Ku noqo Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
