import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { examsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import CameraMonitor from './CameraMonitor';
import { CertificateCard } from './CertificateView';
import { useAuth } from '../context/AuthContext';

// ─── Timer ────────────────────────────────────────────────────────
const Timer = ({ deadline, onExpire }) => {
  const [remaining, setRemaining] = useState(0);
  const expiredRef = useRef(false);
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(deadline) - new Date());
      setRemaining(diff);
      if (diff === 0 && !expiredRef.current) { expiredRef.current = true; onExpire(); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline, onExpire]);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const isUrgent = remaining < 5 * 60000;
  return (
    <div className={`exam-timer ${isUrgent ? 'timer-urgent' : ''}`}>
      <span className="timer-icon">⏱</span>
      <span className="timer-text">{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</span>
      {isUrgent && <span className="timer-warn">Time running out!</span>}
    </div>
  );
};

// ─── Question Renderer ────────────────────────────────────────────
const QuestionView = ({ question, index, total, answer, onChange }) => (
  <div className="question-view">
    <div className="qv-header">
      <span className="qv-num">Question {index + 1} of {total}</span>
      <span className="qv-marks">{question.marks} {question.marks === 1 ? 'mark' : 'marks'}</span>
    </div>
    <div className="qv-progress">
      <div className="qv-progress-bar" style={{ width: `${((index + 1) / total) * 100}%` }} />
    </div>
    <div className="qv-text">{question.questionText}</div>
    {question.type === 'mcq' && (
      <div className="qv-options">
        {question.options.map((opt, oi) => (
          <label key={oi} className={`qv-option ${answer === String(oi) ? 'selected' : ''}`}>
            <input type="radio" name={`q-${question._id}`} value={String(oi)}
              checked={answer === String(oi)} onChange={() => onChange(String(oi))} />
            <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
            <span className="option-text">{opt}</span>
          </label>
        ))}
      </div>
    )}
    {question.type === 'true_false' && (
      <div className="qv-tf">
        {['true', 'false'].map((val) => (
          <label key={val} className={`qv-tf-btn ${answer === val ? 'selected' : ''}`}>
            <input type="radio" name={`tf-${question._id}`} value={val}
              checked={answer === val} onChange={() => onChange(val)} />
            {val === 'true' ? '✓ True' : '✗ False'}
          </label>
        ))}
      </div>
    )}
    {question.type === 'short_answer' && (
      <div className="qv-sa">
        <textarea placeholder="Type your answer here..." value={answer || ''}
          onChange={(e) => onChange(e.target.value)} rows={5} />
        <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.4rem' }}>
          This answer will be graded manually by your teacher.
        </p>
      </div>
    )}
  </div>
);

// ─── Answer Map ───────────────────────────────────────────────────
const AnswerMap = ({ questions, answers, currentIndex, onJump }) => (
  <div className="answer-map">
    <p className="answer-map-title">Question Navigator</p>
    <div className="answer-map-grid">
      {questions.map((q, i) => {
        const answered = answers[q._id] !== undefined && answers[q._id] !== '';
        return (
          <button key={q._id}
            className={`map-pill ${answered ? 'answered' : ''} ${i === currentIndex ? 'current' : ''}`}
            onClick={() => onJump(i)}>{i + 1}</button>
        );
      })}
    </div>
  </div>
);

// ─── Anti-Cheat Warning Banner ────────────────────────────────────
const CheatWarning = ({ message, onDismiss }) => (
  <div className="cheat-warning-banner" onClick={onDismiss}>
    <span>⚠️ {message}</span>
    <small>Click to dismiss</small>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN ExamTaker
// ═══════════════════════════════════════════════════════════════════
const ExamTaker = ({ examId, onFinish }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [phase, setPhase] = useState('loading');
  const [exam, setExam] = useState(null);
  const [resultMeta, setResultMeta] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitResult, setSubmitResult] = useState(null);
  const [certificateCode, setCertificateCode] = useState(null);

  // Anti-cheat state
  const [tabSwitches, setTabSwitches] = useState(0);
  const [cameraViolations, setCameraViolations] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [cheatWarning, setCheatWarning] = useState('');
  const tabRef = useRef(0);
  const camRef = useRef(0);
  const fsRef = useRef(0);
  const autosaveRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Load exam ────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const res = await examsAPI.startExam(examId);
        const { exam: e, result: r } = res.data;
        setExam(e);
        setResultMeta(r);
        const draftMap = r.draftAnswers || {};
        const initial = {};
        e.questions.forEach((q) => { initial[q._id] = draftMap[q._id] || ''; });
        setAnswers(initial);
        setPhase('taking');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to start exam');
        onFinish();
      }
    };
    init();
  }, [examId]);

  // ── Enter fullscreen on start ────────────────────────────────
  useEffect(() => {
    if (phase === 'taking') {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    }
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  }, [phase]);

  // ── Fullscreen change detection ──────────────────────────────
  useEffect(() => {
    const handleFsChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs && phase === 'taking') {
        fsRef.current += 1;
        setFullscreenExits(fsRef.current);
        setCheatWarning(`Fullscreen exited! (${fsRef.current} time${fsRef.current > 1 ? 's' : ''}). Return to fullscreen.`);
        // Re-enter fullscreen
        setTimeout(() => {
          document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        }, 1000);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [phase]);

  // ── Tab switch / visibility detection ───────────────────────
  useEffect(() => {
    if (phase !== 'taking') return;
    const handleVisibility = () => {
      if (document.hidden) {
        tabRef.current += 1;
        setTabSwitches(tabRef.current);
        setCheatWarning(`Tab switch detected! (${tabRef.current} time${tabRef.current > 1 ? 's' : ''}). This is being recorded.`);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [phase]);

  // ── Block right-click and copy/paste ───────────────────────
  useEffect(() => {
    if (phase !== 'taking') return;
    const block = (e) => e.preventDefault();
    const blockKeys = (e) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+A, PrintScreen, F12
      if ((e.ctrlKey && ['c','v','a','u'].includes(e.key.toLowerCase())) ||
          e.key === 'PrintScreen' || e.key === 'F12') {
        e.preventDefault();
        setCheatWarning('Copy/paste shortcuts are disabled during exam.');
      }
    };
    document.addEventListener('contextmenu', block);
    document.addEventListener('keydown', blockKeys);
    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('keydown', blockKeys);
    };
  }, [phase]);

  // ── Autosave every 30s ───────────────────────────────────────
  useEffect(() => {
    if (phase !== 'taking') return;
    autosaveRef.current = setInterval(async () => {
      try {
        await examsAPI.autosave(examId, {
          answers,
          tabSwitchCount: tabRef.current,
          cameraViolations: camRef.current,
        });
      } catch {}
    }, 30000);
    return () => clearInterval(autosaveRef.current);
  }, [phase, answers, examId]);

  const handleAnswerChange = useCallback((qId, val) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  }, []);

  const handleCameraViolation = useCallback((count) => {
    camRef.current = count;
    setCameraViolations(count);
    setCheatWarning(`Camera alert! (${count}). Do not cover or block your camera.`);
  }, []);

  const handleExpire = useCallback(() => {
    toast.info('Time is up! Submitting your exam...');
    handleSubmit(true);
  }, [answers]);

  const handleSubmit = async (isAuto = false) => {
    if (!isAuto) {
      const unanswered = exam.questions.filter((q) => !answers[q._id]).length;
      if (unanswered > 0) {
        const ok = window.confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`);
        if (!ok) return;
      }
    }
    setPhase('submitting');
    try {
      const res = await examsAPI.submitExam(examId, {
        answers,
        tabSwitchCount: tabRef.current,
        cameraViolations: camRef.current,
        fullscreenExits: fsRef.current,
      });
      setSubmitResult(res.data.result);
      setCertificateCode(res.data.certificateCode);
      setPhase('done');
      toast.success(res.data.message);
      // Exit fullscreen
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
      setPhase('taking');
    }
  };

  // ── Phase: loading ───────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="exam-loading"><div className="spinner" /><p>Preparing your exam...</p></div>
  );

  if (phase === 'submitting') return (
    <div className="exam-loading"><div className="spinner" /><p>Submitting your exam...</p></div>
  );

  if (phase === 'done' && submitResult) return (
    <ResultDisplay result={submitResult} certificateCode={certificateCode} student={user} onClose={onFinish} />
  );

  if (phase === 'done') return (
    <div className="exam-loading">
      <p>Exam session ended.</p>
      <button className="btn-primary" onClick={onFinish}>Back to Dashboard</button>
    </div>
  );

  // ── Phase: taking ────────────────────────────────────────────
  const q = exam.questions[currentQ];
  const answered = Object.values(answers).filter((v) => v !== '').length;

  return (
    <div className="exam-taker">
      {/* Anti-cheat warning */}
      {cheatWarning && (
        <CheatWarning message={cheatWarning} onDismiss={() => setCheatWarning('')} />
      )}

      {/* Header */}
      <div className="exam-header">
        <div className="exam-header-left">
          <h2 className="exam-title">{exam.title}</h2>
          <span className="exam-course">{exam.course?.title}</span>
        </div>
        <div className="exam-header-right">
          {/* Anti-cheat indicators */}
          <div className="exam-security-indicators">
            {tabSwitches > 0 && (
              <span className="tab-warn" title="Tab switches recorded">⚠ {tabSwitches} tab switch{tabSwitches > 1 ? 'es' : ''}</span>
            )}
            {cameraViolations > 0 && (
              <span className="cam-warn-badge" title="Camera alerts">📷 {cameraViolations} cam alert{cameraViolations > 1 ? 's' : ''}</span>
            )}
            {!isFullscreen && (
              <span className="fs-warn" title="Not in fullscreen">⛶ Fullscreen required</span>
            )}
          </div>
          <Timer deadline={resultMeta.deadline} onExpire={handleExpire} />
        </div>
      </div>

      <div className="exam-body">
        {/* Sidebar */}
        <div className="exam-sidebar">
          <AnswerMap questions={exam.questions} answers={answers}
            currentIndex={currentQ} onJump={setCurrentQ} />
          <div className="exam-progress-text">{answered} of {exam.questions.length} answered</div>

          {/* Camera Monitor */}
          <CameraMonitor isActive={true} onViolation={handleCameraViolation} />

          <button className="btn-submit-exam" onClick={() => handleSubmit(false)}>Submit Exam</button>
        </div>

        {/* Question area */}
        <div className="exam-main">
          <QuestionView question={q} index={currentQ} total={exam.questions.length}
            answer={answers[q._id] || ''} onChange={(val) => handleAnswerChange(q._id, val)} />
          <div className="exam-nav">
            <button className="btn-secondary" disabled={currentQ === 0}
              onClick={() => setCurrentQ((p) => p - 1)}>← Previous</button>
            <span className="qv-counter">{currentQ + 1} / {exam.questions.length}</span>
            {currentQ < exam.questions.length - 1 ? (
              <button className="btn-primary" onClick={() => setCurrentQ((p) => p + 1)}>Next →</button>
            ) : (
              <button className="btn-submit-exam-inline" onClick={() => handleSubmit(false)}>Submit Exam ✓</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Result Display ───────────────────────────────────────────────
const ResultDisplay = ({ result, certificateCode, student, onClose }) => {
  const [showCert, setShowCert] = useState(false);
  const gradeColor = { 'A+': '#1a6b3c', A: '#1a6b3c', 'B+': '#1a3a6b', B: '#1a3a6b', 'C+': '#6b6b1a', C: '#6b6b1a', D: '#6b3a1a', F: '#c0392b', Pending: '#888' };
  const isPending = result.grade === 'Pending';

  // Merge certificate code into student for display
  const studentWithCert = student ? {
    ...student,
    certificates: certificateCode ? [{ examId: result.exam?._id, verifyCode: certificateCode }] : (student.certificates || [])
  } : null;

  return (
    <div className="result-display">
      <div className="result-card">
        <div className="result-card-top" style={{ background: result.passed ? '#1a6b3c' : '#c0392b' }}>
          <div className="result-icon">{isPending ? '⏳' : result.passed ? '🎉' : '📚'}</div>
          <h2>{isPending ? 'Submitted!' : result.passed ? 'Congratulations!' : 'Keep Practicing!'}</h2>
          <p>{isPending ? 'Your short answers will be graded soon.' : result.passed ? 'You passed the exam!' : 'You did not meet the passing threshold.'}</p>
        </div>

        <div className="result-card-body">
          {!isPending && (
            <div className="result-score-row">
              <div className="score-circle" style={{ borderColor: gradeColor[result.grade] || '#888' }}>
                <span className="score-grade" style={{ color: gradeColor[result.grade] }}>{result.grade}</span>
                <span className="score-gpa">GPA {result.gpa?.toFixed(1)}</span>
              </div>
              <div className="score-details">
                <div className="score-item"><span className="score-label">Score</span><span className="score-val">{result.marksObtained} / {result.totalMarks}</span></div>
                <div className="score-item"><span className="score-label">Percentage</span><span className="score-val">{result.percentage}%</span></div>
                <div className="score-item"><span className="score-label">Status</span><span className={`score-val ${result.passed ? 'text-pass' : 'text-fail'}`}>{result.passed ? 'PASSED' : 'FAILED'}</span></div>
                <div className="score-item"><span className="score-label">Time Taken</span><span className="score-val">{result.timeTakenMinutes} min</span></div>
              </div>
            </div>
          )}

          {/* Exam integrity report */}
          <div className="integrity-report">
            <h4>📊 Exam Integrity Report</h4>
            <div className="integrity-row">
              <span>Tab switches</span>
              <span className={result.tabSwitchCount > 0 ? 'integrity-warn' : 'integrity-ok'}>
                {result.tabSwitchCount || 0} {result.tabSwitchCount > 0 ? '⚠' : '✓'}
              </span>
            </div>
            <div className="integrity-row">
              <span>Camera alerts</span>
              <span className={result.cameraViolations > 0 ? 'integrity-warn' : 'integrity-ok'}>
                {result.cameraViolations || 0} {result.cameraViolations > 0 ? '⚠' : '✓'}
              </span>
            </div>
          </div>

          {/* Certificate section */}
          {result.passed && !isPending && (
            <div className="cert-section">
              <div className="cert-banner">
                🏆 Certificate Earned!
                <button className="btn-secondary" onClick={() => setShowCert(!showCert)}>
                  {showCert ? 'Hide Certificate' : 'View Certificate'}
                </button>
              </div>
              {showCert && <CertificateCard result={result} student={studentWithCert} />}
            </div>
          )}

          {/* Answer breakdown */}
          {result.answers?.length > 0 && (
            <div className="answer-breakdown">
              <h3>Answer Breakdown</h3>
              <div className="breakdown-summary">
                <span className="bs-correct">✓ {result.answers.filter((a) => a.isCorrect).length} Correct</span>
                <span className="bs-wrong">✕ {result.answers.filter((a) => !a.isCorrect && !a.isManualGrade).length} Wrong</span>
                {result.answers.some((a) => a.isManualGrade) && (
                  <span className="bs-manual">📝 {result.answers.filter((a) => a.isManualGrade).length} Manual</span>
                )}
              </div>
              <div className="answer-list">
                {result.answers.map((a, i) => (
                  <div key={i} className={`answer-item ${a.isManualGrade ? 'manual' : a.isCorrect ? 'correct' : 'wrong'}`}>
                    <div className="ai-header">
                      <span className="ai-num">Q{i + 1}</span>
                      <span className="ai-type">{a.type?.replace('_', ' ')}</span>
                      <span className={`ai-status ${a.isManualGrade ? 'manual' : a.isCorrect ? 'correct' : 'wrong'}`}>
                        {a.isManualGrade ? '📝 Pending' : a.isCorrect ? `✓ +${a.marksAwarded}` : '✕ 0'}
                      </span>
                    </div>
                    <p className="ai-question">{a.questionText}</p>
                    {!a.isManualGrade && (
                      <>
                        <p className="ai-your">Your answer: <strong>{a.studentAnswer || '(no answer)'}</strong></p>
                        {!a.isCorrect && <p className="ai-correct">Correct: <strong>{a.correctAnswer}</strong></p>}
                      </>
                    )}
                    {a.isManualGrade && <p className="ai-your">Your answer: <strong>{a.studentAnswer || '(no answer)'}</strong></p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="result-card-footer">
          <button className="btn-primary" onClick={onClose}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default ExamTaker;
