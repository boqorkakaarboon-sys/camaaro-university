import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { usersAPI, coursesAPI, examsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import ExamBuilder from '../components/ExamBuilder';
import ResultDetail from './ResultDetail';

/* ─── Reusable Modal ─────────────────────────────────────────── */
const Modal = ({ title, onClose, children, wide }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" style={wide ? { maxWidth: '700px' } : {}} onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

/* ─── Credential Receipt Modal ───────────────────────────────── */
const CredentialReceipt = ({ cred, onClose }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Camaaro University — Account Credentials\n` +
      `Name: ${cred.name}\nRole: ${cred.role}\nEmail: ${cred.email}\nPassword: ${cred.password}` +
      (cred.studentId ? `\nStudent ID: ${cred.studentId}` : '') +
      (cred.department ? `\nDepartment: ${cred.department}` : '') +
      `\nPortal: ${window.location.origin}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Camaaro University — Account Credentials</title>
      <style>
        body { font-family: Georgia, serif; padding: 60px; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 3px double #1a3a6b; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 40px; }
        h1 { color: #1a3a6b; font-size: 22px; margin: 8px 0 4px; }
        .sub { color: #666; font-size: 13px; }
        .field { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; font-size: 14px; }
        .value { font-weight: bold; font-size: 14px; color: #1a2340; }
        .pwd { font-family: monospace; font-size: 16px; color: #c0392b; background: #fdecea; padding: 4px 10px; border-radius: 4px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
        .warn { background: #fff8e1; border: 1px solid #f0c000; border-radius: 6px; padding: 10px 14px; margin: 20px 0; font-size: 13px; color: #7a5800; }
      </style></head><body>
      <div class="header">
        <div class="logo">🎓</div>
        <h1>CAMAARO UNIVERSITY</h1>
        <div class="sub">Official Account Credentials — Keep Confidential</div>
      </div>
      <div class="field"><span class="label">Full Name</span><span class="value">${cred.name}</span></div>
      <div class="field"><span class="label">Role</span><span class="value" style="text-transform:capitalize">${cred.role}</span></div>
      <div class="field"><span class="label">Email Address</span><span class="value">${cred.email}</span></div>
      ${cred.studentId ? `<div class="field"><span class="label">Student ID</span><span class="value">${cred.studentId}</span></div>` : ''}
      ${cred.department ? `<div class="field"><span class="label">Department</span><span class="value">${cred.department}</span></div>` : ''}
      <div class="field"><span class="label">Password</span><span class="pwd">${cred.password}</span></div>
      <div class="field"><span class="label">Portal URL</span><span class="value">${window.location.origin}</span></div>
      <div class="warn">⚠️ Please change your password after first login. Keep this document secure and do not share.</div>
      <div class="footer">Issued by Camaaro University Administration · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </body></html>
    `);
    w.document.close(); w.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ background: 'var(--green)', borderRadius: '10px 10px 0 0' }}>
          <h3 style={{ color: '#fff' }}>✅ Account Created Successfully</h3>
          <button className="modal-close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ background: '#f0fff4', border: '1px solid var(--green)', borderRadius: 8, padding: '1rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--green)' }}>
            ⚠️ Save these credentials now — the password cannot be retrieved later.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {[
              ['Full Name', cred.name],
              ['Role', cred.role],
              ['Email', cred.email],
              ...(cred.studentId ? [['Student ID', cred.studentId]] : []),
              ...(cred.department ? [['Department', cred.department]] : []),
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <strong style={{ textTransform: label === 'Role' ? 'capitalize' : 'none' }}>{value}</strong>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Password</span>
              <strong style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--red)', background: '#fdecea', padding: '2px 10px', borderRadius: 4 }}>{cred.password}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handlePrint} style={{ flex: 1 }}>🖨 Print Credentials</button>
            <button className="btn-secondary" onClick={handleCopy} style={{ flex: 1 }}>
              {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
            </button>
            <button className="btn-secondary" onClick={onClose} style={{ width: '100%' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   USERS
═══════════════════════════════════════════════════════════════ */
const AdminUsers = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const [createdCred, setCreatedCred] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '', phone: '', studentId: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll(filterRole ? { role: filterRole } : {});
      setUsers(res.data.users);
    } catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filterRole]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.create(form);
      toast.success('User created successfully!');
      setShowModal(false);
      // Save credentials to show receipt
      setCreatedCred({ ...form });
      setForm({ name: '', email: '', password: '', role: 'student', department: '', phone: '', studentId: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create user'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user permanently?')) return;
    try { await usersAPI.remove(id); toast.success('User deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleToggle = async (u) => {
    try { await usersAPI.update(u._id, { isActive: !u.isActive }); load(); }
    catch { toast.error('Failed to update user'); }
  };

  const roleColor = { admin: '#c0392b', teacher: '#1a6b3c', student: '#1a3a6b' };

  return (
    <div>
      <div className="panel-header">
        <h2>User Management</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="filter-select">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add User</button>
        </div>
      </div>

      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: (roleColor[u.role] || '#888') + '22', color: roleColor[u.role] || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <strong>{u.name}</strong>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className="badge" style={{ background: (roleColor[u.role] || '#888') + '20', color: roleColor[u.role] || '#888' }}>{u.role}</span></td>
                  <td>{u.department || '—'}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td><small className="text-muted">{new Date(u.createdAt).toLocaleDateString()}</small></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-sm btn-secondary" onClick={() => handleToggle(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(u._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="empty-state">No users found.</p>}
        </div>
      )}

      {createdCred && <CredentialReceipt cred={createdCred} onClose={() => setCreatedCred(null)} />}

      {showModal && (
        <Modal title="➕ Add New User" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group"><label>Full Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></div>
            <div className="form-group"><label>Email Address *</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@camaaro.edu" /></div>
            <div className="form-group">
              <label>Password *</label>
              <input required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters (will be shown in receipt)" minLength={6} />
              <small className="form-hint">💡 You will receive a printable credential sheet after creation.</small>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Role *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group"><label>Department</label><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Computer Science" /></div>
            </div>
            {form.role === 'student' && (
              <div className="form-group">
                <label>Student ID *</label>
                <input required={form.role === 'student'} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="e.g. STU-2024-001" />
                <small className="form-hint">Official student identification number</small>
              </div>
            )}
            <div className="form-group"><label>Phone (optional)</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" /></div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Create User & View Credentials</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   COURSES
═══════════════════════════════════════════════════════════════ */
const AdminCourses = () => {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEnroll, setShowEnroll] = useState(null);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [form, setForm] = useState({ title: '', code: '', description: '', credits: 3, department: '', teacher: '', maxStudents: 50, schedule: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [cR, tR, sR] = await Promise.all([coursesAPI.getAllAdmin(), usersAPI.getTeachers(), usersAPI.getStudents()]);
      setCourses(cR.data.courses); setTeachers(tR.data.teachers); setStudents(sR.data.students);
    } catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await coursesAPI.create({ ...form, teacher: form.teacher || undefined });
      toast.success('Course created!');
      setShowModal(false);
      setForm({ title: '', code: '', description: '', credits: 3, department: '', teacher: '', maxStudents: 50, schedule: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create course'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return;
    try { await coursesAPI.remove(id); toast.success('Course deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleEnroll = async () => {
    if (!enrollStudentId) return;
    try {
      await coursesAPI.enrollStudent(showEnroll, enrollStudentId);
      toast.success('Student enrolled!');
      setShowEnroll(null); setEnrollStudentId(''); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Enrollment failed'); }
  };

  return (
    <div>
      <div className="panel-header">
        <h2>Course Management</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Course</button>
      </div>

      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Title</th><th>Code</th><th>Credits</th><th>Department</th><th>Teacher</th><th>Students</th><th>Actions</th></tr></thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.title}</strong>{c.description && <><br /><small className="text-muted">{c.description.slice(0, 60)}{c.description.length > 60 ? '…' : ''}</small></>}</td>
                  <td><span className="badge badge-blue">{c.code}</span></td>
                  <td>{c.credits}</td>
                  <td>{c.department || '—'}</td>
                  <td>{c.teacher?.name || <span className="text-muted">Unassigned</span>}</td>
                  <td>{c.students?.length || 0} / {c.maxStudents}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-sm btn-secondary" onClick={() => { setShowEnroll(c._id); }}>Enroll</button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(c._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length === 0 && <p className="empty-state">No courses yet. Create one!</p>}
        </div>
      )}

      {showModal && (
        <Modal title="Create New Course" onClose={() => setShowModal(false)} wide>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}><label>Course Title *</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Introduction to Computer Science" /></div>
              <div className="form-group"><label>Code *</label><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. CS101" /></div>
            </div>
            <div className="form-group"><label>Description</label><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Course description..." /></div>
            <div className="form-row">
              <div className="form-group"><label>Credits</label><input type="number" min={1} max={6} value={form.credits} onChange={(e) => setForm({ ...form, credits: +e.target.value })} /></div>
              <div className="form-group"><label>Max Students</label><input type="number" min={1} value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: +e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Department</label><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Department" /></div>
              <div className="form-group"><label>Assign Teacher</label>
                <select value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}>
                  <option value="">— Select Teacher —</option>
                  {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label>Schedule</label><input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="e.g. Mon/Wed 10:00–11:30" /></div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Create Course</button>
            </div>
          </form>
        </Modal>
      )}

      {showEnroll && (
        <Modal title="Enroll Student in Course" onClose={() => setShowEnroll(null)}>
          <div className="form-group">
            <label>Select Student</label>
            <select value={enrollStudentId} onChange={(e) => setEnrollStudentId(e.target.value)}>
              <option value="">— Select Student —</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowEnroll(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleEnroll}>Enroll Student</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   EXAMS — uses full ExamBuilder with question editor
═══════════════════════════════════════════════════════════════ */
const AdminExams = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [editExam, setEditExam] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [eR, cR] = await Promise.all([examsAPI.getAllAdmin(), coursesAPI.getAllAdmin()]);
      setExams(eR.data.exams); setCourses(cR.data.courses);
    } catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handlePublish = async (exam) => {
    try {
      await examsAPI.update(exam._id, { isPublished: !exam.isPublished });
      toast.success(exam.isPublished ? 'Exam unpublished' : 'Exam published!');
      load();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this exam and all its results?')) return;
    try { await examsAPI.remove(id); toast.success('Exam deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  if (view === 'builder' || view === 'edit') {
    return (
      <ExamBuilder
        exam={view === 'edit' ? editExam : null}
        courses={courses}
        onSaved={() => { setView('list'); load(); }}
        onCancel={() => setView('list')}
      />
    );
  }

  return (
    <div>
      <div className="panel-header">
        <h2>Exam Management</h2>
        <button className="btn-primary" onClick={() => setView('builder')}>+ Create Exam</button>
      </div>

      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="exam-cards">
          {exams.length === 0 && <p className="empty-state">No exams yet. Use the question builder to create one!</p>}
          {exams.map((e) => (
            <div key={e._id} className="exam-list-card">
              <div className="elc-left">
                <span className={`badge badge-${e.type === 'final' ? 'red' : e.type === 'quiz' ? 'green' : 'blue'}`}>{e.type}</span>
                <div>
                  <h3 className="elc-title">{e.title}</h3>
                  <p className="elc-meta">{e.course?.code} · {e.questions?.length || 0} questions · {e.totalMarks} pts · {e.duration} min</p>
                  <p className="elc-time">🕐 {new Date(e.startTime).toLocaleString()} → {new Date(e.endTime).toLocaleString()}</p>
                  {e.description && <p className="elc-desc">{e.description}</p>}
                </div>
              </div>
              <div className="elc-right">
                <span className={`badge ${e.isPublished ? 'badge-green' : 'badge-red'}`}>{e.isPublished ? 'Published' : 'Draft'}</span>
                <button className="btn-sm btn-secondary" onClick={() => { setEditExam(e); setView('edit'); }}>Edit</button>
                <button className="btn-sm btn-secondary" onClick={() => handlePublish(e)}>{e.isPublished ? 'Unpublish' : 'Publish'}</button>
                <button className="btn-sm btn-secondary" onClick={() => navigate(`/admin/exams/${e._id}/results`)}>Results</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(e._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   RESULTS
═══════════════════════════════════════════════════════════════ */
const AdminResults = () => {
  const toast = useToast();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({});
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentId: '', marksObtained: '', remarks: '' });

  useEffect(() => {
    Promise.all([examsAPI.getAllAdmin(), usersAPI.getStudents()])
      .then(([eR, sR]) => { setExams(eR.data.exams); setStudents(sR.data.students); });
  }, []);

  const loadResults = async (examId) => {
    setSelectedExam(examId);
    if (!examId) { setResults([]); setStats({}); return; }
    try { const res = await examsAPI.getResults(examId); setResults(res.data.results); setStats(res.data.stats || {}); }
    catch { }
  };

  const handleAddResult = async (e) => {
    e.preventDefault();
    try {
      await examsAPI.addResult(selectedExam, form);
      toast.success('Result recorded!');
      setShowModal(false); setForm({ studentId: '', marksObtained: '', remarks: '' });
      loadResults(selectedExam);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to record result'); }
  };

  const gradeColor = { 'A+': '#1a6b3c', A: '#1a6b3c', 'B+': '#1a3a6b', B: '#1a3a6b', 'C+': '#6b6b1a', C: '#6b6b1a', D: '#6b3a1a', F: '#c0392b', Pending: '#888' };

  return (
    <div>
      <div className="panel-header">
        <h2>Results & Grading</h2>
        {selectedExam && <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Result</button>}
      </div>

      <div className="form-group" style={{ maxWidth: '440px', marginBottom: '1.5rem' }}>
        <label>Select Exam to View Results</label>
        <select value={selectedExam} onChange={(e) => loadResults(e.target.value)}>
          <option value="">— Choose an exam —</option>
          {exams.map((e) => <option key={e._id} value={e._id}>{e.title} — {e.course?.code}</option>)}
        </select>
      </div>

      {selectedExam && results.length > 0 && (
        <div className="rdp-stats" style={{ marginBottom: '1.25rem' }}>
          <div className="rdp-stat"><span>{stats.total || 0}</span><small>Attempts</small></div>
          <div className="rdp-stat"><span>{stats.submitted || 0}</span><small>Submitted</small></div>
          <div className="rdp-stat"><span style={{ color: '#1a6b3c' }}>{stats.passed || 0}</span><small>Passed</small></div>
          <div className="rdp-stat"><span>{stats.avgPercentage || 0}%</span><small>Avg Score</small></div>
        </div>
      )}

      {selectedExam && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Score</th><th>%</th><th>Grade</th><th>GPA</th><th>Status</th><th>Tab Switches</th><th>Time</th></tr></thead>
            <tbody>
              {results.map((r) => (
                <tr key={r._id}>
                  <td><strong>{r.student?.name}</strong><br /><small className="text-muted">{r.student?.email}</small></td>
                  <td>{r.marksObtained}/{r.totalMarks}</td>
                  <td>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar" style={{ width: `${Math.min(r.percentage, 100)}%`, background: gradeColor[r.grade] || '#1a3a6b' }} />
                      <span>{r.percentage}%</span>
                    </div>
                  </td>
                  <td style={{ color: gradeColor[r.grade], fontWeight: 700 }}>{r.grade}</td>
                  <td>{r.gpa?.toFixed(1)}</td>
                  <td><span className={`badge ${r.passed ? 'badge-green' : 'badge-red'}`}>{r.status}</span></td>
                  <td>{r.tabSwitchCount > 0 ? <span style={{ color: '#c0392b', fontWeight: 600 }}>{r.tabSwitchCount} ⚠</span> : 0}</td>
                  <td>{r.timeTakenMinutes} min</td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.length === 0 && <p className="empty-state">No submissions yet for this exam.</p>}
        </div>
      )}

      {showModal && (
        <Modal title="Record Manual Result" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAddResult}>
            <div className="form-group"><label>Student</label>
              <select required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                <option value="">— Select Student —</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
              </select>
            </div>
            <div className="form-group"><label>Marks Obtained</label>
              <input required type="number" min={0} value={form.marksObtained} onChange={(e) => setForm({ ...form, marksObtained: +e.target.value })} placeholder="Enter marks" />
            </div>
            <div className="form-group"><label>Remarks (optional)</label>
              <input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Any feedback..." />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Save Result</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ADMIN OVERVIEW
═══════════════════════════════════════════════════════════════ */
const AdminOverview = () => {
  const navigate = useNavigate();
  return (
    <div>
      <h2 style={{ marginBottom: '0.35rem' }}>Admin Control Panel</h2>
      <p className="text-muted" style={{ marginBottom: '1.75rem' }}>Manage your entire university from one place.</p>
      <div className="admin-shortcuts">
        {[
          { label: 'Manage Users', icon: '👥', path: '/admin/users', desc: 'Add, edit, and control all user accounts and roles' },
          { label: 'Manage Courses', icon: '📚', path: '/admin/courses', desc: 'Create courses, assign teachers, and enroll students' },
          { label: 'Manage Exams', icon: '📝', path: '/admin/exams', desc: 'Build exams with MCQ, True/False, and short answer questions' },
          { label: 'View Results', icon: '📊', path: '/admin/results', desc: 'Review submissions, grades, GPA and performance stats' },
        ].map((item) => (
          <div key={item.path} className="shortcut-card" onClick={() => navigate(item.path)}>
            <div className="shortcut-icon">{item.icon}</div>
            <div className="shortcut-info"><h4>{item.label}</h4><p>{item.desc}</p></div>
            <span className="shortcut-arrow">→</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ROOT ADMIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const Admin = () => (
  <div className="page">
    <Routes>
      <Route index element={<AdminOverview />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="courses" element={<AdminCourses />} />
      <Route path="exams" element={<AdminExams />} />
      <Route path="exams/:examId/results" element={<ResultDetail />} />
      <Route path="results" element={<AdminResults />} />
    </Routes>
  </div>
);

export default Admin;
