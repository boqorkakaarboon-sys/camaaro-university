import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const navLinks = [
  { path: '/home', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/faculties', label: 'Faculties' },
];

const PublicLayout = ({ children }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="pub-root">
      <header className="pub-header">
        <Link to="/home" className="pub-brand">
          <span className="pub-seal">CU</span>
          <span className="pub-brand-text">
            <strong>Camaaro</strong> University
          </span>
        </Link>

        <nav className={`pub-nav ${menuOpen ? 'open' : ''}`}>
          {navLinks.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className={location.pathname === l.path ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/login" className="pub-login-btn" onClick={() => setMenuOpen(false)}>
            Login →
          </Link>
        </nav>

        <button className="pub-burger" onClick={() => setMenuOpen((p) => !p)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </header>

      <main className="pub-main">{children}</main>

      <footer className="pub-footer">
        <div className="pub-footer-inner">
          <div className="pub-footer-brand">
            <span className="pub-seal small">CU</span>
            <span>Camaaro University</span>
          </div>
          <div className="pub-footer-links">
            <Link to="/home">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/faculties">Faculties</Link>
            <Link to="/login">Login</Link>
          </div>
          <div className="pub-footer-contact">
            <span>📞 +252 612 665 365</span>
            <span>Camaaro &amp; Muqdisho Campuses</span>
          </div>
        </div>
        <div className="pub-footer-bottom">© 2026 Camaaro University. Founded by Ramli Ali Husein.</div>
      </footer>
    </div>
  );
};

export default PublicLayout;
