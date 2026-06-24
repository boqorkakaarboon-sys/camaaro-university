import { useState, useEffect } from 'react';
import { analyticsAPI, coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [data, setData] = useState({ leaderboard: [], myRank: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => { coursesAPI.getAll().then(res => setCourses(res.data.courses)); }, []);

  useEffect(() => {
    setLoading(true);
    analyticsAPI.leaderboard(courseId).then(res => setData(res.data)).finally(() => setLoading(false));
  }, [courseId]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
        <h1 style={{ color:'var(--navy)' }}>🏆 Leaderboard</h1>
        <select value={courseId} onChange={e => setCourseId(e.target.value)}
          style={{ padding:'0.6rem 1rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }}>
          <option value="">Dhammaan Courses (Overall)</option>
          {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.code})</option>)}
        </select>
      </div>

      {user.role === 'student' && data.myRank && (
        <div style={{ background:'var(--navy)', color:'#fff', borderRadius:12, padding:'1.25rem 1.5rem', marginBottom:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:'0.8rem', opacity:0.85 }}>Boggaaga</div>
            <div style={{ fontSize:'1.8rem', fontWeight:700 }}>#{data.myRank.rank}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'0.8rem', opacity:0.85 }}>Average Score</div>
            <div style={{ fontSize:'1.8rem', fontWeight:700 }}>{data.myRank.avg}%</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>Waa la soo qaadayaa...</div>
      ) : data.leaderboard.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🏆</div>
          <p>Wali natiijo lama heli karin</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
          {data.leaderboard.map((entry, i) => {
            const isMe = entry.student._id === user._id;
            return (
              <div key={entry.student._id} style={{
                display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.25rem',
                background: isMe ? 'var(--green-light)' : '#fff', borderRadius:12,
                border: isMe ? '2px solid var(--green)' : '1px solid var(--border)', boxShadow:'var(--shadow)'
              }}>
                <div style={{ width:40, textAlign:'center', fontSize: i<3?'1.6rem':'1.1rem', fontWeight:700, color: i<3?'inherit':'var(--text-muted)' }}>
                  {i < 3 ? medals[i] : `#${entry.rank}`}
                </div>
                {entry.student.avatar ? (
                  <img src={entry.student.avatar} alt="" style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover' }} />
                ) : (
                  <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--navy)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                    {entry.student.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                )}
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600 }}>{entry.student.name} {isMe && <span style={{ color:'var(--green)', fontSize:'0.78rem' }}>(Adiga)</span>}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{entry.student.department || '-'} · {entry.examsTaken} imtixaan</div>
                </div>
                <div style={{ fontSize:'1.3rem', fontWeight:700, color:'var(--navy)' }}>{entry.avg}%</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
