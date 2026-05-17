'use client';
import { useState } from 'react';
import { useJournal, dateKey } from '@/hooks/useJournal';
import Topbar           from '@/components/Topbar';
import Sidebar          from '@/components/Sidebar';
import DashboardSidebar from '@/components/DashboardSidebar';
import Calendar         from '@/components/Calendar';
import Dashboard        from '@/components/Dashboard';
import TradeDialog      from '@/components/TradeDialog';
import DepositDialog    from '@/components/DepositDialog';

export default function HomePage() {
  const journal = useJournal();

  const [isDashboard, setIsDashboard] = useState(false);
  const [dashSection, setDashSection] = useState('overview');
  const [tradeDate,   setTradeDate]   = useState(null);
  const [depType,     setDepType]     = useState(null);
  const [mobSidebar,  setMobSidebar]  = useState(false);

  const openTradeDialog  = (d) => setTradeDate(d);
  const closeTradeDialog = ()  => setTradeDate(null);
  const openDepDialog    = (t) => setDepType(t);
  const closeDepDialog   = ()  => setDepType(null);

  const toggleDashboard = () => {
    setIsDashboard(prev => !prev);
    setMobSidebar(false);
  };

  if (journal.loading) {
    return <div className="loading-overlay">Loading your journal…</div>;
  }

  const statsWithPending = () => {
    const s = journal.stats();
    const pendingCount = journal.tradesByStatus('pending').length;
    return { ...s, pendingCount };
  };

  // Trades for the selected date (now an array)
  const tradeDateKey      = tradeDate ? dateKey(tradeDate) : null;
  const existingDayTrades = tradeDateKey ? (journal.trades[tradeDateKey] || []) : [];

  return (
    <div className="app">
      {mobSidebar && (
        <div className="sidebar-overlay open" onClick={() => setMobSidebar(false)}/>
      )}

      <Topbar
        cur={journal.cur}
        onPrev={() => journal.goMonth(-1)}
        onNext={() => journal.goMonth(+1)}
        onToday={journal.goToday}
        onOpenDeposit={openDepDialog}
        onMobMenu={() => setMobSidebar(true)}
        onLogoClick={toggleDashboard}
        isDashboard={isDashboard}
      />

      <div className="body">
        {isDashboard ? (
          <DashboardSidebar
            active={dashSection}
            onNav={(s) => { setDashSection(s); setMobSidebar(false); }}
            stats={statsWithPending}
            mobOpen={mobSidebar}
          />
        ) : (
          <Sidebar
            stats={journal.stats}
            sortedTxns={journal.sortedTxns}
            onOpenDeposit={(type) => { openDepDialog(type); setMobSidebar(false); }}
            mobOpen={mobSidebar}
          />
        )}

        {isDashboard ? (
          <div style={{ flex: 1, overflow: 'hidden auto' }}>
            <Dashboard
              activeSection={dashSection}
              stats={statsWithPending}
              assetStats={journal.assetStats}
              pnlSeries={journal.pnlSeries}
              tradesByStatus={journal.tradesByStatus}
              allTrades={journal.allTrades}
              accounts={journal.accounts}
              saveAccount={journal.saveAccount}
              deleteAccount={journal.deleteAccount}
              saveTrade={journal.saveTrade}
            />
          </div>
        ) : (
          <Calendar
            cur={journal.cur}
            today={journal.today}
            trades={journal.trades}
            txnsByDate={journal.txnsByDate}
            onDayClick={openTradeDialog}
          />
        )}
      </div>

      {/* Trade Dialog — existing is now an array of trades for that day */}
      {tradeDate && (
        <TradeDialog
          date={tradeDate}
          existing={existingDayTrades}
          accounts={journal.accounts}
          onSave={journal.saveTrade}
          onDelete={journal.deleteTrade}
          onClose={closeTradeDialog}
        />
      )}

      {/* Deposit/Withdrawal Dialog */}
      {depType && (
        <DepositDialog
          initialType={depType}
          accounts={journal.accounts}
          onSave={journal.saveTransaction}
          onClose={closeDepDialog}
        />
      )}
    </div>
  );
}