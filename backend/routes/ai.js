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
    const universityInfo = `
=== CAMAARO UNIVERSITY — XOGTA RASMIGA AH ===
- Magaca Jaamacadda: Camaaro University
- Mulkiilaha/Founder: Ramli Ali Husein
- Laamaha (Campuses): 2 — Camaaro iyo Muqdisho
- Lambarka Taleefanka: +252612665365
- Powered by: Camaaro University

KULLIYADAHA (Faculties/Colleges):
Camaaro University waxay leedahay dhowr kulliyado oo kala duwan. Haddii ardey ku weydiiyo "kulliyada" ama "what faculties/colleges exist", sheeg in jaamacaddu leedahay kulliyado caadi ah oo jaamacad u baahan tahay (sida Computer Science, Business Administration, Medicine, Engineering, Education, Law, iwm) — laakiin sheeg in liiska rasmiga ah ee kulliyadaha la heli karo Admin/Registration office-ka jaamacadda, ama bogga "Courses" ee system-ka.

Haddii ardey ku weydiiyo wax la xiriira jaamacadda (mulkiile, lambarka, laamaha, kulliyadaha, taariikhda, iwm), ka jawaab si toos ah adigoo isticmaalaya xogta kor ku xusan. Haddii aanad hayn xog gaar ah (sida taariikhda exact-ka ah ee la aasaasay), ka jawaab si caqli gal ah oo aad ku tidhaahdo inay tahay inay la xiriiraan Admin Office-ka si ay u helaan xog dheeraad ah.
`;

    const systemPrompt = `You are the official AI Academic Assistant for Camaaro University, powered by Camaaro University.

${universityInfo}

Your role:
1. Answer ANY question about Camaaro University using the official information above (owner, campuses, contact, faculties).
2. Help students with academic subjects — explain concepts clearly across any field of study (math, science, business, computer science, medicine, etc.) at a college level.
3. Be friendly, concise, and educational.
4. Respond in the same language the student uses (Somali or English) — default to Somali if unclear.
5. If asked something you don't have official data for, give your best helpful answer and suggest contacting the university Admin Office for official confirmation.

Always represent the university professionally and positively.`;

    const messagesPayload = {
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: systemPrompt,
      messages,
    };
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': process.env.ANTHROPIC_API_KEY || '' },
      body: JSON.stringify(messagesPayload),
    });
    const data = await response.json();
    res.json({ success: true, reply: data.content?.[0]?.text || 'Sorry, I could not respond.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;