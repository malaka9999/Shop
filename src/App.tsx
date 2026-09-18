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
import { OtherView } from './components/OtherView';
import { ChevronLeft } from 'lucide-react';

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
          {/* Breadcrumb back button when inside an Other sub-module */}
          {['cash', 'credit', 'expenses', 'reports', 'settings'].includes(activeTab) && (
            <div className="mb-3 flex items-center justify-between bg-white border border-neutral-200/90 rounded-2xl px-3 py-2 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('other')}
                className="text-xs font-black text-neutral-800 hover:text-emerald-800 flex items-center gap-1.5 active:scale-95 transition"
              >
                <ChevronLeft size={16} className="text-emerald-700" />
                <span>← Back to Other (වෙනත් අංශ වෙත)</span>
              </button>
            </div>
          )}

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

          {activeTab === 'workers' && <WorkerView />}

          {activeTab === 'other' && (
            <OtherView
              onNavigate={handleNavigateTab}
              onOpenSettings={(sec) => {
                setSettingsSection(sec || 'general');
                setActiveTab('settings');
              }}
            />
          )}

          {activeTab === 'credit' && (
            <CreditView
              initialAction={creditAction}
              onClearAction={() => setCreditAction(undefined)}
            />
          )}

          {activeTab === 'expenses' && <ExpenseView />}

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
