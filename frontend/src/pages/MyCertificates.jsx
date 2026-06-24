import { useState, useEffect } from 'react';
import { certificatesAPI } from '../services/api';

const CertificateDetail = ({ cert, onBack }) => {
  const verifyUrl = `${window.location.origin}/verify/${cert.verifyCode}`;
  return (
    <div>
      <button onClick={onBack} style={{ marginBottom:'1.25rem', background:'none', border:'none', color:'var(--navy)', cursor:'pointer', fontWeight:600, fontSize:'0.9rem' }}>← Ku noqo Liiska</button>
      <div style={{ background:'#fffef8', border:'3px solid var(--gold)', borderRadius:16, padding:'2.5rem', textAlign:'center', maxWidth:600, margin:'0 auto' }}>
        <div style={{ fontSize:'2.5rem' }}>🎓</div>
        <h2 style={{ fontFamily:'Playfair Display, serif', color:'var(--navy)', margin:'0.5rem 0' }}>Certificate of Completion</h2>
        <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>This certifies that</p>
        <h3 style={{ fontFamily:'Playfair Display, serif', color:'var(--navy)', fontSize:'1.5rem', margin:'0.5rem 0' }}>{cert.studentName}</h3>
        <p style={{ color:'var(--text-muted)', fontSize:'0.88rem' }}>has successfully completed</p>
        <h4 style={{ color:'var(--navy)', margin:'0.5rem 0' }}>{cert.courseTitle} ({cert.courseCode})</h4>
        <p style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>{cert.examTitle}</p>
        <div style={{ display:'flex', justifyContent:'center', gap:'2rem', margin:'1.5rem 0' }}>
          <div><div style={{ fontSize:'1.8rem', fontWeight:700, color:'var(--navy)' }}>{cert.grade}</div><div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>GRADE</div></div>
          <div><div style={{ fontSize:'1.8rem', fontWeight:700, color:'var(--navy)' }}>{cert.percentage}%</div><div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>SCORE</div></div>
        </div>
        <p style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
        <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontFamily:'monospace', marginTop:'0.5rem' }}>Verify: {cert.verifyCode}</p>
        <a href={verifyUrl} target="_blank" rel="noreferrer" style={{ display:'inline-block', marginTop:'1rem', color:'var(--navy)', fontSize:'0.82rem', textDecoration:'underline' }}>{verifyUrl}</a>
      </div>
    </div>
  );
};

const MyCertificates = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    certificatesAPI.getMine().then(res => setCerts(res.data.certificates)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>Waa la soo qaadayaa...</div>;

  if (selected) {
    return (
      <CertificateDetail
        cert={{
          studentName: selected.studentName, courseTitle: selected.courseId?.title, courseCode: selected.courseId?.code,
          examTitle: selected.examId?.title, grade: selected.grade, percentage: selected.percentage,
          issuedAt: selected.issuedAt, verifyCode: selected.verifyCode,
        }}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div>
      <h1 style={{ color:'var(--navy)', marginBottom:'1.5rem' }}>🎓 My Certificates</h1>
      {certs.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🎓</div>
          <p>Wali shahaado lama helin. Imtixaan dhammaystir si aad u hesho!</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1.25rem' }}>
          {certs.map((c, i) => (
            <div key={i} onClick={() => setSelected(c)} style={{ cursor:'pointer', background:'linear-gradient(135deg,var(--navy),var(--navy-light))', borderRadius:14, padding:'1.5rem', color:'#fff', position:'relative', overflow:'hidden', boxShadow:'var(--shadow-md)' }}>
              <div style={{ position:'absolute', top:-20, right:-20, fontSize:'5rem', opacity:0.12 }}>🎓</div>
              <div style={{ fontSize:'0.75rem', opacity:0.8, textTransform:'uppercase', letterSpacing:'1px' }}>Certificate of Completion</div>
              <div style={{ fontWeight:700, fontSize:'1.1rem', marginTop:'0.5rem' }}>{c.courseId?.title || 'N/A'}</div>
              <div style={{ fontSize:'0.82rem', opacity:0.85, marginTop:'0.2rem' }}>{c.examId?.title}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:'1.25rem' }}>
                <div>
                  <div style={{ fontSize:'1.6rem', fontWeight:700 }}>{c.grade}</div>
                  <div style={{ fontSize:'0.75rem', opacity:0.8 }}>{c.percentage}%</div>
                </div>
                <div style={{ fontSize:'0.7rem', opacity:0.7, fontFamily:'monospace' }}>{c.verifyCode}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;
