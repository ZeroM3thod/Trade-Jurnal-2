'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// ── helpers ──────────────────────────────────────────────────────────────────
export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function fmt(n)       { return '$' + Math.abs(Number(n) || 0).toFixed(2); }
export function fmtSigned(n) { return (n >= 0 ? '+' : '-') + fmt(n); }

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── hook ─────────────────────────────────────────────────────────────────────
export function useJournal() {
  const todayRef = useRef(null);
  if (!todayRef.current) {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    todayRef.current = t;
  }
  const today = todayRef.current;

  const [cur,          setCur]          = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [trades,       setTrades]       = useState({});
  const [allTrades,    setAllTrades]    = useState({});
  const [transactions, setTransactions] = useState([]);
  const [accounts,     setAccounts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // ── fetch helpers ──────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setTransactions(await res.json());
    } catch (e) { console.error('[useJournal] fetchTransactions:', e); setError(e.message); }
  }, []);

  const fetchAllTrades = useCallback(async () => {
    try {
      const res = await fetch('/api/trades');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const data = await res.json();
      const map = {};
      data.forEach(t => { map[t.date] = t; });
      setAllTrades(map);
    } catch (e) { console.error('[useJournal] fetchAllTrades:', e); setError(e.message); }
  }, []);

  const fetchTrades = useCallback(async (year, month) => {
    try {
      const res = await fetch(`/api/trades?year=${year}&month=${month + 1}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const data = await res.json();
      const map = {};
      data.forEach(t => { map[t.date] = t; });
      setTrades(prev => ({ ...prev, ...map }));
    } catch (e) { console.error('[useJournal] fetchTrades:', e); setError(e.message); }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setAccounts(await res.json());
    } catch (e) { console.error('[useJournal] fetchAccounts:', e); setError(e.message); }
  }, []);

  // ── initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchTrades(today.getFullYear(), today.getMonth()),
        fetchAllTrades(),
        fetchTransactions(),
        fetchAccounts(),
      ]);
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── navigation ─────────────────────────────────────────────────────────────
  const goMonth = useCallback((delta) => {
    setCur(prev => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      fetchTrades(next.getFullYear(), next.getMonth());
      return next;
    });
  }, [fetchTrades]);

  const goToday = useCallback(() => {
    setCur(new Date(today.getFullYear(), today.getMonth(), 1));
    fetchTrades(today.getFullYear(), today.getMonth());
  }, [fetchTrades, today]);

  // ── save trade ─────────────────────────────────────────────────────────────
  const saveTrade = useCallback(async (payload) => {
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const saved = await res.json();
      setTrades(prev    => ({ ...prev,    [saved.date]: saved }));
      setAllTrades(prev => ({ ...prev,    [saved.date]: saved }));
      return true;
    } catch (e) {
      console.error('[useJournal] saveTrade:', e);
      alert(`Failed to save trade: ${e.message}`);
      return false;
    }
  }, []);

  // ── delete trade ───────────────────────────────────────────────────────────
  const deleteTrade = useCallback(async (date) => {
    try {
      const res = await fetch(`/api/trades?date=${date}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setTrades(prev    => { const n = { ...prev };    delete n[date]; return n; });
      setAllTrades(prev => { const n = { ...prev };    delete n[date]; return n; });
      return true;
    } catch (e) {
      console.error('[useJournal] deleteTrade:', e);
      alert(`Failed to delete trade: ${e.message}`);
      return false;
    }
  }, []);

  // ── save transaction ───────────────────────────────────────────────────────
  const saveTransaction = useCallback(async ({ date, type, amount, time, note }) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, type, amount, time, note }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const saved = await res.json();
      setTransactions(prev => [...prev, saved]);
      return true;
    } catch (e) {
      console.error('[useJournal] saveTransaction:', e);
      alert(`Failed to save transaction: ${e.message}`);
      return false;
    }
  }, []);

  // ── delete transaction ─────────────────────────────────────────────────────
  const deleteTransaction = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (e) {
      console.error('[useJournal] deleteTransaction:', e);
      alert(`Failed to delete transaction: ${e.message}`);
      return false;
    }
  }, []);

  // ── save account ───────────────────────────────────────────────────────────
  const saveAccount = useCallback(async (payload) => {
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const saved = await res.json();
      setAccounts(prev => [...prev, saved]);
      return saved;
    } catch (e) {
      console.error('[useJournal] saveAccount:', e);
      alert(`Failed to save account: ${e.message}`);
      return null;
    }
  }, []);

  // ── delete account ─────────────────────────────────────────────────────────
  const deleteAccount = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setAccounts(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (e) {
      console.error('[useJournal] deleteAccount:', e);
      alert(`Failed to delete account: ${e.message}`);
      return false;
    }
  }, []);

  // ── computed stats ─────────────────────────────────────────────────────────
  const stats = useCallback(() => {
    let totalDep=0, totalWd=0, totalProfit=0, totalLoss=0;
    let tradeDays=0, profitDays=0, lossDays=0;

    transactions.forEach(t => {
      if (t.type === 'deposit') totalDep += Number(t.amount) || 0;
      else                      totalWd  += Number(t.amount) || 0;
    });

    Object.values(allTrades).forEach(t => {
      if (!t.traded) return;
      tradeDays++;
      if (t.pnl === 'profit') { totalProfit += Number(t.amount) || 0; profitDays++; }
      else                    { totalLoss   += Number(t.amount) || 0; lossDays++;   }
    });

    const pnl     = totalProfit - totalLoss;
    const balance = totalDep - totalWd + pnl;
    const winRate = tradeDays > 0 ? Math.round(profitDays / tradeDays * 100) : null;
    return { totalDep, totalWd, totalProfit, totalLoss, tradeDays, profitDays, lossDays, pnl, balance, winRate };
  }, [allTrades, transactions]);

  // ── asset performance (for dashboard) ─────────────────────────────────────
  const assetStats = useCallback(() => {
    const map = {};
    Object.values(allTrades).forEach(t => {
      if (!t.traded || !t.asset_name) return;
      const key = t.asset_name.toUpperCase();
      if (!map[key]) map[key] = { asset: key, profit: 0, loss: 0, trades: 0, wins: 0 };
      map[key].trades++;
      if (t.pnl === 'profit') { map[key].profit += Number(t.amount) || 0; map[key].wins++; }
      else                    { map[key].loss   += Number(t.amount) || 0; }
    });
    return Object.values(map)
      .map(a => ({ ...a, net: a.profit - a.loss, winRate: Math.round(a.wins / a.trades * 100) }))
      .sort((a,b) => b.net - a.net);
  }, [allTrades]);

  // ── cumulative P&L series (for chart) ─────────────────────────────────────
  const pnlSeries = useCallback(() => {
    const sorted = Object.values(allTrades)
      .filter(t => t.traded)
      .sort((a,b) => a.date.localeCompare(b.date));

    let cum = 0;
    return sorted.map(t => {
      const delta = t.pnl === 'profit' ? Number(t.amount) : -Number(t.amount);
      cum += delta;
      return { date: t.date, pnl: delta, cumPnl: parseFloat(cum.toFixed(2)) };
    });
  }, [allTrades]);

  // ── trades by status ───────────────────────────────────────────────────────
  const tradesByStatus = useCallback((status) => {
    return Object.values(allTrades)
      .filter(t => {
        if (status === 'win')     return t.traded && t.pnl === 'profit';
        if (status === 'loss')    return t.traded && t.pnl === 'loss';
        if (status === 'pending') return t.status === 'open' || t.status === 'pending';
        return true;
      })
      .sort((a,b) => b.date.localeCompare(a.date));
  }, [allTrades]);

  // ── sorted deposit / withdrawal lists ─────────────────────────────────────
  const sortedTxns = useCallback(() => {
    const deps = transactions.filter(t => t.type === 'deposit').sort((a,b) => a.date.localeCompare(b.date));
    const wds  = transactions.filter(t => t.type === 'withdraw').sort((a,b) => a.date.localeCompare(b.date));
    return { deps, wds };
  }, [transactions]);

  // ── transactions by date ───────────────────────────────────────────────────
  const txnsByDate = useCallback((dateStr) => {
    return transactions.filter(t => t.date === dateStr);
  }, [transactions]);

  return {
    today, cur, trades, allTrades, transactions, accounts, loading, error,
    goMonth, goToday,
    saveTrade, deleteTrade,
    saveTransaction, deleteTransaction,
    saveAccount, deleteAccount,
    stats, assetStats, pnlSeries, tradesByStatus,
    sortedTxns, txnsByDate,
  };
}