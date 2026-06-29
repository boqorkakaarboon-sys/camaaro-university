const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');

const callClaude = async (prompt, systemPrompt = '') => {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  };
  if (systemPrompt) body.system = systemPrompt;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': process.env.ANTHROPIC_API_KEY || '' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.content?.[0]?.text || '';
};

// AI Exam Generator
router.post('/generate-exam', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    const { subject, topic, numQuestions, type, difficulty } = req.body;
    const prompt = `Generate ${numQuestions || 5} ${type || 'mcq'} exam questions about "${topic}" in the subject "${subject}".
Difficulty: ${difficulty || 'medium'}.
Return ONLY a JSON array like this:
[{"type":"mcq","text":"Question?","options":["A","B","C","D"],"answer":"A","points":1},...]
For true_false: options=["True","False"], answer="True" or "False"
For short_answer: no options, answer is a sample answer string.`;
    const raw = await callClaude(prompt, 'You are an expert exam question generator. Return only valid JSON, no markdown or explanation.');
    let questions;
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      questions = JSON.parse(clean);
    } catch {
      return res.status(500).json({ success: false, message: 'AI response parsing failed', raw });
    }
    res.json({ success: true, questions });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// AI Essay Grader
router.post('/grade-essay', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    const { question, answer, sampleAnswer, maxPoints } = req.body;
    const prompt = `Grade this student answer for the following question.

Question: ${question}
Sample/Expected Answer: ${sampleAnswer || '(none provided)'}
Student Answer: ${answer}
Max Points: ${maxPoints || 10}

Return ONLY JSON: {"score": number, "feedback": "string", "strengths": "string", "improvements": "string"}`;
    const raw = await callClaude(prompt, 'You are a fair and constructive academic grader. Return only valid JSON.');
    let result;
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      return res.status(500).json({ success: false, message: 'AI grading failed', raw });
    }
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// AI Academic Chatbot
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const messages = [
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];
    const body = {
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: 'You are an academic assistant for Camaaro University. Help students with their studies, explain concepts clearly, and encourage learning. Be friendly, concise, and educational. Respond in the same language the student uses (Somali or English).',
      messages,
    };
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': process.env.ANTHROPIC_API_KEY || '' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    res.json({ success: true, reply: data.content?.[0]?.text || 'Sorry, I could not respond.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
