import grad2 from '../assets/public/grad-2.jpeg';

const milestones = [
  { year: 'Founding', text: 'Camaaro University was established by Ramli Ali Husein with a vision: accessible, high-quality higher education for Somali students.' },
  { year: 'Expansion', text: 'A second campus opened in Muqdisho, extending the same academic standard to more students across the country.' },
  { year: 'Digital Campus', text: 'Camaaro launched its fully digital learning platform — courses, exams, results, certificates, and an AI academic assistant — all in one place.' },
];

const values = [
  { title: 'Academic Rigor', text: 'Every faculty follows a structured, exam-verified curriculum with real accountability.' },
  { title: 'Accessibility', text: 'Two campuses and a digital platform mean distance is never a barrier to learning.' },
  { title: 'Integrity', text: 'Certificates are digitally verifiable — what a graduate earns can always be proven.' },
];

const About = () => (
  <>
    <section className="pub-page-hero">
      <span className="pub-eyebrow">About Camaaro University</span>
      <h1>Built on discipline. Driven by ambition.</h1>
      <p className="pub-hero-sub">
        Founded by Ramli Ali Husein, Camaaro University exists to give Somali
        students a path from classroom to career — without compromise on quality.
      </p>
    </section>

    <section className="pub-about-grid">
      <div className="pub-about-photo">
        <img src={grad2} alt="Camaaro University graduation cake celebrating a graduate" />
      </div>
      <div className="pub-about-copy">
        <h2>Our Founder</h2>
        <p>
          <strong>Ramli Ali Husein</strong> founded Camaaro University with a simple
          conviction: that quality higher education should be within reach for every
          ambitious Somali student, regardless of where they start. That conviction
          shaped the university's two-campus model and its investment in a modern,
          digital-first academic platform.
        </p>
        <p>
          Today, that vision continues through every cohort that crosses the stage —
          each one a reminder of why the university exists.
        </p>
      </div>
    </section>

    <section className="pub-section">
      <div className="pub-section-head">
        <span className="pub-eyebrow">Our Story</span>
        <h2>From one campus to two cities</h2>
      </div>
      <div className="pub-timeline">
        {milestones.map((m, i) => (
          <div key={m.year} className="pub-timeline-item">
            <div className="pub-timeline-marker">{i + 1}</div>
            <div>
              <h3>{m.year}</h3>
              <p>{m.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="pub-section">
      <div className="pub-section-head">
        <span className="pub-eyebrow">What We Stand For</span>
        <h2>Our values</h2>
      </div>
      <div className="pub-highlight-grid">
        {values.map((v) => (
          <div key={v.title} className="pub-highlight-card">
            <h3>{v.title}</h3>
            <p>{v.text}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="pub-cta-band">
      <h2>Two campuses. One standard.</h2>
      <p>Camaaro and Muqdisho — same faculty quality, same certification, same opportunity.</p>
    </section>
  </>
);

export default About;
