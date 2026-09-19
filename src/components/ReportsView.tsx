import React, { useState, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatRs, formatDateDisplay, formatDateShort, shareToWhatsApp, getTodayDateString } from '../utils/formatters';
import {
  FileText,
  Share2,
  Check,
  Calendar,
  Truck,
  ShoppingBag,
  CreditCard,
  Receipt,
  Wallet,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { WhatsAppSummaryModal } from './WhatsAppSummaryModal';

export const ReportsView: React.FC = () => {
  const {
    todaySummary,
    selectedDate,
    lorryTrips,
    shopSales,
    creditTransactions,
    expenses,
    workerPayments,
    generateDailyWhatsAppSummary,
  } = useBusiness();

  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('today');
  const [copied, setCopied] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Compute aggregate range stats if week or month selected
  const rangeStats = useMemo(() => {
    if (dateFilter === 'today') {
      return null;
    }

    const today = new Date(selectedDate);
    const startDate = new Date(today);

    if (dateFilter === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateFilter === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    }

    const startStr = startDate.toISOString().split('T')[0];

    const rTrips = lorryTrips.filter((t) => t.date >= startStr && t.date <= selectedDate);
    const rSales = shopSales.filter((s) => s.date >= startStr && s.date <= selectedDate);
    const rCreditTxs = creditTransactions.filter((c) => c.date >= startStr && c.date <= selectedDate);
    const rExpenses = expenses.filter((e) => e.date >= startStr && e.date <= selectedDate);
    const rWp = workerPayments.filter((w) => w.date >= startStr && w.date <= selectedDate);

    const totalLorryIncome = rTrips.reduce((s, t) => s + (t.totalAmount || 0), 0);
    const totalDriverPayments = rTrips.reduce((s, t) => s + (t.driverPayment || 0), 0);
    const totalShopSales = rSales.reduce((s, t) => s + (t.totalAmount || 0), 0);
    const totalExpenses = rExpenses.reduce((s, t) => s + (t.amount || 0), 0);
    const totalNewCredit = rCreditTxs
      .filter((c) => c.type === 'CREDIT_SALE')
      .reduce((s, c) => s + c.amount, 0);
    const totalCreditPaid = rCreditTxs
      .filter((c) => c.type === 'PAYMENT_RECEIVED')
      .reduce((s, c) => s + c.amount, 0);

    return {
      tripsCount: rTrips.length,
      totalLorryIncome,
      totalDriverPayments,
      salesCount: rSales.length,
      totalShopSales,
      totalExpenses,
      totalNewCredit,
      totalCreditPaid,
      startDate: formatDateShort(startStr),
      endDate: formatDateShort(selectedDate),
    };
  }, [dateFilter, selectedDate, lorryTrips, shopSales, creditTransactions, expenses, workerPayments]);

  const handleShareWhatsApp = () => {
    setShowWhatsAppModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner */}
      <div className="bg-neutral-900 text-white rounded-3xl p-5 shadow-md border border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-emerald-400">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">
                Business Reports (ව්‍යාපාරික වාර්තා)
              </h2>
              <p className="text-xs text-neutral-400">
                End-of-day summary and WhatsApp export
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="text-xs font-bold bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-neutral-200 border border-neutral-700 transition active:scale-95"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>

        {/* Date Filter Tabs */}
        <div className="grid grid-cols-3 gap-1.5 mt-4 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800">
          <button
            type="button"
            onClick={() => setDateFilter('today')}
            className={`py-2 rounded-xl text-xs font-black transition ${
              dateFilter === 'today'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            TODAY (අද)
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('week')}
            className={`py-2 rounded-xl text-xs font-black transition ${
              dateFilter === 'week'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            THIS WEEK (සතිය)
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('month')}
            className={`py-2 rounded-xl text-xs font-black transition ${
              dateFilter === 'month'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            THIS MONTH (මාසය)
          </button>
        </div>
      </div>

      {/* WHATSAPP SHARE ACTION BUTTON */}
      <button
        type="button"
        id="btn-reports-whatsapp-share"
        onClick={handleShareWhatsApp}
        className="w-full py-4 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2.5 transition active:scale-[0.98] border border-emerald-600"
      >
        {copied ? (
          <>
            <Check size={20} className="text-emerald-200" />
            <span>Daily Summary Copied!</span>
          </>
        ) : (
          <>
            <Share2 size={20} className="text-emerald-200" />
            <span>SEND TODAY&apos;S SUMMARY TO WHATSAPP</span>
          </>
        )}
      </button>

      {/* END-OF-DAY FULL SUMMARY SHEET */}
      {dateFilter === 'today' ? (
        <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-sm space-y-4">
          <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Official Daily Summary Record
              </span>
              <h3 className="text-lg font-black text-neutral-900">
                End-of-Day Ledger ({formatDateDisplay(selectedDate)})
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-neutral-100 text-neutral-700 px-2 py-1 rounded-lg">
              {formatDateShort(selectedDate)}
            </span>
          </div>

          {/* 1. Lorry Transport Section */}
          <div className="space-y-2 border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs uppercase tracking-wide">
              <Truck size={15} />
              <span>1. Lorry Transport (ලොරි ප්‍රවාහන)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-neutral-50 p-2 rounded-xl">
                <span className="text-neutral-500 block text-[11px]">Total Lorries</span>
                <span className="font-bold text-neutral-900">{todaySummary.totalLorriesCount}</span>
              </div>
              <div className="bg-neutral-50 p-2 rounded-xl">
                <span className="text-neutral-500 block text-[11px]">Total Trips</span>
                <span className="font-bold text-neutral-900">{todaySummary.totalTripsCount}</span>
              </div>
              <div className="bg-neutral-50 p-2 rounded-xl">
                <span className="text-neutral-500 block text-[11px]">Trip Income</span>
                <span className="font-bold text-emerald-800">
                  {formatRs(todaySummary.totalLorryIncome)}
                </span>
              </div>
              <div className="bg-neutral-50 p-2 rounded-xl">
                <span className="text-neutral-500 block text-[11px]">Aiya / Driver</span>
                <span className="font-bold text-amber-800">
                  {formatRs(todaySummary.totalDriverPayments)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Shop Section */}
          <div className="space-y-2 border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-xs uppercase tracking-wide">
              <ShoppingBag size={15} />
              <span>2. Shop Sales (කඩේ විකිණුම්)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-neutral-50 p-2 rounded-xl">
                <span className="text-neutral-500 block text-[11px]">Total Sales</span>
                <span className="font-bold text-neutral-900">
                  {formatRs(todaySummary.totalShopSalesAmount)}
                </span>
              </div>
              <div className="bg-neutral-50 p-2 rounded-xl">
                <span className="text-neutral-500 block text-[11px]">Petrol Sold</span>
                <span className="font-bold text-neutral-900">{todaySummary.petrolLitres} L</span>
              </div>
              <div className="bg-neutral-50 p-2 rounded-xl">
                <span className="text-neutral-500 block text-[11px]">Diesel Sold</span>
                <span className="font-bold text-neutral-900">{todaySummary.dieselLitres} L</span>
              </div>
              <div className="bg-neutral-50 p-2 rounded-xl">
                <span className="text-neutral-500 block text-[11px]">Oil Sold</span>
                <span className="font-bold text-neutral-900">{todaySummary.oilLitres} L</span>
              </div>
            </div>
          </div>

          {/* 3. Credit / Naya Section */}
          <div className="space-y-2 border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-1.5 text-orange-800 font-extrabold text-xs uppercase tracking-wide">
              <CreditCard size={15} />
              <span>3. Credit / Naya (ණය ගනුදෙනු)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-neutral-50 p-2 rounded-xl">
                <span className="text-neutral-500 block text-[11px]">New Credit Given</span>
                <span className="font-bold text-orange-800">
                  +{formatRs(todaySummary.newCreditGiven)}
                </span>
              </div>
              <div className="bg-neutral-50 p-2 rounded-xl">
                <span className="text-neutral-500 block text-[11px]">Payments Received</span>
                <span className="font-bold text-emerald-800">
                  {formatRs(todaySummary.creditPaymentsReceived)}
                </span>
              </div>
              <div className="bg-neutral-50 p-2 rounded-xl">
                <span className="text-neutral-500 block text-[11px]">Total Outstanding</span>
                <span className="font-bold text-neutral-900">
                  {formatRs(todaySummary.totalOutstandingCredit)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Expenses Section */}
          <div className="space-y-2 border-b border-neutral-100 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-rose-800 font-extrabold text-xs uppercase tracking-wide">
                <Receipt size={15} />
                <span>4. Expenses (වියදම්)</span>
              </div>
              <span className="text-xs font-black text-rose-700">
                {formatRs(todaySummary.totalExpenses)}
              </span>
            </div>
            {Object.keys(todaySummary.expenseCategoryTotals).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(todaySummary.expenseCategoryTotals).map(([cat, val]) => (
                  <span
                    key={cat}
                    className="text-[11px] bg-rose-50 text-rose-900 px-2 py-0.5 rounded-lg border border-rose-200"
                  >
                    {cat}: {formatRs(val)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 5. Cash Reconciliation Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-neutral-900 font-extrabold text-xs uppercase tracking-wide">
              <Wallet size={15} />
              <span>5. Cash Reconciliation (මුදල් ශේෂය)</span>
            </div>
            <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-600">Opening Cash (ආරම්භක මුදල):</span>
                <span className="font-bold text-neutral-900">{formatRs(todaySummary.openingCash)}</span>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>+ Cash Received (Shop + Lorry + Credit):</span>
                <span className="font-bold">+{formatRs(todaySummary.cashReceived)}</span>
              </div>
              <div className="flex justify-between text-rose-800">
                <span>- Cash Paid Out (Expenses + Direct Wages):</span>
                <span className="font-bold">-{formatRs(todaySummary.cashPaidOut)}</span>
              </div>
              <div className="flex justify-between text-rose-800">
                <span>- Transfers to Bank/Safe:</span>
                <span className="font-bold">-{formatRs(todaySummary.transfersTotal)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-300 font-black text-sm text-neutral-900">
                <span>= Closing Cash (ඉතිරි මුදල):</span>
                <span className="text-emerald-800">{formatRs(todaySummary.closingCash)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : rangeStats ? (
        /* RANGE SUMMARY (Week or Month) */
        <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-sm space-y-4">
          <div className="border-b border-neutral-200 pb-2 flex items-center justify-between">
            <h3 className="font-black text-base text-neutral-900">
              Period Summary ({rangeStats.startDate} to {rangeStats.endDate})
            </h3>
            <span className="text-xs font-bold text-neutral-500 uppercase">{dateFilter}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200">
              <span className="text-[11px] text-emerald-800 font-bold block">
                Total Lorry Income
              </span>
              <span className="text-xl font-black text-emerald-950 mt-1 block">
                {formatRs(rangeStats.totalLorryIncome)}
              </span>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                {rangeStats.tripsCount} Trips
              </span>
            </div>

            <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200">
              <span className="text-[11px] text-amber-800 font-bold block">Total Shop Sales</span>
              <span className="text-xl font-black text-amber-950 mt-1 block">
                {formatRs(rangeStats.totalShopSales)}
              </span>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                {rangeStats.salesCount} Sales
              </span>
            </div>

            <div className="bg-rose-50 rounded-2xl p-3.5 border border-rose-200">
              <span className="text-[11px] text-rose-800 font-bold block">Total Expenses</span>
              <span className="text-xl font-black text-rose-950 mt-1 block">
                {formatRs(rangeStats.totalExpenses)}
              </span>
            </div>

            <div className="bg-orange-50 rounded-2xl p-3.5 border border-orange-200">
              <span className="text-[11px] text-orange-800 font-bold block">Credit Payments</span>
              <span className="text-xl font-black text-orange-950 mt-1 block">
                {formatRs(rangeStats.totalCreditPaid)}
              </span>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                New Credit: {formatRs(rangeStats.totalNewCredit)}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <WhatsAppSummaryModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
      />
    </div>
  );
};
