import { useState, useEffect } from 'react';
import { coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const fileIcon = (type) => {
  if (type?.includes('pdf')) return '📕';
  if (type?.includes('presentation') || type?.includes('powerpoint')) return '📊';
  if (type?.includes('word') || type?.includes('document')) return '📄';
  if (type?.includes('image')) return '🖼';
  return '📎';
};

const CourseMaterials = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  useEffect(() => {
    coursesAPI.getAll().then(res => { setCourses(res.data.courses); if (res.data.courses[0]) setCourseId(res.data.courses[0]._id); });
  }, []);

  const loadMaterials = async () => {
    if (!courseId) return;
    setLoading(true);
    const res = await coursesAPI.getMaterials(courseId);
    setMaterials(res.data.materials.sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
    setLoading(false);
  };
  useEffect(() => { loadMaterials(); }, [courseId]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!title.trim()) return showToast('Marka hore title geli', 'error');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await coursesAPI.uploadMaterial(courseId, { title, fileData: ev.target.result, fileName: file.name, fileType: file.type });
        showToast('Material la soo geliyay!', 'success');
        setTitle('');
        loadMaterials();
      } catch { showToast('Khalad ayaa dhacay', 'error'); }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (materialId) => {
    try { await coursesAPI.deleteMaterial(courseId, materialId); showToast('La tirtiray', 'success'); loadMaterials(); }
    catch { showToast('Khalad ayaa dhacay', 'error'); }
  };

  return (
    <div style={{ maxWidth: 750 }}>
      <h1 style={{ color:'var(--navy)', marginBottom:'1.5rem' }}>📁 Course Materials</h1>

      <select value={courseId} onChange={e => setCourseId(e.target.value)}
        style={{ padding:'0.65rem 1rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit', marginBottom:'1.5rem', width:'100%', maxWidth:320 }}>
        {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.code})</option>)}
      </select>

      {['admin','teacher'].includes(user.role) && (
        <div style={{ background:'#fff', borderRadius:12, padding:'1.25rem', marginBottom:'1.5rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
          <h4 style={{ color:'var(--navy)', marginBottom:'0.85rem' }}>⬆️ Material Cusub Soo Geli</h4>
          <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap' }}>
            <input placeholder="Title-ka material-ka" value={title} onChange={e => setTitle(e.target.value)}
              style={{ flex:1, minWidth:200, padding:'0.6rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
            <label className="btn-primary" style={{ padding:'0.6rem 1.2rem', cursor:'pointer', fontSize:'0.88rem' }}>
              📎 Dooro File
              <input type="file" onChange={handleUpload} style={{ display:'none' }} />
            </label>
          </div>
        </div>
      )}

      {loading ? <div style={{color:'var(--text-muted)'}}>Waa la soo qaadayaa...</div> : materials.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📁</div>
          <p>Course-kan material lama soo gelinin weli</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
          {materials.map(m => (
            <div key={m._id} style={{ display:'flex', alignItems:'center', gap:'0.85rem', background:'#fff', borderRadius:10, padding:'0.85rem 1.1rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:'1.6rem' }}>{fileIcon(m.fileType)}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{m.title}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{m.fileName} · by {m.uploadedBy?.name} · {new Date(m.uploadedAt).toLocaleDateString()}</div>
              </div>
              <a href={m.fileData} download={m.fileName} className="btn-primary" style={{ padding:'0.4rem 0.9rem', fontSize:'0.8rem' }}>⬇ Download</a>
              {['admin','teacher'].includes(user.role) && (
                <button onClick={() => handleDelete(m._id)} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer' }}>🗑</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseMaterials;
