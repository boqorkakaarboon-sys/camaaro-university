import { useState, useEffect, useRef } from 'react';
import { resultsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Transcript = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    resultsAPI.getTranscript().then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Transcript - ${data.student.name}</title>
      <style>body{font-family:Georgia,serif;padding:40px;color:#1a2340}
      h1{color:#1a3a6b;text-align:center;margin-bottom:4px}
      .sub{text-align:center;color:#888;font-size:12px;margin-bottom:30px}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      th,td{padding:8px 12px;border-bottom:1px solid #ddd;text-align:left;font-size:13px}
      th{background:#f4f6fb;color:#1a3a6b}
      .gpa-box{text-align:center;background:#1a3a6b;color:#fff;padding:16px;border-radius:8px;margin-top:20px}
      </style></head><body>
      <h1>🎓 CAMAARO UNIVERSITY</h1>
      <div class="sub">OFFICIAL ACADEMIC TRANSCRIPT</div>
      <p><strong>Student:</strong> ${data.student.name} &nbsp; <strong>ID:</strong> ${data.student.studentId} &nbsp; <strong>Dept:</strong> ${data.student.department}</p>
      ${data.courses.map(c => `
        <h3 style="color:#1a3a6b">${c.course.title} (${c.course.code}) — ${c.course.credits} credits</h3>
        <table><tr><th>Exam</th><th>Score</th><th>Grade</th><th>GPA</th></tr>
        ${c.results.map(r=>`<tr><td>${r.examTitle}</td><td>${r.percentage}%</td><td>${r.grade}</td><td>${r.gpa}</td></tr>`).join('')}
        </table>`).join('')}
      <div class="gpa-box"><div style="font-size:28px;font-weight:700">${data.cumulativeGpa}</div><div style="font-size:11px">CUMULATIVE GPA · ${data.totalCredits} CREDITS</div></div>
      </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Transcript-ka waa la soo qaadayaa...</div>;
  if (!data || !data.courses?.length) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
      <p>Wali natiijo la grade-gareeyay ma jirto</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: 'var(--navy)' }}>🎓 Academic Transcript</h1>
        <button onClick={handlePrint} className="btn-primary">🖨 Print / Download PDF</button>
      </div>

      <div ref={printRef} style={{ background: '#fff', borderRadius: 12, padding: '2rem', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--gold)', paddingBottom: '1rem' }}>
          <div style={{ fontSize: '2.5rem' }}>🎓</div>
          <h2 style={{ color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}>CAMAARO UNIVERSITY</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Official Academic Transcript</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
          <div><strong>Student:</strong> {data.student.name}</div>
          <div><strong>Student ID:</strong> {data.student.studentId}</div>
          <div><strong>Department:</strong> {data.student.department}</div>
          <div><strong>Email:</strong> {data.student.email}</div>
        </div>

        {data.courses.map((c, i) => (
          <div key={i} style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--navy)', marginBottom: '0.5rem' }}>{c.course.title} ({c.course.code}) — {c.course.credits} credits</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ background: 'var(--bg)' }}>{['Exam','Score','Grade','GPA'].map(h=><th key={h} style={{padding:'0.5rem 0.75rem',textAlign:'left',color:'var(--text-muted)'}}>{h}</th>)}</tr></thead>
              <tbody>
                {c.results.map((r, j) => (
                  <tr key={j} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{r.examTitle}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{r.percentage}%</td>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{r.grade}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{r.gpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div style={{ background: 'var(--navy)', color: '#fff', borderRadius: 10, padding: '1.25rem', textAlign: 'center', marginTop: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Playfair Display, serif' }}>{data.cumulativeGpa}</div>
          <div style={{ fontSize: '0.78rem', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.85 }}>Cumulative GPA · {data.totalCredits} Credits</div>
        </div>
      </div>
    </div>
  );
};

export default Transcript;
