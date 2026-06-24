import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { settingsAPI, departmentsAPI, usersAPI, bulkImportAPI } from '../services/api';

const ToggleSwitch = ({ checked, onChange, label, desc }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem', background:'var(--bg)', borderRadius:10 }}>
    <div>
      <div style={{ fontWeight:600, color:'var(--navy)' }}>{label}</div>
      {desc && <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{desc}</div>}
    </div>
    <button onClick={onChange} style={{
      width: 50, height: 28, borderRadius: 20, border: 'none', cursor: 'pointer',
      background: checked ? 'var(--navy)' : '#ccc', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{ position:'absolute', top:3, left: checked ? 25 : 3, width:22, height:22, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
    </button>
  </div>
);

const DepartmentManager = () => {
  const { showToast } = useToast();
  const [depts, setDepts] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name:'', code:'', description:'', head:'' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [d, t] = await Promise.all([departmentsAPI.getAll(), usersAPI.getTeachers()]);
    setDepts(d.data.departments); setTeachers(t.data.teachers); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await departmentsAPI.create(form); showToast('Department la abuuray!', 'success'); setForm({name:'',code:'',description:'',head:''}); load(); }
    catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async (id) => {
    try { await departmentsAPI.remove(id); showToast('Department la tirtiray', 'success'); load(); }
    catch { showToast('Khalad ayaa dhacay', 'error'); }
  };

  if (loading) return <div style={{color:'var(--text-muted)'}}>Waa la soo qaadayaa...</div>;

  return (
    <div>
      <form onSubmit={handleAdd} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.5rem' }}>
        <input placeholder="Department Name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required
          style={{ padding:'0.6rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
        <input placeholder="Code (e.g. CS)" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))}
          style={{ padding:'0.6rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
        <select value={form.head} onChange={e=>setForm(p=>({...p,head:e.target.value}))}
          style={{ padding:'0.6rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }}>
          <option value="">Department Head (optional)</option>
          {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <button type="submit" className="btn-primary">+ Ku Dar</button>
      </form>
      <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
        {depts.map(d => (
          <div key={d._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.85rem 1rem', background:'var(--bg)', borderRadius:8 }}>
            <div>
              <span style={{ fontWeight:600 }}>{d.name}</span> {d.code && <span style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>({d.code})</span>}
              {d.head && <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginLeft:'0.5rem' }}>· Head: {d.head.name}</span>}
            </div>
            <button onClick={() => handleDelete(d._id)} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer' }}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const BulkImport = () => {
  const { showToast } = useToast();
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    const lines = csvText.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return showToast('CSV waa inuu header + saf yeelaa', 'error');
    const headers = lines[0].split(',').map(h => h.trim());
    const users = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => obj[h] = vals[i]);
      return obj;
    });
    setLoading(true);
    try {
      const res = await bulkImportAPI.importUsers(users);
      setResult(res.data.results);
      showToast(res.data.message, 'success');
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
    setLoading(false);
  };

  return (
    <div>
      <p style={{ fontSize:'0.88rem', color:'var(--text-muted)', marginBottom:'1rem' }}>
        CSV qor sida tusaalahan (header row waa lagama maarmaan):<br/>
        <code style={{ background:'var(--bg)', padding:'2px 6px', borderRadius:4 }}>name,email,password,role,department,phone,studentId</code>
      </p>
      <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={8}
        placeholder="name,email,password,role,department,phone,studentId
Ahmed Ali,ahmed@camaaro.edu,Pass@123,student,Computer Science,+252611234567,STU001"
        style={{ width:'100%', padding:'0.85rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'monospace', fontSize:'0.85rem', marginBottom:'1rem' }} />
      <button onClick={handleImport} disabled={loading || !csvText.trim()} className="btn-primary">
        {loading ? 'Waa la soo dejinayaa...' : '📤 Bulk Import'}
      </button>
      {result && (
        <div style={{ marginTop:'1.25rem', background:'var(--bg)', borderRadius:10, padding:'1rem' }}>
          <div style={{ display:'flex', gap:'1.5rem', marginBottom: result.errors.length ? '0.75rem' : 0 }}>
            <div><span style={{ color:'var(--green)', fontWeight:700 }}>{result.created}</span> la abuuray</div>
            <div><span style={{ color:'var(--red)', fontWeight:700 }}>{result.skipped}</span> la boodey</div>
          </div>
          {result.errors.length > 0 && (
            <ul style={{ fontSize:'0.8rem', color:'var(--text-muted)', paddingLeft:'1.2rem' }}>
              {result.errors.map((e,i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [sysSettings, setSysSettings] = useState(null);
  const [emailNotifs, setEmailNotifs] = useState(true);

  useEffect(() => {
    if (user.role === 'admin') settingsAPI.get().then(res => setSysSettings(res.data.settings));
  }, [user.role]);

  const handleSaveSystem = async (e) => {
    e.preventDefault();
    try { await settingsAPI.update(sysSettings); showToast('System settings la cusboonaysiiyay!', 'success'); }
    catch { showToast('Khalad ayaa dhacay', 'error'); }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ color:'var(--navy)', marginBottom:'1.5rem' }}>⚙️ Settings</h1>

      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', borderBottom:'2px solid var(--border)', flexWrap:'wrap' }}>
        {[['general','General'], ...(user.role==='admin' ? [['system','System'],['departments','Departments'],['bulk','Bulk Import']] : [])].map(([t,l]) => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding:'0.6rem 1.1rem', border:'none', borderBottom:`3px solid ${activeTab===t?'var(--navy)':'transparent'}`, background:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:activeTab===t?700:400, color:activeTab===t?'var(--navy)':'var(--text-muted)', marginBottom:'-2px' }}>
            {l}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <ToggleSwitch checked={theme === 'dark'} onChange={toggleTheme} label="🌙 Dark Mode" desc="UI-ga mugdiga ah, indhaha ka badbaadiya habeenkii" />
          <ToggleSwitch checked={emailNotifs} onChange={() => setEmailNotifs(p=>!p)} label="📧 Email Notifications" desc="Imtixaan, natiijo, iyo ogeysiisyo kale email ahaan" />
        </div>
      )}

      {activeTab === 'system' && sysSettings && (
        <form onSubmit={handleSaveSystem} style={{ background:'#fff', borderRadius:12, padding:'1.5rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:'1rem' }}>
          {[['universityName','University Name'],['tagline','Tagline'],['contactEmail','Contact Email'],['contactPhone','Contact Phone'],['address','Address']].map(([k,l]) => (
            <div key={k}>
              <label style={{ display:'block', fontWeight:500, marginBottom:'0.3rem', fontSize:'0.88rem' }}>{l}</label>
              <input value={sysSettings[k] || ''} onChange={e => setSysSettings(p=>({...p,[k]:e.target.value}))}
                style={{ width:'100%', padding:'0.65rem 0.9rem', border:'1.5px solid var(--border)', borderRadius:8, fontFamily:'inherit' }} />
            </div>
          ))}
          <ToggleSwitch checked={sysSettings.maintenanceMode} onChange={() => setSysSettings(p=>({...p,maintenanceMode:!p.maintenanceMode}))}
            label="🚧 Maintenance Mode" desc="Marka la shido, users-ka cusub login ma sameyn karaan" />
          <button type="submit" className="btn-primary" style={{ alignSelf:'flex-start' }}>💾 Kaydi System Settings</button>
        </form>
      )}

      {activeTab === 'departments' && (
        <div style={{ background:'#fff', borderRadius:12, padding:'1.5rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
          <DepartmentManager />
        </div>
      )}

      {activeTab === 'bulk' && (
        <div style={{ background:'#fff', borderRadius:12, padding:'1.5rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
          <BulkImport />
        </div>
      )}
    </div>
  );
};

export default Settings;
