import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import campusBg from '../assets/campus-bg.png';

const Login = () => {
  const { login, verify2FA, error, setError } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [twoFAStep, setTwoFAStep] = useState(false);
  const [twoFAUserId, setTwoFAUserId] = useState(null);
  const [code, setCode] = useState('');

  const handleChange = (e) => {
    setError(null);
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success && result.requires2FA) {
      setTwoFAStep(true);
      setTwoFAUserId(result.userId);
    } else if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await verify2FA(twoFAUserId, code);
    setLoading(false);
    if (result.success) navigate('/dashboard');
  };

  return (
    <div className="login-page">
      {/* LEFT — campus background image */}
      <div
        className="login-left"
        style={{
          backgroundImage: `url(${campusBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {/* Dark overlay so text stays readable */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(16,36,72,0.82) 0%, rgba(16,36,72,0.55) 100%)',
        }} />

        <div className="login-branding" style={{ position: 'relative', zIndex: 1 }}>
          {/* University Logo Badge */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '3px solid rgba(201,162,39,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', marginBottom: '1.2rem',
            backdropFilter: 'blur(8px)',
          }}>🎓</div>

          <h1 className="login-uni-name" style={{ fontSize: '2.4rem', marginBottom: '0.4rem' }}>
            Camaaro University
          </h1>
          <p className="login-tagline" style={{ fontSize: '1.05rem', marginBottom: '2rem' }}>
            Empowering Minds, Shaping Futures
          </p>

          <div className="login-features">
            {[
              'Quality Education & Innovative Thinking',
              'Live Camera Exam Monitoring',
              'Anti-Cheat Protection System',
              'Verified Digital Certificates',
              'Integrity & Community Leadership',
            ].map((f) => (
              <div key={f} className="feature-item">
                <span>✓</span> {f}
              </div>
            ))}
          </div>

          {/* Values strip */}
          <div style={{
            marginTop: '2.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
          }}>
            {['Excellence', 'Integrity', 'Innovation'].map((v) => (
              <span key={v} style={{
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
                color: 'rgba(201,162,39,0.9)', textTransform: 'uppercase',
                borderTop: '1px solid rgba(201,162,39,0.4)', paddingTop: '0.4rem',
              }}>{v}</span>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — login form */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--navy)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>🎓</div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Camaaro University Portal
              </span>
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {twoFAStep ? (
            <form className="login-form" onSubmit={handleVerify2FA}>
              <div style={{ background: '#eaf2fb', border: '1px solid #2980b9', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#2980b9' }}>
                🔐 Code-ka laga diray email-kaaga geli si aad u sii wadato.
              </div>
              <div className="form-group">
                <label>Verification Code</label>
                <input
                  type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g,''))} required
                  style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.3em', fontWeight: 700 }}
                />
              </div>
              <button
                type="submit" className="btn-primary btn-full"
                disabled={loading || code.length !== 6}
                style={{ marginTop: '0.5rem', padding: '0.85rem', fontSize: '1rem', borderRadius: 10 }}
              >
                {loading ? 'Waa la xaqiijinayaa…' : '🔓 Xaqiiji →'}
              </button>
              <button type="button" onClick={() => { setTwoFAStep(false); setCode(''); }}
                style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', width: '100%' }}>
                ← Ku noqo Login
              </button>
            </form>
          ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email" name="email" placeholder="your@camaaro.edu"
                value={form.email} onChange={handleChange} required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-toggle">
                <input
                  type={showPwd ? 'text' : 'password'} name="password"
                  placeholder="Enter your password"
                  value={form.password} onChange={handleChange} required
                />
                <button type="button" className="toggle-pwd" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '-0.4rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--navy)' }}>Forgot password?</Link>
            </div>

            <button
              type="submit" className="btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.85rem', fontSize: '1rem', borderRadius: 10 }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
          )}

          <div style={{
            marginTop: '1.5rem', padding: '0.9rem 1rem',
            background: '#f0f4f8', borderRadius: 10,
            border: '1px solid var(--border)', textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              🔒 Access is provided by your administrator.<br />
              Contact your university admin to get an account.
            </p>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} Camaaro University — All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
