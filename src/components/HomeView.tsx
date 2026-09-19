import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatRs, formatDateDisplay, shareToWhatsApp } from '../utils/formatters';
import {
  Truck,
  Fuel,
  Droplet,
  CreditCard,
  Banknote,
  Receipt,
  Share2,
  Check,
  ChevronRight,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { ActiveTab, CashTransferType } from '../types';
import { WhatsAppSummaryModal } from './WhatsAppSummaryModal';

export interface HomeViewProps {
  onOpenQuickTrip?: () => void;
  onOpenQuickSale?: (category?: 'fuel' | 'oil') => void;
  onOpenQuickCredit?: () => void;
  onOpenQuickPayment?: () => void;
  onOpenQuickExpense?: () => void;
  onOpenQuickTransfer?: () => void;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenSettingsPrices?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenQuickTrip,
  onOpenQuickSale,
  onOpenQuickCredit,
  onOpenQuickPayment,
  onOpenQuickExpense,
  onOpenQuickTransfer,
  onNavigate,
  onOpenSettingsPrices,
}) => {
  const {
    todaySummary,
    selectedDate,
    isToday,
    generateDailyWhatsAppSummary,
    setActiveTab,
    addCashTransfer,
  } = useBusiness();
  const [copied, setCopied] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Quick Aiya Modal State
  const [showAiyaModal, setShowAiyaModal] = useState(false);
  const [aiyaTransferType, setAiyaTransferType] = useState<CashTransferType>('FROM_AIYA');
  const [aiyaAmount, setAiyaAmount] = useState('');
  const [aiyaNote, setAiyaNote] = useState('');
  const [aiyaFeedback, setAiyaFeedback] = useState<string | null>(null);

  const handleNavigate = (tab: ActiveTab) => {
    if (onNavigate) onNavigate(tab);
    else setActiveTab(tab);
  };

  const handleQuickTrip = () => {
    if (onOpenQuickTrip) onOpenQuickTrip();
    else handleNavigate('lorries');
  };
  const handleQuickSale = (cat?: 'fuel' | 'oil') => {
    if (onOpenQuickSale) onOpenQuickSale(cat);
    else handleNavigate('shop');
  };
  const handleQuickCredit = () => {
    if (onOpenQuickCredit) onOpenQuickCredit();
    else handleNavigate('credit');
  };
  const handleQuickPayment = () => {
    if (onOpenQuickPayment) onOpenQuickPayment();
    else handleNavigate('credit');
  };
  const handleQuickExpense = () => {
    if (onOpenQuickExpense) onOpenQuickExpense();
    else handleNavigate('expenses');
  };
  const handleQuickTransfer = () => {
    if (onOpenQuickTransfer) onOpenQuickTransfer();
    else handleNavigate('cash');
  };

  const handleOpenAiyaModal = (type: CashTransferType) => {
    setAiyaTransferType(type);
    setAiyaAmount('');
    setAiyaNote(type === 'FROM_AIYA' ? 'අයියා දුන්නා' : 'අයියාට දුන්නා');
    setShowAiyaModal(true);
  };

  const handleConfirmAiyaTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(aiyaAmount);
    if (isNaN(amt) || amt <= 0) return;

    addCashTransfer(amt, aiyaNote.trim() || (aiyaTransferType === 'FROM_AIYA' ? 'අයියා දුන්නා' : 'අයියාට දුන්නා'), aiyaTransferType);
    const feedbackText =
      aiyaTransferType === 'FROM_AIYA'
        ? `+ Rs. ${amt.toLocaleString()} අයියා දුන් මුදල් ලාච්චුවට එකතු විය`
        : `- Rs. ${amt.toLocaleString()} අයියාට දුන් මුදල් සටහන් විය`;
    setAiyaFeedback(feedbackText);
    setTimeout(() => setAiyaFeedback(null), 3500);

    setAiyaAmount('');
    setShowAiyaModal(false);
  };

  const handleShareDailyWhatsApp = () => {
    setShowWhatsAppModal(true);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Date & Closing Cash Hero Card */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-3xl p-5 shadow-lg border border-emerald-700/50">
        <div className="flex items-center justify-between text-emerald-200">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isToday ? 'TODAY (අද දවස)' : 'DATE RECORD'}
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-600/50 text-emerald-100">
            {formatDateDisplay(selectedDate)}
          </span>
        </div>

        {/* Big Cash Number */}
        <div className="mt-3">
          <p className="text-xs text-emerald-200 font-medium tracking-wide">
            Remaining Cash in Hand / Drawer (ඉතිරි මුදල්)
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {formatRs(todaySummary.closingCash)}
            </h2>
            <button
              type="button"
              id="btn-home-view-cash-ledger"
              onClick={() => setActiveTab('cash')}
              className="text-xs text-emerald-200 hover:text-white flex items-center gap-0.5 font-bold bg-emerald-700/60 hover:bg-emerald-700 px-2.5 py-1.5 rounded-xl border border-emerald-500/40 active:scale-95 transition"
            >
              <span>Ledger</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Cash In / Out Notebook Summary Pills */}
        <div className="mt-4 pt-3 border-t border-emerald-700/60 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-emerald-900/60 rounded-xl p-2 border border-emerald-700/40">
            <span className="text-emerald-300 text-[11px] block">Total Available (මුළු මුදල)</span>
            <span className="font-bold text-emerald-100 text-sm">
              +{formatRs(todaySummary.totalInflow)}
            </span>
            <span className="text-[10px] text-emerald-300/80 block mt-0.5">
              ලාච්චුව {formatRs(todaySummary.openingCash)} + අයියා {formatRs(todaySummary.cashFromAiya)}
            </span>
          </div>
          <div className="bg-emerald-900/60 rounded-xl p-2 border border-emerald-700/40">
            <span className="text-rose-300 text-[11px] block">Total Out (වියදම් & අයියා)</span>
            <span className="font-bold text-rose-100 text-sm">
              -{formatRs(todaySummary.totalOutflow)}
            </span>
            <span className="text-[10px] text-rose-300/80 block mt-0.5">
              වියදම් {formatRs(todaySummary.totalExpenses + todaySummary.directWorkerPayments)} + අයියා {formatRs(todaySummary.transfersToAiya)}
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification Feedback */}
      {aiyaFeedback && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl text-emerald-900 font-bold text-xs flex items-center gap-2 shadow-sm animate-fade-in">
          <Check size={18} className="text-emerald-700 shrink-0" />
          <span>{aiyaFeedback}</span>
        </div>
      )}

      {/* QUICK ACTIONS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-extrabold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>QUICK ACTIONS (ඉක්මන් ඇතුළත් කිරීම්)</span>
          </h3>
          <span className="text-[11px] text-neutral-400 font-medium">1-Tap Fast Entry</span>
        </div>

        {/* Large Visual Action Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* LORRY TRIP */}
          <button
            type="button"
            id="btn-quick-lorry-trip"
            onClick={handleQuickTrip}
            className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border-2 border-emerald-600/30 hover:border-emerald-600 shadow-sm hover:shadow transition text-left active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Truck size={22} />
            </div>
            <div>
              <span className="block font-bold text-sm text-neutral-900 leading-tight">
                Lorry Trip
              </span>
              <span className="block text-xs text-emerald-700 font-medium leading-tight">
                ලොරි ට්‍රිප්
              </span>
            </div>
          </button>

          {/* FUEL SALE */}
          <button
            type="button"
            id="btn-quick-fuel-sale"
            onClick={() => handleQuickSale('fuel')}
            className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border-2 border-amber-600/30 hover:border-amber-600 shadow-sm hover:shadow transition text-left active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Fuel size={22} />
            </div>
            <div>
              <span className="block font-bold text-sm text-neutral-900 leading-tight">
                Fuel Sale
              </span>
              <span className="block text-xs text-amber-700 font-medium leading-tight">
                පෙට්‍රල් / ඩීසල්
              </span>
            </div>
          </button>

          {/* OIL SALE */}
          <button
            type="button"
            id="btn-quick-oil-sale"
            onClick={() => handleQuickSale('oil')}
            className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border-2 border-blue-600/30 hover:border-blue-600 shadow-sm hover:shadow transition text-left active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <Droplet size={22} />
            </div>
            <div>
              <span className="block font-bold text-sm text-neutral-900 leading-tight">
                Oil Sale
              </span>
              <span className="block text-xs text-blue-700 font-medium leading-tight">
                ඔයිල් / තෙල්
              </span>
            </div>
          </button>

          {/* NAYA SALE */}
          <button
            type="button"
            id="btn-quick-naya-sale"
            onClick={handleQuickCredit}
            className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border-2 border-orange-600/30 hover:border-orange-600 shadow-sm hover:shadow transition text-left active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center shrink-0">
              <CreditCard size={22} />
            </div>
            <div>
              <span className="block font-bold text-sm text-neutral-900 leading-tight">
                Naya Sale
              </span>
              <span className="block text-xs text-orange-700 font-medium leading-tight">
                ණයට විකිණීම
              </span>
            </div>
          </button>

          {/* RECEIVE PAYMENT */}
          <button
            type="button"
            id="btn-quick-receive-payment"
            onClick={handleQuickPayment}
            className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border-2 border-green-600/30 hover:border-green-600 shadow-sm hover:shadow transition text-left active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-green-100 text-green-800 flex items-center justify-center shrink-0">
              <Banknote size={22} />
            </div>
            <div>
              <span className="block font-bold text-sm text-neutral-900 leading-tight">
                Payment
              </span>
              <span className="block text-xs text-green-700 font-medium leading-tight">
                ණය මුදල් ලැබීම
              </span>
            </div>
          </button>

          {/* EXPENSE */}
          <button
            type="button"
            id="btn-quick-expense"
            onClick={handleQuickExpense}
            className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border-2 border-rose-600/30 hover:border-rose-600 shadow-sm hover:shadow transition text-left active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
              <Receipt size={22} />
            </div>
            <div>
              <span className="block font-bold text-sm text-neutral-900 leading-tight">
                Expense
              </span>
              <span className="block text-xs text-rose-700 font-medium leading-tight">
                වියදම්
              </span>
            </div>
          </button>
        </div>

        {/* AIYA MONEY FLOW FAST BUTTONS (No bank transfers! Cash to/from Aiya) */}
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <button
            type="button"
            id="btn-home-quick-from-aiya"
            onClick={() => handleOpenAiyaModal('FROM_AIYA')}
            className="py-3 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border-2 border-emerald-300 transition active:scale-95 shadow-xs"
          >
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
              +
            </span>
            <div className="text-left leading-tight">
              <span className="block font-bold text-xs">අයියා දුන්න</span>
              <span className="block text-[10px] text-emerald-700 font-medium">Cash from Aiya</span>
            </div>
          </button>

          <button
            type="button"
            id="btn-home-quick-to-aiya"
            onClick={() => handleOpenAiyaModal('TO_AIYA')}
            className="py-3 px-3 bg-rose-50 hover:bg-rose-100 text-rose-900 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border-2 border-rose-300 transition active:scale-95 shadow-xs"
          >
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black">
              -
            </span>
            <div className="text-left leading-tight">
              <span className="block font-bold text-xs">අයියාට දුන්න</span>
              <span className="block text-[10px] text-rose-700 font-medium">Cash to Aiya</span>
            </div>
          </button>
        </div>
      </div>

      {/* TODAY'S SUMMARY DASHBOARD */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-neutral-600 uppercase tracking-wider">
            TODAY&apos;S SUMMARY (අද දවසේ සාරාංශය)
          </h3>
          <span className="text-[11px] text-neutral-400 font-medium">Automatic calculation</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Lorry Summary Card */}
          <div
            onClick={() => handleNavigate('lorries')}
            className="bg-white rounded-2xl p-3.5 border border-neutral-200 shadow-sm hover:border-emerald-500 cursor-pointer transition active:scale-[0.99]"
          >
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Truck size={14} />
                <span>LORRY (ලොරි)</span>
              </span>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                {todaySummary.totalTripsCount} Trips
              </span>
            </div>
            <div className="text-xl font-black text-neutral-900 mt-1">
              {formatRs(todaySummary.totalLorryIncome)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 flex justify-between">
              <span>Driver: {formatRs(todaySummary.totalDriverPayments)}</span>
              <span>Credit: {formatRs(todaySummary.totalLorryCredit)}</span>
            </div>
          </div>

          {/* Shop Summary Card */}
          <div
            onClick={() => handleNavigate('shop')}
            className="bg-white rounded-2xl p-3.5 border border-neutral-200 shadow-sm hover:border-emerald-500 cursor-pointer transition active:scale-[0.99]"
          >
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <Fuel size={14} />
                <span>SHOP (කඩේ)</span>
              </span>
              <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                {todaySummary.totalShopSalesCount} Sales
              </span>
            </div>
            <div className="text-xl font-black text-neutral-900 mt-1">
              {formatRs(todaySummary.totalShopSalesAmount)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              <span>Cash: {formatRs(todaySummary.shopCashSales)}</span>
            </div>
          </div>

          {/* Naya Summary Card */}
          <div
            onClick={() => handleNavigate('credit')}
            className="bg-white rounded-2xl p-3.5 border border-neutral-200 shadow-sm hover:border-emerald-500 cursor-pointer transition active:scale-[0.99]"
          >
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1">
                <CreditCard size={14} />
                <span>NAYA (ණය)</span>
              </span>
            </div>
            <div className="text-xl font-black text-neutral-900 mt-1">
              +{formatRs(todaySummary.newCreditGiven)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 flex justify-between">
              <span className="text-green-600 font-medium">
                Paid: {formatRs(todaySummary.creditPaymentsReceived)}
              </span>
              <span className="text-orange-700 font-medium">
                Total: {formatRs(todaySummary.totalOutstandingCredit)}
              </span>
            </div>
          </div>

          {/* Expenses Summary Card */}
          <div
            onClick={() => handleNavigate('expenses')}
            className="bg-white rounded-2xl p-3.5 border border-neutral-200 shadow-sm hover:border-emerald-500 cursor-pointer transition active:scale-[0.99]"
          >
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                <Receipt size={14} />
                <span>EXPENSES (වියදම්)</span>
              </span>
            </div>
            <div className="text-xl font-black text-rose-700 mt-1">
              {formatRs(todaySummary.totalExpenses)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              <span>
                Workers: {formatRs(todaySummary.totalWorkerPayments)}
              </span>
            </div>
          </div>
        </div>

        {/* Full Cash & Aiya Summary Card (Matching notebook) */}
        <div
          onClick={() => handleNavigate('cash')}
          className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border-2 border-emerald-300 shadow-sm cursor-pointer transition active:scale-[0.99] hover:border-emerald-500"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Wallet size={16} className="text-emerald-700" />
              <span>CASH DRAWER & AIYA (ලාච්චුව & අයියා)</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5">
              <span>View Book</span>
              <ChevronRight size={12} />
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-emerald-200/60">
            <div>
              <span className="text-[10px] text-neutral-500 block font-semibold">ලාච්චුව (Opening)</span>
              <span className="text-xs font-black text-neutral-900">
                {formatRs(todaySummary.openingCash)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-700 block font-bold">+ අයියා දුන්න</span>
              <span className="text-xs font-black text-emerald-800">
                +{formatRs(todaySummary.cashFromAiya)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-rose-700 block font-bold">- අයියාට දුන්න</span>
              <span className="text-xs font-black text-rose-800">
                -{formatRs(todaySummary.transfersToAiya)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* WHATSAPP BIG ACTION BUTTON */}
      <div className="pt-2">
        <button
          type="button"
          id="btn-home-send-whatsapp-summary"
          onClick={handleShareDailyWhatsApp}
          className="w-full py-4 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black text-base shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition active:scale-[0.98] border border-emerald-600"
        >
          {copied ? (
            <>
              <Check size={22} className="text-emerald-200" />
              <span>Summary Copied to Clipboard! (පිටපත් කෙරිණි)</span>
            </>
          ) : (
            <>
              <Share2 size={22} className="text-emerald-200" />
              <span>SEND DAILY SUMMARY TO WHATSAPP</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-center text-neutral-400 mt-1.5 font-medium">
          Format: Lorry trips, Shop sales, Naya changes, Expenses, and Cash balance
        </p>
      </div>

      {/* QUICK AIYA CASH MODAL */}
      {showAiyaModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm text-white ${
                    aiyaTransferType === 'FROM_AIYA' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {aiyaTransferType === 'FROM_AIYA' ? '+' : '-'}
                </span>
                <div>
                  <h3 className="font-black text-sm text-neutral-900">
                    {aiyaTransferType === 'FROM_AIYA'
                      ? 'අයියා දුන් මුදල් (Cash from Aiya)'
                      : 'අයියාට දුන් මුදල් (Cash to Aiya)'}
                  </h3>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    {aiyaTransferType === 'FROM_AIYA'
                      ? 'ලාච්චුවට එකතු වේ (+)'
                      : 'ලාච්චුවෙන් අඩු වේ (-)'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiyaModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Direction Switcher Toggle */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAiyaTransferType('FROM_AIYA');
                  setAiyaNote('අයියා දුන්නා');
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  aiyaTransferType === 'FROM_AIYA'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                + අයියා දුන්න
              </button>
              <button
                type="button"
                onClick={() => {
                  setAiyaTransferType('TO_AIYA');
                  setAiyaNote('අයියාට දුන්නා');
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  aiyaTransferType === 'TO_AIYA'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                - අයියාට දුන්න
              </button>
            </div>

            <form onSubmit={handleConfirmAiyaTransfer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Amount (මුදල Rs.):
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 7000"
                  value={aiyaAmount}
                  onChange={(e) => setAiyaAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-black text-lg text-neutral-900 focus:outline-none focus:border-emerald-600"
                />

                {/* Quick preset buttons matching notebook (2000, 5000, 7000, 10000, 20000, 22000) */}
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {[2000, 5000, 7000, 10000, 20000, 22000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAiyaAmount(String(amt))}
                      className="py-1 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-bold text-neutral-800"
                    >
                      {amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Reason / Note (හේතුව / සටහන):
                </label>
                <input
                  type="text"
                  placeholder="e.g. අයියා දුන්නා / අයියාට ලබාදීම"
                  value={aiyaNote}
                  onChange={(e) => setAiyaNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              {aiyaAmount && !isNaN(parseFloat(aiyaAmount)) && (
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs flex justify-between">
                  <span>නව ලාච්චුවේ ඉතිරි:</span>
                  <span className="font-black text-emerald-800">
                    {formatRs(
                      aiyaTransferType === 'FROM_AIYA'
                        ? todaySummary.closingCash + parseFloat(aiyaAmount)
                        : todaySummary.closingCash - parseFloat(aiyaAmount)
                    )}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiyaModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-black text-white ${
                    aiyaTransferType === 'FROM_AIYA'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {aiyaTransferType === 'FROM_AIYA' ? '+ Confirm From Aiya' : '- Confirm To Aiya'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <WhatsAppSummaryModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
      />
    </div>
  );
};
