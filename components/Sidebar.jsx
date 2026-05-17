'use client';
import { fmt, fmtSigned } from '@/hooks/useJournal';

export default function Sidebar({ stats, sortedTxns, onOpenDeposit, mobOpen }) {
  const s = stats();
  const { deps, wds } = sortedTxns();

  return (
    <div className={`sidebar${mobOpen ? ' mob-open' : ''}`}>
      {/* ── Overview stats ── */}
      <div className="sb-section">
        <div className="sb-label">Overview</div>
        <div className="stat-grid">
          <div className="stat-card full">
            <div className="sc-label">Account Balance</div>
            <div className="sc-val blue">{fmt(s.balance)}</div>
            <div className="sc-sub">Deposits: {fmt(s.totalDep)} · Withdrawals: {fmt(s.totalWd)}</div>
          </div>

          <div className="stat-card">
            <div className="sc-label">Total P&amp;L</div>
            <div className={`sc-val ${s.pnl >= 0 ? 'profit' : 'loss'}`}>{fmtSigned(s.pnl)}</div>
          </div>

          <div className="stat-card">
            <div className="sc-label">Trading Days</div>
            <div className="sc-val blue">{s.tradeDays}</div>
            <div className="sc-sub">days logged</div>
          </div>

          <div className="stat-card">
            <div className="sc-label">Profit Days</div>
            <div className="sc-val profit">{s.profitDays}</div>
          </div>

          <div className="stat-card">
            <div className="sc-label">Loss Days</div>
            <div className="sc-val loss">{s.lossDays}</div>
          </div>

          <div className="stat-card">
            <div className="sc-label">Win Rate</div>
            <div className={`sc-val ${s.winRate === null ? '' : s.winRate >= 50 ? 'profit' : 'loss'}`}>
              {s.winRate !== null ? `${s.winRate}%` : '—'}
            </div>
          </div>

          <div className="stat-card">
            <div className="sc-label">Deposits</div>
            <div className="sc-val profit">{fmt(s.totalDep)}</div>
          </div>

          <div className="stat-card">
            <div className="sc-label">Withdrawals</div>
            <div className="sc-val loss">{fmt(s.totalWd)}</div>
          </div>
        </div>
      </div>

      {/* ── Deposits list ── */}
      <div className="sb-section">
        <div className="sb-label">Deposits</div>
        <div className="txn-list">
          {deps.length === 0
            ? <div className="empty-note">No deposits yet</div>
            : deps.map(t => (
              <div key={t.id} className="txn-item">
                <div className="txn-left">
                  <div className="txn-date">{t.date}{t.time ? ` · ${t.time}` : ''}</div>
                  {t.note && <div className="txn-note">{t.note}</div>}
                </div>
                <span className="txn-amt pos">+{fmt(t.amount)}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── Withdrawals list ── */}
      <div className="sb-section">
        <div className="sb-label">Withdrawals</div>
        <div className="txn-list">
          {wds.length === 0
            ? <div className="empty-note">No withdrawals yet</div>
            : wds.map(t => (
              <div key={t.id} className="txn-item">
                <div className="txn-left">
                  <div className="txn-date">{t.date}{t.time ? ` · ${t.time}` : ''}</div>
                  {t.note && <div className="txn-note">{t.note}</div>}
                </div>
                <span className="txn-amt neg">-{fmt(t.amount)}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="sb-actions">
        <button className="sb-act-btn dep" onClick={() => onOpenDeposit('deposit')}>
          <svg viewBox="0 0 16 16"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
          Add deposit
        </button>
        <button className="sb-act-btn wd" onClick={() => onOpenDeposit('withdraw')}>
          <svg viewBox="0 0 16 16"><line x1="2" y1="8" x2="14" y2="8"/></svg>
          Add withdrawal
        </button>
      </div>
    </div>
  );
}