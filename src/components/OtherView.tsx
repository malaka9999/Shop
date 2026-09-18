import React from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatRs } from '../utils/formatters';
import {
  Wallet,
  CreditCard,
  Receipt,
  FileText,
  Settings,
  ChevronRight,
  LayoutGrid,
  TrendingUp,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface OtherViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenSettings?: (section?: 'prices' | 'lorries' | 'workers' | 'general') => void;
}

export const OtherView: React.FC<OtherViewProps> = ({ onNavigate, onOpenSettings }) => {
  const { todaySummary, customers, firebaseSyncStatus } = useBusiness();

  // Primary options inside "Other"
  const options = [
    {
      id: 'cash' as ActiveTab,
      title: 'Cash & Till (මුදල් & ලාච්චුව)',
      titleSi: 'දෛනික ලාච්චුව සහ අයියාගේ මුදල් හුවමාරු',
      description: 'ආරම්භක මුදල, අයියාට දුන්න/ලැබුන මුදල් සහ අවසාන ලාච්චු ශේෂය',
      icon: Wallet,
      color: 'bg-emerald-600 text-white',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      statLabel: 'ලාච්චුවේ ඉතිරි',
      statValue: formatRs(todaySummary.closingCash),
    },
    {
      id: 'credit' as ActiveTab,
      title: 'Customer Credit (ණය පොත)',
      titleSi: 'පාරිභෝගික ණය සහ ලැබීම් කළමනාකරණය',
      description: 'ණයට දුන් මුදල්, ලැබීම් පියවීම්, පාරිභෝගික විස්තර සහ හිඟ මුදල්',
      icon: CreditCard,
      color: 'bg-blue-600 text-white',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
      statLabel: 'මුළු හිඟ ණය',
      statValue: formatRs(todaySummary.totalOutstandingCredit),
    },
    {
      id: 'expenses' as ActiveTab,
      title: 'Daily Expenses (දෛනික වියදම්)',
      titleSi: 'ව්‍යාපාරික වියදම් සටහන් කිරීම',
      description: 'ලොරි නඩත්තු, ඉන්ධන, කෑම බීම සහ අනෙකුත් සියලු වියදම් වර්ගීකරණය',
      icon: Receipt,
      color: 'bg-rose-600 text-white',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      statLabel: 'අද මුළු වියදම්',
      statValue: formatRs(todaySummary.totalExpenses),
    },
    {
      id: 'reports' as ActiveTab,
      title: 'Reports & Statements (වාර්තා & සාරාංශ)',
      titleSi: 'දෛනික ගිණුම් සාරාංශ සහ WhatsApp වාර්තා',
      description: 'මුළු දවසේ ආදායම්-වියදම් ගණනය කිරීම් සහ WhatsApp පණිවිඩ පිටපත් කිරීම',
      icon: FileText,
      color: 'bg-purple-600 text-white',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      statLabel: 'ලොරි ට්‍රිප් ගණන',
      statValue: `${todaySummary.totalTripsCount} Trips`,
    },
    {
      id: 'settings' as ActiveTab,
      title: 'Settings & Prices (සැකසුම් & මිල ගණන්)',
      titleSi: 'මිල ගණන්, ලොරි විස්තර සහ දත්ත සුරැකීම',
      description: 'ඉන්ධන/භාණ්ඩ ඒකක මිල වෙනස් කිරීම, ලොරි ලියාපදිංචිය සහ Backup ලබා ගැනීම',
      icon: Settings,
      color: 'bg-slate-700 text-white',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
      statLabel: 'පද්ධතිය',
      statValue: firebaseSyncStatus === 'connected' ? 'Cloud Synced' : 'Offline Ready',
    },
  ];

  return (
    <div className="space-y-3.5 pb-24 font-sans select-none">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shadow-inner">
            <LayoutGrid size={22} />
          </div>
          <div>
            <h2 className="font-black text-base text-white tracking-wide flex items-center gap-2">
              <span>Other Options</span>
              <span className="text-amber-400 text-xs font-bold">(වෙනත් අංශ)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              මුදල් ලාච්චුව, ණය පොත, වියදම්, වාර්තා සහ පද්ධති සැකසුම්
            </p>
          </div>
        </div>
      </div>

      {/* Vertical List of Big, Spacious Cards ("pahalata tikak lokuwata") */}
      <div className="space-y-3">
        {options.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              id={`other-card-${item.id}`}
              onClick={() => {
                if (item.id === 'settings' && onOpenSettings) {
                  onOpenSettings('general');
                } else {
                  onNavigate(item.id);
                }
              }}
              className="w-full text-left bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/90 shadow-xs hover:border-emerald-500 hover:shadow-md transition duration-150 active:scale-[0.99] flex flex-col gap-2.5 group"
            >
              {/* Top Row: Icon, Titles & Arrow */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition`}
                  >
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-neutral-900 leading-snug group-hover:text-emerald-700 transition">
                      {item.title}
                    </h3>
                    <p className="text-xs font-bold text-neutral-600 mt-0.5">
                      {item.titleSi}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition shrink-0 mt-1">
                  <ChevronRight size={18} />
                </div>
              </div>

              {/* Description line */}
              <p className="text-[11px] text-neutral-500 pl-0.5">
                {item.description}
              </p>

              {/* Bottom Stat pill */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 mt-0.5">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  {item.statLabel}
                </span>
                <span
                  className={`text-xs font-black font-mono px-2.5 py-0.5 rounded-lg border ${item.badgeBg}`}
                >
                  {item.statValue}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info / Sri Lankan Currency standard */}
      <div className="bg-neutral-100/80 rounded-2xl p-3 text-center border border-neutral-200/60 text-[11px] text-neutral-500 flex items-center justify-center gap-2">
        <ShieldCheck size={14} className="text-emerald-700" />
        <span>ශ්‍රී ලංකා රුපියල් (LKR) ගිණුම් පොත් සම්මතයට අනුව සැකසූ පද්ධතිය</span>
      </div>
    </div>
  );
};
