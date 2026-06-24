import { useState, useEffect } from 'react';
import { attendanceAPI, coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const StudentAttendanceView = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceAPI.getMine().then(res => setRecords(res.data.records)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const stats = records.reduce((acc, r) => { acc[r.status] = (acc[r.status]||0)+1; return acc; }, {});
  const total = records.length;
  const presentPct = total ? Math.round(((stats.present||0)/total)*100) : 0;

  if (loading) return <div style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>Waa la soo qaadayaa...</div>;

  return (
    <div>
      <h1 style={{ color: 'var(--navy)', marginBottom: '1.5rem' }}>✅ My Attendance</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background:'#fff', borderRadius:12, padding:'1.25rem', textAlign:'center', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:'1.8rem', fontWeight:700, color: presentPct>=75?'var(--green)':'var(--red)' }}>{presentPct}%</div>
          <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Attendance Rate</div>
        </div>
        {[['present','✅ Present','var(--green)'],['absent','❌ Absent','var(--red)'],['late','⏰ Late','var(--gold)'],['excused','📋 Excused','#888']].map(([k,l,c])=>(
          <div key={k} style={{ background:'#fff', borderRadius:12, padding:'1.25rem', textAlign:'center', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:'1.8rem', fontWeight:700, color:c }}>{stats[k]||0}</div>
            <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'var(--shadow)', border:'1px solid var(--border)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{background:'var(--bg)'}}>{['Date','Course','Status','Note'].map(h=><th key={h} style={{padding:'0.75rem 1rem',textAlign:'left',fontSize:'0.82rem',color:'var(--text-muted)'}}>{h}</th>)}</tr></thead>
          <tbody>
            {records.map((r,i)=>(
              <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                <td style={{padding:'0.7rem 1rem'}}>{new Date(r.date).toLocaleDateString()}</td>
                <td style={{padding:'0.7rem 1rem'}}>{r.course?.title} ({r.course?.code})</td>
                <td style={{padding:'0.7rem 1rem'}}>
                  <span style={{ padding:'2px 10px', borderRadius:20, fontSize:'0.78rem', fontWeight:600,
                    background: r.status==='present'?'#e8f5ee':r.status==='absent'?'#fdecea':r.status==='late'?'#fef6e7':'#f0f0f0',
                    color: r.status==='present'?'var(--green)':r.status==='absent'?'var(--red)':r.status==='late'?'#b8860b':'#888' }}>
                    {r.status}
                  </span>
                </td>
                <td style={{padding:'0.7rem 1rem', color:'var(--text-muted)', fontSize:'0.85rem'}}>{r.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TeacherAttendanceView = () => {
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { coursesAPI.getAll().then(res => setCourses(res.data.courses)); }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    const course = courses.find(c => c._id === selectedCourse);
    setStudents(course?.students || []);
    setLoading(true);
    attendanceAPI.getByCourse(selectedCourse, date).then(res => {
      const existing = res.data.records[0];
      if (existing) {
        const map = {};
        existing.records.forEach(r => { map[r.student._id || r.student] = r.status; });
        setRecords(map);
      } else setRecords({});
    }).finally(() => setLoading(false));
  }, [selectedCourse, date, courses]);

  const setStatus = (studentId, status) => setRecords(p => ({ ...p, [studentId]: status }));

  const handleSave = async () => {
    try {
      const recs = students.map(s => ({ student: s._id, status: records[s._id] || 'absent' }));
      await attendanceAPI.mark({ courseId: selectedCourse, date, records: recs });
      showToast('Attendance la kaydiyay!', 'success');
    } catch { showToast('Khalad ayaa dhacay', 'error'); }
  };

  const statusColors = { present:'var(--green)', absent:'var(--red)', late:'var(--gold)', excused:'#888' };

  return (
    <div>
      <h1 style={{ color: 'var(--navy)', marginBottom: '1.5rem' }}>✅ Mark Attendance</h1>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
          style={{ padding:'0.65rem 1rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit', minWidth:220 }}>
          <option value="">Dooro Course</option>
          {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.code})</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ padding:'0.65rem 1rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
      </div>

      {selectedCourse && (
        loading ? <div style={{color:'var(--text-muted)'}}>Waa la soo qaadayaa...</div> : (
        <div style={{ background:'#fff', borderRadius:12, boxShadow:'var(--shadow)', border:'1px solid var(--border)', overflow:'hidden' }}>
          {students.length === 0 ? (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)' }}>Course-kan arday kuma jiraan</div>
          ) : (
            <>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{background:'var(--bg)'}}>{['Student','Status'].map(h=><th key={h} style={{padding:'0.75rem 1rem',textAlign:'left',fontSize:'0.82rem',color:'var(--text-muted)'}}>{h}</th>)}</tr></thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id} style={{ borderTop:'1px solid var(--border)' }}>
                    <td style={{ padding:'0.75rem 1rem', fontWeight:500 }}>{s.name}</td>
                    <td style={{ padding:'0.6rem 1rem' }}>
                      <div style={{ display:'flex', gap:'0.4rem' }}>
                        {['present','absent','late','excused'].map(st => (
                          <button key={st} onClick={() => setStatus(s._id, st)}
                            style={{ padding:'0.3rem 0.7rem', borderRadius:6, fontSize:'0.78rem', cursor:'pointer', fontFamily:'inherit', fontWeight:600,
                              border: `1.5px solid ${records[s._id]===st ? statusColors[st] : 'var(--border)'}`,
                              background: records[s._id]===st ? statusColors[st] : '#fff',
                              color: records[s._id]===st ? '#fff' : 'var(--text-muted)' }}>
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--border)' }}>
              <button onClick={handleSave} className="btn-primary">💾 Kaydi Attendance</button>
            </div>
            </>
          )}
        </div>
        )
      )}
    </div>
  );
};

const Attendance = () => {
  const { user } = useAuth();
  return user.role === 'student' ? <StudentAttendanceView /> : <TeacherAttendanceView />;
};

export default Attendance;
