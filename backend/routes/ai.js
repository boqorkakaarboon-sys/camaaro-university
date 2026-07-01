const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Google Gemini API — Free tier, no credit card required.
// Get a free key at https://aistudio.google.com/apikey
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const callGemini = async (messages, systemPrompt = '') => {
  const apiKey = process.env.GEMINI_API_KEY || '';

  // Convert OpenAI-style messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.7,
    },
  };

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text;
};

// AI Exam Generator
router.post('/generate-exam', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { subject, topic, numQuestions, type, difficulty } = req.body;
    const prompt = `Generate ${numQuestions || 5} ${type || 'mcq'} exam questions about "${topic}" in the subject "${subject}".
Difficulty: ${difficulty || 'medium'}.
Return ONLY a JSON array like this:
[{"type":"mcq","text":"Question?","options":["A","B","C","D"],"answer":"A","points":1},...]
For true_false: options=["True","False"], answer="True" or "False"
For short_answer: no options, answer is a sample answer string.`;

    const raw = await callGemini(
      [{ role: 'user', content: prompt }],
      'You are an expert exam question generator. Return only valid JSON, no markdown or explanation.'
    );

    let questions;
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      questions = JSON.parse(clean);
    } catch {
      return res.status(500).json({ success: false, message: 'AI response parsing failed', raw });
    }
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// AI Essay Grader
router.post('/grade-essay', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { question, answer, sampleAnswer, maxPoints } = req.body;
    const prompt = `Grade this student answer for the following question.

Question: ${question}
Sample/Expected Answer: ${sampleAnswer || '(none provided)'}
Student Answer: ${answer}
Max Points: ${maxPoints || 10}

Return ONLY JSON: {"score": number, "feedback": "string", "strengths": "string", "improvements": "string"}`;

    const raw = await callGemini(
      [{ role: 'user', content: prompt }],
      'You are a fair and constructive academic grader. Return only valid JSON.'
    );

    let result;
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      return res.status(500).json({ success: false, message: 'AI grading failed', raw });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
Computer Science, Business Administration, Medicine & Health Sciences,
Engineering, Education, Law, Social Sciences.
Liiska rasmiga ah la heli karaa Admin/Registration office-ka jaamacadda.
`;

    const systemPrompt = `You are the official AI Academic Assistant for Camaaro University, powered by Camaaro University.

${universityInfo}

Your role:
1. Answer ANY question about Camaaro University using the official information above.
2. Help students with academic subjects — explain concepts clearly at college level.
3. Be friendly, concise, and educational.
4. Respond in the same language the student uses (Somali or English) — default to Somali if unclear.
5. If asked something you don't have official data for, suggest contacting the Admin Office.

Always represent the university professionally and positively.`;

    const reply = await callGemini(messages, systemPrompt);
    res.json({ success: true, reply });
  } catch (err) {
    console.error('AI /chat error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
