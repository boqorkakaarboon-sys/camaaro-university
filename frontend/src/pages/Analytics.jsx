import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';

const StatCard = ({ icon, label, value, color = 'var(--navy)' }) => (
  <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', textAlign: 'center' }}>
    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
    <div style={{ fontSize: '2rem', fontWeight: 700, color, fontFamily: 'Playfair Display, serif' }}>{value}</div>
    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{label}</div>
  </div>
);

const GradeBar = ({ grade, count, total }) => {
  const pct = total ? Math.round((count / total) * 100) : 0;
  const colors = { 'A+':'#1a6b3c','A':'#27ae60','B+':'#2980b9','B':'#3498db','C+':'#f39c12','C':'#e67e22','D':'#e74c3c','F':'#c0392b' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
      <span style={{ width: 28, fontWeight: 700, color: colors[grade] || '#666', fontSize: '0.88rem' }}>{grade}</span>
      <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 20, height: 18, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: colors[grade] || '#999', borderRadius: 20, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ width: 40, fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'right' }}>{count}</span>
    </div>
  );
};

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsAPI.overview();
        setStats(res.data.stats);
        const logRes = await analyticsAPI.auditLog();
        setLogs(logRes.data.logs);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Xogta waa la soo qaadayaa...</div>;
  if (!stats) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--red)' }}>Xogta lama soo qaadin</div>;

  const totalGrades = Object.values(stats.gradeDist).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: 'var(--navy)', marginBottom: '0.25rem' }}>📈 Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Warbixinta guud ee jaamacadda</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
        {[['overview','📊 Guud'],['grades','🎓 Grades'],['students','🏆 Top Students'],['dept','🏛 Departments'],['audit','📋 Audit Log']].map(([t,l]) => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding: '0.6rem 1.1rem', border: 'none', borderBottom: `3px solid ${activeTab===t?'var(--navy)':'transparent'}`, background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: activeTab===t?700:400, color: activeTab===t?'var(--navy)':'var(--text-muted)', marginBottom: '-2px', fontSize: '0.88rem' }}>
            {l}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard icon="🎓" label="Students" value={stats.totalStudents} color="var(--navy)" />
            <StatCard icon="👨‍🏫" label="Teachers" value={stats.totalTeachers} color="var(--green)" />
            <StatCard icon="📚" label="Courses" value={stats.totalCourses} color="var(--gold)" />
            <StatCard icon="📝" label="Exams" value={stats.totalExams} color="#9b59b6" />
            <StatCard icon="📊" label="Natiijooyin" value={stats.totalResults} color="#2980b9" />
            <StatCard icon="✅" label="Pass Rate" value={`${stats.passRate}%`} color={stats.passRate>=50?'var(--green)':'var(--red)'} />
            <StatCard icon="⭐" label="Avg Score" value={`${stats.avgScore}%`} color="var(--navy)" />
          </div>
        </div>
      )}

      {activeTab === 'grades' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', maxWidth: 500 }}>
          <h3 style={{ color: 'var(--navy)', marginBottom: '1.25rem' }}>Grade Distribution</h3>
          {Object.entries(stats.gradeDist).map(([g, c]) => <GradeBar key={g} grade={g} count={c} total={totalGrades} />)}
        </div>
      )}

      {activeTab === 'students' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--navy)' }}>🏆 Top 10 Students</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg)' }}>{['#','Name','Student ID','Dept','Avg Score'].map(h=><th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.82rem', color:'var(--text-muted)', fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {stats.topStudents.map((s, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding:'0.75rem 1rem', fontWeight:700, color:i<3?'var(--gold)':'var(--text-muted)' }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</td>
                  <td style={{ padding:'0.75rem 1rem', fontWeight:600 }}>{s.student?.name || 'N/A'}</td>
                  <td style={{ padding:'0.75rem 1rem', color:'var(--text-muted)', fontSize:'0.85rem' }}>{s.student?.studentId || '-'}</td>
                  <td style={{ padding:'0.75rem 1rem', color:'var(--text-muted)', fontSize:'0.85rem' }}>{s.student?.department || '-'}</td>
                  <td style={{ padding:'0.75rem 1rem' }}><span style={{ background:'var(--navy)',color:'#fff',padding:'2px 10px',borderRadius:20,fontWeight:700,fontSize:'0.85rem' }}>{s.avg}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'dept' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--navy)' }}>🏛 Department Stats</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg)' }}>{['Department','Total','Passed','Pass Rate','Avg Score'].map(h=><th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.82rem', color:'var(--text-muted)', fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {stats.departmentStats.map((d, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding:'0.75rem 1rem', fontWeight:600 }}>{d.department}</td>
                  <td style={{ padding:'0.75rem 1rem' }}>{d.total}</td>
                  <td style={{ padding:'0.75rem 1rem', color:'var(--green)' }}>{d.passed}</td>
                  <td style={{ padding:'0.75rem 1rem' }}><span style={{ background:d.passRate>=50?'#e8f5ee':'#fdecea',color:d.passRate>=50?'var(--green)':'var(--red)',padding:'2px 10px',borderRadius:20,fontWeight:700,fontSize:'0.85rem' }}>{d.passRate}%</span></td>
                  <td style={{ padding:'0.75rem 1rem', fontWeight:700, color:'var(--navy)' }}>{d.avgScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'audit' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--navy)' }}>📋 Audit Log</h3>
          </div>
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: 'var(--bg)', position:'sticky', top:0 }}>{['Time','User','Action','Target','IP'].map(h=><th key={h} style={{ padding:'0.65rem 1rem', textAlign:'left', fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600 }}>{h}</th>)}</tr></thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)', fontSize: '0.82rem' }}>
                    <td style={{ padding:'0.6rem 1rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={{ padding:'0.6rem 1rem', fontWeight:500 }}>{log.user?.name || 'System'}<br/><span style={{color:'var(--text-muted)',fontSize:'0.75rem'}}>{log.user?.email}</span></td>
                    <td style={{ padding:'0.6rem 1rem' }}><span style={{ background:'var(--bg)',padding:'2px 8px',borderRadius:6,fontFamily:'monospace',fontSize:'0.78rem' }}>{log.action}</span></td>
                    <td style={{ padding:'0.6rem 1rem', color:'var(--text-muted)' }}>{log.target}</td>
                    <td style={{ padding:'0.6rem 1rem', color:'var(--text-muted)', fontFamily:'monospace', fontSize:'0.75rem' }}>{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
