const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
      return true;
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({ from: `"Camaaro University" <${process.env.SMTP_USER}>`, to, subject, html });
    return true;
  } catch (err) {
    console.error('Email error:', err.message);
    return false;
  }
};

const templates = {
  passwordReset: (name, url) => ({
    subject: 'Camaaro University — Password Reset',
    html: `<div style="font-family:sans-serif;padding:32px;background:#f4f6fb;border-radius:12px;max-width:500px;margin:auto"><h2 style="color:#1a3a6b">🔑 Password Reset</h2><p>Salaan ${name},</p><p>Codsashada password dib u dejinta:</p><a href="${url}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#1a3a6b;color:#fff;border-radius:8px;text-decoration:none">Dib u Deji Password</a><p style="color:#888;font-size:13px">Wuxuu dhacayaa 1 saac.</p></div>`,
  }),
  twoFA: (name, code) => ({
    subject: 'Camaaro University — 2FA Code',
    html: `<div style="font-family:sans-serif;padding:32px;background:#f4f6fb;border-radius:12px;max-width:500px;margin:auto"><h2 style="color:#1a3a6b">🔐 Code Xaqiijinta</h2><p>Salaan ${name},</p><div style="background:#1a3a6b;color:#fff;font-size:36px;font-weight:700;letter-spacing:12px;text-align:center;padding:20px;border-radius:8px;margin:16px 0">${code}</div><p style="color:#888;font-size:13px">10 daqiiqo gudaheeda buu dhacayaa.</p></div>`,
  }),
  resultNotify: (name, examTitle, grade, score) => ({
    subject: `Natiijadaada: ${examTitle}`,
    html: `<div style="font-family:sans-serif;padding:32px;background:#f4f6fb;border-radius:12px;max-width:500px;margin:auto"><h2 style="color:#1a6b3c">🎓 Natiijadaada Diyaar</h2><p>Salaan ${name},</p><p>Imtixaanka <strong>${examTitle}</strong>:</p><div style="background:#fff;border-radius:8px;padding:16px;text-align:center"><div style="font-size:48px;font-weight:700;color:#1a3a6b">${grade}</div><div>${score}%</div></div></div>`,
  }),
  examReminder: (name, title, date) => ({
    subject: `Xusuusnow: ${title}`,
    html: `<div style="font-family:sans-serif;padding:32px;background:#f4f6fb;border-radius:12px;max-width:500px;margin:auto"><h2 style="color:#1a3a6b">📝 Imtixaan Xusuusnow</h2><p>Salaan ${name},</p><p>Imtixaankaaga <strong>${title}</strong> wuxuu dhacayaa <strong>${new Date(date).toLocaleString()}</strong>.</p></div>`,
  }),
};

module.exports = { sendEmail, templates };
