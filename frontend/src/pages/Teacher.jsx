import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { coursesAPI, examsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ExamBuilder from '../components/ExamBuilder';
import ResultDetail from './ResultDetail';

/* ─── Teacher Courses ─────────────────────────────── */
const TeacherCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    coursesAPI.getAll().then((r) => { setCourses(r.data.courses); setLoading(false); });
  }, []);
  return (
    <div>
      <div className="panel-header"><h2>My Courses</h2></div>
      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="courses-grid">
          {courses.length === 0 && <p className="empty-state">No courses assigned yet.</p>}
          {courses.map((c) => (
            <div key={c._id} className="course-card">
              <div className="course-card-header">
                <span className="badge badge-blue">{c.code}</span>
                <span className="course-credits">{c.credits} cr.</span>
              </div>
              <h3 className="course-card-title">{c.title}</h3>
              <p className="course-card-dept">{c.department}</p>
              <p className="course-card-desc">{c.description || 'No description.'}</p>
              <div className="course-card-footer">
                <span>👥 {c.students?.length || 0} students</span>
                <span>🕐 {c.schedule || 'TBD'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Teacher Exams ───────────────────────────────── */
const TeacherExams = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'builder' | 'edit'
  const [editExam, setEditExam] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [eR, cR] = await Promise.all([examsAPI.getAll(), coursesAPI.getAll()]);
      setExams(eR.data.exams);
      setCourses(cR.data.courses);
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
    if (!confirm('Delete this exam and all results?')) return;
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
        <h2>My Exams</h2>
        <button className="btn-primary" onClick={() => setView('builder')}>+ Create Exam</button>
      </div>
      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="exam-cards">
          {exams.length === 0 && <p className="empty-state">No exams created yet.</p>}
          {exams.map((e) => (
            <div key={e._id} className="exam-list-card">
              <div className="elc-left">
                <span className={`badge badge-${e.type === 'final' ? 'red' : e.type === 'quiz' ? 'green' : 'blue'}`}>{e.type}</span>
                <div>
                  <h3 className="elc-title">{e.title}</h3>
                  <p className="elc-meta">{e.course?.code} · {e.questions?.length || 0} questions · {e.totalMarks} pts · {e.duration} min</p>
                  <p className="elc-time">🕐 {new Date(e.startTime).toLocaleString()} → {new Date(e.endTime).toLocaleString()}</p>
                </div>
              </div>
              <div className="elc-right">
                <span className={`badge ${e.isPublished ? 'badge-green' : 'badge-red'}`}>{e.isPublished ? 'Published' : 'Draft'}</span>
                <button className="btn-sm btn-secondary" onClick={() => { setEditExam(e); setView('edit'); }}>Edit</button>
                <button className="btn-sm btn-secondary" onClick={() => handlePublish(e)}>{e.isPublished ? 'Unpublish' : 'Publish'}</button>
                <button className="btn-sm btn-secondary" onClick={() => navigate(`/teacher/exams/${e._id}/results`)}>Results</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(e._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Teacher Overview ────────────────────────────── */
const TeacherOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem' }}>Teacher Portal</h2>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Welcome, {user.name}.</p>
      <div className="admin-shortcuts">
        {[
          { label: 'My Courses', icon: '📚', path: '/teacher/courses', desc: 'View your assigned courses' },
          { label: 'My Exams', icon: '📝', path: '/teacher/exams', desc: 'Create and manage exams with question builder' },
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

const Teacher = () => (
  <div className="page">
    <Routes>
      <Route index element={<TeacherOverview />} />
      <Route path="courses" element={<TeacherCourses />} />
      <Route path="exams" element={<TeacherExams />} />
      <Route path="exams/:examId/results" element={<ResultDetail />} />
    </Routes>
  </div>
);

export default Teacher;
