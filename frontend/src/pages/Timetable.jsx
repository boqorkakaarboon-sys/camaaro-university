import { useState, useEffect } from 'react';
import { coursesAPI, examsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const useCountdown = (targetDate) => {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setRemaining('Bilaabmay'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return remaining;
};

const ExamCountdownCard = ({ exam }) => {
  const countdown = useCountdown(exam.startTime);
  const isUrgent = new Date(exam.startTime) - new Date() < 86400000;
  return (
    <div style={{ background: isUrgent ? 'var(--red-light)' : '#fff', border: isUrgent ? '2px solid var(--red)' : '1px solid var(--border)', borderRadius:12, padding:'1rem 1.25rem', boxShadow:'var(--shadow)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' }}>
      <div>
        <div style={{ fontWeight:700, color:'var(--navy)' }}>📝 {exam.title}</div>
        <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{exam.course?.title} ({exam.course?.code})</div>
        <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{new Date(exam.startTime).toLocaleString()}</div>
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Countdown</div>
        <div style={{ fontSize:'1.2rem', fontWeight:700, color: isUrgent ? 'var(--red)' : 'var(--navy)', fontFamily:'monospace' }}>{countdown}</div>
      </div>
    </div>
  );
};

const Timetable = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');

  useEffect(() => {
    const load = async () => {
      const [c, e] = await Promise.all([coursesAPI.getAll(), examsAPI.getAll()]);
      setCourses(c.data.courses);
      const upcoming = (e.data.exams || []).filter(ex => new Date(ex.startTime) > new Date()).sort((a,b) => new Date(a.startTime) - new Date(b.startTime));
      setUpcomingExams(upcoming);
      setLoading(false);
    };
    load();
  }, []);

  const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  if (loading) return <div style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>Waa la soo qaadayaa...</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ color:'var(--navy)', marginBottom:'1.5rem' }}>🗓 Timetable</h1>

      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', borderBottom:'2px solid var(--border)' }}>
        {[['schedule','📅 Jadwalka Course-yada'],['exams','⏰ Imtixaanada Soo Socda']].map(([t,l]) => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding:'0.6rem 1.1rem', border:'none', borderBottom:`3px solid ${activeTab===t?'var(--navy)':'transparent'}`, background:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:activeTab===t?700:400, color:activeTab===t?'var(--navy)':'var(--text-muted)', marginBottom:'-2px', fontSize:'0.9rem' }}>
            {l}
          </button>
        ))}
      </div>

      {activeTab === 'schedule' && (
        courses.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📅</div>
            <p>Course lama diiwaan gelin</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {courses.map(c => (
              <div key={c._id} style={{ background:'#fff', borderRadius:12, padding:'1.1rem 1.25rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontWeight:700, color:'var(--navy)' }}>{c.title}</div>
                    <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{c.code} {c.teacher && `· ${c.teacher.name}`}</div>
                  </div>
                  <span style={{ background:'var(--bg)', padding:'3px 10px', borderRadius:20, fontSize:'0.78rem', color:'var(--navy)', fontWeight:600 }}>{c.credits || 3} credits</span>
                </div>
                <div style={{ marginTop:'0.6rem', fontSize:'0.85rem', color: c.schedule ? 'var(--text)' : 'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                  🕐 {c.schedule || 'Jadwal weli lama dejin'}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'exams' && (
        upcomingExams.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>⏰</div>
            <p>Imtixaan soo socda ma jiraan</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
            {upcomingExams.map(exam => <ExamCountdownCard key={exam._id} exam={exam} />)}
          </div>
        )
      )}
    </div>
  );
};

export default Timetable;
