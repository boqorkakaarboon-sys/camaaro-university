import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examsAPI, usersAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CertificateCard } from '../components/CertificateView';

const gradeColor = {
  'A+': '#1a6b3c', A: '#1a6b3c', 'B+': '#1a3a6b', B: '#1a3a6b',
  'C+': '#6b6b1a', C: '#6b6b1a', D: '#6b3a1a', F: '#c0392b', Pending: '#888',
};

const ResultDetail = () => {
  const { examId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);   // for student: single result
  const [studentProfile, setStudentProfile] = useState(null);
  const [examResults, setExamResults] = useState(null); // for teacher: { results, stats }
  const [loading, setLoading] = useState(true);
  const [gradingResult, setGradingResult] = useState(null); // result being graded
  const [gradeForm, setGradeForm] = useState({});
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        if (user.role === 'student') {
          const res = await examsAPI.getMyResult(examId);
          setData(res.data.result);
          try {
            const pr = await authAPI.getMe();
            setStudentProfile(pr.data.user);
          } catch { setStudentProfile(user); }
        } else {
          const res = await examsAPI.getResults(examId);
          setExamResults(res.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load results');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId]);

  const openGrading = (result) => {
    const initial = {};
    result.answers?.filter((a) => a.isManualGrade).forEach((a) => {
      initial[a.questionId] = a.marksAwarded || 0;
    });
    setGradeForm(initial);
    setRemarks(result.remarks || '');
    setGradingResult(result);
  };

  const submitGrade = async () => {
    const answerGrades = Object.entries(gradeForm).map(([questionId, marksAwarded]) => ({
      questionId, marksAwarded: parseFloat(marksAwarded) || 0,
    }));
    try {
      await examsAPI.manualGrade(gradingResult._id, { answerGrades, remarks });
      toast.success('Result graded successfully!');
      setGradingResult(null);
      // Reload
      const res = await examsAPI.getResults(examId);
      setExamResults(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Grading failed');
    }
  };

  if (loading) return <div className="page-loading">Loading results...</div>;

  // ─── Student view ─────────────────────────────────────────────
  if (user.role === 'student') {
    if (!data) return <div className="empty-state">No result found for this exam.</div>;
    const r = data;
    const isPending = r.grade === 'Pending';
    return (
      <div className="page">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="result-detail-page">
          <div className="rdp-header">
            <div>
              <h1>{r.exam?.title}</h1>
              <p className="text-muted">{r.course?.title} · {r.course?.code}</p>
            </div>
            <div className="rdp-grade-badge" style={{ color: gradeColor[r.grade], border: `2px solid ${gradeColor[r.grade]}` }}>
              {r.grade}
            </div>
          </div>

          <div className="rdp-stats">
            <div className="rdp-stat"><span>{r.marksObtained}/{r.totalMarks}</span><small>Score</small></div>
            <div className="rdp-stat"><span>{r.percentage}%</span><small>Percentage</small></div>
            <div className="rdp-stat"><span>{r.gpa?.toFixed(1)}</span><small>GPA Points</small></div>
            <div className="rdp-stat"><span>{r.timeTakenMinutes} min</span><small>Time Taken</small></div>
            <div className="rdp-stat">
              <span style={{ color: r.passed ? '#1a6b3c' : '#c0392b' }}>{r.passed ? 'PASSED' : 'FAILED'}</span>
              <small>Status</small>
            </div>
          </div>

          {isPending && (
            <div className="alert alert-info">⏳ Some answers are pending manual grading by your teacher.</div>
          )}

          {r.answers?.length > 0 && (
            <div className="answer-breakdown">
              <h3>Answer Review</h3>
              <div className="breakdown-summary">
                <span className="bs-correct">✓ {r.answers.filter((a) => a.isCorrect).length} Correct</span>
                <span className="bs-wrong">✕ {r.answers.filter((a) => !a.isCorrect && !a.isManualGrade).length} Incorrect</span>
                {r.answers.some((a) => a.isManualGrade) && (
                  <span className="bs-manual">📝 {r.answers.filter((a) => a.isManualGrade).length} Manual</span>
                )}
              </div>
              <div className="answer-list">
                {r.answers.map((a, i) => (
                  <div key={i} className={`answer-item ${a.isManualGrade ? 'manual' : a.isCorrect ? 'correct' : 'wrong'}`}>
                    <div className="ai-header">
                      <span className="ai-num">Q{i + 1}</span>
                      <span className="ai-type">{a.type?.replace('_', ' ')}</span>
                      <span className={`ai-status ${a.isManualGrade ? 'manual' : a.isCorrect ? 'correct' : 'wrong'}`}>
                        {a.isManualGrade ? `📝 ${a.marksAwarded > 0 ? '+' + a.marksAwarded : 'Pending'}` : a.isCorrect ? `✓ +${a.marksAwarded}` : '✕ 0'}
                      </span>
                    </div>
                    <p className="ai-question">{a.questionText}</p>
                    <p className="ai-your">Your answer: <strong>{a.studentAnswer || '(blank)'}</strong></p>
                    {!a.isManualGrade && !a.isCorrect && <p className="ai-correct">Correct: <strong>{a.correctAnswer}</strong></p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificate */}
          {r.passed && (
            <div className="panel" style={{ marginTop: '2rem' }}>
              <div className="panel-header">
                <h3>🎓 Your Certificate</h3>
              </div>
              <CertificateCard result={r} student={studentProfile || user} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Teacher / Admin view ──────────────────────────────────────
  const { stats, results } = examResults || { stats: {}, results: [] };

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      <h1 style={{ marginBottom: '0.5rem' }}>Exam Results</h1>

      {/* Stats row */}
      <div className="rdp-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="rdp-stat"><span>{stats.total || 0}</span><small>Attempts</small></div>
        <div className="rdp-stat"><span>{stats.submitted || 0}</span><small>Submitted</small></div>
        <div className="rdp-stat"><span style={{ color: '#1a6b3c' }}>{stats.passed || 0}</span><small>Passed</small></div>
        <div className="rdp-stat"><span>{stats.avgPercentage || 0}%</span><small>Avg Score</small></div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>Student</th><th>Score</th><th>%</th><th>Grade</th><th>Status</th><th>Tabs</th><th>Time</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r._id}>
                <td><strong>{r.student?.name}</strong><br /><small className="text-muted">{r.student?.email}</small></td>
                <td>{r.marksObtained}/{r.totalMarks}</td>
                <td>{r.percentage}%</td>
                <td style={{ color: gradeColor[r.grade], fontWeight: 700 }}>{r.grade}</td>
                <td><span className={`badge ${r.passed ? 'badge-green' : 'badge-red'}`}>{r.status}</span></td>
                <td>{r.tabSwitchCount || 0}</td>
                <td>{r.timeTakenMinutes} min</td>
                <td>
                  {r.needsManualGrading && r.status !== 'graded' && (
                    <button className="btn-sm btn-primary" onClick={() => openGrading(r)}>Grade</button>
                  )}
                  {r.status === 'graded' && <span className="badge badge-green">Graded</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {results.length === 0 && <p className="empty-state">No submissions yet.</p>}
      </div>

      {/* Manual grading modal */}
      {gradingResult && (
        <div className="modal-overlay" onClick={() => setGradingResult(null)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Grade: {gradingResult.student?.name}</h3>
              <button className="modal-close" onClick={() => setGradingResult(null)}>✕</button>
            </div>
            <div className="modal-body">
              {gradingResult.answers?.filter((a) => a.isManualGrade).map((a, i) => (
                <div key={i} className="grade-question-row">
                  <p className="ai-question"><strong>Q:</strong> {a.questionText}</p>
                  <p className="ai-your">Answer: <em>{a.studentAnswer || '(no answer)'}</em></p>
                  <div className="form-row" style={{ alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ whiteSpace: 'nowrap' }}>Marks (max {a.maxMarks}):</label>
                    <input
                      type="number" min={0} max={a.maxMarks} step={0.5}
                      value={gradeForm[a.questionId] ?? 0}
                      onChange={(e) => setGradeForm((f) => ({ ...f, [a.questionId]: e.target.value }))}
                      style={{ width: '80px' }}
                    />
                  </div>
                </div>
              ))}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Remarks</label>
                <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional feedback" />
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setGradingResult(null)}>Cancel</button>
                <button className="btn-primary" onClick={submitGrade}>Save Grade</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDetail;
