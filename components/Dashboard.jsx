'use client';
import { useState, useMemo } from 'react';
import { fmt, fmtSigned } from '@/hooks/useJournal';

// ── Tiny inline chart components (no external deps) ──────────────────────────

function Sparkline({ data, color = 'var(--blue)', height = 40 }) {
  if (!data || data.length < 2) return <div style={{ height }} />;
  const vals = data.map(d => d.cumPnl);
  const min  = Math.min(...vals);
  const max  = Math.max(...vals);
  const range = max - min || 1;
  const w = 200; const h = height;
  const pts = vals.map((v, i) =>
    `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`
  ).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

function BarChart({ data, maxBars = 8 }) {
  const items = data.slice(0, maxBars);
  if (!items.length) return <div style={{ color: 'var(--text3)', fontSize: 13, padding: '20px 0' }}>No asset data yet.</div>;
  const maxAbs = Math.max(...items.map(d => Math.abs(d.net)), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(item => {
        const pct = Math.abs(item.net) / maxAbs * 100;
        const isPos = item.net >= 0;
        return (
          <div key={item.asset} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 70, fontSize: 11, color: 'var(--text2)', textAlign: 'right', flexShrink: 0, fontWeight: 500 }}>{item.asset}</div>
            <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 4, height: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${pct}%`,
                background: isPos ? 'var(--profit)' : 'var(--loss)',
                borderRadius: 4, opacity: 0.8,
                transition: 'width 0.6s ease',
              }}/>
              <span style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                fontSize: 10, fontWeight: 600,
                color: isPos ? 'var(--profit-text)' : 'var(--loss-text)',
              }}>
                {fmtSigned(item.net)}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', width: 32, textAlign: 'right', flexShrink: 0 }}>{item.winRate}%</div>
          </div>
        );
      })}
    </div>
  );
}

function PnlLineChart({ data }) {
  if (!data || data.length < 2) {
    return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>Not enough trades yet.</div>;
  }
  const vals = data.map(d => d.cumPnl);
  const min  = Math.min(...vals, 0);
  const max  = Math.max(...vals, 0);
  const range = max - min || 1;
  const W = 600; const H = 130;
  const pad = { t: 10, b: 24, l: 48, r: 10 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  const toX = i  => pad.l + (i / (data.length - 1)) * iW;
  const toY = v  => pad.t + iH - ((v - min) / range) * iH;

  const pts = data.map((d, i) => `${toX(i)},${toY(d.cumPnl)}`).join(' ');
  const areaBottom = toY(0);

  // Area path
  const area = `M${pad.l},${areaBottom} ` +
    data.map((d, i) => `L${toX(i)},${toY(d.cumPnl)}`).join(' ') +
    ` L${toX(data.length - 1)},${areaBottom} Z`;

  // Y-axis labels
  const yTicks = [min, (min + max) / 2, max].map(v => ({
    v, y: toY(v), label: (v >= 0 ? '+' : '') + v.toFixed(0),
  }));

  // X-axis: show first, middle, last date labels
  const xTicks = [0, Math.floor((data.length - 1) / 2), data.length - 1]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map(i => ({ i, x: toX(i), label: data[i].date.slice(5) }));

  const isPositive = vals[vals.length - 1] >= 0;
  const lineColor  = isPositive ? 'var(--profit)' : 'var(--loss)';
  const areaColor  = isPositive ? 'rgba(129,201,149,0.15)' : 'rgba(242,139,130,0.12)';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 160 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isPositive ? '#81c995' : '#f28b82'} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={isPositive ? '#81c995' : '#f28b82'} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Zero line */}
      <line x1={pad.l} y1={toY(0)} x2={W - pad.r} y2={toY(0)}
        stroke="var(--border2)" strokeWidth="0.8" strokeDasharray="4 4"/>
      {/* Area */}
      <path d={area} fill="url(#areaGrad)"/>
      {/* Line */}
      <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round"/>
      {/* Y ticks */}
      {yTicks.map(t => (
        <text key={t.v} x={pad.l - 4} y={t.y + 4} textAnchor="end"
          fontSize="9" fill="var(--text3)">{t.label}</text>
      ))}
      {/* X ticks */}
      {xTicks.map(t => (
        <text key={t.i} x={t.x} y={H - 4} textAnchor="middle"
          fontSize="9" fill="var(--text3)">{t.label}</text>
      ))}
    </svg>
  );
}

function DonutChart({ wins, losses }) {
  const total = wins + losses;
  if (!total) return <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 12 }}>No data</div>;
  const winPct = wins / total;
  const r = 28; const cx = 40; const cy = 40; const sw = 10;
  const circ = 2 * Math.PI * r;
  const winArc  = circ * winPct;
  const lossArc = circ * (1 - winPct);
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      {/* Loss arc (background) */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(242,139,130,0.35)" strokeWidth={sw}/>
      {/* Win arc */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="var(--profit)" strokeWidth={sw}
        strokeDasharray={`${winArc} ${circ - winArc}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"/>
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">
        {Math.round(winPct * 100)}%
      </text>
    </svg>
  );
}

// ── Trade Table ───────────────────────────────────────────────────────────────
function TradeTable({ trades, emptyMsg }) {
  if (!trades.length) return (
    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>{emptyMsg}</div>
  );
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Date','Asset','Direction','Status','Entry','Exit','Lots','P&L','Note'].map(h => (
              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map(t => {
            const isProfit = t.pnl === 'profit';
            return (
              <tr key={t.id || t.date} style={{ borderBottom: '1px solid var(--border)', transition: 'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={{ padding: '8px 10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{t.date}</td>
                <td style={{ padding: '8px 10px', fontWeight: 500, color: 'var(--text)' }}>{t.asset_name || '—'}</td>
                <td style={{ padding: '8px 10px' }}>
                  {t.direction ? (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                      background: t.direction === 'long' ? 'var(--profit-bg)' : 'var(--loss-bg)',
                      color: t.direction === 'long' ? 'var(--profit-text)' : 'var(--loss-text)',
                      textTransform: 'uppercase',
                    }}>{t.direction}</span>
                  ) : '—'}
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 10,
                    background: t.status === 'open' ? 'rgba(242,139,130,0.15)' : t.status === 'pending' ? 'rgba(253,214,99,0.12)' : 'var(--surface2)',
                    color: t.status === 'open' ? 'var(--loss-text)' : t.status === 'pending' ? 'var(--gold)' : 'var(--text3)',
                    textTransform: 'capitalize',
                  }}>{t.status || 'closed'}</span>
                </td>
                <td style={{ padding: '8px 10px', color: 'var(--text2)', fontFamily: 'monospace', fontSize: 11 }}>{t.entry_price ?? '—'}</td>
                <td style={{ padding: '8px 10px', color: 'var(--text2)', fontFamily: 'monospace', fontSize: 11 }}>{t.exit_price ?? '—'}</td>
                <td style={{ padding: '8px 10px', color: 'var(--text2)' }}>{t.lots ?? '—'}</td>
                <td style={{ padding: '8px 10px', fontWeight: 600,
                  color: !t.traded ? 'var(--text3)' : isProfit ? 'var(--profit-text)' : 'var(--loss-text)' }}>
                  {t.traded ? `${isProfit ? '+' : '-'}${fmt(t.amount)}` : '—'}
                </td>
                <td style={{ padding: '8px 10px', color: 'var(--text3)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.note || t.trade_reason || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Account Card ──────────────────────────────────────────────────────────────
function AccountCard({ account, trades, onDelete }) {
  const tradedList = Object.values(trades).filter(t => t.traded && String(t.account_id) === String(account.id));
  const profit = tradedList.filter(t => t.pnl === 'profit').reduce((s, t) => s + Number(t.amount), 0);
  const loss   = tradedList.filter(t => t.pnl === 'loss'  ).reduce((s, t) => s + Number(t.amount), 0);
  const pnl    = profit - loss;
  const TYPE_COLOR = { forex: 'var(--blue)', crypto: 'var(--gold)', stocks: 'var(--profit-text)', other: 'var(--text2)' };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{account.name}</div>
          {account.broker && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{account.broker}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
            background: `${TYPE_COLOR[account.type] || 'var(--text2)'}22`,
            color: TYPE_COLOR[account.type] || 'var(--text2)', textTransform: 'uppercase',
          }}>{account.type}</span>
          <button onClick={() => onDelete(account.id)} style={{
            background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
            fontSize: 16, padding: '2px 4px', borderRadius: 4, transition: 'color .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--loss-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>×</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Total P&L</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: pnl >= 0 ? 'var(--profit-text)' : 'var(--loss-text)' }}>{fmtSigned(pnl)}</div>
        </div>
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Trades</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{tradedList.length}</div>
        </div>
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Win Rate</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--blue)' }}>
            {tradedList.length ? Math.round(tradedList.filter(t => t.pnl === 'profit').length / tradedList.length * 100) + '%' : '—'}
          </div>
        </div>
      </div>
      {account.note && (
        <div style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>{account.note}</div>
      )}
    </div>
  );
}

// ── AddAccountDialog ──────────────────────────────────────────────────────────
function AddAccountDialog({ onSave, onClose }) {
  const [name,    setName]    = useState('');
  const [broker,  setBroker]  = useState('');
  const [type,    setType]    = useState('forex');
  const [initial, setInitial] = useState('');
  const [note,    setNote]    = useState('');
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), broker: broker.trim(), type, initial_balance: parseFloat(initial) || 0, note: note.trim() });
    setSaving(false);
    onClose();
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dialog" style={{ maxWidth: 400 }}>
        <div className="dlg-header">
          <div className="dlg-title">Add Account</div>
          <button className="dlg-close" onClick={onClose}>&#x2715;</button>
        </div>
        <div className="dlg-body">
          <div>
            <div className="form-label">Account Name *</div>
            <input className="inp" type="text" placeholder="e.g. IC Markets Live, Binance…"
              value={name} onChange={e => setName(e.target.value)} autoFocus/>
          </div>
          <div>
            <div className="form-label">Broker / Exchange</div>
            <input className="inp" type="text" placeholder="e.g. IC Markets, Binance, TD Ameritrade"
              value={broker} onChange={e => setBroker(e.target.value)}/>
          </div>
          <div>
            <div className="form-label">Account Type</div>
            <div className="choice-row" style={{ flexWrap: 'wrap', gap: 6 }}>
              {['forex','crypto','stocks','other'].map(t => (
                <button key={t} className={`choice-btn${type === t ? ' active' : ''}`}
                  style={{ textTransform: 'capitalize', flex: 'unset', minWidth: 70, fontSize: 12 }}
                  onClick={() => setType(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="form-label">Initial Balance (optional)</div>
            <div className="amount-wrap">
              <span className="currency">$</span>
              <input className="inp" type="number" min="0" step="0.01" placeholder="0.00"
                style={{ flex: 1 }} value={initial} onChange={e => setInitial(e.target.value)}/>
            </div>
          </div>
          <div>
            <div className="form-label">Note (optional)</div>
            <input className="inp" type="text" placeholder="e.g. Prop firm account, demo…"
              value={note} onChange={e => setNote(e.target.value)}/>
          </div>
        </div>
        <div className="dlg-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Add Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, trend }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: color || 'var(--text)', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, sub, children, action }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{sub}</div>}
        </div>
        {action}
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ activeSection, stats, assetStats, pnlSeries, tradesByStatus, allTrades, accounts, saveAccount, deleteAccount }) {
  const [showAddAccount, setShowAddAccount] = useState(false);

  const s         = stats();
  const series    = pnlSeries();
  const assets    = assetStats();
  const bestAsset = assets[0];
  const worstAsset = assets[assets.length - 1];

  // Extend stats with pendingCount
  const pendingTrades = tradesByStatus('pending');

  if (activeSection === 'pending') {
    return (
      <div className="dash-content">
        <Section title="Pending / Open Trades" sub={`${pendingTrades.length} active trade${pendingTrades.length !== 1 ? 's' : ''}`}>
          <TradeTable trades={pendingTrades} emptyMsg="No pending or open trades. Log a trade with status 'Open' or 'Pending'." />
        </Section>
      </div>
    );
  }

  if (activeSection === 'wins') {
    const wins = tradesByStatus('win');
    const totalWin = wins.reduce((s, t) => s + Number(t.amount), 0);
    return (
      <div className="dash-content">
        <div className="kpi-grid" style={{ marginBottom: 16 }}>
          <KpiCard label="Win Trades" value={wins.length} color="var(--profit-text)"/>
          <KpiCard label="Total Profit" value={fmt(totalWin)} color="var(--profit-text)"/>
          <KpiCard label="Avg Win" value={wins.length ? fmt(totalWin / wins.length) : '—'} color="var(--profit-text)"/>
        </div>
        <Section title="Winning Trades">
          <TradeTable trades={wins} emptyMsg="No winning trades yet. Keep going!" />
        </Section>
      </div>
    );
  }

  if (activeSection === 'losses') {
    const losses = tradesByStatus('loss');
    const totalLoss = losses.reduce((s, t) => s + Number(t.amount), 0);
    return (
      <div className="dash-content">
        <div className="kpi-grid" style={{ marginBottom: 16 }}>
          <KpiCard label="Loss Trades" value={losses.length} color="var(--loss-text)"/>
          <KpiCard label="Total Loss" value={fmt(totalLoss)} color="var(--loss-text)"/>
          <KpiCard label="Avg Loss" value={losses.length ? fmt(totalLoss / losses.length) : '—'} color="var(--loss-text)"/>
        </div>
        <Section title="Losing Trades">
          <TradeTable trades={losses} emptyMsg="No losing trades! You're clean." />
        </Section>
      </div>
    );
  }

  if (activeSection === 'accounts') {
    return (
      <div className="dash-content">
        {showAddAccount && (
          <AddAccountDialog onSave={saveAccount} onClose={() => setShowAddAccount(false)} />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>Accounts</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{accounts.length} account{accounts.length !== 1 ? 's' : ''} configured</div>
          </div>
          <button className="add-btn" onClick={() => setShowAddAccount(true)}>
            <svg viewBox="0 0 16 16"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
            <span>Add Account</span>
          </button>
        </div>
        {accounts.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1.5px dashed var(--border2)', borderRadius: 'var(--radius-lg)',
            padding: '48px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏦</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>No accounts yet</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Add your trading accounts to track performance per account.</div>
            <button className="btn btn-primary" onClick={() => setShowAddAccount(true)}>Add your first account</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {accounts.map(a => (
              <AccountCard key={a.id} account={a} trades={allTrades} onDelete={deleteAccount} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Overview (default) ────────────────────────────────────────────────────
  return (
    <div className="dash-content">
      {/* KPI row */}
      <div className="kpi-grid">
        <KpiCard label="Account Balance" value={`$${Math.abs(s.balance).toFixed(2)}`}
          color="var(--blue)" sub={`${s.totalDep > 0 ? `Deposited $${s.totalDep.toFixed(2)}` : 'No deposits'}`}/>
        <KpiCard label="Total P&L" value={fmtSigned(s.pnl)}
          color={s.pnl >= 0 ? 'var(--profit-text)' : 'var(--loss-text)'}
          sub={`${s.profitDays}W / ${s.lossDays}L`}/>
        <KpiCard label="Win Rate" value={s.winRate !== null ? `${s.winRate}%` : '—'}
          color={s.winRate === null ? 'var(--text)' : s.winRate >= 50 ? 'var(--profit-text)' : 'var(--loss-text)'}
          sub={`${s.tradeDays} trading days`}/>
        <KpiCard label="Total Trades" value={s.tradeDays}
          color="var(--text)" sub={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}/>
      </div>

      {/* P&L Chart + Win/Loss donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 14 }}>
        <Section title="Cumulative P&L" sub={series.length ? `${series[0].date} → ${series[series.length - 1].date}` : 'No trades yet'}>
          <PnlLineChart data={series} />
        </Section>

        <Section title="Win / Loss">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <DonutChart wins={s.profitDays} losses={s.lossDays} />
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--profit-text)' }}>● Win</span>
                <span style={{ color: 'var(--text2)', fontWeight: 600 }}>{s.profitDays}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--loss-text)' }}>● Loss</span>
                <span style={{ color: 'var(--text2)', fontWeight: 600 }}>{s.lossDays}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text3)' }}>Avg Win</span>
                <span style={{ color: 'var(--profit-text)', fontWeight: 600 }}>{s.profitDays ? fmt(s.totalProfit / s.profitDays) : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text3)' }}>Avg Loss</span>
                <span style={{ color: 'var(--loss-text)', fontWeight: 600 }}>{s.lossDays ? fmt(s.totalLoss / s.lossDays) : '—'}</span>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Asset performance + best/worst */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 14 }}>
        <Section title="Asset Performance" sub="Net P&L per instrument">
          <BarChart data={assets} />
        </Section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Section title="🏆 Best Asset">
            {bestAsset ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--profit-text)' }}>{bestAsset.asset}</div>
                <div style={{ fontSize: 13, color: 'var(--profit-text)' }}>{fmtSigned(bestAsset.net)}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{bestAsset.trades} trades · {bestAsset.winRate}% win</div>
              </div>
            ) : <div style={{ color: 'var(--text3)', fontSize: 12 }}>No data yet</div>}
          </Section>
          <Section title="⚠️ Worst Asset">
            {worstAsset && worstAsset !== bestAsset ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--loss-text)' }}>{worstAsset.asset}</div>
                <div style={{ fontSize: 13, color: 'var(--loss-text)' }}>{fmtSigned(worstAsset.net)}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{worstAsset.trades} trades · {worstAsset.winRate}% win</div>
              </div>
            ) : <div style={{ color: 'var(--text3)', fontSize: 12 }}>No data yet</div>}
          </Section>
        </div>
      </div>

      {/* Recent trades table */}
      <Section title="Recent Trades" sub="Latest 20 entries across all accounts">
        <TradeTable
          trades={Object.values(allTrades)
            .filter(t => t.traded)
            .sort((a,b) => b.date.localeCompare(a.date))
            .slice(0, 20)}
          emptyMsg="No trades logged yet. Click any day on the calendar to add one."
        />
      </Section>
    </div>
  );
}