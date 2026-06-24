import { useState, useEffect } from 'react';
import { discussionsAPI, coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Discussions = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [threads, setThreads] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '' });
  const [replyText, setReplyText] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { coursesAPI.getAll().then(res => { setCourses(res.data.courses); if (res.data.courses[0]) setSelectedCourse(res.data.courses[0]._id); }); }, []);

  const loadThreads = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    const res = await discussionsAPI.getThreads(selectedCourse);
    setThreads(res.data.threads);
    setLoading(false);
  };
  useEffect(() => { loadThreads(); }, [selectedCourse]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await discussionsAPI.createThread(selectedCourse, newThread); setNewThread({title:'',content:''}); setShowNew(false); showToast('Thread la abuuray!', 'success'); loadThreads(); }
    catch { showToast('Khalad ayaa dhacay', 'error'); }
  };

  const handleReply = async (threadId) => {
    const content = replyText[threadId];
    if (!content?.trim()) return;
    try { await discussionsAPI.reply(selectedCourse, threadId, { content }); setReplyText(p=>({...p,[threadId]:''})); loadThreads(); }
    catch { showToast('Khalad ayaa dhacay', 'error'); }
  };

  const handlePin = async (threadId) => { await discussionsAPI.pin(selectedCourse, threadId); loadThreads(); };

  const roleColors = { admin:'#c0392b', teacher:'#1a6b3c', student:'#1a3a6b' };

  return (
    <div style={{ maxWidth: 750 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
        <h1 style={{ color:'var(--navy)' }}>💬 Discussion Forum</h1>
        <button onClick={() => setShowNew(p=>!p)} className="btn-primary">+ Thread Cusub</button>
      </div>

      <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
        style={{ padding:'0.65rem 1rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit', marginBottom:'1.25rem', width:'100%', maxWidth:320 }}>
        {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.code})</option>)}
      </select>

      {showNew && (
        <form onSubmit={handleCreate} style={{ background:'#fff', borderRadius:12, padding:'1.25rem', marginBottom:'1.5rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:'0.85rem' }}>
          <input placeholder="Title-ka su'aasha/mowduuca" value={newThread.title} onChange={e=>setNewThread(p=>({...p,title:e.target.value}))} required
            style={{ padding:'0.65rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
          <textarea placeholder="Faahfaahin..." rows={3} value={newThread.content} onChange={e=>setNewThread(p=>({...p,content:e.target.value}))} required
            style={{ padding:'0.65rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
          <button type="submit" className="btn-primary" style={{ alignSelf:'flex-start' }}>Post</button>
        </form>
      )}

      {loading ? <div style={{color:'var(--text-muted)'}}>Waa la soo qaadayaa...</div> : threads.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>💬</div>
          <p>Wali su'aalo lama qorin course-kan</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {threads.map(t => (
            <div key={t._id} style={{ background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'var(--shadow)', border: t.isPinned?'2px solid var(--gold)':'1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontWeight:700, color:'var(--navy)', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                    {t.isPinned && '📌'} {t.title}
                  </div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>
                    by <span style={{ color: roleColors[t.author?.role], fontWeight:600 }}>{t.author?.name}</span> · {new Date(t.createdAt).toLocaleString()}
                  </div>
                </div>
                {['admin','teacher'].includes(user.role) && (
                  <button onClick={() => handlePin(t._id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1rem' }}>{t.isPinned ? '📌' : '📍'}</button>
                )}
              </div>
              <p style={{ fontSize:'0.9rem', color:'var(--text)', marginTop:'0.6rem', lineHeight:1.5 }}>{t.content}</p>

              {t.replies?.length > 0 && (
                <div style={{ marginTop:'0.85rem', paddingLeft:'1rem', borderLeft:'2px solid var(--border)', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                  {t.replies.map((r, i) => (
                    <div key={i}>
                      <div style={{ fontSize:'0.8rem', fontWeight:600, color: roleColors[r.author?.role] }}>{r.author?.name} <span style={{ color:'var(--text-muted)', fontWeight:400 }}>· {new Date(r.createdAt).toLocaleString()}</span></div>
                      <div style={{ fontSize:'0.85rem', color:'var(--text)' }}>{r.content}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.85rem' }}>
                <input placeholder="Jawaab qor..." value={replyText[t._id] || ''} onChange={e => setReplyText(p=>({...p,[t._id]:e.target.value}))}
                  onKeyDown={e => e.key==='Enter' && handleReply(t._id)}
                  style={{ flex:1, padding:'0.5rem 0.8rem', border:'1px solid var(--border)', borderRadius:8, fontSize:'0.85rem', fontFamily:'inherit' }} />
                <button onClick={() => handleReply(t._id)} style={{ padding:'0.5rem 1rem', background:'var(--navy)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.85rem' }}>Send</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Discussions;
