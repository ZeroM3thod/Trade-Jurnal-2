'use client';
import { dateKey, fmt } from '@/hooks/useJournal';

const DOW = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

export default function Calendar({ cur, today, trades, txnsByDate, onDayClick }) {
  const y = cur.getFullYear();
  const m = cur.getMonth();

  // Build 42-cell grid
  const first = new Date(y, m, 1).getDay();
  const last  = new Date(y, m+1, 0).getDate();
  const cells = [];

  for (let i = 0; i < first; i++) {
    cells.push({ d: new Date(y, m, 1 - first + i), other: true });
  }
  for (let d = 1; d <= last; d++) {
    cells.push({ d: new Date(y, m, d), other: false });
  }
  while (cells.length < 42) {
    const d = new Date(y, m, last + cells.length - last - first + 1);
    cells.push({ d, other: true });
  }

  return (
    <div className="cal-main">
      {/* Day-of-week header */}
      <div className="dow-row">
        {DOW.map(d => <div key={d} className="dow-cell">{d}</div>)}
      </div>

      {/* Day cells */}
      <div className="days-grid">
        {cells.map(({ d, other }, i) => {
          const k    = dateKey(d);
          const txns = txnsByDate(k);
          const hasDep = txns.some(t => t.type === 'deposit');
          const isToday = d.getTime() === today.getTime();

          // trades[k] is now an array (or undefined)
          const dayTrades   = trades[k] || [];
          const closedTrades = dayTrades.filter(t => t.traded && t.pnl && t.status === 'closed');
          const pendingTrades = dayTrades.filter(t => t.traded && (t.status === 'open' || t.status === 'pending'));
          const dayProfit = closedTrades.filter(t => t.pnl === 'profit').reduce((s, t) => s + Number(t.amount), 0);
          const dayLoss   = closedTrades.filter(t => t.pnl === 'loss').reduce((s, t)   => s + Number(t.amount), 0);
          const dayNet    = dayProfit - dayLoss;
          const hasTraded = closedTrades.length > 0;

          let cellClass = 'day-cell';
          if (other) cellClass += ' other-month';
          if (hasTraded) {
            cellClass += dayNet >= 0 ? ' profit-day' : ' loss-day';
          } else if (hasDep) {
            cellClass += ' deposit-day';
          }

          // Show up to 2 trade badges + overflow count
          const tradeBadges = dayTrades.filter(t => t.traded);
          const MAX_BADGES  = 2;
          const overflow    = tradeBadges.length - MAX_BADGES;

          return (
            <div key={i} className={cellClass} onClick={() => onDayClick(d)}>
              <div className={`day-num${isToday ? ' today' : ''}`}>{d.getDate()}</div>
              <div className="day-badges">
                {tradeBadges.slice(0, MAX_BADGES).map((tr, idx) => {
                  let badgeClass = 'day-badge';
                  if (tr.status === 'closed' && tr.pnl === 'profit') badgeClass += ' p';
                  else if (tr.status === 'closed' && tr.pnl === 'loss') badgeClass += ' l';
                  else badgeClass += ' p'; // pending/open — reuse green slot visually
                  return (
                    <div key={tr.id || idx} className={badgeClass}>
                      {tr.asset_name ? tr.asset_name.slice(0, 6) + ' ' : ''}
                      {tr.status !== 'closed'
                        ? '⏳'
                        : `${tr.pnl === 'profit' ? '+' : '-'}${fmt(tr.amount)}`}
                    </div>
                  );
                })}
                {overflow > 0 && (
                  <div className="day-badge" style={{ color: 'var(--text3)', background: 'var(--surface2)', fontSize: 9 }}>
                    +{overflow} more
                  </div>
                )}
                {txns.map(t => (
                  <div key={t.id} className={`day-badge ${t.type === 'deposit' ? 'd' : 'w'}`}>
                    {t.type === 'deposit' ? '↓ Dep ' : '↑ Wd '}{fmt(t.amount)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}