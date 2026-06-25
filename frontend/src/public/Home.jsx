import { Link } from 'react-router-dom';
import grad1 from '../assets/public/grad-1.jpeg';
import grad3 from '../assets/public/grad-3.jpeg';

const stats = [
  { value: '2', label: 'Campuses' },
  { value: '7+', label: 'Faculties' },
  { value: '1000+', label: 'Graduates' },
  { value: '2', label: 'Cities — Camaaro & Muqdisho' },
];

const highlights = [
  {
    title: 'Online Learning Platform',
    text: 'Courses, exams, results, and certificates — all managed in one digital campus accessible from anywhere.',
    icon: '💻',
  },
  {
    title: 'Real Certification',
    text: 'Every graduate receives a verifiable digital certificate, instantly checkable through our verification system.',
    icon: '🎓',
  },
  {
    title: 'AI Academic Assistant',
    text: 'Students get 24/7 help from an AI assistant trained to answer questions about courses, faculties, and academic topics.',
    icon: '🤖',
  },
];

const Home = () => (
  <>
    {/* HERO */}
    <section className="pub-hero">
      <div className="pub-hero-text">
        <span className="pub-eyebrow">Camaaro &amp; Muqdisho</span>
        <h1>
          Where ambition <br /> earns its <span className="pub-accent">seal.</span>
        </h1>
        <p className="pub-hero-sub">
          Camaaro University trains the next generation of Somali professionals —
          from Information Technology to Medicine — across two campuses,
          one standard of excellence.
        </p>
        <div className="pub-hero-cta">
          <Link to="/faculties" className="pub-btn pub-btn-primary">Explore Faculties</Link>
          <Link to="/login" className="pub-btn pub-btn-ghost">Student / Staff Login</Link>
        </div>
      </div>
      <div className="pub-hero-art">
        <div className="pub-hero-photo-wrap">
          <img src={grad1} alt="Camaaro University graduate holding a graduation cap" />
          <div className="pub-hero-seal-badge">
            <span>EST.</span>
            <strong>CU</strong>
          </div>
        </div>
      </div>
    </section>

    {/* STATS STRIP */}
    <section className="pub-stats">
      {stats.map((s) => (
        <div key={s.label} className="pub-stat">
          <strong>{s.value}</strong>
          <span>{s.label}</span>
        </div>
      ))}
    </section>

    {/* HIGHLIGHTS */}
    <section className="pub-section">
      <div className="pub-section-head">
        <span className="pub-eyebrow">Why Camaaro</span>
        <h2>A modern university, built digital-first</h2>
      </div>
      <div className="pub-highlight-grid">
        {highlights.map((h) => (
          <div key={h.title} className="pub-highlight-card">
            <div className="pub-highlight-icon">{h.icon}</div>
            <h3>{h.title}</h3>
            <p>{h.text}</p>
          </div>
        ))}
      </div>
    </section>

    {/* GRADUATE SPOTLIGHT */}
    <section className="pub-spotlight">
      <div className="pub-spotlight-photo">
        <img src={grad3} alt="Camaaro University graduate in red gown" />
      </div>
      <div className="pub-spotlight-text">
        <span className="pub-eyebrow">Graduate Spotlight</span>
        <h2>"Camaaro gave me more than a degree — it gave me direction."</h2>
        <p>
          Every gown, every sash, every walk across the stage represents years of
          discipline supported by Camaaro's faculty and digital learning tools.
          Our graduates leave ready for the workplace — or to build one of their own.
        </p>
        <Link to="/about" className="pub-link-arrow">Learn about our mission →</Link>
      </div>
    </section>

    {/* CTA BAND */}
    <section className="pub-cta-band">
      <h2>Ready to begin your chapter?</h2>
      <p>Admissions, courses, and faculty information are one call away.</p>
      <div className="pub-hero-cta">
        <a href="tel:+252612665365" className="pub-btn pub-btn-primary">📞 +252 612 665 365</a>
        <Link to="/faculties" className="pub-btn pub-btn-ghost">View Faculties</Link>
      </div>
    </section>
  </>
);

export default Home;
