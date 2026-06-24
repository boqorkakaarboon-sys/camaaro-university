import { useState, useEffect } from 'react';
import { examsAPI, coursesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const EMPTY_QUESTION = () => ({
  _key: Date.now() + Math.random(),
  questionText: '',
  type: 'mcq',
  options: ['', '', '', ''],
  correctAnswer: '0',
  marks: 1,
});

const QuestionCard = ({ q, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const update = (field, val) => onChange(index, { ...q, [field]: val });

  const updateOption = (oi, val) => {
    const opts = [...q.options];
    opts[oi] = val;
    onChange(index, { ...q, options: opts });
  };

  const addOption = () => onChange(index, { ...q, options: [...q.options, ''] });
  const removeOption = (oi) => {
    if (q.options.length <= 2) return;
    const opts = q.options.filter((_, i) => i !== oi);
    const ca = parseInt(q.correctAnswer) >= opts.length ? '0' : q.correctAnswer;
    onChange(index, { ...q, options: opts, correctAnswer: ca });
  };

  return (
    <div className="question-card">
      <div className="question-card-header">
        <div className="question-num">Q{index + 1}</div>
        <div className="question-type-row">
          <select value={q.type} onChange={(e) => update('type', e.target.value)} className="qtype-select">
            <option value="mcq">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="short_answer">Short Answer</option>
          </select>
          <input
            type="number" min={1} max={100} value={q.marks}
            onChange={(e) => update('marks', Math.max(1, parseInt(e.target.value) || 1))}
            className="marks-input" title="Marks"
          />
          <span className="marks-label">pts</span>
        </div>
        <div className="question-actions-top">
          {!isFirst && <button type="button" className="icon-btn" onClick={() => onMoveUp(index)} title="Move up">↑</button>}
          {!isLast && <button type="button" className="icon-btn" onClick={() => onMoveDown(index)} title="Move down">↓</button>}
          <button type="button" className="icon-btn danger" onClick={() => onRemove(index)} title="Remove question">✕</button>
        </div>
      </div>

      <div className="form-group">
        <textarea
          placeholder={`Question ${index + 1} text...`}
          value={q.questionText}
          onChange={(e) => update('questionText', e.target.value)}
          rows={2} required
        />
      </div>

      {q.type === 'mcq' && (
        <div className="mcq-options">
          <p className="options-label">Options <span className="text-muted">(mark correct)</span></p>
          {q.options.map((opt, oi) => (
            <div key={oi} className="option-row">
              <input
                type="radio" name={`correct-${q._key}`} value={String(oi)}
                checked={q.correctAnswer === String(oi)}
                onChange={() => update('correctAnswer', String(oi))}
              />
              <input
                type="text" placeholder={`Option ${oi + 1}`}
                value={opt} onChange={(e) => updateOption(oi, e.target.value)}
                className="option-text" required
              />
              <button type="button" className="icon-btn danger sm" onClick={() => removeOption(oi)}>✕</button>
            </div>
          ))}
          {q.options.length < 6 && (
            <button type="button" className="btn-add-option" onClick={addOption}>+ Add option</button>
          )}
        </div>
      )}

      {q.type === 'true_false' && (
        <div className="tf-options">
          <p className="options-label">Correct answer:</p>
          <div className="tf-row">
            <label className={`tf-btn ${q.correctAnswer === 'true' ? 'selected' : ''}`}>
              <input type="radio" name={`tf-${q._key}`} value="true" checked={q.correctAnswer === 'true'} onChange={() => update('correctAnswer', 'true')} />
              ✓ True
            </label>
            <label className={`tf-btn ${q.correctAnswer === 'false' ? 'selected' : ''}`}>
              <input type="radio" name={`tf-${q._key}`} value="false" checked={q.correctAnswer === 'false'} onChange={() => update('correctAnswer', 'false')} />
              ✗ False
            </label>
          </div>
        </div>
      )}

      {q.type === 'short_answer' && (
        <div className="sa-hint">
          <span className="badge badge-warn">📝 Manual grading required</span>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Teacher will grade this answer manually after submission.
          </p>
        </div>
      )}
    </div>
  );
};

const ExamBuilder = ({ exam, onSaved, onCancel, courses }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: exam?.title || '',
    description: exam?.description || '',
    course: exam?.course?._id || exam?.course || '',
    type: exam?.type || 'quiz',
    startTime: exam?.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : '',
    endTime: exam?.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : '',
    duration: exam?.duration || 30,
    passingMarks: exam?.passingMarks || 40,
    shuffleQuestions: exam?.shuffleQuestions || false,
  });
  const [questions, setQuestions] = useState(
    exam?.questions?.length
      ? exam.questions.map((q) => ({ ...q, _key: Date.now() + Math.random() }))
      : [EMPTY_QUESTION()]
  );

  const totalMarks = questions.reduce((s, q) => s + (parseInt(q.marks) || 0), 0);

  const handleChange = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleQuestionChange = (index, updated) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
  };

  const addQuestion = () => setQuestions((prev) => [...prev, EMPTY_QUESTION()]);

  const removeQuestion = (index) => {
    if (questions.length === 1) { toast.warn('Exam must have at least one question'); return; }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const arr = [...questions];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    setQuestions(arr);
  };

  const moveDown = (index) => {
    if (index === questions.length - 1) return;
    const arr = [...questions];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    setQuestions(arr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.course) { toast.error('Please select a course'); return; }
    if (!form.startTime || !form.endTime) { toast.error('Start and end time are required'); return; }
    if (new Date(form.endTime) <= new Date(form.startTime)) { toast.error('End time must be after start time'); return; }

    const invalidQ = questions.find((q) => !q.questionText.trim());
    if (invalidQ) { toast.error('All questions must have text'); return; }

    const mcqInvalid = questions.find((q) => q.type === 'mcq' && q.options.some((o) => !o.trim()));
    if (mcqInvalid) { toast.error('All MCQ options must be filled in'); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        questions: questions.map(({ _key, ...q }) => q),
      };
      if (exam?._id) {
        await examsAPI.update(exam._id, payload);
        toast.success('Exam updated successfully!');
      } else {
        await examsAPI.create(payload);
        toast.success('Exam created successfully!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exam-builder">
      <div className="builder-header">
        <h2>{exam?._id ? 'Edit Exam' : 'Create New Exam'}</h2>
        <div className="builder-header-right">
          <span className="total-marks-badge">Total: {totalMarks} pts</span>
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Exam Meta ── */}
        <div className="builder-section">
          <h3 className="section-title">Exam Details</h3>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Exam Title *</label>
              <input required value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="e.g. Midterm Exam — Data Structures" />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={(e) => handleChange('type', e.target.value)}>
                <option value="quiz">Quiz</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Course *</label>
              <select required value={form.course} onChange={(e) => handleChange('course', e.target.value)}>
                <option value="">— Select Course —</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.title} ({c.code})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input type="number" min={1} required value={form.duration} onChange={(e) => handleChange('duration', parseInt(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Passing Marks *</label>
              <input type="number" min={1} required value={form.passingMarks} onChange={(e) => handleChange('passingMarks', parseInt(e.target.value))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time *</label>
              <input type="datetime-local" required value={form.startTime} onChange={(e) => handleChange('startTime', e.target.value)} />
            </div>
            <div className="form-group">
              <label>End Time *</label>
              <input type="datetime-local" required value={form.endTime} onChange={(e) => handleChange('endTime', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Optional instructions for students..." />
          </div>

          <label className="checkbox-label">
            <input type="checkbox" checked={form.shuffleQuestions} onChange={(e) => handleChange('shuffleQuestions', e.target.checked)} />
            Shuffle question order for each student
          </label>
        </div>

        {/* ── Questions ── */}
        <div className="builder-section">
          <div className="section-header-row">
            <h3 className="section-title">Questions <span className="text-muted">({questions.length})</span></h3>
            <button type="button" className="btn-primary sm" onClick={addQuestion}>+ Add Question</button>
          </div>

          <div className="questions-list">
            {questions.map((q, i) => (
              <QuestionCard
                key={q._key}
                q={q} index={i}
                onChange={handleQuestionChange}
                onRemove={removeQuestion}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                isFirst={i === 0}
                isLast={i === questions.length - 1}
              />
            ))}
          </div>

          <button type="button" className="btn-add-question" onClick={addQuestion}>
            + Add Another Question
          </button>
        </div>

        <div className="builder-footer">
          <div className="marks-summary">
            <span>{questions.length} questions</span>
            <span className="dot">·</span>
            <span>{totalMarks} total marks</span>
            <span className="dot">·</span>
            <span>{form.duration} minutes</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : exam?._id ? 'Update Exam' : 'Create Exam'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ExamBuilder;
