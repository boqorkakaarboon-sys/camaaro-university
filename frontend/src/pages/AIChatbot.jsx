import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AIChatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Salaam ${user?.name?.split(' ')[0] || ''}! 👋 Waxaan ahay AI Assistant-ka Camaaro University. Wax kasta oo waxbarashada kula xiriira ayaan kaa caawin karaa. Su'aal i weydii!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await aiAPI.chat({ message: text, history: messages.slice(-6) });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Waan ka xumahay, jawaab ma soo celiyaan kartid. Dib u isku day.' }]);
    }
    setLoading(false);
  };

  const suggestions = ['Jaamacadda yaa leh?', 'Jaamacadda halkee ku taal?', 'Lambarka jaamacadda?', 'Maxay tahay Pythagorean theorem?'];

  return (
    <div style={{ maxWidth: 750, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ color: 'var(--navy)', marginBottom: '0.15rem' }}>🤖 AI Academic Assistant</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Powered by Camaaro University</p>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflow: 'auto', background: '#fff', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.6rem', alignItems: 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'var(--navy)' : 'var(--bg)',
              color: msg.role === 'user' ? '#fff' : 'var(--text)',
              fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e0e6f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0, fontWeight: 700, color: 'var(--navy)' }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤖</div>
            <div style={{ background: 'var(--bg)', padding: '0.75rem 1rem', borderRadius: '16px 16px 16px 4px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-block', animation: 'pulse 1s infinite' }}>⋯ Jawaab waa la diyaarinayaa</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => { setInput(s); }}
              style={{ padding: '0.4rem 0.85rem', background: '#fff', border: '1.5px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', color: 'var(--navy)', transition: 'all 0.2s' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Su'aashaada qor..."
          style={{ flex: 1, padding: '0.85rem 1.1rem', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: '0.92rem', fontFamily: 'inherit', outline: 'none' }}
        />
        <button onClick={send} disabled={loading || !input.trim()} className="btn-primary" style={{ padding: '0.85rem 1.5rem', borderRadius: 10 }}>
          ➤
        </button>
      </div>
    </div>
  );
};

export default AIChatbot;
