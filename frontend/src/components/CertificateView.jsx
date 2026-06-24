import { useState, useRef } from 'react';

/**
 * CertificateView - Professional certificate with ID verification
 */

export const CertificateCard = ({ result, student }) => {
  const printRef = useRef(null);
  const [copying, setCopying] = useState(false);

  if (!result || !result.passed) return null;

  const cert = student?.certificates?.find(
    (c) => c.examId?.toString() === result.exam?._id?.toString()
  );
  const verifyCode = cert?.verifyCode || result.certificateCode || 'N/A';
  const verifyUrl = `${window.location.origin}/verify/${verifyCode}`;
  const issueDate = new Date(result.submittedAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>Certificate — ${student?.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=IM+Fell+English:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 landscape; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #fff; }
        .cert-page {
          width: 297mm; height: 210mm;
          background: #fffef8;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 0;
        }
        /* Corner decorations */
        .corner { position: absolute; width: 80px; height: 80px; }
        .corner-tl { top: 18px; left: 18px; border-top: 4px solid #b8960c; border-left: 4px solid #b8960c; }
        .corner-tr { top: 18px; right: 18px; border-top: 4px solid #b8960c; border-right: 4px solid #b8960c; }
        .corner-bl { bottom: 18px; left: 18px; border-bottom: 4px solid #b8960c; border-left: 4px solid #b8960c; }
        .corner-br { bottom: 18px; right: 18px; border-bottom: 4px solid #b8960c; border-right: 4px solid #b8960c; }
        /* Outer border */
        .outer-border {
          position: absolute; inset: 12px;
          border: 2px solid #b8960c; border-radius: 2px;
        }
        .inner-border {
          position: absolute; inset: 18px;
          border: 0.5px solid rgba(184,150,12,0.3); border-radius: 1px;
        }
        /* Background watermark */
        .watermark {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 180px; opacity: 0.04; pointer-events: none;
          font-family: 'Playfair Display', serif; color: #1a3a6b;
          letter-spacing: 10px; white-space: nowrap;
        }
        /* Content */
        .cert-inner { position: relative; z-index: 1; text-align: center; padding: 0 60px; width: 100%; }
        .cert-header { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 6px; }
        .seal { font-size: 44px; }
        .uni-name { font-family: 'Playfair Display', serif; font-size: 28px; color: #1a3a6b; letter-spacing: 3px; font-weight: 700; }
        .uni-sub { font-size: 10px; color: #888; letter-spacing: 4px; text-transform: uppercase; margin-top: 2px; }
        .divider { width: 300px; height: 1px; background: linear-gradient(90deg, transparent, #b8960c, transparent); margin: 10px auto; }
        .cert-title { font-family: 'IM Fell English', serif; font-size: 13px; letter-spacing: 4px; text-transform: uppercase; color: #888; margin: 8px 0 4px; }
        .cert-presents { font-size: 11px; color: #aaa; margin-bottom: 6px; font-style: italic; }
        .student-name { font-family: 'Playfair Display', serif; font-size: 46px; color: #b8960c; font-style: italic; margin: 8px 0; line-height: 1.1; }
        .cert-body { font-size: 12px; color: #555; line-height: 2; margin: 6px 0; }
        .cert-body strong { color: #1a2340; }
        .grade-badge { display: inline-block; background: #f0fff4; border: 2px solid #1a6b3c; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 20px; font-weight: 700; color: #1a6b3c; margin: 6px 0; }
        .cert-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; padding: 0 20px; }
        .sig-line { text-align: center; }
        .sig-name { font-family: 'Playfair Display', serif; font-size: 13px; color: #1a3a6b; border-top: 1px solid #1a3a6b; padding-top: 4px; min-width: 140px; }
        .sig-title { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
        .cert-id-box { background: #f8f8f8; border: 1px solid #eee; border-radius: 4px; padding: 6px 12px; text-align: center; }
        .cert-id-label { font-size: 8px; color: #aaa; text-transform: uppercase; letter-spacing: 1px; }
        .cert-id-val { font-family: monospace; font-size: 11px; color: #1a3a6b; font-weight: 700; letter-spacing: 1px; }
        .cert-url { font-size: 8px; color: #aaa; margin-top: 2px; }
      </style></head>
      <body>
        <div class="cert-page">
          <div class="outer-border"></div>
          <div class="inner-border"></div>
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>
          <div class="watermark">CU</div>
          <div class="cert-inner">
            <div class="cert-header">
              <div class="seal">🎓</div>
              <div>
                <div class="uni-name">CAMAARO UNIVERSITY</div>
                <div class="uni-sub">Empowering Minds · Shaping Futures</div>
              </div>
            </div>
            <div class="divider"></div>
            <div class="cert-title">Certificate of Achievement</div>
            <div class="cert-presents">This is to certify that</div>
            <div class="student-name">${student?.name || 'Student Name'}</div>
            <div class="cert-body">
              Student ID: <strong>${student?.studentId || 'N/A'}</strong> &nbsp;|&nbsp;
              Department: <strong>${student?.department || 'N/A'}</strong>
            </div>
            <div class="cert-body">
              has successfully completed the examination<br>
              <strong>"${result.exam?.title}"</strong><br>
              in <strong>${result.course?.title} (${result.course?.code})</strong><br>
              with a score of <strong>${result.marksObtained}/${result.totalMarks} (${result.percentage}%)</strong>
              &nbsp;·&nbsp; GPA: <strong>${result.gpa?.toFixed(2)}</strong>
            </div>
            <div class="grade-badge">${result.grade}</div>
            <div class="divider" style="width:200px"></div>
            <div class="cert-footer">
              <div class="sig-line">
                <div class="sig-name">University Registrar</div>
                <div class="sig-title">Registrar's Office</div>
              </div>
              <div class="cert-id-box">
                <div class="cert-id-label">Certificate ID</div>
                <div class="cert-id-val">${verifyCode}</div>
                <div class="cert-url">Verify: ${verifyUrl}</div>
              </div>
              <div class="sig-line">
                <div class="sig-name">${issueDate}</div>
                <div class="sig-title">Date of Issue</div>
              </div>
            </div>
          </div>
        </div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(verifyCode);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="certificate-wrapper">
      {/* Preview */}
      <div ref={printRef} style={{
        background: '#fffef8',
        border: '12px double #b8960c',
        borderRadius: 4,
        padding: '40px 50px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Georgia, serif',
      }}>
        {/* Watermark */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 160, opacity: 0.03, fontWeight: 700, color: '#1a3a6b', pointerEvents: 'none',
        }}>CU</div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 4 }}>
            <span style={{ fontSize: 42 }}>🎓</span>
            <div>
              <div style={{ fontSize: 22, color: '#1a3a6b', fontWeight: 700, letterSpacing: 3 }}>CAMAARO UNIVERSITY</div>
              <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 4, textTransform: 'uppercase' }}>Empowering Minds · Shaping Futures</div>
            </div>
          </div>

          <div style={{ width: 280, height: 1, background: 'linear-gradient(90deg,transparent,#b8960c,transparent)', margin: '10px auto' }} />

          <div style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>Certificate of Achievement</div>
          <div style={{ fontSize: 12, color: '#aaa', fontStyle: 'italic', marginBottom: 6 }}>This is to certify that</div>

          <div style={{ fontSize: 38, color: '#b8960c', fontStyle: 'italic', margin: '8px 0', lineHeight: 1.1 }}>
            {student?.name || 'Student Name'}
          </div>

          <div style={{ fontSize: 13, color: '#555', lineHeight: 2, margin: '6px 0' }}>
            Student ID: <strong style={{ color: '#1a2340' }}>{student?.studentId || 'N/A'}</strong> &nbsp;|&nbsp;
            Department: <strong style={{ color: '#1a2340' }}>{student?.department || 'N/A'}</strong>
          </div>

          <div style={{ fontSize: 13, color: '#555', lineHeight: 2 }}>
            has successfully completed the examination<br />
            <strong style={{ color: '#1a2340' }}>"{result.exam?.title}"</strong><br />
            in <strong style={{ color: '#1a2340' }}>{result.course?.title} ({result.course?.code})</strong><br />
            with a score of <strong>{result.marksObtained}/{result.totalMarks} ({result.percentage}%)</strong>
            &nbsp;·&nbsp; GPA: <strong>{result.gpa?.toFixed(2)}</strong>
          </div>

          <div style={{
            display: 'inline-block', background: '#f0fff4', border: '2px solid #1a6b3c',
            borderRadius: '50%', width: 56, height: 56, lineHeight: '52px',
            fontSize: 20, fontWeight: 700, color: '#1a6b3c', margin: '10px 0',
          }}>{result.grade}</div>

          <div style={{ width: 180, height: 1, background: 'linear-gradient(90deg,transparent,#b8960c,transparent)', margin: '8px auto' }} />

          {/* Footer row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, padding: '0 10px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#1a3a6b', borderTop: '1px solid #1a3a6b', paddingTop: 4, minWidth: 120 }}>University Registrar</div>
              <div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Registrar's Office</div>
            </div>
            <div style={{ textAlign: 'center', background: '#f8f8f8', border: '1px solid #eee', borderRadius: 6, padding: '6px 14px' }}>
              <div style={{ fontSize: 8, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>Certificate ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#1a3a6b', fontWeight: 700, letterSpacing: 1 }}>{verifyCode}</div>
              <div style={{ fontSize: 8, color: '#aaa', marginTop: 2 }}>{verifyUrl}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#1a3a6b', borderTop: '1px solid #1a3a6b', paddingTop: 4, minWidth: 120 }}>{issueDate}</div>
              <div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Date of Issue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="cert-actions">
        <button className="btn-primary" onClick={handlePrint}>🖨 Print Certificate</button>
        <button className="btn-secondary" onClick={copyCode}>
          {copying ? '✓ Copied!' : '📋 Copy Certificate ID'}
        </button>
        <div className="cert-verify-hint">
          Certificate ID: <strong>{verifyCode}</strong> — shareable for verification
        </div>
      </div>
    </div>
  );
};

/* ─── Public Certificate Verifier ─────────────────────────────── */
export const CertificateVerifier = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`/api/auth/verify-certificate/${code.trim()}`);
      const data = await res.json();
      if (data.success) setResult(data.certificate);
      else setError(data.message || 'Certificate not found');
    } catch {
      setError('Failed to verify. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="cert-verifier">
      <div className="cert-verifier-card">
        <div className="cert-verifier-header">
          <span className="cert-verifier-icon">🔍</span>
          <h2>Certificate Verification</h2>
          <p>Enter the certificate ID to verify its authenticity</p>
        </div>

        <form onSubmit={handleVerify} className="cert-verify-form">
          <input
            type="text" placeholder="e.g. CAMR-A1B2C3D4E5F6"
            value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="cert-code-input" maxLength={20}
          />
          <button type="submit" className="btn-primary" disabled={loading || !code.trim()}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        {error && (
          <div className="cert-verify-result invalid">
            <span>❌</span>
            <div><strong>Invalid Certificate</strong><p>{error}</p></div>
          </div>
        )}

        {result && (
          <div className="cert-verify-result valid">
            <div className="cvr-header"><span className="cvr-check">✅</span><strong>Certificate Verified!</strong></div>
            <div className="cvr-details">
              {[
                ['Student Name', result.studentName],
                ['Student ID', result.studentId],
                ['Email', result.email],
                ['Department', result.department],
                ['Exam', result.examTitle],
                ['Course', `${result.courseTitle} (${result.courseCode})`],
              ].map(([label, val]) => (
                <div key={label} className="cvr-row"><span>{label}</span><strong>{val}</strong></div>
              ))}
              <div className="cvr-row"><span>Grade</span><strong style={{ color: '#1a6b3c', fontSize: '1.2rem' }}>{result.grade}</strong></div>
              <div className="cvr-row"><span>Score</span><strong>{result.percentage}%</strong></div>
              <div className="cvr-row"><span>Issued</span><strong>{new Date(result.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
              <div className="cvr-row"><span>Cert ID</span><code>{result.verifyCode}</code></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateCard;
