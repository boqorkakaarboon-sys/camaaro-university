import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { usersAPI, coursesAPI, examsAPI } from '../services/api';

/* ─── ID Check Widget (Admin only) ──────────────────────────── */
const IDCheckWidget = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await usersAPI.getAll({ search: query.trim(), role: 'student' });
      const users = res.data.users;
      if (users.length === 0) {
        setError('No student found with that ID or name.');
      } else {
        setResult(users[0]);
      }
    } catch {
      setError('Search failed. Please try again.');
    }
    setLoading(false);
  };

  const roleColor = { admin: '#c0392b', teacher: '#1a6b3c', student: '#1a3a6b' };

  return (
    <div className="panel" style={{ marginBottom: '2rem' }}>
      <div className="panel-header">
        <h3>🪪 Student ID Check</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Search by Student ID or Name</span>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Enter Student ID (e.g. STU-2024-001) or name..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setResult(null); setError(''); }}
          style={{
            flex: 1, padding: '0.7rem 1rem', borderRadius: 8,
            border: '1.5px solid var(--border)', fontSize: '0.9rem',
            fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button type="submit" className="btn-primary" disabled={loading || !query.trim()}>
          {loading ? '…' : '🔍 Search'}
        </button>
      </form>

      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.75rem 1rem', color: '#c0392b', fontSize: '0.88rem' }}>
          ❌ {error}
        </div>
      )}

      {result && (
        <div style={{ background: '#f0fff4', border: '2px solid var(--green)', borderRadius: 10, padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: roleColor[result.role] + '22', color: roleColor[result.role],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1.3rem',
          }}>
            {result.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <strong style={{ fontSize: '1.05rem' }}>{result.name}</strong>
              <span style={{ background: '#1a3a6b22', color: '#1a3a6b', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>
                {result.role}
              </span>
              <span style={{ background: result.isActive ? '#e8f5ee' : '#fdecea', color: result.isActive ? '#1a6b3c' : '#c0392b', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                {result.isActive ? '✓ Active' : '✗ Inactive'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {[
                ['Student ID', result.studentId || '—'],
                ['Email', result.email],
                ['Department', result.department || '—'],
                ['Phone', result.phone || '—'],
                ['Joined', new Date(result.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })],
              ].map(([label, val]) => (
                <div key={label}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}: </span>
                  <strong style={{ color: 'var(--text)' }}>{val}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [recentCourses, setRecentCourses] = useState([]);
  const [recentExams, setRecentExams] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user.role === 'admin') {
          const [usersRes, coursesRes, examsRes] = await Promise.all([
            usersAPI.getAll(),
            coursesAPI.getAllAdmin(),
            examsAPI.getAllAdmin(),
          ]);
          const users = usersRes.data.users;
          setStats({
            totalUsers: users.length,
            totalStudents: users.filter((u) => u.role === 'student').length,
            totalTeachers: users.filter((u) => u.role === 'teacher').length,
            totalCourses: coursesRes.data.count,
            totalExams: examsRes.data.count,
          });
          setRecentCourses(coursesRes.data.courses.slice(0, 5));
          setRecentExams(examsRes.data.exams.slice(0, 5));
        } else if (user.role === 'teacher') {
          const [coursesRes, examsRes] = await Promise.all([
            coursesAPI.getAll(),
            examsAPI.getAll(),
          ]);
          setStats({
            myCourses: coursesRes.data.count,
            myExams: examsRes.data.count,
          });
          setRecentCourses(coursesRes.data.courses.slice(0, 5));
          setRecentExams(examsRes.data.exams.slice(0, 5));
        } else {
          const [coursesRes, examsRes, resultsRes] = await Promise.all([
            coursesAPI.getAll(),
            examsAPI.getAll(),
            examsAPI.getMyResults(),
          ]);
          setStats({
            enrolledCourses: coursesRes.data.count,
            upcomingExams: examsRes.data.count,
            resultsReceived: resultsRes.data.count,
          });
          setRecentCourses(coursesRes.data.courses.slice(0, 5));
          setRecentExams(examsRes.data.exams.slice(0, 5));
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const adminCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#1a3a6b' },
    { title: 'Students', value: stats.totalStudents, icon: '🎒', color: '#1a6b3c' },
    { title: 'Teachers', value: stats.totalTeachers, icon: '🏫', color: '#6b3a1a' },
    { title: 'Courses', value: stats.totalCourses, icon: '📚', color: '#6b1a3a' },
    { title: 'Exams', value: stats.totalExams, icon: '📝', color: '#3a1a6b' },
  ];

  const teacherCards = [
    { title: 'My Courses', value: stats.myCourses, icon: '📚', color: '#1a6b3c' },
    { title: 'My Exams', value: stats.myExams, icon: '📝', color: '#1a3a6b' },
  ];

  const studentCards = [
    { title: 'Enrolled Courses', value: stats.enrolledCourses, icon: '📚', color: '#1a3a6b' },
    { title: 'Upcoming Exams', value: stats.upcomingExams, icon: '📝', color: '#6b3a1a' },
    { title: 'Results Received', value: stats.resultsReceived, icon: '📊', color: '#1a6b3c' },
  ];

  const cards = user.role === 'admin' ? adminCards : user.role === 'teacher' ? teacherCards : studentCards;

  if (loading) return <div className="page-loading">Loading dashboard...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="page-subtitle">
            {user.role === 'admin' && "Here's your university overview."}
            {user.role === 'teacher' && "Here's what's happening with your courses."}
            {user.role === 'student' && "Here's your academic progress."}
          </p>
        </div>
        <div className={`role-badge role-badge--${user.role}`}>
          {user.role.toUpperCase()}
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((card) => (
          <Card key={card.title} {...card} />
        ))}
      </div>

      {user.role === 'admin' && <IDCheckWidget />}

      <div className="dashboard-panels">
        <div className="panel">
          <div className="panel-header">
            <h3>
              {user.role === 'teacher' ? 'My Courses' : user.role === 'student' ? 'My Courses' : 'Recent Courses'}
            </h3>
            <button
              className="btn-link"
              onClick={() =>
                navigate(user.role === 'admin' ? '/admin/courses' : `/${user.role}/courses`)
              }
            >
              View All →
            </button>
          </div>
          {recentCourses.length === 0 ? (
            <p className="empty-state">No courses found.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Code</th>
                    <th>Credits</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCourses.map((c) => (
                    <tr key={c._id}>
                      <td><strong>{c.title}</strong></td>
                      <td><span className="badge badge-blue">{c.code}</span></td>
                      <td>{c.credits}</td>
                      <td>{c.department || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>
              {user.role === 'student' ? 'Upcoming Exams' : 'Recent Exams'}
            </h3>
            <button
              className="btn-link"
              onClick={() =>
                navigate(user.role === 'admin' ? '/admin/exams' : `/${user.role}/exams`)
              }
            >
              View All →
            </button>
          </div>
          {recentExams.length === 0 ? (
            <p className="empty-state">No exams found.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExams.map((e) => (
                    <tr key={e._id}>
                      <td><strong>{e.title}</strong></td>
                      <td>{e.course?.code || '—'}</td>
                      <td>{new Date(e.examDate).toLocaleDateString()}</td>
                      <td><span className={`badge badge-${e.type === 'final' ? 'red' : 'green'}`}>{e.type}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
