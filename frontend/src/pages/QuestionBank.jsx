import { useState, useEffect } from 'react';
import { qbAPI, aiAPI, coursesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const AIGeneratorModal = ({ onClose, onGenerated }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState({ subject:'', topic:'', numQuestions:5, type:'mcq', difficulty:'medium' });
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await aiAPI.generateExam(form);
      setGenerated(res.data.questions);
    } catch { showToast('AI generation ku guuldareystay', 'error'); }
    setLoading(false);
  };

  const handleSaveAll = async () => {
    try {
      await qbAPI.bulk({ questions: generated.map(q => ({ ...q, subject: form.subject })) });
      showToast(`${generated.length} su'aalood la kaydiyay!`, 'success');
      onGenerated();
      onClose();
    } catch { showToast('Khalad ayaa dhacay', 'error'); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'2rem', width:'100%', maxWidth:600, maxHeight:'88vh', overflow:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h3 style={{ color:'var(--navy)' }}>🤖 AI Exam Question Generator</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.4rem', cursor:'pointer' }}>✕</button>
        </div>

        {!generated ? (
          <form onSubmit={handleGenerate} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={{display:'block',fontSize:'0.88rem',fontWeight:500,marginBottom:'0.3rem'}}>Subject</label>
              <input value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} placeholder="e.g. Mathematics" required
                style={{ width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'0.88rem',fontWeight:500,marginBottom:'0.3rem'}}>Topic</label>
              <input value={form.topic} onChange={e=>setForm(p=>({...p,topic:e.target.value}))} placeholder="e.g. Quadratic Equations" required
                style={{ width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
              <div>
                <label style={{display:'block',fontSize:'0.85rem',fontWeight:500,marginBottom:'0.3rem'}}># Questions</label>
                <input type="number" min={1} max={20} value={form.numQuestions} onChange={e=>setForm(p=>({...p,numQuestions:Number(e.target.value)}))}
                  style={{ width:'100%', padding:'0.6rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
              </div>
              <div>
                <label style={{display:'block',fontSize:'0.85rem',fontWeight:500,marginBottom:'0.3rem'}}>Type</label>
                <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}
                  style={{ width:'100%', padding:'0.6rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }}>
                  <option value="mcq">MCQ</option>
                  <option value="true_false">True/False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:'0.85rem',fontWeight:500,marginBottom:'0.3rem'}}>Difficulty</label>
                <select value={form.difficulty} onChange={e=>setForm(p=>({...p,difficulty:e.target.value}))}
                  style={{ width:'100%', padding:'0.6rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop:'0.5rem' }}>
              {loading ? '🤖 AI ayaa abuuraysa su\'aalo...' : '✨ Generate Questions'}
            </button>
          </form>
        ) : (
          <div>
            <p style={{ fontSize:'0.88rem', color:'var(--text-muted)', marginBottom:'1rem' }}>{generated.length} su'aalood la abuuray. Eeg kahor inta aad kaydinayo:</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', maxHeight:300, overflow:'auto', marginBottom:'1.25rem' }}>
              {generated.map((q, i) => (
                <div key={i} style={{ border:'1px solid var(--border)', borderRadius:8, padding:'0.75rem' }}>
                  <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{i+1}. {q.text}</div>
                  {q.options && <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.3rem' }}>{q.options.join(' · ')}</div>}
                  <div style={{ fontSize:'0.78rem', color:'var(--green)', marginTop:'0.3rem' }}>✓ {q.answer}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={() => setGenerated(null)} style={{ flex:1, padding:'0.7rem', background:'var(--bg)', border:'1.5px solid var(--border)', borderRadius:8, cursor:'pointer', fontFamily:'inherit' }}>← Dib u samee</button>
              <button onClick={handleSaveAll} className="btn-primary" style={{ flex:1 }}>💾 Dhammaan Kaydi</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const QuestionBank = () => {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [showAI, setShowAI] = useState(false);
  const [filter, setFilter] = useState({ type: '', subject: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await qbAPI.getAll(filter);
    setQuestions(res.data.questions);
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const handleDelete = async (id) => {
    try { await qbAPI.remove(id); showToast('Su\'aasha la tirtiray', 'success'); load(); }
    catch { showToast('Khalad ayaa dhacay', 'error'); }
  };

  const typeColors = { mcq:'#2980b9', true_false:'#9b59b6', short_answer:'#16a085' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
        <h1 style={{ color:'var(--navy)' }}>🗂 Question Bank</h1>
        <button onClick={() => setShowAI(true)} className="btn-primary">🤖 AI Generate Questions</button>
      </div>

      <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem' }}>
        <select value={filter.type} onChange={e => setFilter(p=>({...p,type:e.target.value}))}
          style={{ padding:'0.6rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }}>
          <option value="">Dhammaan Noocyada</option>
          <option value="mcq">MCQ</option>
          <option value="true_false">True/False</option>
          <option value="short_answer">Short Answer</option>
        </select>
        <input placeholder="Subject ka raadi..." value={filter.subject} onChange={e => setFilter(p=>({...p,subject:e.target.value}))}
          style={{ padding:'0.6rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit', flex:1, maxWidth:280 }} />
      </div>

      {loading ? <div style={{color:'var(--text-muted)'}}>Waa la soo qaadayaa...</div> : questions.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🗂</div>
          <p>Su'aalo lama kaydiyay weli</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {questions.map(q => (
            <div key={q._id} style={{ background:'#fff', borderRadius:10, padding:'1rem 1.25rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.4rem' }}>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background: typeColors[q.type]+'20', color: typeColors[q.type] }}>{q.type}</span>
                  {q.subject && <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{q.subject}</span>}
                  <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>· {q.difficulty}</span>
                </div>
                <div style={{ fontWeight:500, fontSize:'0.9rem' }}>{q.text}</div>
                {q.options?.length > 0 && <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.3rem' }}>{q.options.join(' · ')}</div>}
              </div>
              <button onClick={() => handleDelete(q._id)} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:'0.9rem' }}>🗑</button>
            </div>
          ))}
        </div>
      )}

      {showAI && <AIGeneratorModal onClose={() => setShowAI(false)} onGenerated={load} />}
    </div>
  );
};

export default QuestionBank;
