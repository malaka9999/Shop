import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatRs } from '../utils/formatters';
import {
  Receipt,
  Plus,
  Trash2,
  Tag,
  Clock,
  Coffee,
  Wrench,
  Fuel,
  Truck,
  Users,
  AlertCircle,
  X,
} from 'lucide-react';
import { Expense } from '../types';

export const ExpenseView: React.FC = () => {
  const {
    expenses,
    selectedDate,
    todaySummary,
    addExpense,
    deleteExpense,
    expenseCategories,
    addExpenseCategory,
  } = useBusiness();

  const [selectedCategory, setSelectedCategory] = useState<string>(expenseCategories[0] || 'Food');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [showAddCustomCategory, setShowAddCustomCategory] = useState<boolean>(false);
  const [customCatName, setCustomCatName] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentExpenses = expenses.filter((e) => e.date === selectedDate);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    addExpense({
      date: selectedDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: selectedCategory,
      amount: amountNum,
      note: note.trim(),
    });

    setAmount('');
    setNote('');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCatName.trim()) return;
    addExpenseCategory(customCatName.trim());
    setSelectedCategory(customCatName.trim());
    setCustomCatName('');
    setShowAddCustomCategory(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner with Today's Total Expenses */}
      <div className="bg-rose-900 text-white rounded-3xl p-5 shadow-md border border-rose-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-800 flex items-center justify-center text-rose-200">
              <Receipt size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">
                Daily Expenses (දෛනික වියදම්)
              </h2>
              <p className="text-xs text-rose-300">
                {currentExpenses.length} Expense entries today
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-rose-800 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-rose-300 block font-medium">
              Total Expenses Today (අද දවසේ මුළු වියදම)
            </span>
            <h3 className="text-3xl font-black text-white mt-0.5">
              {formatRs(todaySummary.totalExpenses)}
            </h3>
          </div>
        </div>
      </div>

      {/* QUICK ADD EXPENSE FORM */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-neutral-800 uppercase tracking-wide flex items-center gap-1.5">
          <Plus size={16} className="text-rose-600" />
          <span>+ ADD NEW EXPENSE (වියදමක් සටහන් කරන්න)</span>
        </h3>

        <form onSubmit={handleAddExpense} className="space-y-3">
          {/* Category Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-700">Select Category:</label>
              <button
                type="button"
                onClick={() => setShowAddCustomCategory(true)}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-900"
              >
                + New Category
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {expenseCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                    selectedCategory === cat
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Amount with Quick Preset Buttons */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Amount (වියදම් මුදල Rs.)
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-black text-base text-neutral-900 focus:outline-none focus:border-rose-600"
            />

            {/* Quick amount presets */}
            <div className="flex gap-1.5 mt-2">
              {[500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(String(amt))}
                  className="flex-1 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold active:scale-95"
                >
                  Rs. {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Note (සටහන - Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Lunch for 3 workers / Petrol for bike / Bolt set"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-medium focus:outline-none focus:border-rose-600"
            />
          </div>

          <button
            type="submit"
            id="btn-submit-expense"
            className="w-full py-3.5 bg-rose-700 hover:bg-rose-800 text-white font-black text-sm rounded-2xl shadow-md active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span>RECORD EXPENSE (වියදම සටහන් කරන්න)</span>
          </button>
        </form>
      </div>

      {/* TODAY'S EXPENSE LIST */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-neutral-600 uppercase tracking-wider">
            TODAY&apos;S EXPENSES LIST ({currentExpenses.length})
          </h3>
          <span className="text-[11px] text-neutral-400">Chronological</span>
        </div>

        {currentExpenses.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-neutral-300">
            <Receipt size={28} className="mx-auto text-neutral-300 mb-1" />
            <p className="font-bold text-neutral-700 text-sm">No expenses recorded for this date.</p>
            <p className="text-xs text-neutral-400 mt-0.5">Use the quick form above to add one.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {currentExpenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white rounded-2xl p-3 border border-neutral-200 shadow-xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                      {exp.category}
                    </span>
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Clock size={11} />
                      {exp.time}
                    </span>
                  </div>
                  {exp.note && (
                    <p className="text-xs text-neutral-600 mt-1 truncate">{exp.note}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-sm text-rose-700">
                    {formatRs(exp.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteExpense(exp.id)}
                    className="p-1.5 text-neutral-300 hover:text-rose-600 rounded-lg"
                    title="Delete Expense"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CUSTOM CATEGORY MODAL */}
      {showAddCustomCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h4 className="font-black text-sm text-neutral-900">New Category</h4>
              <button
                type="button"
                onClick={() => setShowAddCustomCategory(false)}
                className="text-neutral-400"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="e.g. Yard Rent / Machine Service"
                value={customCatName}
                onChange={(e) => setCustomCatName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-rose-600"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl"
              >
                Add Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
