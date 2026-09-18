import React, { useState, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatRs, formatDateShort, shareToWhatsApp } from '../utils/formatters';
import {
  Users,
  Plus,
  Truck,
  Phone,
  Banknote,
  Clock,
  User,
  Calendar,
  X,
  Share2,
  Trash2,
  CheckCircle2,
  Search,
  FileText,
  BadgeDollarSign,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Worker, WorkerPayment } from '../types';

export const WorkerView: React.FC = () => {
  const {
    workers,
    workerPayments,
    lorries,
    selectedDate,
    addWorkerPayment,
    deleteWorkerPayment,
    addWorker,
  } = useBusiness();

  // Active sub-tab: 'todayPaid' (එදා දවසේ සල්ලි ගත් අය) or 'allWorkers' (සියලු සේවකයින්)
  const [activeSubTab, setActiveSubTab] = useState<'todayPaid' | 'allWorkers'>('todayPaid');

  // Selected worker for detailed profile view
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  // Modals
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showPayWorkerModal, setShowPayWorkerModal] = useState(false);

  // Pay worker form state
  const [payWorkerId, setPayWorkerId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payType, setPayType] = useState<'DIRECT_ADVANCE' | 'DAILY_WAGE'>('DIRECT_ADVANCE');
  const [payNote, setPayNote] = useState<string>('');

  // New worker form state
  const [workerName, setWorkerName] = useState<string>('');
  const [workerPhone, setWorkerPhone] = useState<string>('');
  const [assignedLorryId, setAssignedLorryId] = useState<string>('');

  // Search in all workers
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Feedback states
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  // Payments on selectedDate
  const todayPayments = useMemo(() => {
    return workerPayments.filter((wp) => wp.date === selectedDate);
  }, [workerPayments, selectedDate]);

  // Group payments on selectedDate by worker
  const todayPaidWorkers = useMemo(() => {
    const map = new Map<
      string,
      {
        workerId: string;
        workerName: string;
        worker?: Worker;
        totalPaid: number;
        payments: WorkerPayment[];
      }
    >();

    todayPayments.forEach((p) => {
      const existing = map.get(p.workerId);
      const workerObj = workers.find((w) => w.id === p.workerId);
      const name = workerObj?.name || p.workerName || 'Worker';

      if (existing) {
        existing.totalPaid += p.amount;
        existing.payments.push(p);
      } else {
        map.set(p.workerId, {
          workerId: p.workerId,
          workerName: name,
          worker: workerObj,
          totalPaid: p.amount,
          payments: [p],
        });
      }
    });

    // Sort descending by totalPaid
    return Array.from(map.values()).sort((a, b) => b.totalPaid - a.totalPaid);
  }, [todayPayments, workers]);

  // Totals on selectedDate
  const todayTotalPaid = useMemo(() => {
    return todayPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [todayPayments]);

  const todayAdvanceTotal = useMemo(() => {
    return todayPayments
      .filter((p) => p.type === 'DIRECT_ADVANCE')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [todayPayments]);

  const todayWageTotal = useMemo(() => {
    return todayPayments
      .filter((p) => p.type !== 'DIRECT_ADVANCE')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [todayPayments]);

  // Filtered workers list for 'allWorkers' tab
  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) return workers;
    const q = searchQuery.toLowerCase();
    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.assignedLorryName && w.assignedLorryName.toLowerCase().includes(q)) ||
        (w.phone && w.phone.includes(q))
    );
  }, [workers, searchQuery]);

  // Helper to compute worker cumulative stats (Today, Week, Month)
  const getWorkerStats = (workerId: string) => {
    const allWp = workerPayments.filter((w) => w.workerId === workerId);
    const today = selectedDate;

    // Current week (past 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];

    // Current month (YYYY-MM)
    const monthPrefix = today.substring(0, 7);

    const todayTotal = allWp
      .filter((w) => w.date === today)
      .reduce((s, w) => s + w.amount, 0);

    const weekTotal = allWp
      .filter((w) => w.date >= sevenDaysStr && w.date <= today)
      .reduce((s, w) => s + w.amount, 0);

    const monthTotal = allWp
      .filter((w) => w.date.startsWith(monthPrefix))
      .reduce((s, w) => s + w.amount, 0);

    return { todayTotal, weekTotal, monthTotal, count: allWp.length };
  };

  // Open Pay Modal for a specific worker
  const handleOpenPayModal = (workerId?: string) => {
    setPayWorkerId(workerId || (workers[0]?.id || ''));
    setPayAmount('');
    setPayType('DIRECT_ADVANCE');
    setPayNote('');
    setShowPayWorkerModal(true);
  };

  // Submit payment
  const handleConfirmPayWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payWorkerId || !payAmount) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;

    const w = workers.find((x) => x.id === payWorkerId);
    const workerName = w?.name || 'Worker';

    addWorkerPayment({
      date: selectedDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      workerId: payWorkerId,
      workerName,
      amount: amt,
      type: payType,
      note: payNote.trim() || (payType === 'DIRECT_ADVANCE' ? 'Advance cash' : 'Daily wage'),
    });

    setPayAmount('');
    setPayNote('');
    setShowPayWorkerModal(false);

    // Auto-switch to todayPaid tab to see the payment
    setActiveSubTab('todayPaid');

    setSuccessToast(`✓ ${workerName} හට ${formatRs(amt)} ක මුදලක් සාර්ථකව සටහන් විය!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Add new worker
  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim()) return;

    const assignedLorry = lorries.find((l) => l.id === assignedLorryId);

    const newWorker = addWorker({
      name: workerName.trim(),
      phone: workerPhone.trim(),
      assignedLorryId: assignedLorryId || undefined,
      assignedLorryName: assignedLorry
        ? `${assignedLorry.name} (${assignedLorry.numberPlate})`
        : undefined,
      isActive: true,
    });

    setWorkerName('');
    setWorkerPhone('');
    setAssignedLorryId('');
    setShowAddWorkerModal(false);

    setSuccessToast(`✓ ${newWorker.name} සේවක ලැයිස්තුවට එක් කරන ලදී!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // WhatsApp share of today's paid workers
  const handleShareWorkerPayments = () => {
    if (todayPaidWorkers.length === 0) return;
    const formattedDate = formatDateShort(selectedDate);
    let msg = `👷 *සේවක මුදල් ලබාගැනීම් (Worker Payments)*\n`;
    msg += `📅 දිනය: ${formattedDate} (${selectedDate})\n`;
    msg += `👥 මුදල් ලබාගත් පිරිස: ${todayPaidWorkers.length} දෙනෙක්\n`;
    msg += `------------------------------------------\n`;
    todayPaidWorkers.forEach((item, idx) => {
      msg += `*${idx + 1}. ${item.workerName}* - ${formatRs(item.totalPaid)}\n`;
      if (item.worker?.assignedLorryName) {
        msg += `   🚛 ${item.worker.assignedLorryName}\n`;
      }
      item.payments.forEach((p) => {
        const typeLabel =
          p.type === 'DIRECT_ADVANCE'
            ? 'අත්තිකාරම්'
            : p.type === 'DAILY_WAGE'
            ? 'දෛනික වැටුප්'
            : 'ට්‍රිප් වැටුප්';
        msg += `   • ${p.time || ''} - ${formatRs(p.amount)} [${typeLabel}]${
          p.note ? ` (${p.note})` : ''
        }\n`;
      });
      msg += `\n`;
    });
    msg += `==========================================\n`;
    msg += `💰 *අද මුළු සේවක ගෙවීම්:* ${formatRs(todayTotalPaid)}\n`;
    msg += `   • අත්තිකාරම් (Advances): ${formatRs(todayAdvanceTotal)}\n`;
    msg += `   • වැටුප් (Wages): ${formatRs(todayWageTotal)}\n`;

    shareToWhatsApp(msg);
  };

  const selectedWorker = selectedWorkerId
    ? workers.find((w) => w.id === selectedWorkerId)
    : null;

  const selectedWorkerPayments = selectedWorkerId
    ? workerPayments.filter((w) => w.workerId === selectedWorkerId)
    : [];

  return (
    <div className="space-y-3.5 pb-24 font-sans select-none">
      {/* SUCCESS TOAST */}
      {successToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce border border-emerald-400">
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* TOP BANNER */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-md border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <Users size={20} />
            </div>
            <div>
              <h2 className="font-black text-sm tracking-wide text-white flex items-center gap-1.5">
                <span>Worker Payments</span>
                <span className="text-emerald-400 text-xs font-bold">(සේවක ගෙවීම්)</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                දෛනික වැටුප් සහ අත්තිකාරම් මුදල් කළමනාකරණය
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenPayModal()}
              className="text-xs font-black bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-xl flex items-center gap-1.5 text-white shadow-md active:scale-95 transition"
            >
              <Plus size={14} />
              <span>+ Pay Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddWorkerModal(true)}
              className="text-xs font-bold bg-slate-800 hover:bg-slate-700 px-2.5 py-2 rounded-xl flex items-center gap-1 text-slate-200 border border-slate-700 transition active:scale-95"
              title="නව සේවකයෙක් එකතු කරන්න"
            >
              <User size={13} />
              <span>+ Worker</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TABS: "එදා දවසේ සල්ලි ගත් අය" vs "සියලු සේවකයින්" */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-sm">
        {/* TAB 1: PAID TODAY */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('todayPaid');
            setSelectedWorkerId(null);
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
            activeSubTab === 'todayPaid'
              ? 'bg-emerald-700 text-white shadow-md border border-emerald-500/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <BadgeDollarSign size={16} className={activeSubTab === 'todayPaid' ? 'text-amber-300' : 'text-slate-400'} />
          <span className="truncate">එදා දවසේ සල්ලි ගත් අය</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeSubTab === 'todayPaid'
                ? 'bg-emerald-950 text-emerald-200 border border-emerald-800'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {todayPaidWorkers.length}
          </span>
        </button>

        {/* TAB 2: ALL WORKERS */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('allWorkers');
            setSelectedWorkerId(null);
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
            activeSubTab === 'allWorkers'
              ? 'bg-slate-800 text-white shadow-md border border-slate-600'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Users size={16} className={activeSubTab === 'allWorkers' ? 'text-amber-300' : 'text-slate-400'} />
          <span className="truncate">සියලු සේවකයින්</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700">
            {workers.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: DEDICATED SECTION FOR "එදා දවසේ සල්ලි ගත් අය"     */}
      {/* ======================================================== */}
      {activeSubTab === 'todayPaid' && (
        <div className="space-y-3">
          {/* Summary Card for Today's Paid Workers */}
          <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Calendar size={14} className="text-amber-400" />
                <span>තෝරාගත් දිනය:</span>
                <span className="font-mono text-amber-300 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700">
                  {selectedDate}
                </span>
              </div>

              {todayPaidWorkers.length > 0 && (
                <button
                  type="button"
                  onClick={handleShareWorkerPayments}
                  className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition active:scale-95"
                  title="WhatsApp හරහා ගෙවීම් ලැයිස්තුව යවන්න"
                >
                  <Share2 size={12} />
                  <span>WhatsApp යවන්න</span>
                </button>
              )}
            </div>

            {/* Big Total and Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between sm:block">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">
                  අද මුළු ගෙවීම් එකතුව
                </span>
                <span className="text-xl font-black text-amber-400 font-mono block mt-0.5">
                  {formatRs(todayTotalPaid)}
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between sm:block">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">
                  මුදල් ගත් සේවකයින්
                </span>
                <span className="text-base font-black text-white block mt-0.5">
                  {todayPaidWorkers.length} දෙනෙක් ({todayPayments.length} වාරයක්)
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between sm:block">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">
                  අත්තිකාරම් / වැටුප්
                </span>
                <div className="flex items-center gap-2 mt-0.5 text-xs font-mono font-bold">
                  <span className="text-emerald-400">අත්ති: {formatRs(todayAdvanceTotal)}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-300">වැටුප්: {formatRs(todayWageTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LIST OF WORKERS WHO TOOK MONEY ON THIS DATE */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Banknote size={14} className="text-emerald-500" />
                <span>මුදල් ලබාගත් සේවකයින් ({todayPaidWorkers.length})</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                {todayPaidWorkers.length > 0 ? 'ලැබූ මුදල අනුව පෙළගස්වා ඇත' : ''}
              </span>
            </div>

            {todayPaidWorkers.length === 0 ? (
              <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto border border-slate-800">
                  <BadgeDollarSign size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-300 text-sm">
                    {selectedDate} දින සේවක ගෙවීම් කිසිවක් නැත
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    අද දින (හෝ තෝරාගත් දිනයේ) සේවකයින්ට ලබාදුන් මුදල් මෙහි වෙනම සටහන් වේ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenPayModal()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-md active:scale-95 transition"
                >
                  <Plus size={14} />
                  <span>+ සේවකයෙකුට මුදල් ගෙවන්න (Pay Cash)</span>
                </button>
              </div>
            ) : (
              todayPaidWorkers.map((item) => (
                <div
                  key={item.workerId}
                  className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm space-y-3 text-neutral-900 hover:border-emerald-500 transition"
                >
                  {/* Worker header row */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-base text-neutral-900">{item.workerName}</h4>
                        {item.worker?.assignedLorryName ? (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <Truck size={12} />
                            <span>{item.worker.assignedLorryName}</span>
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                            Shop / Yard
                          </span>
                        )}
                      </div>
                      {item.worker?.phone && (
                        <span className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                          <Phone size={11} />
                          {item.worker.phone}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-neutral-500 block uppercase font-bold">
                        අද ගත් මුදල (Today Paid)
                      </span>
                      <span className="text-lg font-black text-emerald-700 font-mono block">
                        {formatRs(item.totalPaid)}
                      </span>
                    </div>
                  </div>

                  {/* Individual transactions list for this worker on this date */}
                  <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-100 space-y-1.5">
                    <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider block">
                      අද දින ගෙවීම් විස්තරය ({item.payments.length})
                    </span>
                    {item.payments.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-lg p-2 border border-neutral-200/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
                            <Clock size={11} className="text-neutral-400" />
                            {p.time || '—'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              p.type === 'DIRECT_ADVANCE'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {p.type === 'DIRECT_ADVANCE' ? 'අත්තිකාරම්' : 'දෛනික වැටුප'}
                          </span>
                          {p.note && (
                            <span className="text-neutral-700 text-[11px] truncate max-w-[140px] sm:max-w-xs">
                              {p.note}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-neutral-900 font-mono">
                            {formatRs(p.amount)}
                          </span>

                          {/* Delete transaction with inline confirm */}
                          {deletingPaymentId === p.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteWorkerPayment(p.id);
                                  setDeletingPaymentId(null);
                                }}
                                className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black"
                              >
                                ඔව්
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingPaymentId(null)}
                                className="px-1.5 py-0.5 bg-neutral-200 text-neutral-700 rounded text-[10px]"
                              >
                                නැත
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingPaymentId(p.id)}
                              className="text-neutral-400 hover:text-rose-600 p-1 transition"
                              title="Delete this payment"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => handleOpenPayModal(item.workerId)}
                      className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1 active:scale-95 transition"
                    >
                      <Plus size={13} />
                      <span>+ තවත් මුදල් ගෙවන්න</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedWorkerId(item.workerId)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl active:scale-95 transition"
                    >
                      සම්පූර්ණ විස්තර
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: ALL WORKERS DIRECTORY                            */}
      {/* ======================================================== */}
      {activeSubTab === 'allWorkers' && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="සේවක නම හෝ ලොරිය සොයන්න..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-2xl text-xs font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-emerald-600 shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-neutral-600 uppercase tracking-wider">
              ALL WORKERS & DRIVERS ({filteredWorkers.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowAddWorkerModal(true)}
              className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
            >
              <Plus size={12} />
              <span>නව සේවකයෙක්</span>
            </button>
          </div>

          {filteredWorkers.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-neutral-200 text-neutral-500 text-xs">
              කිසිදු සේවකයෙකු හමු නොවීය.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredWorkers.map((worker) => {
                const stats = getWorkerStats(worker.id);
                const hasPaidToday = stats.todayTotal > 0;

                return (
                  <div
                    key={worker.id}
                    className={`bg-white rounded-2xl p-4 border shadow-xs transition hover:border-slate-500 ${
                      hasPaidToday ? 'border-emerald-300 bg-emerald-50/10' : 'border-neutral-200'
                    }`}
                  >
                    <div
                      onClick={() => setSelectedWorkerId(worker.id)}
                      className="cursor-pointer flex items-start justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-sm text-neutral-900">{worker.name}</h4>
                          {hasPaidToday && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="අද මුදල් ලබාගෙන ඇත" />
                          )}
                        </div>
                        {worker.assignedLorryName ? (
                          <span className="text-xs text-emerald-800 font-bold block mt-0.5 flex items-center gap-1">
                            <Truck size={12} />
                            <span>{worker.assignedLorryName}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400 block mt-0.5">Shop / Yard</span>
                        )}
                        {worker.phone && (
                          <span className="text-[11px] text-neutral-400 block mt-0.5">
                            {worker.phone}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 block uppercase font-bold">
                          Today Paid
                        </span>
                        <span
                          className={`font-black text-sm block font-mono ${
                            hasPaidToday ? 'text-emerald-700' : 'text-neutral-900'
                          }`}
                        >
                          {formatRs(stats.todayTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 pt-2.5 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => handleOpenPayModal(worker.id)}
                        className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1 active:scale-95 transition"
                      >
                        <Plus size={12} />
                        <span>Pay Cash</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedWorkerId(worker.id)}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl active:scale-95 transition"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* WORKER DETAIL PROFILE VIEW (MODAL / OVERLAY)             */}
      {/* ======================================================== */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3.5 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 my-auto border border-neutral-200">
            <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-neutral-900">{selectedWorker.name}</h3>
                <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                  {selectedWorker.assignedLorryName && (
                    <span className="flex items-center gap-1 text-emerald-800 font-bold">
                      <Truck size={12} />
                      <span>{selectedWorker.assignedLorryName}</span>
                    </span>
                  )}
                  {selectedWorker.phone && <span>{selectedWorker.phone}</span>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWorkerId(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stats Cards: Today, This Week, This Month */}
            {(() => {
              const stats = getWorkerStats(selectedWorker.id);
              return (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-50/50 rounded-2xl p-2.5 border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                      Today (අද)
                    </span>
                    <span className="text-base font-black text-emerald-900 mt-0.5 block truncate font-mono">
                      {formatRs(stats.todayTotal)}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      This Week (සතිය)
                    </span>
                    <span className="text-base font-black text-slate-900 mt-0.5 block truncate font-mono">
                      {formatRs(stats.weekTotal)}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      This Month (මාසය)
                    </span>
                    <span className="text-base font-black text-slate-900 mt-0.5 block truncate font-mono">
                      {formatRs(stats.monthTotal)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Action Button: Pay Cash */}
            <button
              type="button"
              onClick={() => {
                setSelectedWorkerId(null);
                handleOpenPayModal(selectedWorker.id);
              }}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Banknote size={16} />
              <span>+ RECORD DIRECT PAYMENT / ADVANCE (අත්තිකාරම් / වැටුප්)</span>
            </button>

            {/* Payment History */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-extrabold text-neutral-600 uppercase tracking-wider">
                PAYMENT HISTORY ({selectedWorkerPayments.length})
              </h4>

              {selectedWorkerPayments.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-4 bg-neutral-50 rounded-xl">
                  මෙම සේවකයාට මෙතෙක් කිසිදු ගෙවීමක් කර නොමැත.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {selectedWorkerPayments.map((wp) => (
                    <div
                      key={wp.id}
                      className="p-2.5 rounded-xl border border-neutral-100 bg-neutral-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-neutral-900">{wp.note || 'Payment'}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-700">
                            {wp.type === 'LORRY_TRIP'
                              ? 'Trip Wage'
                              : wp.type === 'DIRECT_ADVANCE'
                              ? 'Advance'
                              : 'Wage'}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400 block mt-0.5">
                          {wp.date} • {wp.time}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-neutral-900 font-mono">
                          {formatRs(wp.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteWorkerPayment(wp.id)}
                          className="text-neutral-400 hover:text-rose-600 p-1"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAY WORKER MODAL                                         */}
      {/* ======================================================== */}
      {showPayWorkerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Banknote size={16} />
                </div>
                <div>
                  <h3 className="font-black text-base text-neutral-900">Pay Worker (මුදල් ගෙවීම)</h3>
                  <p className="text-[11px] text-neutral-500">{selectedDate} දිනට අදාළව</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPayWorkerModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayWorker} className="space-y-3 text-xs">
              {/* Worker Selector */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  සේවකයා තෝරන්න (Select Worker): *
                </label>
                <select
                  value={payWorkerId}
                  onChange={(e) => setPayWorkerId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-bold focus:outline-none focus:border-emerald-600 text-xs bg-white"
                  required
                >
                  <option value="">-- සේවකයෙකු තෝරන්න --</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.assignedLorryName ? `(${w.assignedLorryName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Type */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  ගෙවීමේ ආකාරය (Payment Type):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayType('DIRECT_ADVANCE')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      payType === 'DIRECT_ADVANCE'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                    }`}
                  >
                    Advance (අත්තිකාරම්)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayType('DAILY_WAGE')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      payType === 'DAILY_WAGE'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                    }`}
                  >
                    Wage (දෛනික වැටුප)
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  මුදල (Amount in Rs.): *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500 font-mono">
                    Rs.
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1000"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 font-black text-base text-neutral-900 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                {/* Preset quick buttons */}
                <div className="flex gap-1.5 mt-2">
                  {[500, 1000, 1500, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPayAmount(String(amt))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                        payAmount === String(amt)
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">සටහන (Note):</label>
                <input
                  type="text"
                  placeholder="e.g. කෑමට / ට්‍රිප් අත්තිකාරම්..."
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayWorkerModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700"
                >
                  අවලංගුයි
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-black text-white shadow-md active:scale-95 transition"
                >
                  ගෙවීම සටහන් කරන්න
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD WORKER MODAL                                         */}
      {/* ======================================================== */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <User size={16} />
                </div>
                <div>
                  <h3 className="font-black text-base text-neutral-900">නව සේවකයෙක් එකතු කරන්න</h3>
                  <p className="text-[11px] text-neutral-500">Add Worker / Driver</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddWorkerModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveWorker} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  සේවකයාගේ නම (Worker Name): *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. චමින්ද / බන්ඩාර..."
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  දුරකථන අංකය (Phone):
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 077-1234567"
                  value={workerPhone}
                  onChange={(e) => setWorkerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  අයත් ලොරිය (Assigned Lorry - Optional):
                </label>
                <select
                  value={assignedLorryId}
                  onChange={(e) => setAssignedLorryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 bg-white"
                >
                  <option value="">None / General Shop Worker</option>
                  {lorries.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.numberPlate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700"
                >
                  අවලංගුයි
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 font-black text-white shadow-md active:scale-95 transition"
                >
                  සුරකින්න (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
