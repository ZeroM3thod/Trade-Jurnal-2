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
          const k       = dateKey(d);
          const tr      = trades[k];
          const txns    = txnsByDate(k);
          const hasDep  = txns.some(t => t.type === 'deposit');
          const isToday = d.getTime() === today.getTime();

          let cellClass = 'day-cell';
          if (other) cellClass += ' other-month';
          if (tr?.traded) {
            cellClass += tr.pnl === 'profit' ? ' profit-day' : ' loss-day';
          } else if (hasDep && !tr?.traded) {
            cellClass += ' deposit-day';
          }

          return (
            <div key={i} className={cellClass} onClick={() => onDayClick(d)}>
              <div className={`day-num${isToday ? ' today' : ''}`}>{d.getDate()}</div>
              <div className="day-badges">
                {tr?.traded && (
                  <div className={`day-badge ${tr.pnl === 'profit' ? 'p' : 'l'}`}>
                    {tr.pnl === 'profit' ? '+' : '-'}{fmt(tr.amount)}
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