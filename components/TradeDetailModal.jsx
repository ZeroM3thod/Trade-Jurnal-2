'use client';
import { useState } from 'react';
import { fmt } from '@/hooks/useJournal';

const FIELD = ({ label, value, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: 13, color: color || 'var(--text)', fontWeight: 500 }}>{value || '—'}</div>
  </div>
);

const Badge = ({ children, color, bg }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 12,
    background: bg, color, textTransform: 'uppercase', letterSpacing: '0.5px',
  }}>{children}</span>
);

export default function TradeDetailModal({ trade, accounts = [], onSave, onClose }) {
  const [showClose, setShowClose] = useState(false);
  const [closeResult,   setCloseResult]   = useState(null);
  const [closePnl,      setClosePnl]      = useState('');
  const [closeExitPx,   setCloseExitPx]   = useState(trade.exit_price ? String(trade.exit_price) : '');
  const [closeExitTime, setCloseExitTime] = useState(trade.exit_time  || '');
  const [saving,        setSaving]        = useState(false);
  const [showPw,        setShowPw]        = useState(false);

  const account  = accounts.find(a => String(a.id) === String(trade.account_id));
  const isPending = trade.status === 'open' || trade.status === 'pending';
  const isClosed  = trade.status === 'closed';
  const isProfit  = trade.pnl === 'profit';

  const statusColor = { open: 'var(--loss-text)', pending: 'var(--gold)', closed: 'var(--text2)' };
  const statusBg    = { open: 'rgba(242,139,130,0.15)', pending: 'rgba(253,214,99,0.12)', closed: 'var(--surface3)' };

  const handleCloseTrade = async () => {
    if (!closeResult) return;
    setSaving(true);
    await onSave({
      date:           trade.date,
      traded:         true,
      status:         'closed',
      pnl:            closeResult,
      amount:         parseFloat(closePnl) || 0,
      note:           trade.note       || null,
      account_id:     trade.account_id || null,
      asset_name:     trade.asset_name || null,
      lots:           trade.lots       ?? null,
      margin:         trade.margin     ?? null,
      entry_price:    trade.entry_price ?? null,
      exit_price:     closeExitPx ? parseFloat(closeExitPx) : (trade.exit_price ?? null),
      entry_time:     trade.entry_time || null,
      exit_time:      closeExitTime || null,
      direction:      trade.direction   || null,
      trade_reason:   trade.trade_reason || null,
      screenshot_url: trade.screenshot_url || null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dialog" style={{ maxWidth: 540 }}>

        {/* ── Header ── */}
        <div className="dlg-header" style={{ background: 'var(--surface2)', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div className="dlg-title" style={{ fontSize: 17 }}>
                {trade.asset_name || 'Unknown Asset'}
              </div>
              {trade.direction && (
                <Badge
                  color={trade.direction === 'long' ? 'var(--profit-text)' : 'var(--loss-text)'}
                  bg={trade.direction === 'long' ? 'var(--profit-bg)' : 'var(--loss-bg)'}>
                  {trade.direction === 'long' ? '▲ Long' : '▼ Short'}
                </Badge>
              )}
              <Badge color={statusColor[trade.status] || 'var(--text2)'} bg={statusBg[trade.status] || 'var(--surface3)'}>
                {trade.status || 'closed'}
              </Badge>
              {isClosed && trade.pnl && (
                <Badge
                  color={isProfit ? 'var(--profit-text)' : 'var(--loss-text)'}
                  bg={isProfit ? 'var(--profit-bg)' : 'var(--loss-bg)'}>
                  {isProfit ? `+${fmt(trade.amount)}` : `-${fmt(trade.amount)}`}
                </Badge>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{trade.date}</div>
          </div>
          <button className="dlg-close" onClick={onClose}>&#x2715;</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '68vh', overflowY: 'auto' }}>

          {/* Account info */}
          {account && (
            <div style={{
              background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Account</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{account.name}</div>
                  {account.broker && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{account.broker}</div>}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase',
                  background: 'var(--blue-bg)', color: 'var(--blue)',
                }}>{account.type}</span>
              </div>
              {(account.trader_id || account.trader_password) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
                  {account.trader_id && (
                    <div style={{ fontSize: 11 }}>
                      <span style={{ color: 'var(--text3)' }}>Trader ID: </span>
                      <span style={{ color: 'var(--text)', fontWeight: 600, fontFamily: 'monospace' }}>{account.trader_id}</span>
                    </div>
                  )}
                  {account.trader_password && (
                    <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: 'var(--text3)' }}>Password: </span>
                      <span style={{ color: 'var(--text)', fontWeight: 600, fontFamily: 'monospace' }}>
                        {showPw ? account.trader_password : '••••••••'}
                      </span>
                      <button
                        onClick={() => setShowPw(p => !p)}
                        style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12, padding: '0 2px' }}>
                        {showPw ? '🙈' : '👁'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Price & Time grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <FIELD label="Entry Price" value={trade.entry_price ? Number(trade.entry_price).toFixed(5) : null} color="var(--text)"/>
            <FIELD label="Entry Time"  value={trade.entry_time} color="var(--blue)"/>
            <FIELD label="Exit Price"  value={trade.exit_price  ? Number(trade.exit_price).toFixed(5)  : null} color="var(--text)"/>
            <FIELD label="Exit Time"   value={trade.exit_time}  color="var(--blue)"/>
          </div>

          {/* Lots & Margin */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <FIELD label="Lot Size" value={trade.lots ?? null}/>
            <FIELD label="Margin"   value={trade.margin ? `$${Number(trade.margin).toFixed(2)}` : null}/>
            <FIELD label="Leverage" value={
              trade.lots && trade.margin && Number(trade.margin) > 0
                ? `~${Math.round(Number(trade.lots) * 100000 / Number(trade.margin))}:1`
                : null
            } color="var(--blue)"/>
          </div>

          {/* P&L summary for closed trades */}
          {isClosed && trade.pnl && (
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--radius)',
              background: isProfit ? 'var(--profit-bg)' : 'var(--loss-bg)',
              border: `1px solid ${isProfit ? 'rgba(129,201,149,0.3)' : 'rgba(242,139,130,0.3)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: 13, color: isProfit ? 'var(--profit-text)' : 'var(--loss-text)', fontWeight: 600 }}>
                {isProfit ? '📈 Profit Trade' : '📉 Loss Trade'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: isProfit ? 'var(--profit-text)' : 'var(--loss-text)' }}>
                {isProfit ? '+' : '-'}{fmt(trade.amount)}
              </div>
            </div>
          )}

          {/* Trade reason */}
          {trade.trade_reason && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Trade Reason / Analysis</div>
              <div style={{
                background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '12px 14px',
                fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap',
              }}>{trade.trade_reason}</div>
            </div>
          )}

          {/* Note */}
          {trade.note && (
            <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', padding: '6px 0' }}>
              💬 {trade.note}
            </div>
          )}

          {/* Screenshot */}
          {trade.screenshot_url && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Trade Screenshot</div>
              <img
                src={trade.screenshot_url}
                alt="Trade screenshot"
                style={{
                  width: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border2)',
                  maxHeight: 280, objectFit: 'contain', background: 'var(--surface2)', cursor: 'zoom-in',
                }}
                onClick={() => window.open(trade.screenshot_url, '_blank')}
              />
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, textAlign: 'center' }}>
                Click to open full size
              </div>
            </div>
          )}

          {/* ── Close Pending Trade Section ── */}
          {isPending && (
            <div style={{
              border: '1.5px solid rgba(253,214,99,0.3)', borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setShowClose(p => !p)}
                style={{
                  width: '100%', padding: '12px 16px', background: 'rgba(253,214,99,0.08)',
                  border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  color: 'var(--gold)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-main)',
                }}>
                <span>⏳ Close This Trade</span>
                <span style={{ fontSize: 18, transform: showClose ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>›</span>
              </button>

              {showClose && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--surface2)' }}>
                  {/* Result */}
                  <div>
                    <div className="form-label">Result <span style={{ color: 'var(--loss-text)' }}>*</span></div>
                    <div className="pnl-row">
                      <button className={`pnl-chip profit${closeResult === 'profit' ? ' active' : ''}`} onClick={() => setCloseResult('profit')}>📈 Profit</button>
                      <button className={`pnl-chip loss${closeResult   === 'loss'   ? ' active' : ''}`} onClick={() => setCloseResult('loss')}>📉 Loss</button>
                    </div>
                  </div>

                  {/* PNL Amount */}
                  <div>
                    <div className="form-label">P&amp;L Amount (USD) <span style={{ color: 'var(--loss-text)' }}>*</span></div>
                    <div className="amount-wrap">
                      <span className="currency">$</span>
                      <input className="inp" type="number" min="0" step="0.01" placeholder="0.00"
                        style={{ flex: 1 }} value={closePnl} onChange={e => setClosePnl(e.target.value)}/>
                    </div>
                  </div>

                  {/* Exit Price + Exit Time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div className="form-label">Exit Price</div>
                      <input className="inp" type="number" step="any" placeholder="0.00000"
                        value={closeExitPx} onChange={e => setCloseExitPx(e.target.value)}/>
                    </div>
                    <div>
                      <div className="form-label">Exit Time</div>
                      <input className="inp" type="time" value={closeExitTime} onChange={e => setCloseExitTime(e.target.value)}/>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ alignSelf: 'flex-end' }}
                    disabled={saving || !closeResult || !closePnl || parseFloat(closePnl) <= 0}
                    onClick={handleCloseTrade}>
                    {saving ? 'Saving…' : '✅ Close Trade'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dlg-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}