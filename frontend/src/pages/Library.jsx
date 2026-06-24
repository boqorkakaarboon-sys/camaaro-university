import { useState, useEffect } from 'react';
import { libraryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const BookCard = ({ book, onBorrow, onRead, userRole }) => {
  const isAvailable = book.availableCopies > 0;
  return (
    <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: book.coverImage ? 'transparent' : 'linear-gradient(135deg,var(--navy),var(--navy-light))', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
        {book.coverImage ? <img src={book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📚'}
      </div>
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.95rem', lineHeight: 1.3 }}>{book.title}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>by {book.author}</div>
        <div style={{ fontSize: '0.78rem', background: 'var(--bg)', padding: '2px 8px', borderRadius: 20, display: 'inline-block', color: 'var(--navy)' }}>{book.category}</div>
        {book.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '0.25rem' }}>{book.description.slice(0, 90)}{book.description.length > 90 ? '...' : ''}</p>}
        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: isAvailable ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
            {isAvailable ? `✅ ${book.availableCopies} Available` : '❌ Not Available'}
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {book.pdfFile && <button onClick={() => onRead(book)} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>📖 Read</button>}
            {userRole === 'student' && isAvailable && <button onClick={() => onBorrow(book._id)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>📥 Borrow</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

const PDFReader = ({ book, onClose }) => {
  const [page, setPage] = useState(1);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--navy-dark)', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 600 }}>📖 {book.title}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        {book.pdfFile ? (
          <iframe src={book.pdfFile} title={book.title} style={{ width: '100%', height: '100%', minHeight: '70vh', border: 'none', borderRadius: 8 }} />
        ) : (
          <div style={{ color: '#fff', textAlign: 'center', paddingTop: '4rem' }}>PDF ma heli karin</div>
        )}
      </div>
    </div>
  );
};

const AddBookModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ title: '', author: '', isbn: '', category: 'General', description: '', totalCopies: 1, pdfFile: '' });
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(p => ({ ...p, pdfFile: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--navy)' }}>📚 Buug Cusub Ku Dar</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[['title','Magaca Buugga','text'],['author','Qoraaha','text'],['isbn','ISBN (optional)','text'],['category','Nooca','text']].map(([k,l,t]) => (
            <div key={k}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.3rem', fontSize: '0.88rem' }}>{l}</label>
              <input type={t} value={form[k]} onChange={e => setForm(p=>({...p,[k]:e.target.value}))} required={k!=='isbn'}
                style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.3rem', fontSize: '0.88rem' }}>Sharaxaadda</label>
            <textarea value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} rows={3}
              style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.3rem', fontSize: '0.88rem' }}>Tirada Nuqulada</label>
            <input type="number" min={1} value={form.totalCopies} onChange={e => setForm(p=>({...p,totalCopies:Number(e.target.value)}))}
              style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.3rem', fontSize: '0.88rem' }}>PDF Buugga (optional)</label>
            <input type="file" accept=".pdf" onChange={handleFile} style={{ width: '100%', fontSize: '0.88rem' }} />
            {form.pdfFile && <p style={{ fontSize: '0.78rem', color: 'var(--green)', marginTop: '0.25rem' }}>✅ PDF la soo geliyay</p>}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Jooji</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.75rem' }}>{loading ? 'Waa la kaydiyaa...' : '💾 Kaydi'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Library = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [readingBook, setReadingBook] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [myBorrowed, setMyBorrowed] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const [booksRes, catsRes] = await Promise.all([libraryAPI.getAll({ search, category }), libraryAPI.getCategories()]);
      setBooks(booksRes.data.books);
      setCategories(catsRes.data.categories);
      if (user.role === 'student') {
        const borrowed = await libraryAPI.getMyBorrowed();
        setMyBorrowed(borrowed.data.books);
      }
    } catch { showToast('Buuggaasha lama soo qaadin', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, category]);

  const handleBorrow = async (id) => {
    try {
      await libraryAPI.borrow(id);
      showToast('Buugga si fiican ayaad u amaahday! 14 maalmood ayaad leedahay.', 'success');
      load();
    } catch (err) { showToast(err.response?.data?.message || 'Amaahdu ku guuldareysatay', 'error'); }
  };

  const handleAddBook = async (form) => {
    try {
      await libraryAPI.create(form);
      showToast('Buugga si guul leh ayaa loo daray!', 'success');
      setShowAdd(false);
      load();
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const displayBooks = activeTab === 'borrowed' ? myBorrowed : books;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--navy)', marginBottom: '0.25rem' }}>📖 Library</h1>
          <p style={{ color: 'var(--text-muted)' }}>{books.length} buug oo diwaan galiyay</p>
        </div>
        {['admin','librarian'].includes(user.role) && (
          <button onClick={() => setShowAdd(true)} className="btn-primary">+ Buug Cusub</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0' }}>
        {[['all','📚 Dhammaan Buuggaasha'],['borrowed','📥 La Amaahday']].map(([t,l]) => (
          user.role === 'student' || t === 'all' ? (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding: '0.6rem 1.25rem', border: 'none', borderBottom: `3px solid ${activeTab===t?'var(--navy)':'transparent'}`, background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: activeTab===t?700:400, color: activeTab===t?'var(--navy)':'var(--text-muted)', marginBottom: '-2px', fontSize: '0.9rem' }}>
              {l}
            </button>
          ) : null
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input placeholder="🔍 Buug Raadi..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '0.65rem 1rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }} />
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ padding: '0.65rem 1rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
          <option value="">Dhammaan Noocyada</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Buuggaasha waa la soo qaadayaa...</div>
      ) : displayBooks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <p>Buug lama helin</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {displayBooks.map(book => (
            <BookCard key={book._id} book={book} onBorrow={handleBorrow} onRead={setReadingBook} userRole={user.role} />
          ))}
        </div>
      )}

      {readingBook && <PDFReader book={readingBook} onClose={() => setReadingBook(null)} />}
      {showAdd && <AddBookModal onClose={() => setShowAdd(false)} onSave={handleAddBook} />}
    </div>
  );
};

export default Library;
