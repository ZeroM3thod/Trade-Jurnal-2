'use client';

const NAV = [
  { id: 'overview',  icon: '⬡', label: 'Overview'       },
  { id: 'pending',   icon: '⏳', label: 'Pending Trades' },
  { id: 'wins',      icon: '📈', label: 'Win Trades'     },
  { id: 'losses',    icon: '📉', label: 'Loss Trades'    },
  { id: 'accounts',  icon: '🏦', label: 'Accounts'       },
];

export default function DashboardSidebar({ active, onNav, stats, mobOpen }) {
  const s = stats();

  return (
    <div className={`sidebar${mobOpen ? ' mob-open' : ''}`} style={{ gap: 0 }}>

      {/* Nav items */}
      <div style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div className="sb-label" style={{ padding: '4px 8px 8px' }}>Dashboard</div>
        {NAV.map(n => (
          <button key={n.id}
            className="sb-act-btn"
            style={{
              justifyContent: 'flex-start',
              background: active === n.id ? 'var(--blue-bg)' : 'none',
              color:      active === n.id ? 'var(--blue)' : 'var(--text)',
              borderColor: active === n.id ? 'var(--blue-border)' : 'transparent',
              fontWeight: active === n.id ? 500 : 400,
              fontSize: 13,
              gap: 10,
            }}
            onClick={() => onNav(n.id)}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>{n.icon}</span>
            {n.label}
            {n.id === 'pending' && s.pendingCount > 0 && (
              <span style={{
                marginLeft: 'auto', background: 'rgba(253,214,99,0.2)',
                color: 'var(--gold)', fontSize: 10, fontWeight: 600,
                padding: '1px 6px', borderRadius: 10,
              }}>{s.pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="section-divider" style={{ margin: '4px 16px' }}/>

      {/* Quick stats */}
      <div className="sb-section" style={{ borderTop: 'none' }}>
        <div className="sb-label">Quick Stats</div>
        <div className="stat-grid">
          <div className="stat-card full">
            <div className="sc-label">Account Balance</div>
            <div className="sc-val blue">${Math.abs(s.balance).toFixed(2)}</div>
            <div className="sc-sub">{s.pnl >= 0 ? '▲' : '▼'} ${Math.abs(s.pnl).toFixed(2)} P&L</div>
          </div>
          <div className="stat-card">
            <div className="sc-label">Win Rate</div>
            <div className={`sc-val ${s.winRate === null ? '' : s.winRate >= 50 ? 'profit' : 'loss'}`}>
              {s.winRate !== null ? `${s.winRate}%` : '—'}
            </div>
          </div>
          <div className="stat-card">
            <div className="sc-label">Total Trades</div>
            <div className="sc-val blue">{s.tradeDays}</div>
          </div>
        </div>
      </div>
    </div>
  );
}