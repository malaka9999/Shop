import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatRs } from '../utils/formatters';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
  Plus,
  X,
  CheckCircle2,
} from 'lucide-react';
import { CashTransferType } from '../types';

export const CashView: React.FC = () => {
  const {
    todaySummary,
    selectedDate,
    cashTransfers,
    addCashTransfer,
    deleteCashTransfer,
    updateOpeningCash,
  } = useBusiness();

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustOpeningModal, setShowAdjustOpeningModal] = useState(false);

  // Transfer form state: strictly for Aiya
  const [transferType, setTransferType] = useState<CashTransferType>('FROM_AIYA');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferReason, setTransferReason] = useState('අයියා දුන්නා');

  // Adjust opening cash form
  const [adjustedOpening, setAdjustedOpening] = useState('');
  const [adjustedReason, setAdjustedReason] = useState('');

  const currentTransfers = cashTransfers.filter((t) => t.date === selectedDate);

  const handleOpenTransferModal = (type: CashTransferType) => {
    setTransferType(type);
    setTransferAmount('');
    setTransferReason(type === 'FROM_AIYA' ? 'අයියා දුන්නා' : 'අයියාට දුන්නා');
    setShowTransferModal(true);
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) return;

    addCashTransfer(
      amt,
      transferReason.trim() || (transferType === 'FROM_AIYA' ? 'අයියා දුන්නා' : 'අයියාට දුන්නා'),
      transferType
    );
    setTransferAmount('');
    setShowTransferModal(false);
  };

  const handleConfirmAdjustOpening = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(adjustedOpening);
    if (isNaN(amt) || amt < 0) return;

    updateOpeningCash(selectedDate, amt, adjustedReason.trim());
    setAdjustedOpening('');
    setAdjustedReason('');
    setShowAdjustOpeningModal(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Hero Cash Balance Card */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-3xl p-5 shadow-lg border border-emerald-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-emerald-200">
              <Wallet size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">
                Cash Management (දෛනික මුදල් පොත)
              </h2>
              <p className="text-xs text-emerald-300">
                Drawer & Aiya Cash Reconciliation
              </p>
            </div>
          </div>
        </div>

        {/* Big Closing Cash Display */}
        <div className="mt-4 pt-3 border-t border-emerald-700/60">
          <span className="text-xs text-emerald-300 block font-medium">
            Remaining Cash in Till / Drawer (ලාච්චුවේ ඉතිරි මුදල)
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-white mt-0.5">
            {formatRs(todaySummary.closingCash)}
          </h3>
        </div>

        {/* 2 Quick Action Buttons: From Aiya (+) & To Aiya (-) */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-emerald-700/60">
          <button
            type="button"
            id="btn-cash-from-aiya"
            onClick={() => handleOpenTransferModal('FROM_AIYA')}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border border-emerald-400/50 transition active:scale-95 shadow-xs"
          >
            <ArrowDownLeft size={16} className="text-emerald-200" />
            <span>+ අයියා දුන්න (Cash In)</span>
          </button>

          <button
            type="button"
            id="btn-cash-to-aiya"
            onClick={() => handleOpenTransferModal('TO_AIYA')}
            className="py-2.5 px-3 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border border-rose-500/50 transition active:scale-95 shadow-xs"
          >
            <ArrowUpRight size={16} className="text-rose-200" />
            <span>- අයියාට දුන්න (Cash Out)</span>
          </button>
        </div>
      </div>

      {/* DETAILED DAILY CASH FORMULA / BREAKDOWN */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <h3 className="text-xs font-black text-neutral-800 uppercase tracking-wide">
            CASH RECONCILIATION BREAKDOWN (මුදල් ගණනය කිරීම)
          </h3>
          <span className="text-[11px] text-neutral-400 font-medium">Notebook formula</span>
        </div>

        {/* 1. Opening Cash */}
        <div className="flex items-center justify-between py-2 border-b border-neutral-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-700 font-bold flex items-center justify-center">
              1
            </span>
            <div>
              <span className="font-bold text-neutral-800 block">
                Opening Cash (ලාච්චුවේ ආරම්භක මුදල)
              </span>
              <span className="text-[11px] text-neutral-400">
                {todaySummary.isManualOpening
                  ? 'Manually set / adjusted'
                  : 'Carried forward from yesterday closing'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-neutral-900">
              {formatRs(todaySummary.openingCash)}
            </span>
            <button
              type="button"
              onClick={() => {
                setAdjustedOpening(String(todaySummary.openingCash));
                setShowAdjustOpeningModal(true);
              }}
              className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-600 hover:text-emerald-700 transition"
              title="Adjust Opening Cash"
            >
              <Edit2 size={13} />
            </button>
          </div>
        </div>

        {/* 2. Cash Inflows */}
        <div className="space-y-1.5 py-1">
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-emerald-800 font-bold flex items-center gap-1.5">
              <span className="text-base leading-none font-black text-emerald-600">+</span>
              <span>අයියා දුන්න (Cash from Aiya)</span>
            </span>
            <span className="font-black text-emerald-700">
              +{formatRs(todaySummary.cashFromAiya)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-emerald-800 font-bold flex items-center gap-1.5">
              <span className="text-base leading-none font-black text-emerald-600">+</span>
              <span>Lorry Cash Received (ලොරි වලින් ආ මුදල්)</span>
            </span>
            <span className="font-bold text-neutral-900">
              {formatRs(todaySummary.totalLorryCash)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-emerald-800 font-bold flex items-center gap-1.5">
              <span className="text-base leading-none font-black text-emerald-600">+</span>
              <span>Shop Cash Sales (කඩේ අත්පිට විකිණුම්)</span>
            </span>
            <span className="font-bold text-neutral-900">
              {formatRs(todaySummary.shopCashSales)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-emerald-800 font-bold flex items-center gap-1.5">
              <span className="text-base leading-none font-black text-emerald-600">+</span>
              <span>Credit Customer Payments (ණය ලැබීම්)</span>
            </span>
            <span className="font-bold text-neutral-900">
              {formatRs(todaySummary.creditPaymentsReceived)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs py-1.5 bg-emerald-50/70 px-2 rounded-xl border border-emerald-100">
            <span className="font-bold text-emerald-950">
              = මුළු ලැබීම් එකතුව (Total Available Inflow)
            </span>
            <span className="font-black text-sm text-emerald-900">
              {formatRs(todaySummary.totalInflow)}
            </span>
          </div>
        </div>

        {/* 3. Cash Outflows */}
        <div className="space-y-1.5 py-1 border-t border-neutral-100">
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-rose-800 font-bold flex items-center gap-1.5">
              <span className="text-base leading-none font-black text-rose-600">-</span>
              <span>Daily Expenses (සාමාන්‍ය දෛනික වියදම්)</span>
            </span>
            <span className="font-bold text-rose-700">
              {formatRs(todaySummary.totalExpenses)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-rose-800 font-bold flex items-center gap-1.5">
              <span className="text-base leading-none font-black text-rose-600">-</span>
              <span>Direct Worker Wages / Advances (සේවක ගෙවීම්)</span>
            </span>
            <span className="font-bold text-rose-700">
              {formatRs(todaySummary.directWorkerPayments)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-rose-800 font-bold flex items-center gap-1.5">
              <span className="text-base leading-none font-black text-rose-600">-</span>
              <span>අයියාට දුන්න (Cash given to Aiya)</span>
            </span>
            <span className="font-black text-rose-700">
              -{formatRs(todaySummary.transfersToAiya)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs py-1.5 bg-rose-50/70 px-2 rounded-xl border border-rose-100">
            <span className="font-bold text-rose-950">
              = මුළු වියදම් & ගෙවීම් (Total Outflows)
            </span>
            <span className="font-black text-sm text-rose-900">
              -{formatRs(todaySummary.totalOutflow)}
            </span>
          </div>
        </div>

        {/* 4. Total Closing Cash */}
        <div className="pt-2 border-t-2 border-neutral-200 flex items-center justify-between bg-emerald-50 -mx-4 -mb-4 p-4 rounded-b-3xl">
          <div>
            <span className="text-xs font-black text-emerald-950 uppercase tracking-wide block">
              = CLOSING CASH (ලාච්චුවේ ඉතිරි මුදල)
            </span>
            <span className="text-[10px] text-emerald-700">
              Automatic carry-forward to tomorrow
            </span>
          </div>
          <span className="text-2xl font-black text-emerald-900">
            {formatRs(todaySummary.closingCash)}
          </span>
        </div>
      </div>

      {/* TODAY'S AIYA TRANSFERS LOG */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-neutral-600 uppercase tracking-wider">
            අයියා සමඟ ගනුදෙනු (AIYA TRANSACTIONS) ({currentTransfers.length})
          </h3>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenTransferModal('FROM_AIYA')}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200"
            >
              + අයියා දුන්න
            </button>
            <button
              type="button"
              onClick={() => handleOpenTransferModal('TO_AIYA')}
              className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200"
            >
              - අයියාට දුන්න
            </button>
          </div>
        </div>

        {currentTransfers.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center border border-dashed border-neutral-300">
            <p className="text-xs text-neutral-500 font-semibold">
              අද දින අයියා සමඟ මුදල් ගනුදෙනු සටහන් කර නොමැත.
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              අයියාගෙන් මුදල් ලැබුනේ නම් හෝ අයියාට මුදල් දුන්නේ නම් ඉහත බොත්තම් ඔබන්න.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {currentTransfers.map((t) => {
              const isFrom = t.type === 'FROM_AIYA';
              return (
                <div
                  key={t.id}
                  className={`bg-white rounded-2xl p-3 border flex items-center justify-between gap-2 shadow-xs ${
                    isFrom ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs text-white ${
                        isFrom ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      {isFrom ? '+' : '-'}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                            isFrom
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isFrom ? 'අයියා දුන්නා' : 'අයියාට දුන්නා'}
                        </span>
                        <span className="font-bold text-xs text-neutral-900">
                          {t.reason}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">
                        {t.time}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-black text-sm ${
                        isFrom ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isFrom ? '+' : '-'}
                      {formatRs(t.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteCashTransfer(t.id)}
                      className="p-1 text-neutral-300 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TRANSFER CASH WITH AIYA MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm text-white ${
                    transferType === 'FROM_AIYA' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {transferType === 'FROM_AIYA' ? '+' : '-'}
                </span>
                <div>
                  <h3 className="font-black text-sm text-neutral-900">
                    {transferType === 'FROM_AIYA'
                      ? 'අයියා දුන් මුදල් (Cash from Aiya)'
                      : 'අයියාට දුන් මුදල් (Cash to Aiya)'}
                  </h3>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    {transferType === 'FROM_AIYA'
                      ? 'ලාච්චුවට එකතු වේ (+)'
                      : 'ලාච්චුවෙන් අඩු වේ (-)'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
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
                  setTransferType('FROM_AIYA');
                  setTransferReason('අයියා දුන්නා');
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  transferType === 'FROM_AIYA'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                + අයියා දුන්න
              </button>
              <button
                type="button"
                onClick={() => {
                  setTransferType('TO_AIYA');
                  setTransferReason('අයියාට දුන්නා');
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  transferType === 'TO_AIYA'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                - අයියාට දුන්න
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Amount (මුදල Rs.):
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 7000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-black text-lg text-neutral-900 focus:outline-none focus:border-emerald-600"
                />

                {/* Quick preset buttons */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[2000, 5000, 7000, 10000, 20000, 22000, 25000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTransferAmount(String(amt))}
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
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              {transferAmount && !isNaN(parseFloat(transferAmount)) && (
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs flex justify-between">
                  <span>නව ලාච්චුවේ ඉතිරි:</span>
                  <span className="font-black text-emerald-800">
                    {formatRs(
                      transferType === 'FROM_AIYA'
                        ? todaySummary.closingCash + parseFloat(transferAmount)
                        : todaySummary.closingCash - parseFloat(transferAmount)
                    )}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-black text-white ${
                    transferType === 'FROM_AIYA'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {transferType === 'FROM_AIYA' ? '+ Confirm From Aiya' : '- Confirm To Aiya'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST OPENING CASH MODAL */}
      {showAdjustOpeningModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-black text-base text-neutral-900">
                Adjust Opening Cash (ලාච්චුව සැකසීම)
              </h3>
              <button
                type="button"
                onClick={() => setShowAdjustOpeningModal(false)}
                className="p-1 text-neutral-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustOpening} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Opening Cash Amount (ආරම්භක මුදල Rs.)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={adjustedOpening}
                  onChange={(e) => setAdjustedOpening(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-black text-base text-neutral-900 focus:outline-none focus:border-emerald-600"
                />

                <div className="flex gap-1.5 mt-2">
                  {[4460, 10000, 20000, 40000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdjustedOpening(String(amt))}
                      className="flex-1 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-bold"
                    >
                      {amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Reason for Adjustment (වෙනස් කිරීමට හේතුව)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physical count in drawer / ආරම්භක ශේෂය"
                  value={adjustedReason}
                  onChange={(e) => setAdjustedReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustOpeningModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-black text-white"
                >
                  Save Opening Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
