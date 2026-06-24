import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { coursesAPI, examsAPI, resultsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ExamTaker from '../components/ExamTaker';
import ResultDetail from './ResultDetail';

/* ─── Student Courses ─────────────────────────────── */
const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    coursesAPI.getAll().then((r) => { setCourses(r.data.courses); setLoading(false); });
  }, []);
  return (
    <div>
      <div className="panel-header"><h2>My Enrolled Courses</h2></div>
      {loading ? <div className="page-loading">Loading...</div> : (
        <>
          {courses.length === 0 && <p className="empty-state">Not enrolled in any courses yet. Contact your admin.</p>}
          <div className="courses-grid">
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
                  <span>👨‍🏫 {c.teacher?.name || 'TBD'}</span>
                  <span>🕐 {c.schedule || 'TBD'}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Student Exams ───────────────────────────────── */
const StudentExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [myResults, setMyResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([examsAPI.getAll(), resultsAPI.getMyResults()]).then(([eR, rR]) => {
      setExams(eR.data.exams);
      const map = {};
      rR.data.results.forEach((r) => { map[r.exam?._id] = r; });
      setMyResults(map);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const canTake = (e) => {
    const start = new Date(e.startTime);
    const end = new Date(e.endTime);
    return now >= start && now <= end;
  };
  const isUpcoming = (e) => new Date(e.startTime) > now;
  const isPast = (e) => new Date(e.endTime) < now;

  return (
    <div>
      <div className="panel-header"><h2>My Exams</h2></div>
      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="exam-cards">
          {exams.length === 0 && <p className="empty-state">No exams available yet.</p>}
          {exams.map((e) => {
            const result = myResults[e._id];
            const submitted = result && ['submitted', 'graded'].includes(result.status);
            const active = canTake(e) && !submitted;
            return (
              <div key={e._id} className={`exam-list-card ${active ? 'active-exam' : ''}`}>
                <div className="elc-left">
                  <span className={`badge badge-${e.type === 'final' ? 'red' : e.type === 'quiz' ? 'green' : 'blue'}`}>{e.type}</span>
                  <div>
                    <h3 className="elc-title">{e.title}</h3>
                    <p className="elc-meta">{e.course?.code} · {e.questions?.length || 0} Qs · {e.totalMarks} pts · {e.duration} min</p>
                    <p className="elc-time">
                      🕐 {new Date(e.startTime).toLocaleString()} — {new Date(e.endTime).toLocaleString()}
                    </p>
                    {e.description && <p className="elc-desc">{e.description}</p>}
                  </div>
                </div>
                <div className="elc-right">
                  {submitted && (
                    <>
                      <span className="badge badge-green">Submitted</span>
                      {result.grade && result.grade !== 'Pending' && (
                        <span className="grade-chip">{result.grade} · {result.percentage}%</span>
                      )}
                      <button className="btn-sm btn-secondary" onClick={() => navigate(`/student/exams/${e._id}/result`)}>
                        View Result
                      </button>
                    </>
                  )}
                  {!submitted && isUpcoming(e) && (
                    <span className="badge badge-blue">Upcoming · {new Date(e.startTime).toLocaleDateString()}</span>
                  )}
                  {!submitted && isPast(e) && <span className="badge badge-red">Missed</span>}
                  {active && (
                    <button className="btn-primary" onClick={() => navigate(`/student/exams/${e._id}/take`)}>
                      Start Exam →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Exam Taking Wrapper ─────────────────────────── */
const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  return (
    <ExamTaker
      examId={examId}
      onFinish={() => navigate('/student/exams')}
    />
  );
};

/* ─── Student Results ─────────────────────────────── */
const StudentResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [avgGpa, setAvgGpa] = useState('0.00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resultsAPI.getMyResults().then((r) => {
      setResults(r.data.results);
      setAvgGpa(r.data.avgGpa);
      setLoading(false);
    });
  }, []);

  const gradeColor = { 'A+': '#1a6b3c', A: '#1a6b3c', 'B+': '#1a3a6b', B: '#1a3a6b', 'C+': '#6b6b1a', C: '#6b6b1a', D: '#6b3a1a', F: '#c0392b', Pending: '#888' };

  return (
    <div>
      <div className="panel-header"><h2>My Results</h2></div>
      {!loading && results.length > 0 && (
        <div className="result-summary">
          <div className="result-summary-item"><span className="result-summary-value">{results.length}</span><span className="result-summary-label">Exams Taken</span></div>
          <div className="result-summary-item"><span className="result-summary-value">{avgGpa}</span><span className="result-summary-label">Avg GPA</span></div>
          <div className="result-summary-item">
            <span className="result-summary-value" style={{ color: '#1a6b3c' }}>{results.filter((r) => r.passed).length}</span>
            <span className="result-summary-label">Passed</span>
          </div>
          <div className="result-summary-item">
            <span className="result-summary-value" style={{ color: '#c0392b' }}>{results.filter((r) => !r.passed && r.status === 'graded').length}</span>
            <span className="result-summary-label">Failed</span>
          </div>
        </div>
      )}
      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Exam</th><th>Course</th><th>Score</th><th>%</th><th>Grade</th><th>GPA</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {results.map((r) => (
                <tr key={r._id}>
                  <td><strong>{r.exam?.title}</strong><br /><small className="text-muted">{r.exam?.type}</small></td>
                  <td>{r.course?.code}</td>
                  <td>{r.marksObtained}/{r.totalMarks}</td>
                  <td>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar" style={{ width: `${Math.min(r.percentage, 100)}%`, background: gradeColor[r.grade] || '#1a3a6b' }} />
                      <span>{r.percentage}%</span>
                    </div>
                  </td>
                  <td style={{ color: gradeColor[r.grade], fontWeight: 700 }}>{r.grade}</td>
                  <td>{r.gpa?.toFixed(1)}</td>
                  <td><span className={`badge ${r.passed ? 'badge-green' : 'badge-red'}`}>{r.passed ? 'PASS' : 'FAIL'}</span></td>
                  <td><button className="btn-sm btn-secondary" onClick={() => navigate(`/student/exams/${r.exam?._id}/result`)}>Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.length === 0 && <p className="empty-state">No results yet.</p>}
        </div>
      )}
    </div>
  );
};

/* ─── Student Overview ────────────────────────────── */
const StudentOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem' }}>Student Portal</h2>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Welcome, {user.name}.</p>
      <div className="admin-shortcuts">
        {[
          { label: 'My Courses', icon: '📚', path: '/student/courses', desc: 'View enrolled courses' },
          { label: 'Exams', icon: '📝', path: '/student/exams', desc: 'Take exams and view status' },
          { label: 'My Results', icon: '📊', path: '/student/results', desc: 'Grades, GPA, and answer review' },
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

const Student = () => (
  <div className="page">
    <Routes>
      <Route index element={<StudentOverview />} />
      <Route path="courses" element={<StudentCourses />} />
      <Route path="exams" element={<StudentExams />} />
      <Route path="exams/:examId/take" element={<TakeExam />} />
      <Route path="exams/:examId/result" element={<ResultDetail />} />
      <Route path="results" element={<StudentResults />} />
    </Routes>
  </div>
);

export default Student;
