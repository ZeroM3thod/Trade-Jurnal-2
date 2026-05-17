'use client';
import { MONTHS } from '@/hooks/useJournal';

export default function Topbar({ cur, onPrev, onNext, onToday, onOpenDeposit, onMobMenu, onLogoClick, isDashboard }) {
  return (
    <div className="topbar">
      <button className="mob-menu-btn" onClick={onMobMenu} aria-label="Open menu">
        <svg viewBox="0 0 22 22">
          <line x1="3" y1="6"  x2="19" y2="6" />
          <line x1="3" y1="11" x2="19" y2="11"/>
          <line x1="3" y1="16" x2="19" y2="16"/>
        </svg>
      </button>

      {/* Logo — click to toggle dashboard */}
      <button
        className="cal-logo"
        onClick={onLogoClick}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8, transition: 'background .15s' }}
        title={isDashboard ? 'Back to Calendar' : 'Open Dashboard'}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="6" fill="#1a73e8"/>
          {isDashboard ? (
            /* Dashboard icon — chart bars */
            <>
              <rect x="5"  y="18" width="5" height="9" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="13" y="12" width="5" height="15" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="21" y="7" width="5" height="20" rx="1.5" fill="white" opacity="0.9"/>
              <polyline points="7.5,17 15.5,10 23.5,5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            </>
          ) : (
            /* Calendar icon */
            <>
              <rect x="5"    y="5"  width="22" height="5" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="5"    y="12" width="7"  height="7" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="12.5" y="12" width="7"  height="7" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="20"   y="12" width="7"  height="7" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="5"    y="21" width="7"  height="6" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="12.5" y="21" width="7"  height="6" rx="1.5" fill="white" opacity="0.9"/>
            </>
          )}
        </svg>
        <span className="cal-logo-text">
          {isDashboard ? <>Trading <span>Dashboard</span></> : <>Trading <span>Journal</span></>}
        </span>
      </button>

      {/* Month nav — only in calendar view */}
      {!isDashboard && (
        <div className="month-nav">
          <button className="icon-btn" onClick={onPrev} aria-label="Previous month">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="11,4 6,9 11,14"/>
            </svg>
          </button>
          <button className="icon-btn" onClick={onNext} aria-label="Next month">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="7,4 12,9 7,14"/>
            </svg>
          </button>
          <span className="month-label">{MONTHS[cur.getMonth()]} {cur.getFullYear()}</span>
        </div>
      )}

      {isDashboard && <div style={{ flex: 1 }}/>}

      {!isDashboard && (
        <>
          <button className="today-btn" onClick={onToday}>Today</button>
          <div className="spacer"/>
        </>
      )}

      <button className="add-btn" onClick={() => onOpenDeposit('deposit')}>
        <svg viewBox="0 0 16 16">
          <line x1="8" y1="2" x2="8" y2="14"/>
          <line x1="2" y1="8" x2="14" y2="8"/>
        </svg>
        <span>Add deposit / withdrawal</span>
      </button>
    </div>
  );
}