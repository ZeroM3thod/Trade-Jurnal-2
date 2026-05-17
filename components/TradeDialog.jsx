'use client';
import { useState, useEffect, useRef } from 'react';
import { MONTHS, dateKey, fmt } from '@/hooks/useJournal';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const COMMON_ASSETS = [
  'EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD','USD/CHF','NZD/USD',
  'BTC/USD','ETH/USD','BNB/USD','SOL/USD','XRP/USD','ADA/USD',
  'AAPL','TSLA','NVDA','AMZN','MSFT','META','GOOGL',
  'GOLD','SILVER','OIL','SPX500','NAS100','DOW30',
];

export default function TradeDialog({ date, existing, accounts, onSave, onDelete, onClose }) {
  const [tab,         setTab]         = useState('trade');
  const [traded,      setTraded]      = useState(null);
  const [status,      setStatus]      = useState('pending');   // default = pending
  const [pnl,         setPnl]         = useState(null);
  const [amount,      setAmount]      = useState('');
  const [note,        setNote]        = useState('');
  const [accountId,   setAccountId]   = useState('');
  const [assetName,   setAssetName]   = useState('');
  const [lots,        setLots]        = useState('');
  const [margin,      setMargin]      = useState('');
  const [entryPrice,  setEntryPrice]  = useState('');
  const [exitPrice,   setExitPrice]   = useState('');
  const [entryTime,   setEntryTime]   = useState('');
  const [exitTime,    setExitTime]    = useState('');
  const [direction,   setDirection]   = useState(null);
  const [reason,      setReason]      = useState('');
  const [screenshot,  setScreenshot]  = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [assetDropdown, setAssetDropdown] = useState(false);
  const assetRef = useRef(null);

  useEffect(() => {
    if (existing) {
      setTraded(existing.traded);
      setPnl(existing.pnl || null);
      setStatus(existing.status || 'pending');
      setAmount(existing.amount ? String(existing.amount) : '');
      setNote(existing.note || '');
      setAccountId(existing.account_id ? String(existing.account_id) : '');
      setAssetName(existing.asset_name || '');
      setLots(existing.lots ? String(existing.lots) : '');
      setMargin(existing.margin ? String(existing.margin) : '');
      setEntryPrice(existing.entry_price ? String(existing.entry_price) : '');
      setExitPrice(existing.exit_price ? String(existing.exit_price) : '');
      setEntryTime(existing.entry_time || '');
      setExitTime(existing.exit_time || '');
      setDirection(existing.direction || null);
      setReason(existing.trade_reason || '');
      setScreenshotPreview(existing.screenshot_url || null);
    } else {
      setTraded(null); setPnl(null); setStatus('pending'); setAmount(''); setNote('');
      setAccountId(''); setAssetName(''); setLots(''); setMargin('');
      setEntryPrice(''); setExitPrice(''); setEntryTime(''); setExitTime('');
      setDirection(null); setReason('');
      setScreenshot(null); setScreenshotPreview(null);
    }
    setTab('trade');
  }, [existing, date]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (assetRef.current && !assetRef.current.contains(e.target)) setAssetDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!date) return null;

  const title    = `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  const subtitle = DAYS[date.getDay()];
  const k        = dateKey(date);

  const filteredAssets = assetName
    ? COMMON_ASSETS.filter(a => a.toLowerCase().includes(assetName.toLowerCase()))
    : COMMON_ASSETS.slice(0, 8);

  // Upload screenshot to local public/trade folder
  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (traded === null) return;
    setSaving(true);

    // Upload screenshot to public/trade/
    let screenshotUrl = existing?.screenshot_url || null;
    if (screenshot) {
      try {
        const fd = new FormData();
        fd.append('file', screenshot);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (res.ok) {
          const { url } = await res.json();
          screenshotUrl = url;
        }
      } catch (err) {
        console.warn('Screenshot upload failed:', err);
      }
    }

    await onSave({
      date:           k,
      traded,
      status:         traded ? status : 'closed',
      pnl:            traded ? (pnl || null) : null,
      amount:         traded ? (parseFloat(amount) || 0) : 0,
      note:           traded ? note.trim() : null,
      account_id:     accountId ? parseInt(accountId) : null,
      asset_name:     assetName.trim() || null,
      lots:           lots       ? parseFloat(lots)       : null,
      margin:         margin     ? parseFloat(margin)     : null,
      entry_price:    entryPrice ? parseFloat(entryPrice) : null,
      exit_price:     exitPrice  ? parseFloat(exitPrice)  : null,
      entry_time:     entryTime  || null,
      exit_time:      exitTime   || null,
      direction:      direction  || null,
      trade_reason:   reason.trim() || null,
      screenshot_url: screenshotUrl,
    });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    setSaving(true);
    await onDelete(k);
    setSaving(false);
    onClose();
  };

  const isClosed = status === 'closed';

  return (
    <div className="overlay" role="dialog" aria-modal="true"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dialog" style={{ maxWidth: 460 }}>

        {/* Header */}
        <div className="dlg-header">
          <div>
            <div className="dlg-title">{title}</div>
            <div className="dlg-subtitle">{subtitle}</div>
          </div>
          <button className="dlg-close" onClick={onClose}>&#x2715;</button>
        </div>

        {/* Tab bar */}
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="dlg-tabs" style={{ margin: 0 }}>
            <button className={`dlg-tab${tab === 'trade'   ? ' active' : ''}`} onClick={() => setTab('trade')}>Trade</button>
            <button className={`dlg-tab${tab === 'details' ? ' active' : ''}`} onClick={() => setTab('details')}>Details</button>
            <button className={`dlg-tab${tab === 'notes'   ? ' active' : ''}`} onClick={() => setTab('notes')}>Notes &amp; Media</button>
          </div>
        </div>

        <div className="dlg-body" style={{ maxHeight: '62vh', overflowY: 'auto' }}>

          {/* ── TAB: Trade ── */}
          {tab === 'trade' && (
            <>
              {/* Did you trade? */}
              <div>
                <div className="form-label">Did you trade today?</div>
                <div className="choice-row">
                  <button className={`choice-btn${traded === true  ? ' active' : ''}`} onClick={() => setTraded(true)}>Yes, I traded</button>
                  <button className={`choice-btn${traded === false ? ' active' : ''}`} onClick={() => setTraded(false)}>No trade today</button>
                </div>
              </div>

              {traded === true && (
                <>
                  {/* Status */}
                  <div>
                    <div className="form-label">Trade Status</div>
                    <div className="choice-row" style={{ gap: 6 }}>
                      {['pending','open','closed'].map(s => (
                        <button key={s} className={`choice-btn${status === s ? ' active' : ''}`}
                          style={{ textTransform: 'capitalize', fontSize: 12 }}
                          onClick={() => setStatus(s)}>
                          {s === 'pending' ? '⏳ Pending' : s === 'open' ? '🔴 Open' : '✅ Closed'}
                        </button>
                      ))}
                    </div>
                    {status === 'pending' && (
                      <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 6, padding: '5px 10px', background: 'rgba(253,214,99,0.08)', borderRadius: 'var(--radius)' }}>
                        Trade will appear in Pending Trades. You can close it later from the Dashboard.
                      </div>
                    )}
                  </div>

                  {/* Account */}
                  <div>
                    <div className="form-label">Account</div>
                    <select className="inp" value={accountId} onChange={e => setAccountId(e.target.value)}>
                      <option value="">— Select account —</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}{a.broker ? ` (${a.broker})` : ''}</option>
                      ))}
                    </select>
                    {accounts.length === 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                        No accounts yet — add one from Dashboard → Accounts.
                      </div>
                    )}
                  </div>

                  {/* Asset */}
                  <div ref={assetRef} style={{ position: 'relative' }}>
                    <div className="form-label">Asset / Symbol</div>
                    <input className="inp" type="text" placeholder="e.g. EUR/USD, BTC/USD, TSLA…"
                      value={assetName}
                      onChange={e => { setAssetName(e.target.value); setAssetDropdown(true); }}
                      onFocus={() => setAssetDropdown(true)}
                      autoComplete="off"
                    />
                    {assetDropdown && filteredAssets.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
                        background: 'var(--surface)', border: '1px solid var(--border2)',
                        borderRadius: 'var(--radius)', marginTop: 2, maxHeight: 180, overflowY: 'auto',
                        boxShadow: 'var(--shadow)',
                      }}>
                        {filteredAssets.map(a => (
                          <div key={a}
                            style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text)', transition: 'background .1s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}
                            onMouseDown={() => { setAssetName(a); setAssetDropdown(false); }}>
                            {a}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Direction */}
                  <div>
                    <div className="form-label">Position</div>
                    <div className="choice-row">
                      <button className={`choice-btn${direction === 'long'  ? ' active' : ''}`}
                        style={direction === 'long'  ? { borderColor: 'var(--profit-text)', background: 'var(--profit-bg)', color: 'var(--profit-text)' } : {}}
                        onClick={() => setDirection('long')}>📈 Long (Buy)</button>
                      <button className={`choice-btn${direction === 'short' ? ' active' : ''}`}
                        style={direction === 'short' ? { borderColor: 'var(--loss-text)',   background: 'var(--loss-bg)',   color: 'var(--loss-text)'   } : {}}
                        onClick={() => setDirection('short')}>📉 Short (Sell)</button>
                    </div>
                  </div>

                  {/* Entry Price + Entry Time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div className="form-label">Entry Price</div>
                      <input className="inp" type="number" step="any" placeholder="0.00000"
                        value={entryPrice} onChange={e => setEntryPrice(e.target.value)}/>
                    </div>
                    <div>
                      <div className="form-label">Entry Time</div>
                      <input className="inp" type="time" value={entryTime} onChange={e => setEntryTime(e.target.value)}/>
                    </div>
                  </div>

                  {/* Result + Exit fields — only for closed trades */}
                  {isClosed && (
                    <>
                      <div>
                        <div className="form-label">Result</div>
                        <div className="pnl-row">
                          <button className={`pnl-chip profit${pnl === 'profit' ? ' active' : ''}`} onClick={() => setPnl('profit')}>📈 Profit</button>
                          <button className={`pnl-chip loss${pnl   === 'loss'   ? ' active' : ''}`} onClick={() => setPnl('loss')}>📉 Loss</button>
                        </div>
                      </div>

                      <div>
                        <div className="form-label">P&amp;L Amount (USD)</div>
                        <div className="amount-wrap">
                          <span className="currency">$</span>
                          <input className="inp" type="number" min="0" step="0.01" placeholder="0.00"
                            style={{ flex: 1 }} value={amount} onChange={e => setAmount(e.target.value)}/>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <div className="form-label">Exit Price</div>
                          <input className="inp" type="number" step="any" placeholder="0.00000"
                            value={exitPrice} onChange={e => setExitPrice(e.target.value)}/>
                        </div>
                        <div>
                          <div className="form-label">Exit Time</div>
                          <input className="inp" type="time" value={exitTime} onChange={e => setExitTime(e.target.value)}/>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {traded === false && (
                <div style={{ fontSize: 13, color: 'var(--text2)', padding: '4px 0' }}>
                  This day will be marked as a rest day — no colour on the calendar.
                </div>
              )}
            </>
          )}

          {/* ── TAB: Details ── */}
          {tab === 'details' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="form-label">Lot Size</div>
                  <input className="inp" type="number" step="0.01" min="0" placeholder="0.01"
                    value={lots} onChange={e => setLots(e.target.value)}/>
                </div>
                <div>
                  <div className="form-label">Margin Used (USD)</div>
                  <div className="amount-wrap">
                    <span className="currency">$</span>
                    <input className="inp" type="number" step="0.01" min="0" placeholder="0.00"
                      style={{ flex: 1 }} value={margin} onChange={e => setMargin(e.target.value)}/>
                  </div>
                </div>
              </div>

              {/* Price delta preview */}
              {entryPrice && exitPrice && direction && (
                <div style={{
                  padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: 12,
                  background: (() => {
                    const diff = parseFloat(exitPrice) - parseFloat(entryPrice);
                    const isP = direction === 'long' ? diff > 0 : diff < 0;
                    return isP ? 'var(--profit-bg)' : 'var(--loss-bg)';
                  })(),
                  color: (() => {
                    const diff = parseFloat(exitPrice) - parseFloat(entryPrice);
                    const isP = direction === 'long' ? diff > 0 : diff < 0;
                    return isP ? 'var(--profit-text)' : 'var(--loss-text)';
                  })(),
                }}>
                  Price Δ: {(parseFloat(exitPrice) - parseFloat(entryPrice)).toFixed(5)}
                  {' '}({direction === 'long'
                    ? (parseFloat(exitPrice) > parseFloat(entryPrice) ? '↑ profitable' : '↓ loss')
                    : (parseFloat(exitPrice) < parseFloat(entryPrice) ? '↑ profitable' : '↓ loss')})
                </div>
              )}

              {(lots || margin) && (
                <div style={{
                  display: 'flex', gap: 12, padding: '8px 12px',
                  background: 'var(--surface2)', borderRadius: 'var(--radius)', fontSize: 12,
                }}>
                  {lots   && <span style={{ color: 'var(--text2)' }}>Lots: <strong style={{ color: 'var(--text)' }}>{lots}</strong></span>}
                  {margin && <span style={{ color: 'var(--text2)' }}>Margin: <strong style={{ color: 'var(--text)' }}>${parseFloat(margin).toFixed(2)}</strong></span>}
                  {lots && margin && (
                    <span style={{ color: 'var(--text2)', marginLeft: 'auto' }}>
                      Leverage: <strong style={{ color: 'var(--blue)' }}>
                        ~{(parseFloat(margin) > 0 ? (parseFloat(lots) * 100000 / parseFloat(margin)).toFixed(0) : '—')}:1
                      </strong>
                    </span>
                  )}
                </div>
              )}

              <div>
                <div className="form-label">Short Note (optional)</div>
                <input className="inp" type="text" placeholder="e.g. BTC breakout, EUR/USD trend follow…"
                  value={note} onChange={e => setNote(e.target.value)}/>
              </div>
            </>
          )}

          {/* ── TAB: Notes & Media ── */}
          {tab === 'notes' && (
            <>
              <div>
                <div className="form-label">Trade Reason / Analysis</div>
                <textarea className="inp" rows={7}
                  placeholder="Describe your trade rationale, setup, market conditions, emotions, mistakes, what you learned…"
                  style={{ resize: 'vertical', lineHeight: 1.6, minHeight: 140 }}
                  value={reason} onChange={e => setReason(e.target.value)}/>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, textAlign: 'right' }}>
                  {reason.length} characters
                </div>
              </div>

              {/* Screenshot upload */}
              <div>
                <div className="form-label">Trade Screenshot</div>
                {screenshotPreview ? (
                  <div style={{ position: 'relative' }}>
                    <img src={screenshotPreview} alt="Trade screenshot"
                      style={{
                        width: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border2)',
                        maxHeight: 220, objectFit: 'cover', cursor: 'pointer',
                      }}
                      onClick={() => window.open(screenshotPreview, '_blank')}
                    />
                    <button style={{
                      position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.75)',
                      border: 'none', color: '#fff', borderRadius: '50%', width: 26, height: 26,
                      cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                      onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}>✕</button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '24px 16px', border: '1.5px dashed var(--border2)',
                    borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'background .15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>Click to upload screenshot</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>PNG, JPG, WEBP — auto-saved to /public/trade/</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleScreenshotChange}/>
                  </label>
                )}
              </div>
            </>
          )}

          {/* Existing entry summary */}
          {existing && (
            <div style={{ marginTop: 4 }}>
              <div className="section-divider"/>
              <div className="info-row">
                <span>Saved entry</span>
                <span className="info-val">
                  {existing.traded
                    ? `${existing.pnl === 'profit' ? '+' : existing.pnl === 'loss' ? '-' : ''}${existing.pnl ? fmt(existing.amount) : 'pending'}${existing.asset_name ? ` · ${existing.asset_name}` : ''}`
                    : 'No trade'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="dlg-footer">
          {existing && (
            <button className="btn btn-danger" style={{ marginRight: 'auto' }}
              onClick={handleDelete} disabled={saving}>
              Delete
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || traded === null}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}