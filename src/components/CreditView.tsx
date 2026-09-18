import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatRs, shareToWhatsApp } from '../utils/formatters';
import {
  CreditCard,
  Plus,
  Search,
  Phone,
  ArrowDownLeft,
  ArrowUpRight,
  Share2,
  Check,
  User,
  MapPin,
  ChevronRight,
  X,
  Clock,
  Banknote,
} from 'lucide-react';
import { Customer } from '../types';

interface CreditViewProps {
  initialAction?: 'payment' | 'credit_sale';
  onClearAction?: () => void;
}

export const CreditView: React.FC<CreditViewProps> = ({ initialAction, onClearAction }) => {
  const {
    customers,
    creditTransactions,
    selectedDate,
    receiveCreditPayment,
    addCustomerCreditSale,
    addCustomer,
    generateCustomerWhatsAppStatement,
  } = useBusiness();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreditSaleModal, setShowCreditSaleModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle initialAction from quick access on Home page
  useEffect(() => {
    if (initialAction === 'payment') {
      if (!selectedCustomerId && customers.length > 0) {
        const withBalance = customers.find((c) => c.currentBalance > 0);
        setSelectedCustomerId(withBalance ? withBalance.id : customers[0].id);
      }
      setShowPaymentModal(true);
      if (onClearAction) onClearAction();
    } else if (initialAction === 'credit_sale') {
      if (!selectedCustomerId && customers.length > 0) {
        setSelectedCustomerId(customers[0].id);
      }
      setShowCreditSaleModal(true);
      if (onClearAction) onClearAction();
    }
  }, [initialAction, customers]);

  // Form states
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustLimit, setNewCustLimit] = useState('');

  // Payment / Credit sale amounts
  const [txAmount, setTxAmount] = useState('');
  const [txNotes, setTxNotes] = useState('');

  const totalOutstanding = customers.reduce((s, c) => s + (c.currentBalance || 0), 0);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedCustomer = selectedCustomerId
    ? customers.find((c) => c.id === selectedCustomerId)
    : null;

  const customerTransactions = selectedCustomerId
    ? creditTransactions.filter((tx) => tx.customerId === selectedCustomerId)
    : [];

  const handleShareStatement = (custId: string) => {
    const cust = customers.find((c) => c.id === custId);
    const text = generateCustomerWhatsAppStatement(custId, selectedDate);
    const opened = shareToWhatsApp(text, cust?.phone);
    if (!opened) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const created = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim() || 'No phone',
      address: newCustAddress.trim(),
      creditLimit: newCustLimit ? parseFloat(newCustLimit) : undefined,
    });

    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustLimit('');
    setShowAddCustomerModal(false);
    setSelectedCustomerId(created.id);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const custId = selectedCustomerId || (customers.length > 0 ? customers[0].id : null);
    if (!custId || !txAmount) return;
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    receiveCreditPayment(custId, amountNum, txNotes.trim());
    setTxAmount('');
    setTxNotes('');
    setShowPaymentModal(false);
  };

  const handleConfirmCreditSale = (e: React.FormEvent) => {
    e.preventDefault();
    const custId = selectedCustomerId || (customers.length > 0 ? customers[0].id : null);
    if (!custId || !txAmount) return;
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    addCustomerCreditSale(custId, amountNum, txNotes.trim() || 'Direct credit sale', 'DIRECT');
    setTxAmount('');
    setTxNotes('');
    setShowCreditSaleModal(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner with Total Outstanding Naya */}
      <div className="bg-orange-900 text-white rounded-3xl p-5 shadow-md border border-orange-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-800 flex items-center justify-center text-orange-200">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">
                Customer Credit / Naya (ණය පොත)
              </h2>
              <p className="text-xs text-orange-200">
                {customers.length} Registered credit customers
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-add-credit-customer"
            onClick={() => setShowAddCustomerModal(true)}
            className="text-xs font-bold bg-orange-800 hover:bg-orange-700 px-3 py-1.5 rounded-xl flex items-center gap-1 text-orange-100 border border-orange-600/50 transition active:scale-95"
          >
            <Plus size={14} />
            <span>New Customer</span>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-orange-800 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-orange-300 block font-medium">
              Total Outstanding Debt (මුළු හිඟ ණය මුදල)
            </span>
            <h3 className="text-3xl font-black text-white mt-0.5">
              {formatRs(totalOutstanding)}
            </h3>
          </div>
        </div>
      </div>

      {/* DETAILED CUSTOMER PROFILE VIEW (If customer is selected) */}
      {selectedCustomer ? (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-orange-500 shadow-lg space-y-4">
          <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-neutral-900">{selectedCustomer.name}</h3>
                {selectedCustomer.phone && (
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200"
                  >
                    <Phone size={12} />
                    <span>{selectedCustomer.phone}</span>
                  </a>
                )}
              </div>
              {selectedCustomer.address && (
                <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                  <MapPin size={12} />
                  <span>{selectedCustomer.address}</span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedCustomerId(null)}
              className="text-xs font-bold text-neutral-400 hover:text-neutral-700 p-1"
            >
              Close Profile ✕
            </button>
          </div>

          {/* Current Naya Big Hero Card */}
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200 text-center">
            <span className="text-xs font-bold text-orange-800 uppercase tracking-wider block">
              Current Naya Balance (දැනට ඇති ණය)
            </span>
            <span className="text-3xl sm:text-4xl font-black text-orange-950 block mt-1">
              {formatRs(selectedCustomer.currentBalance)}
            </span>

            <div className="flex justify-center gap-4 mt-2 text-xs text-neutral-500 font-medium">
              <span>Total Taken: {formatRs(selectedCustomer.totalCredit)}</span>
              <span>•</span>
              <span className="text-green-700">Total Paid: {formatRs(selectedCustomer.totalPaid)}</span>
            </div>
          </div>

          {/* Customer Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              id="btn-customer-receive-payment"
              onClick={() => {
                setTxAmount('');
                setTxNotes('');
                setShowPaymentModal(true);
              }}
              className="py-3 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition shadow-sm"
            >
              <Banknote size={18} />
              <span>+ Payment (මුදල් ලැබුණි)</span>
            </button>

            <button
              type="button"
              id="btn-customer-credit-sale"
              onClick={() => {
                setTxAmount('');
                setTxNotes('');
                setShowCreditSaleModal(true);
              }}
              className="py-3 px-2 bg-orange-700 hover:bg-orange-800 text-white rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition shadow-sm"
            >
              <CreditCard size={18} />
              <span>+ Naya (ණයට දීම)</span>
            </button>

            <button
              type="button"
              id="btn-customer-whatsapp-statement"
              onClick={() => handleShareStatement(selectedCustomer.id)}
              className="py-3 px-2 bg-neutral-900 hover:bg-black text-white rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition shadow-sm"
            >
              {copied ? <Check size={18} /> : <Share2 size={18} />}
              <span>{copied ? 'Copied' : 'WhatsApp Statement'}</span>
            </button>
          </div>

          {/* Customer Transaction History */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-extrabold text-neutral-600 uppercase tracking-wider">
              TRANSACTION HISTORY ({customerTransactions.length})
            </h4>

            {customerTransactions.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-4 bg-neutral-50 rounded-xl">
                No past transactions recorded for this customer yet.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {customerTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-xl border border-neutral-100 bg-neutral-50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          tx.type === 'PAYMENT_RECEIVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {tx.type === 'PAYMENT_RECEIVED' ? (
                          <ArrowDownLeft size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-neutral-900 block leading-tight">
                          {tx.type === 'PAYMENT_RECEIVED'
                            ? 'Payment Received (මුදල් ගෙවීම)'
                            : `Credit Sale (${tx.source})`}
                        </span>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                          <span>{tx.date}</span>
                          <span>{tx.time}</span>
                          {tx.notes && <span>• {tx.notes}</span>}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-black text-sm block ${
                          tx.type === 'PAYMENT_RECEIVED' ? 'text-emerald-700' : 'text-orange-700'
                        }`}
                      >
                        {tx.type === 'PAYMENT_RECEIVED' ? '-' : '+'}
                        {formatRs(tx.amount)}
                      </span>
                      <span className="text-[10px] text-neutral-400 block">
                        Bal: {formatRs(tx.newBalance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* SEARCH CUSTOMER BAR */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search customer by name or phone (නම හෝ දුරකථන අංකය සොයන්න)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:border-orange-500 shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* ALL CUSTOMERS LIST */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-neutral-600 uppercase tracking-wider">
            ALL CUSTOMERS ({filteredCustomers.length})
          </h3>
          <span className="text-[11px] text-neutral-400">Tap to view statement</span>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-neutral-300">
            <User size={28} className="mx-auto text-neutral-300 mb-1" />
            <p className="font-bold text-neutral-700 text-sm">No customers found.</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Tap &quot;+ New Customer&quot; above to add one.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCustomers.map((cust) => (
              <div
                key={cust.id}
                className="bg-white rounded-2xl p-3.5 border border-neutral-200 shadow-xs hover:border-orange-500 transition"
              >
                <div
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-black text-sm text-neutral-900">{cust.name}</h4>
                    <span className="text-xs text-neutral-500 block mt-0.5">{cust.phone}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-neutral-400 uppercase font-semibold block">
                      Current Naya
                    </span>
                    <span className="font-black text-base text-orange-700 block">
                      {formatRs(cust.currentBalance)}
                    </span>
                  </div>
                </div>

                {/* 3 Quick Buttons on Card (per user prompt) */}
                <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId(cust.id);
                      setTxAmount('');
                      setTxNotes('');
                      setShowCreditSaleModal(true);
                    }}
                    className="flex-1 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl text-xs font-bold border border-orange-200 transition active:scale-95"
                  >
                    + Credit Sale
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId(cust.id);
                      setTxAmount('');
                      setTxNotes('');
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition active:scale-95"
                  >
                    + Payment
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareStatement(cust.id)}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Share2 size={12} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECEIVE PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div>
                <h3 className="font-black text-base text-neutral-900">
                  Receive Payment (ණය මුදල් ලැබීම)
                </h3>
                <p className="text-xs text-neutral-500">
                  {selectedCustomer
                    ? `Customer: ${selectedCustomer.name}`
                    : 'Select customer & record payment'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X size={20} />
              </button>
            </div>

            {customers.length === 0 ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-xs text-neutral-500">
                  ගණුදෙනුකරුවන් ලියාපදිංචි කර නොමැත. කරුණාකර පළමුව නව ගණුදෙනුකරුවෙකු එක් කරන්න.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setShowAddCustomerModal(true);
                  }}
                  className="px-4 py-2 bg-orange-700 text-white font-bold text-xs rounded-xl"
                >
                  + Add Customer (නව ගණුදෙනුකරු)
                </button>
              </div>
            ) : (
              (() => {
                const currentCust =
                  selectedCustomer ||
                  customers.find((c) => c.id === selectedCustomerId) ||
                  customers[0];
                const custBalance = currentCust?.currentBalance || 0;

                return (
                  <>
                    {/* Customer Selector dropdown */}
                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">
                        Select Customer (ගණුදෙනුකරු):
                      </label>
                      <select
                        value={currentCust.id}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-900 bg-white focus:outline-none focus:border-emerald-600"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (හිඟ ණය: {formatRs(c.currentBalance)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-orange-50 p-2.5 rounded-xl border border-orange-200 text-center">
                      <span className="text-xs text-orange-800 font-bold block">Current Balance:</span>
                      <span className="text-xl font-black text-orange-950">
                        {formatRs(custBalance)}
                      </span>
                    </div>

                    <form onSubmit={handleConfirmPayment} className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">
                          Payment Amount (ගෙවන ලද මුදල Rs.)
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 10000"
                          value={txAmount}
                          onChange={(e) => setTxAmount(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-black text-base text-neutral-900 focus:outline-none focus:border-emerald-600"
                        />

                        {/* Quick preset amount buttons */}
                        <div className="flex gap-1.5 mt-2">
                          {[1000, 2000, 5000, 10000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setTxAmount(String(amt))}
                              className="flex-1 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-bold text-[11px] text-neutral-700 active:scale-95"
                            >
                              {amt >= 1000 ? `${amt / 1000}k` : amt}
                            </button>
                          ))}
                          {custBalance > 0 && (
                            <button
                              type="button"
                              onClick={() => setTxAmount(String(custBalance))}
                              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold text-[11px] active:scale-95"
                            >
                              Full
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">Note (සටහන)</label>
                        <input
                          type="text"
                          placeholder="e.g. Cash handed at shop"
                          value={txNotes}
                          onChange={(e) => setTxNotes(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      {txAmount && !isNaN(parseFloat(txAmount)) && (
                        <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 flex justify-between">
                          <span>New Balance after payment:</span>
                          <span className="font-black text-emerald-800">
                            {formatRs(Math.max(0, custBalance - parseFloat(txAmount)))}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowPaymentModal(false)}
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
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* RECORD CREDIT SALE MODAL */}
      {showCreditSaleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div>
                <h3 className="font-black text-base text-neutral-900">
                  Record Credit Sale (ණයට දීම)
                </h3>
                <p className="text-xs text-neutral-500">
                  {selectedCustomer
                    ? `Customer: ${selectedCustomer.name}`
                    : 'Select customer & record credit'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreditSaleModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X size={20} />
              </button>
            </div>

            {customers.length === 0 ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-xs text-neutral-500">
                  ගණුදෙනුකරුවන් ලියාපදිංචි කර නොමැත. කරුණාකර පළමුව නව ගණුදෙනුකරුවෙකු එක් කරන්න.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreditSaleModal(false);
                    setShowAddCustomerModal(true);
                  }}
                  className="px-4 py-2 bg-orange-700 text-white font-bold text-xs rounded-xl"
                >
                  + Add Customer (නව ගණුදෙනුකරු)
                </button>
              </div>
            ) : (
              (() => {
                const currentCust =
                  selectedCustomer ||
                  customers.find((c) => c.id === selectedCustomerId) ||
                  customers[0];
                const custBalance = currentCust?.currentBalance || 0;

                return (
                  <>
                    {/* Customer Selector dropdown */}
                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">
                        Select Customer (ගණුදෙනුකරු):
                      </label>
                      <select
                        value={currentCust.id}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-900 bg-white focus:outline-none focus:border-orange-600"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (දැනට ණය: {formatRs(c.currentBalance)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <form onSubmit={handleConfirmCreditSale} className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">
                          Credit Amount (ණය මුදල Rs.)
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 8600"
                          value={txAmount}
                          onChange={(e) => setTxAmount(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-black text-base text-neutral-900 focus:outline-none focus:border-orange-600"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-neutral-700 block mb-1">
                          Reason / Item Description
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Diesel 20L / Cement bags / Oil"
                          value={txNotes}
                          onChange={(e) => setTxNotes(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-orange-600"
                        />
                      </div>

                      {txAmount && !isNaN(parseFloat(txAmount)) && (
                        <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-200 text-xs text-orange-900 flex justify-between">
                          <span>New Balance will be:</span>
                          <span className="font-black">
                            {formatRs(custBalance + parseFloat(txAmount))}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowCreditSaleModal(false)}
                          className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 font-black text-white"
                        >
                          Add to Naya
                        </button>
                      </div>
                    </form>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-black text-base text-neutral-900">
                Add Credit Customer (නව ණයගැතියෙක්)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Customer Name (නම)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kamal / Priyantha Bass"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-orange-600 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Phone Number (දුරකථන අංකය)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 077-1234567"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-orange-600 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Address / Location (ලිපිනය)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pannala Road / Site Junction"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-orange-600"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Credit Limit (ණය සීමාව - Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={newCustLimit}
                  onChange={(e) => setNewCustLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-orange-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-700 hover:bg-orange-800 font-black text-white"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
