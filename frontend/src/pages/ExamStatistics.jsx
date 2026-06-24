import { useState, useEffect } from 'react';
import { examsAPI, analyticsAPI } from '../services/api';

const ExamStatistics = () => {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { examsAPI.getAll().then(res => setExams(res.data.exams || [])); }, []);

  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    analyticsAPI.examStats(examId).then(res => setStats(res.data)).finally(() => setLoading(false));
  }, [examId]);

  const colorFor = (pct) => pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--gold)' : 'var(--red)';

  return (
    <div style={{ maxWidth: 750 }}>
      <h1 style={{ color:'var(--navy)', marginBottom:'1.5rem' }}>📊 Exam Statistics</h1>

      <select value={examId} onChange={e => setExamId(e.target.value)}
        style={{ padding:'0.65rem 1rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit', marginBottom:'1.5rem', width:'100%', maxWidth:340 }}>
        <option value="">Dooro Exam</option>
        {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
      </select>

      {loading ? <div style={{color:'var(--text-muted)'}}>Waa la soo qaadayaa...</div> : stats && (
        <div>
          <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem' }}>
            <div style={{ background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)', textAlign:'center', flex:1 }}>
              <div style={{ fontSize:'1.8rem', fontWeight:700, color:'var(--navy)' }}>{stats.totalAttempts}</div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>Total Attempts</div>
            </div>
            <div style={{ background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)', textAlign:'center', flex:1 }}>
              <div style={{ fontSize:'1.8rem', fontWeight:700, color:'var(--navy)' }}>{stats.questionStats.length}</div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>Su'aalo</div>
            </div>
          </div>

          <div style={{ background:'#fff', borderRadius:12, boxShadow:'var(--shadow)', border:'1px solid var(--border)', overflow:'hidden' }}>
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
              <h4 style={{ color:'var(--navy)' }}>Per-Question Breakdown (adagga ugu horeyn)</h4>
            </div>
            <div style={{ display:'flex', flexDirection:'column' }}>
              {stats.questionStats.map((q, i) => (
                <div key={q.questionId} style={{ padding:'1rem 1.25rem', borderBottom: i < stats.questionStats.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                    <div style={{ fontWeight:500, fontSize:'0.88rem', flex:1 }}>{i+1}. {q.text}</div>
                    <div style={{ fontWeight:700, color: colorFor(q.correctPct), fontSize:'0.9rem', whiteSpace:'nowrap', marginLeft:'1rem' }}>{q.correctPct}%</div>
                  </div>
                  <div style={{ background:'var(--bg)', borderRadius:20, height:8, overflow:'hidden' }}>
                    <div style={{ width:`${q.correctPct}%`, height:'100%', background: colorFor(q.correctPct), borderRadius:20, transition:'width 0.6s' }} />
                  </div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.3rem' }}>{q.total} jawaab · {q.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!examId && !loading && (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📊</div>
          <p>Dooro exam si aad u aragto statistics-ka</p>
        </div>
      )}
    </div>
  );
};

export default ExamStatistics;
