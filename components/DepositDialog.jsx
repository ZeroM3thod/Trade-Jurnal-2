'use client';
import { useState, useEffect } from 'react';

export default function DepositDialog({ initialType, accounts = [], onSave, onClose }) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const [type,      setType]      = useState(initialType || 'deposit');
  const [date,      setDate]      = useState(todayStr);
  const [amount,    setAmount]    = useState('');
  const [time,      setTime]      = useState('');
  const [note,      setNote]      = useState('');
  const [accountId, setAccountId] = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    setType(initialType || 'deposit');
    setDate(todayStr);
    setAmount('');
    setTime('');
    setNote('');
    setAccountId('');
  }, [initialType]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSave = date && amount && parseFloat(amount) > 0 && accountId;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await onSave({
      date,
      type,
      amount: parseFloat(amount),
      time,
      note:       note.trim(),
      account_id: parseInt(accountId),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dialog" style={{ maxWidth: 420 }}>
        <div className="dlg-header">
          <div className="dlg-title">
            {type === 'deposit' ? 'Add deposit' : 'Add withdrawal'}
          </div>
          <button className="dlg-close" onClick={onClose}>&#x2715;</button>
        </div>

        <div className="dlg-body">
          {/* Type tabs */}
          <div style={{ margin: '-20px -20px 14px' }}>
            <div className="dlg-tabs">
              <button className={`dlg-tab${type === 'deposit'  ? ' active' : ''}`} onClick={() => setType('deposit')}>Deposit</button>
              <button className={`dlg-tab${type === 'withdraw' ? ' active' : ''}`} onClick={() => setType('withdraw')}>Withdrawal</button>
            </div>
          </div>

          {/* Account — required */}
          <div>
            <div className="form-label">Account <span style={{ color: 'var(--loss-text)' }}>*</span></div>
            <select className="inp" value={accountId} onChange={e => setAccountId(e.target.value)}>
              <option value="">— Select account —</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.broker ? ` (${a.broker})` : ''}
                </option>
              ))}
            </select>
            {accounts.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                No accounts yet — add one from Dashboard → Accounts.
              </div>
            )}
          </div>

          <div>
            <div className="form-label">Date <span style={{ color: 'var(--loss-text)' }}>*</span></div>
            <input className="inp" type="date" value={date} onChange={e => setDate(e.target.value)}/>
          </div>

          <div>
            <div className="form-label">Amount (USD) <span style={{ color: 'var(--loss-text)' }}>*</span></div>
            <div className="amount-wrap">
              <span className="currency">$</span>
              <input className="inp" type="number" min="0.01" step="0.01" placeholder="0.00"
                style={{ flex: 1 }} value={amount} onChange={e => setAmount(e.target.value)}/>
            </div>
          </div>

          <div>
            <div className="form-label">Time (optional)</div>
            <input className="inp" type="time" value={time} onChange={e => setTime(e.target.value)}/>
          </div>

          <div>
            <div className="form-label">Note (optional)</div>
            <input className="inp" type="text" placeholder="e.g. Bank transfer, Binance…"
              value={note} onChange={e => setNote(e.target.value)}/>
          </div>
        </div>

        <div className="dlg-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !canSave}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}