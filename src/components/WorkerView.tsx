import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatRs, getTodayDateString } from '../utils/formatters';
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
} from 'lucide-react';
import { Worker, WorkerPayment } from '../types';

export const WorkerView: React.FC = () => {
  const {
    workers,
    workerPayments,
    lorries,
    selectedDate,
    addWorkerPayment,
    addWorker,
  } = useBusiness();

  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showPayWorkerModal, setShowPayWorkerModal] = useState(false);

  // New worker form
  const [workerName, setWorkerName] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [assignedLorryId, setAssignedLorryId] = useState('');

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState<'DIRECT_ADVANCE' | 'DAILY_WAGE'>('DIRECT_ADVANCE');
  const [payNote, setPayNote] = useState('');

  const selectedWorker = selectedWorkerId
    ? workers.find((w) => w.id === selectedWorkerId)
    : null;

  // Helper to compute worker stats (Today, Week, Month)
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

  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim()) return;

    const assignedLorry = lorries.find((l) => l.id === assignedLorryId);

    addWorker({
      name: workerName.trim(),
      phone: workerPhone.trim(),
      assignedLorryId: assignedLorryId || undefined,
      assignedLorryName: assignedLorry ? `${assignedLorry.name} (${assignedLorry.numberPlate})` : undefined,
      isActive: true,
    });

    setWorkerName('');
    setWorkerPhone('');
    setAssignedLorryId('');
    setShowAddWorkerModal(false);
  };

  const handleConfirmPayWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || !payAmount) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;

    const w = workers.find((x) => x.id === selectedWorkerId);

    addWorkerPayment({
      date: selectedDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      workerId: selectedWorkerId,
      workerName: w?.name || 'Worker',
      amount: amt,
      type: payType,
      note: payNote.trim() || (payType === 'DIRECT_ADVANCE' ? 'Advance cash' : 'Daily wage'),
    });

    setPayAmount('');
    setPayNote('');
    setShowPayWorkerModal(false);
  };

  // Payments for selected worker
  const selectedWorkerPayments = selectedWorkerId
    ? workerPayments.filter((w) => w.workerId === selectedWorkerId)
    : [];

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-md border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-200">
              <Users size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">
                Worker Payments (සේවක ගෙවීම්)
              </h2>
              <p className="text-xs text-slate-300">
                Lorry trip driver wages and direct cash advances
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddWorkerModal(true)}
            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1 text-slate-100 border border-slate-600/50 transition active:scale-95"
          >
            <Plus size={14} />
            <span>New Worker</span>
          </button>
        </div>
      </div>

      {/* SELECTED WORKER PROFILE VIEW */}
      {selectedWorker && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-600 shadow-lg space-y-4">
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
              className="text-xs font-bold text-neutral-400 hover:text-neutral-700"
            >
              Close ✕
            </button>
          </div>

          {/* Stats Cards: Today, This Week, This Month */}
          {(() => {
            const stats = getWorkerStats(selectedWorker.id);
            return (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Today (අද)
                  </span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block truncate">
                    {formatRs(stats.todayTotal)}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    This Week (සතිය)
                  </span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block truncate">
                    {formatRs(stats.weekTotal)}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    This Month (මාසය)
                  </span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block truncate">
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
              setPayAmount('');
              setPayNote('');
              setShowPayWorkerModal(true);
            }}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Banknote size={16} />
            <span>+ RECORD DIRECT PAYMENT / ADVANCE (අත්තිකාරම් / වැටුප්)</span>
          </button>

          {/* Payment History */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-extrabold text-neutral-600 uppercase tracking-wider">
              PAYMENT HISTORY ({selectedWorkerPayments.length})
            </h4>

            {selectedWorkerPayments.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-3 bg-neutral-50 rounded-xl">
                No payments logged yet for this worker.
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
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-neutral-200 text-neutral-700">
                          {wp.type === 'LORRY_TRIP' ? 'Trip Wage' : 'Direct Advance'}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">
                        {wp.date} • {wp.time}
                      </span>
                    </div>

                    <span className="font-black text-sm text-neutral-900">
                      {formatRs(wp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ALL WORKERS LIST */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-neutral-600 uppercase tracking-wider px-1">
          ALL WORKERS & DRIVERS ({workers.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {workers.map((worker) => {
            const stats = getWorkerStats(worker.id);
            return (
              <div
                key={worker.id}
                className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs hover:border-slate-500 transition"
              >
                <div
                  onClick={() => setSelectedWorkerId(worker.id)}
                  className="cursor-pointer flex items-start justify-between"
                >
                  <div>
                    <h4 className="font-black text-sm text-neutral-900">{worker.name}</h4>
                    {worker.assignedLorryName ? (
                      <span className="text-xs text-emerald-800 font-bold block mt-0.5 flex items-center gap-1">
                        <Truck size={12} />
                        <span>{worker.assignedLorryName}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400 block mt-0.5">Shop / Yard</span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 block uppercase font-bold">
                      Today Paid
                    </span>
                    <span className="font-black text-sm text-neutral-900">
                      {formatRs(stats.todayTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-2.5 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWorkerId(worker.id);
                      setPayAmount('');
                      setPayNote('');
                      setShowPayWorkerModal(true);
                    }}
                    className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Plus size={12} />
                    <span>Pay Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWorkerId(worker.id)}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl active:scale-95"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PAY WORKER MODAL */}
      {showPayWorkerModal && selectedWorker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div>
                <h3 className="font-black text-base text-neutral-900">Pay Worker (මුදල් ගෙවීම)</h3>
                <p className="text-xs text-neutral-500">{selectedWorker.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayWorkerModal(false)}
                className="p-1 text-neutral-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayWorker} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Payment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayType('DIRECT_ADVANCE')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      payType === 'DIRECT_ADVANCE'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
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
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                    }`}
                  >
                    Wage (දෛනික කුලිය)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Amount (මුදල Rs.)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 2000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-black text-base text-neutral-900 focus:outline-none focus:border-emerald-600"
                />

                <div className="flex gap-1.5 mt-2">
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPayAmount(String(amt))}
                      className="flex-1 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-bold"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Note (සටහන)</label>
                <input
                  type="text"
                  placeholder="e.g. Food money / Trip advance"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-black text-white"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD WORKER MODAL */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-black text-base text-neutral-900">
                Add New Worker / Driver (නව සේවකයෙක්)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddWorkerModal(false)}
                className="p-1 text-neutral-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveWorker} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Worker Name (නම)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Aiya / Bandara"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-slate-600 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Phone (දුරකථන අංකය)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 077-1234567"
                  value={workerPhone}
                  onChange={(e) => setWorkerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-slate-600 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Assigned Lorry (අයත් ලොරිය - Optional)
                </label>
                <select
                  value={assignedLorryId}
                  onChange={(e) => setAssignedLorryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-slate-600"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 font-black text-white"
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
