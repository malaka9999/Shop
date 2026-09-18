import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatDateDisplay, getTodayDateString } from '../utils/formatters';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  Truck,
  ShoppingBag,
  CreditCard,
  Receipt,
  Users,
  Wallet,
  FileText,
  Home,
  Cloud,
} from 'lucide-react';
import { ActiveTab } from '../types';

export interface NavbarProps {
  onOpenSearch?: () => void;
  onOpenSettings?: () => void;
  activeTab?: ActiveTab;
  onNavigate?: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, onOpenSettings, activeTab: propActiveTab, onNavigate }) => {
  const { selectedDate, setSelectedDate, isToday, language, firebaseSyncStatus } = useBusiness();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const setDateToToday = () => {
    setSelectedDate(getTodayDateString());
  };

  return (
    <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md select-none">
      <div className="max-w-4xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & App Title */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 border border-emerald-600 flex items-center justify-center font-bold text-lg text-emerald-100 shadow-inner">
            🇱🇰
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight flex items-center gap-1.5">
              <span>Lanka Manager</span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-900/70 text-emerald-200 font-semibold border border-emerald-700/50">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-emerald-200/90 font-medium">
              {language === 'si'
                ? 'ලොරි & කඩේ කළමනාකරණය'
                : language === 'en'
                ? 'Lorry & Shop Manager'
                : 'ලොරි & කඩේ • Lorry & Shop'}
            </p>
          </div>
        </div>

        {/* Date Selector Banner */}
        <div className="flex items-center bg-emerald-900/80 rounded-xl p-1 border border-emerald-700/60 shadow-inner">
          <button
            type="button"
            onClick={() => changeDateByDays(-1)}
            aria-label="Previous day"
            className="p-1 hover:bg-emerald-800 rounded-lg text-emerald-200 hover:text-white transition active:scale-95"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-2 py-0.5 text-center flex items-center gap-1 text-xs font-bold text-emerald-50 hover:text-white"
          >
            <Calendar size={13} className="text-emerald-300" />
            <span>{isToday ? 'TODAY' : formatDateDisplay(selectedDate)}</span>
          </button>

          <button
            type="button"
            onClick={() => changeDateByDays(1)}
            aria-label="Next day"
            className="p-1 hover:bg-emerald-800 rounded-lg text-emerald-200 hover:text-white transition active:scale-95"
          >
            <ChevronRight size={18} />
          </button>

          {!isToday && (
            <button
              type="button"
              onClick={setDateToToday}
              className="ml-1 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded shadow-sm"
            >
              Today
            </button>
          )}
        </div>

        {/* Global Action Icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            id="btn-global-cloud"
            onClick={onOpenSettings}
            title={
              firebaseSyncStatus === 'connected'
                ? 'Firebase Cloud Synced (Real-time)'
                : firebaseSyncStatus === 'connecting'
                ? 'Connecting to Firebase...'
                : 'Offline Storage'
            }
            aria-label="Firebase Cloud Sync Status"
            className="w-9 h-9 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-100 hover:text-white transition active:scale-90 relative"
          >
            <Cloud size={18} />
            <span
              className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-emerald-900 ${
                firebaseSyncStatus === 'connected'
                  ? 'bg-emerald-300 animate-pulse'
                  : firebaseSyncStatus === 'connecting'
                  ? 'bg-amber-400'
                  : 'bg-neutral-400'
              }`}
            />
          </button>

          <button
            type="button"
            id="btn-global-search"
            onClick={onOpenSearch}
            title="Global Search"
            aria-label="Search"
            className="w-9 h-9 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-100 hover:text-white transition active:scale-90"
          >
            <Search size={18} />
          </button>

          <button
            type="button"
            id="btn-global-settings"
            onClick={onOpenSettings}
            title="Settings & Prices"
            aria-label="Settings"
            className="w-9 h-9 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-100 hover:text-white transition active:scale-90"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Embedded Datepicker Popup if toggled */}
      {showDatePicker && (
        <div className="bg-emerald-950 px-4 py-2 flex items-center justify-center gap-3 border-t border-emerald-800/80">
          <label className="text-xs text-emerald-200 font-medium">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedDate(e.target.value);
                setShowDatePicker(false);
              }
            }}
            className="bg-emerald-900 text-white text-xs px-2 py-1 rounded border border-emerald-700 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowDatePicker(false)}
            className="text-xs text-emerald-300 hover:text-white underline"
          >
            Close
          </button>
        </div>
      )}
    </header>
  );
};

export interface BottomNavProps {
  activeTab?: ActiveTab;
  onNavigate?: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab: propActiveTab, onNavigate }) => {
  const { activeTab: ctxActiveTab, setActiveTab } = useBusiness();
  const activeTab = propActiveTab || ctxActiveTab;

  const handleSelect = (tab: ActiveTab) => {
    if (onNavigate) onNavigate(tab);
    setActiveTab(tab);
  };

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    labelSi: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
    { id: 'lorries', label: 'Lorry', labelSi: 'ලොරි', icon: Truck },
    { id: 'shop', label: 'Shop', labelSi: 'කඩේ', icon: ShoppingBag },
    { id: 'workers', label: 'Workers', labelSi: 'සේවකයින්', icon: Users },
    { id: 'home', label: 'Home', labelSi: 'මුල් පිටුව', icon: Home },
    { id: 'cash', label: 'Cash', labelSi: 'මුදල්', icon: Wallet },
    { id: 'credit', label: 'Credit', labelSi: 'ණය', icon: CreditCard },
    { id: 'expenses', label: 'Expenses', labelSi: 'වියදම්', icon: Receipt },
    { id: 'reports', label: 'Reports', labelSi: 'වාර්තා', icon: FileText },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-neutral-200 shadow-lg select-none">
      <div className="max-w-4xl mx-auto px-1 flex items-center justify-around overflow-x-auto py-1.5 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`flex flex-col items-center justify-center min-w-[48px] py-1 px-1.5 rounded-xl transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-emerald-800 font-extrabold bg-emerald-50 scale-105'
                  : 'text-neutral-500 hover:text-neutral-900 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  isActive ? 'bg-emerald-700 text-white shadow-sm' : 'text-neutral-500'
                }`}
              >
                <Icon size={18} />
              </div>
              <span className="text-[10px] mt-0.5 leading-none whitespace-nowrap">
                {item.label}
              </span>
              <span className="text-[9px] text-neutral-400 font-normal leading-none mt-0.5 whitespace-nowrap">
                {item.labelSi}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
