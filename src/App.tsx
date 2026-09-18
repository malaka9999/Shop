import React, { useState } from 'react';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import { Navbar, BottomNav } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { LorryView } from './components/LorryView';
import { ShopView } from './components/ShopView';
import { CreditView } from './components/CreditView';
import { ExpenseView } from './components/ExpenseView';
import { WorkerView } from './components/WorkerView';
import { CashView } from './components/CashView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useBusiness();
  const [shopCategoryFilter, setShopCategoryFilter] = useState<'fuel' | 'oil' | undefined>(undefined);
  const [creditAction, setCreditAction] = useState<'payment' | 'credit_sale' | undefined>(undefined);
  const [settingsSection, setSettingsSection] = useState<'prices' | 'lorries' | 'workers' | 'general'>('prices');

  const handleOpenSettingsPrices = () => {
    setSettingsSection('prices');
    setActiveTab('settings');
  };

  const handleNavigateTab = (tab: any) => {
    if (tab !== 'shop') {
      setShopCategoryFilter(undefined);
    }
    if (tab !== 'credit') {
      setCreditAction(undefined);
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans antialiased selection:bg-emerald-200">
      <div className="max-w-md mx-auto min-h-screen bg-neutral-50 shadow-2xl flex flex-col relative border-x border-neutral-200/80">
        {/* Persistent Top Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          onNavigate={handleNavigateTab}
          onOpenSettings={() => {
            setSettingsSection('general');
            setActiveTab('settings');
          }}
        />

        {/* Main Body View Switching */}
        <main className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'home' && (
            <HomeView
              onNavigate={handleNavigateTab}
              onOpenQuickTrip={() => setActiveTab('lorries')}
              onOpenQuickSale={(cat) => {
                setShopCategoryFilter(cat);
                setActiveTab('shop');
              }}
              onOpenQuickCredit={() => {
                setCreditAction('credit_sale');
                setActiveTab('credit');
              }}
              onOpenQuickPayment={() => {
                setCreditAction('payment');
                setActiveTab('credit');
              }}
              onOpenQuickExpense={() => setActiveTab('expenses')}
              onOpenQuickTransfer={() => setActiveTab('cash')}
              onOpenSettingsPrices={handleOpenSettingsPrices}
            />
          )}

          {activeTab === 'lorries' && <LorryView />}

          {activeTab === 'shop' && (
            <ShopView
              onOpenSettingsPrices={handleOpenSettingsPrices}
              initialCategoryFilter={shopCategoryFilter}
            />
          )}

          {activeTab === 'credit' && (
            <CreditView
              initialAction={creditAction}
              onClearAction={() => setCreditAction(undefined)}
            />
          )}

          {activeTab === 'expenses' && <ExpenseView />}

          {activeTab === 'workers' && <WorkerView />}

          {activeTab === 'cash' && <CashView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'settings' && (
            <SettingsView initialSection={settingsSection} />
          )}
        </main>

        {/* Persistent Bottom Navigation Tabs */}
        <BottomNav activeTab={activeTab} onNavigate={handleNavigateTab} />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BusinessProvider>
      <AppContent />
    </BusinessProvider>
  );
}
