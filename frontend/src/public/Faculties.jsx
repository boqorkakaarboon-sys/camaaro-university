import { Link } from 'react-router-dom';

const faculties = [
  {
    icon: '💻',
    name: 'Information Technology',
    desc: 'Software development, networking, cybersecurity, and information systems — preparing graduates for Somalia\'s growing tech sector.',
    degrees: ['Bachelor of Information Technology', 'Diploma in Computer Science'],
  },
  {
    icon: '💼',
    name: 'Business Administration',
    desc: 'Management, accounting, marketing, and entrepreneurship for students building the next generation of Somali businesses.',
    degrees: ['Bachelor of Business Administration', 'Diploma in Accounting'],
  },
  {
    icon: '⚕️',
    name: 'Medicine & Health Sciences',
    desc: 'Foundational and clinical training across medicine, nursing, and pharmacy for future healthcare professionals.',
    degrees: ['Bachelor of Medicine (MBBS track)', 'Diploma in Nursing', 'Diploma in Pharmacy'],
  },
  {
    icon: '⚙️',
    name: 'Engineering',
    desc: 'Civil, electrical, and general engineering programs grounded in practical, hands-on project work.',
    degrees: ['Bachelor of Civil Engineering', 'Bachelor of Electrical Engineering'],
  },
  {
    icon: '📚',
    name: 'Education',
    desc: 'Training the teachers who will shape Somalia\'s next generation of learners, from primary through secondary level.',
    degrees: ['Bachelor of Education', 'Diploma in Teaching'],
  },
  {
    icon: '⚖️',
    name: 'Law',
    desc: 'Somali and international legal frameworks, advocacy, and ethics for students pursuing legal careers.',
    degrees: ['Bachelor of Laws (LLB)'],
  },
  {
    icon: '🌍',
    name: 'Social Sciences',
    desc: 'Public administration, political science, and community development for students focused on public impact.',
    degrees: ['Bachelor of Public Administration', 'Bachelor of Political Science'],
  },
];

const Faculties = () => (
  <>
    <section className="pub-page-hero">
      <span className="pub-eyebrow">Academics</span>
      <h1>Every path. One university.</h1>
      <p className="pub-hero-sub">
        Camaaro University offers faculties across technology, business, health,
        engineering, education, law, and the social sciences — available at both
        the Camaaro and Muqdisho campuses.
      </p>
    </section>

    <section className="pub-faculty-grid">
      {faculties.map((f) => (
        <div key={f.name} className="pub-faculty-card">
          <div className="pub-faculty-icon">{f.icon}</div>
          <h3>{f.name}</h3>
          <p>{f.desc}</p>
          <ul>
            {f.degrees.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </div>
      ))}
    </section>

    <section className="pub-note-band">
      <p>
        📋 This list reflects Camaaro University's core academic offering.
        For the most current course catalog, intake dates, and admission
        requirements, please contact the Admissions Office directly.
      </p>
    </section>

    <section className="pub-cta-band">
      <h2>Have questions about a faculty?</h2>
      <p>Our admissions team and AI academic assistant are both ready to help.</p>
      <div className="pub-hero-cta">
        <a href="tel:+252612665365" className="pub-btn pub-btn-primary">📞 +252 612 665 365</a>
        <Link to="/login" className="pub-btn pub-btn-ghost">Ask the AI Assistant</Link>
      </div>
    </section>
  </>
);

export default Faculties;
