import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';

const MyProgress = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { analyticsAPI.myProgress().then(res => setData(res.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>Waa la soo qaadayaa...</div>;
  if (!data || data.trend.length === 0) return (
    <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📈</div>
      <p>Wali natiijo lama grade-gareeyay</p>
    </div>
  );

  const { trend, avgGpa } = data;
  const maxPct = 100;
  const w = 680, h = 220, padding = 36;
  const stepX = trend.length > 1 ? (w - padding*2) / (trend.length - 1) : 0;
  const points = trend.map((t, i) => ({
    x: padding + i * stepX,
    y: padding + (1 - t.percentage / maxPct) * (h - padding*2),
    ...t,
  }));
  const pathD = points.map((p, i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length-1].x} ${h-padding} L ${points[0].x} ${h-padding} Z`;

  return (
    <div style={{ maxWidth: 750 }}>
      <h1 style={{ color:'var(--navy)', marginBottom:'0.25rem' }}>📈 My Progress</h1>
      <p style={{ color:'var(--text-muted)', marginBottom:'1.5rem' }}>GPA-gaaga isbeddelka waqtiga — Cumulative GPA: <strong style={{ color:'var(--navy)' }}>{avgGpa}</strong></p>

      <div style={{ background:'#fff', borderRadius:12, padding:'1.5rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)', marginBottom:'1.5rem', overflowX:'auto' }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', minWidth: 500 }}>
          {[0,25,50,75,100].map(v => (
            <g key={v}>
              <line x1={padding} y1={padding + (1-v/100)*(h-padding*2)} x2={w-padding} y2={padding + (1-v/100)*(h-padding*2)} stroke="var(--border)" strokeWidth="1" />
              <text x={4} y={padding + (1-v/100)*(h-padding*2) + 4} fontSize="10" fill="var(--text-muted)">{v}%</text>
            </g>
          ))}
          <path d={areaD} fill="var(--navy)" opacity="0.08" />
          <path d={pathD} fill="none" stroke="var(--navy)" strokeWidth="2.5" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="var(--navy)" />
              <title>{p.examTitle}: {p.percentage}%</title>
            </g>
          ))}
        </svg>
      </div>

      <div style={{ background:'#fff', borderRadius:12, boxShadow:'var(--shadow)', border:'1px solid var(--border)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{background:'var(--bg)'}}>{['Date','Exam','Course','Score','Grade','GPA'].map(h=><th key={h} style={{padding:'0.7rem 1rem',textAlign:'left',fontSize:'0.8rem',color:'var(--text-muted)'}}>{h}</th>)}</tr></thead>
          <tbody>
            {trend.slice().reverse().map((t,i) => (
              <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                <td style={{padding:'0.6rem 1rem', fontSize:'0.85rem', color:'var(--text-muted)'}}>{new Date(t.date).toLocaleDateString()}</td>
                <td style={{padding:'0.6rem 1rem', fontSize:'0.85rem'}}>{t.examTitle}</td>
                <td style={{padding:'0.6rem 1rem', fontSize:'0.85rem', color:'var(--text-muted)'}}>{t.course}</td>
                <td style={{padding:'0.6rem 1rem', fontSize:'0.85rem', fontWeight:600}}>{t.percentage}%</td>
                <td style={{padding:'0.6rem 1rem', fontSize:'0.85rem', fontWeight:700, color:'var(--navy)'}}>{t.grade}</td>
                <td style={{padding:'0.6rem 1rem', fontSize:'0.85rem'}}>{t.gpa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyProgress;
