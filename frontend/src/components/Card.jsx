const Card = ({ title, value, subtitle, icon, color = '#1a3a6b', onClick }) => {
  return (
    <div
      className={`stat-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ '--card-accent': color }}
    >
      <div className="card-icon" style={{ background: color + '18', color }}>
        {icon}
      </div>
      <div className="card-content">
        <div className="card-value">{value ?? '—'}</div>
        <div className="card-title">{title}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
      <div className="card-bar" style={{ background: color }} />
    </div>
  );
};

export default Card;
