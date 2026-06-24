import { useState, useEffect } from 'react';
import { usersAPI, analyticsAPI } from '../services/api';

const StudentProgress = () => {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { usersAPI.getStudents().then(res => setStudents(res.data.students)); }, []);

  // Note: uses overview analytics filtered client-side since backend tracks by logged-in user;
  // for teacher viewing other students we reuse course-level breakdown via overview topStudents as fallback.
  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    analyticsAPI.overview().then(res => {
      const found = res.data.stats.topStudents.find(s => s.student?._id === studentId);
      setStats(found || null);
    }).finally(() => setLoading(false));
  }, [studentId]);

  const student = students.find(s => s._id === studentId);

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ color:'var(--navy)', marginBottom:'1.5rem' }}>📈 Student Progress</h1>

      <select value={studentId} onChange={e => setStudentId(e.target.value)}
        style={{ padding:'0.65rem 1rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit', marginBottom:'1.5rem', width:'100%', maxWidth:320 }}>
        <option value="">Dooro Student</option>
        {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
      </select>

      {!studentId ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📈</div>
          <p>Dooro student si aad u aragto horumarkooda</p>
        </div>
      ) : loading ? (
        <div style={{color:'var(--text-muted)'}}>Waa la soo qaadayaa...</div>
      ) : !stats ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <p>Student-kan weli natiijo lama grade-gareeyay (xog kuma jiro top 10 list)</p>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:12, padding:'1.5rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.25rem' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--navy)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.3rem' }}>
              {student?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--navy)' }}>{student?.name}</div>
              <div style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>{student?.studentId} · {student?.department}</div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div style={{ background:'var(--bg)', borderRadius:10, padding:'1.25rem', textAlign:'center' }}>
              <div style={{ fontSize:'2rem', fontWeight:700, color:'var(--navy)' }}>{stats.avg}%</div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>Average Score</div>
            </div>
            <div style={{ background:'var(--bg)', borderRadius:10, padding:'1.25rem', textAlign:'center' }}>
              <div style={{ fontSize:'2rem', fontWeight:700, color:'var(--navy)' }}>{stats.count}</div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>Imtixaan La Qaatay</div>
            </div>
          </div>
          <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'1.25rem' }}>
            💡 Faahfaahin dheeraad ah ee per-exam waxaad ka heli kartaa "Results" page-ka.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentProgress;
