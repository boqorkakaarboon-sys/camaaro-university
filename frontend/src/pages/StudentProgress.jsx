import { useState, useEffect } from 'react';
import { usersAPI, analyticsAPI } from '../services/api';

const StudentProgress = () => {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { usersAPI.getStudents().then(res => setStudents(res.data.students)); }, []);

  useEffect(() => {
    if (!studentId) { setData(null); return; }
    setLoading(true);
    setError('');
    analyticsAPI.studentDetail(studentId)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.message || 'Khalad ayaa dhacay'))
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <div style={{ maxWidth: 760 }}>
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
      ) : error ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--red)' }}><p>{error}</p></div>
      ) : !data || data.stats.count === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📭</div>
          <p>Student-kan weli wax natiijo ah lama grade-gareeyay</p>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:12, padding:'1.5rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--navy)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.3rem' }}>
              {data.student.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--navy)' }}>{data.student.name}</div>
              <div style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>{data.student.studentId} · {data.student.department}</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
            <div style={{ background:'var(--bg)', borderRadius:10, padding:'1.1rem', textAlign:'center' }}>
              <div style={{ fontSize:'1.6rem', fontWeight:700, color:'var(--navy)' }}>{data.stats.avg}%</div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Avg Score</div>
            </div>
            <div style={{ background:'var(--bg)', borderRadius:10, padding:'1.1rem', textAlign:'center' }}>
              <div style={{ fontSize:'1.6rem', fontWeight:700, color:'var(--navy)' }}>{data.stats.avgGpa}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Avg GPA</div>
            </div>
            <div style={{ background:'#e8f5ee', borderRadius:10, padding:'1.1rem', textAlign:'center' }}>
              <div style={{ fontSize:'1.6rem', fontWeight:700, color:'var(--green)' }}>{data.stats.passedCount}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Passed</div>
            </div>
            <div style={{ background:'#fdecea', borderRadius:10, padding:'1.1rem', textAlign:'center' }}>
              <div style={{ fontSize:'1.6rem', fontWeight:700, color:'var(--red)' }}>{data.stats.failedCount}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Failed</div>
            </div>
          </div>

          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'2px solid var(--border)' }}>
                {['Exam','Course','%','Grade','Status'].map(h => (
                  <th key={h} style={{ padding:'0.6rem 0.5rem', textAlign:'left', fontSize:'0.8rem', color:'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.trend.map((t, i) => (
                <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'0.6rem 0.5rem', fontSize:'0.88rem' }}>{t.examTitle}</td>
                  <td style={{ padding:'0.6rem 0.5rem', fontSize:'0.88rem', color:'var(--text-muted)' }}>{t.course}</td>
                  <td style={{ padding:'0.6rem 0.5rem', fontSize:'0.88rem', fontWeight:600 }}>{t.percentage}%</td>
                  <td style={{ padding:'0.6rem 0.5rem', fontSize:'0.88rem' }}>{t.grade}</td>
                  <td style={{ padding:'0.6rem 0.5rem' }}>
                    <span style={{
                      fontSize:'0.75rem', fontWeight:600, padding:'2px 8px', borderRadius:6,
                      background: t.passed ? '#e8f5ee' : '#fdecea',
                      color: t.passed ? 'var(--green)' : 'var(--red)',
                    }}>
                      {t.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentProgress;
