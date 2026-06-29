import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examsAPI } from '../services/api';

const GradeStudents = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await examsAPI.getAll();
        const examList = res.data.exams || [];
        setExams(examList);

        // Fetch pending-grade counts per exam (best-effort, ignore individual failures)
        const counts = {};
        await Promise.all(examList.map(async (e) => {
          try {
            const r = await examsAPI.getResults(e._id);
            const results = r.data.results || [];
            counts[e._id] = {
              total: results.length,
              pending: results.filter(x => x.needsManualGrading && x.status !== 'graded').length,
              graded: results.filter(x => x.status === 'graded').length,
            };
          } catch { counts[e._id] = { total: 0, pending: 0, graded: 0 }; }
        }));
        setPendingCounts(counts);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="page-loading">Loading exams...</div>;

  return (
    <div>
      <div className="panel-header">
        <h2>📊 Grade Students</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Dooro exam si aad u aragto natiijooyinka ardayda oo aad u grade-gareeyso su'aalaha manual-ka ah.
      </p>

      {exams.length === 0 ? (
        <p className="empty-state">No exams created yet.</p>
      ) : (
        <div className="exam-cards">
          {exams.map((e) => {
            const c = pendingCounts[e._id] || { total: 0, pending: 0, graded: 0 };
            return (
              <div key={e._id} className="exam-list-card">
                <div className="elc-left">
                  <span className={`badge badge-${e.type === 'final' ? 'red' : e.type === 'quiz' ? 'green' : 'blue'}`}>{e.type}</span>
                  <div>
                    <h3 className="elc-title">{e.title}</h3>
                    <p className="elc-meta">{e.course?.code} · {c.total} submission{c.total !== 1 ? 's' : ''} · {c.graded} graded</p>
                    {c.pending > 0 && (
                      <p style={{ color: 'var(--gold)', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.25rem' }}>
                        ⚠️ {c.pending} pending manual grading
                      </p>
                    )}
                  </div>
                </div>
                <div className="elc-right">
                  <span className={`badge ${e.isPublished ? 'badge-green' : 'badge-red'}`}>{e.isPublished ? 'Published' : 'Draft'}</span>
                  <button className="btn-sm btn-primary" onClick={() => navigate(`/teacher/exams/${e._id}/results`)}>
                    {c.pending > 0 ? `Grade (${c.pending})` : 'View Results'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GradeStudents;
