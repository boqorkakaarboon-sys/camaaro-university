import { useState, useEffect } from 'react';
import { assignmentsAPI, coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CreateAssignmentModal = ({ courses, onClose, onSave }) => {
  const [form, setForm] = useState({ title:'', description:'', course:'', dueDate:'', maxScore:100 });
  const [loading, setLoading] = useState(false);
  const submit = async (e) => { e.preventDefault(); setLoading(true); await onSave(form); setLoading(false); };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'2rem', width:'100%', maxWidth:480 }}>
        <h3 style={{ color:'var(--navy)', marginBottom:'1.25rem' }}>📝 Assignment Cusub</h3>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div>
            <label style={{display:'block',fontSize:'0.88rem',fontWeight:500,marginBottom:'0.3rem'}}>Course</label>
            <select value={form.course} onChange={e=>setForm(p=>({...p,course:e.target.value}))} required
              style={{ width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }}>
              <option value="">Dooro Course</option>
              {courses.map(c=><option key={c._id} value={c._id}>{c.title} ({c.code})</option>)}
            </select>
          </div>
          <div>
            <label style={{display:'block',fontSize:'0.88rem',fontWeight:500,marginBottom:'0.3rem'}}>Title</label>
            <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} required
              style={{ width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
          </div>
          <div>
            <label style={{display:'block',fontSize:'0.88rem',fontWeight:500,marginBottom:'0.3rem'}}>Description</label>
            <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3}
              style={{ width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div>
              <label style={{display:'block',fontSize:'0.88rem',fontWeight:500,marginBottom:'0.3rem'}}>Due Date</label>
              <input type="datetime-local" value={form.dueDate} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))} required
                style={{ width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'0.88rem',fontWeight:500,marginBottom:'0.3rem'}}>Max Score</label>
              <input type="number" value={form.maxScore} onChange={e=>setForm(p=>({...p,maxScore:Number(e.target.value)}))}
                style={{ width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex:1, padding:'0.75rem', background:'var(--bg)', border:'1.5px solid var(--border)', borderRadius:8, cursor:'pointer', fontFamily:'inherit' }}>Jooji</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex:1, padding:'0.75rem' }}>{loading?'Waa la kaydiyaa...':'💾 Abuur'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SubmissionsModal = ({ assignment, onClose }) => {
  const { showToast } = useToast();
  const [subs, setSubs] = useState([]);
  const [grading, setGrading] = useState(null);
  const [scoreInput, setScoreInput] = useState({});

  useEffect(() => { assignmentsAPI.getSubmissions(assignment._id).then(res => setSubs(res.data.submissions)); }, [assignment]);

  const handleGrade = async (studentId) => {
    const { score, feedback } = scoreInput[studentId] || {};
    try {
      await assignmentsAPI.grade(assignment._id, studentId, { score: Number(score), feedback: feedback || '' });
      showToast('La grade-gareeyay!', 'success');
      const res = await assignmentsAPI.getSubmissions(assignment._id);
      setSubs(res.data.submissions);
      setGrading(null);
    } catch { showToast('Khalad ayaa dhacay', 'error'); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'2rem', width:'100%', maxWidth:600, maxHeight:'85vh', overflow:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h3 style={{ color:'var(--navy)' }}>📋 {assignment.title} — Submissions</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.4rem', cursor:'pointer' }}>✕</button>
        </div>
        {subs.length === 0 ? <p style={{color:'var(--text-muted)'}}>Wali submission lama helin</p> : subs.map(s => (
          <div key={s._id} style={{ border:'1px solid var(--border)', borderRadius:10, padding:'1rem', marginBottom:'0.75rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:600 }}>{s.student?.name}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{s.student?.studentId} · {new Date(s.submittedAt).toLocaleString()}</div>
              </div>
              <span style={{ padding:'2px 10px', borderRadius:20, fontSize:'0.75rem', fontWeight:600, background: s.status==='graded'?'#e8f5ee':s.status==='late'?'#fdecea':'#eaf2fb', color: s.status==='graded'?'var(--green)':s.status==='late'?'var(--red)':'#2980b9' }}>{s.status}</span>
            </div>
            {s.fileData && <a href={s.fileData} download={s.fileName} style={{ fontSize:'0.85rem', color:'var(--navy)', display:'inline-block', marginTop:'0.5rem' }}>📎 {s.fileName}</a>}
            {s.status === 'graded' ? (
              <div style={{ marginTop:'0.5rem', fontSize:'0.85rem' }}>Score: <strong>{s.score}/{assignment.maxScore}</strong> — {s.feedback}</div>
            ) : (
              <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.75rem' }}>
                <input type="number" placeholder="Score" max={assignment.maxScore}
                  onChange={e => setScoreInput(p=>({...p,[s.student._id]:{...p[s.student._id], score:e.target.value}}))}
                  style={{ width:80, padding:'0.4rem 0.6rem', border:'1px solid var(--border)', borderRadius:6 }} />
                <input placeholder="Feedback"
                  onChange={e => setScoreInput(p=>({...p,[s.student._id]:{...p[s.student._id], feedback:e.target.value}}))}
                  style={{ flex:1, padding:'0.4rem 0.6rem', border:'1px solid var(--border)', borderRadius:6 }} />
                <button onClick={() => handleGrade(s.student._id)} className="btn-primary" style={{ padding:'0.4rem 0.9rem', fontSize:'0.82rem' }}>Grade</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Assignments = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [viewSubs, setViewSubs] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await assignmentsAPI.getAll();
    setAssignments(res.data.assignments);
    if (user.role !== 'student') { const c = await coursesAPI.getAll(); setCourses(c.data.courses); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    try { await assignmentsAPI.create(form); showToast('Assignment la abuuray!', 'success'); setShowCreate(false); load(); }
    catch { showToast('Khalad ayaa dhacay', 'error'); }
  };

  const handleFileUpload = (e, assignmentId) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await assignmentsAPI.submit(assignmentId, { fileData: ev.target.result, fileName: file.name, fileType: file.type });
        showToast('Si guul leh ayaad u soo gudbisay!', 'success');
        load();
      } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>Waa la soo qaadayaa...</div>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ color:'var(--navy)' }}>📋 Assignments</h1>
        {user.role !== 'student' && <button onClick={() => setShowCreate(true)} className="btn-primary">+ Assignment Cusub</button>}
      </div>

      {assignments.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📋</div>
          <p>Assignment ma jiraan</p>
        </div>
      ) : (
        <div style={{ display:'grid', gap:'1rem' }}>
          {assignments.map(a => {
            const isPast = new Date() > new Date(a.dueDate);
            return (
              <div key={a._id} style={{ background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'0.5rem' }}>
                  <div>
                    <div style={{ fontWeight:700, color:'var(--navy)' }}>{a.title}</div>
                    <div style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>{a.course?.title} ({a.course?.code})</div>
                    {a.description && <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginTop:'0.4rem' }}>{a.description}</p>}
                  </div>
                  <span style={{ padding:'3px 12px', borderRadius:20, fontSize:'0.78rem', fontWeight:600, background: isPast?'#fdecea':'#e8f5ee', color: isPast?'var(--red)':'var(--green)', whiteSpace:'nowrap' }}>
                    {isPast ? '⏰ Past Due' : `Due: ${new Date(a.dueDate).toLocaleDateString()}`}
                  </span>
                </div>
                <div style={{ marginTop:'0.85rem', display:'flex', gap:'0.6rem' }}>
                  {user.role === 'student' ? (
                    <label className="btn-primary" style={{ padding:'0.5rem 1rem', fontSize:'0.85rem', cursor:'pointer' }}>
                      📎 Soo Gudbi Jawaab
                      <input type="file" onChange={e => handleFileUpload(e, a._id)} style={{ display:'none' }} />
                    </label>
                  ) : (
                    <button onClick={() => setViewSubs(a)} className="btn-primary" style={{ padding:'0.5rem 1rem', fontSize:'0.85rem' }}>👀 View Submissions</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreateAssignmentModal courses={courses} onClose={() => setShowCreate(false)} onSave={handleCreate} />}
      {viewSubs && <SubmissionsModal assignment={viewSubs} onClose={() => setViewSubs(null)} />}
    </div>
  );
};

export default Assignments;
