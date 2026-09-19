import React, { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatRs, shareToWhatsApp, getTodayDateString } from '../utils/formatters';
import { PRIMARY_LORRY_NAMES } from '../data/initialData';
import {
  Truck,
  Plus,
  Share2,
  Check,
  Trash2,
  Calendar,
  Clock,
  User,
  X,
  ArrowRight,
  RotateCcw,
  Search,
  Key,
  CheckCircle2,
  Calculator,
  BarChart3,
  FileText,
  DollarSign,
  AlertCircle,
  Pencil,
  Layers,
} from 'lucide-react';
import { Lorry, LorryPaymentType, LorryTrip } from '../types';

interface RecallEntry {
  lorryId: string;
  lorryName: string;
  material: string;
  quantity?: number;
  amount: number;
}

const RECALL_STORAGE_KEY = 'lorry_last_entry_recall_v1';

export const LorryView: React.FC = () => {
  const {
    lorries,
    lorryTrips,
    customers,
    selectedDate,
    todaySummary,
    addLorryTrip,
    editLorryTrip,
    deleteLorryTrip,
    addLorry,
    firebaseSyncStatus,
    generateLorryWhatsAppSummary,
    materialTypes,
  } = useBusiness();

  // Active Sub-Tab (Matching Screenshot):
  // 1: ADD DATA | 2: ANALYSIS | 3: RECORDS
  const [activeSubTab, setActiveSubTab] = useState<'addData' | 'analysis' | 'records'>('addData');

  // Multi-step Wizard State (Steps 1 to 4)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedLorryId, setSelectedLorryId] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('පස්');
  const [customMaterial, setCustomMaterial] = useState<string>('');
  const [showCustomMaterialInput, setShowCustomMaterialInput] = useState<boolean>(false);

  // Quantity & Amount Calculation
  // Quantity defaults to 300 Feet (අඩි). Amount is OPTIONAL (defaults to 0)!
  const [quantity, setQuantity] = useState<number>(300);
  const [amount, setAmount] = useState<number>(0);
  const [calcMode, setCalcMode] = useState<'default300' | 'unitRate'>('default300');
  const [unitRate, setUnitRate] = useState<number>(1);

  // Payment Options
  const [selectedCustomerForCredit, setSelectedCustomerForCredit] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [tripNotes, setTripNotes] = useState<string>('');

  // UI States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showAddLorryModal, setShowAddLorryModal] = useState<boolean>(false);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

  // Edit Trip Modal State
  const [editingTrip, setEditingTrip] = useState<LorryTrip | null>(null);
  const [editLorryId, setEditLorryId] = useState<string>('');
  const [editMaterial, setEditMaterial] = useState<string>('පස්');
  const [editCustomMaterial, setEditCustomMaterial] = useState<string>('');
  const [editPaymentType, setEditPaymentType] = useState<LorryPaymentType>('FULL');
  const [editQuantity, setEditQuantity] = useState<number>(300);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editCustomerId, setEditCustomerId] = useState<string>('');
  const [editCustomerName, setEditCustomerName] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Open Edit Modal with pre-populated data
  const handleOpenEditTripModal = (trip: LorryTrip) => {
    setEditingTrip(trip);
    setEditLorryId(trip.lorryId);
    const mat = trip.material || trip.tripType || 'පස්';
    const isPrimaryMat = (materialTypes as readonly string[]).includes(mat);
    if (isPrimaryMat) {
      setEditMaterial(mat);
      setEditCustomMaterial('');
    } else {
      setEditMaterial('CUSTOM');
      setEditCustomMaterial(mat);
    }
    setEditPaymentType(trip.paymentType);
    setEditQuantity(trip.quantity || 300);
    setEditAmount(trip.paymentType === 'AIYA' ? 0 : trip.totalAmount);
    setEditDate(trip.date);
    setEditTime(trip.time);
    setEditCustomerId(trip.customerId || '');
    setEditCustomerName(trip.customerName || '');
    setEditNotes(trip.notes || '');
  };

  // Save changes to edited trip
  const handleSaveEditedTrip = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingTrip) return;

    const isAiya = editPaymentType === 'AIYA';
    const finalMaterial = editMaterial === 'CUSTOM' ? (editCustomMaterial.trim() || 'පස්') : editMaterial;
    const finalAmount = isAiya ? 0 : (Number(editAmount) || 0);
    const updatedLorry = lorries.find((l) => l.id === editLorryId);

    editLorryTrip(editingTrip.id, {
      lorryId: editLorryId,
      lorryName: updatedLorry?.name || editingTrip.lorryName,
      material: finalMaterial,
      tripType: finalMaterial,
      destination: finalMaterial,
      quantity: Number(editQuantity) || 300,
      paymentType: editPaymentType,
      totalAmount: finalAmount,
      cashReceived: editPaymentType === 'FULL' ? finalAmount : 0,
      driverPayment: 0,
      creditAmount: editPaymentType === 'CREDIT' ? finalAmount : 0,
      date: editDate || editingTrip.date,
      time: editTime || editingTrip.time,
      customerId: editPaymentType === 'CREDIT' ? (editCustomerId || undefined) : undefined,
      customerName: editPaymentType === 'CREDIT' ? (customers.find((c) => c.id === editCustomerId)?.name || editCustomerName || undefined) : undefined,
      notes: editNotes.trim() || undefined,
    });

    setEditingTrip(null);
    setSuccessToast('ට්‍රිප් එක සාර්ථකව සංස්කරණය කරන ලදී! (Trip updated)');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // New Lorry Modal State
  const [newLorryName, setNewLorryName] = useState<string>('');
  const [newLorryPlate, setNewLorryPlate] = useState<string>('');
  const [newLorryDriver, setNewLorryDriver] = useState<string>('');

  // Quick Recall Banner State (⟲ පෙර: HL සමන්ත • ABC • 300 [නැවත ගන්න])
  const [lastRecall, setLastRecall] = useState<RecallEntry | null>(() => {
    try {
      const saved = localStorage.getItem(RECALL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Keep amount updated when quantity or unit rate changes in unitRate mode
  useEffect(() => {
    if (calcMode === 'unitRate') {
      setAmount(Math.round((quantity || 0) * (unitRate || 0)));
    }
  }, [calcMode, quantity, unitRate]);

  // Selected Lorry object
  const activeLorry = useMemo(() => {
    return lorries.find((l) => l.id === selectedLorryId) || null;
  }, [lorries, selectedLorryId]);

  // Split lorries into "Main Frequent Lorries" and "Other / Newly Added Lorries"
  const { frequentLorries, otherLorries } = useMemo(() => {
    const frequent: Lorry[] = [];
    const others: Lorry[] = [];

    // Filter by search query if any
    const q = searchQuery.trim().toLowerCase();
    const filtered = lorries.filter((l) =>
      q ? l.name.toLowerCase().includes(q) || (l.numberPlate && l.numberPlate.toLowerCase().includes(q)) : true
    );

    // Map through PRIMARY_LORRY_NAMES in order
    PRIMARY_LORRY_NAMES.forEach((pName) => {
      const found = filtered.find((l) => l.name === pName);
      if (found) {
        frequent.push(found);
      }
    });

    // Add any remaining lorries to otherLorries
    filtered.forEach((l) => {
      if (!frequent.some((f) => f.id === l.id)) {
        others.push(l);
      }
    });

    return { frequentLorries: frequent, otherLorries: others };
  }, [lorries, searchQuery]);

  // Handle Lorry Selection -> Instant Advance to Step 2!
  const handleSelectLorry = (lorry: Lorry) => {
    setSelectedLorryId(lorry.id);
    setCurrentStep(2);
  };

  // Handle Material Selection -> Instant Advance to Step 3!
  const handleSelectMaterial = (mat: string) => {
    setSelectedMaterial(mat);
    setShowCustomMaterialInput(false);
    setCurrentStep(3);
  };

  // Quick Preset amount selection in Step 3
  const handleSelectPresetAmount = (val: number) => {
    setAmount(val);
    setCalcMode('default300');
  };

  // Reset form back to Step 1 immediately ready for next entry
  const resetToStepOne = () => {
    setSelectedLorryId('');
    setSelectedMaterial('පස්');
    setCustomMaterial('');
    setShowCustomMaterialInput(false);
    setQuantity(300);
    setCalcMode('default300');
    setAmount(0);
    setUnitRate(1);
    setSelectedCustomerForCredit('');
    setNewCustomerName('');
    setTripNotes('');
    setCurrentStep(1);
  };

  // Save Trip and Trigger Instant Next Entry flow
  const handleSaveTrip = async (paymentMode: 'SAMPURNA' | 'AIYATA' | 'NAYATA') => {
    if (!activeLorry) return;

    const finalMaterial = showCustomMaterialInput && customMaterial.trim() ? customMaterial.trim() : selectedMaterial;
    // Aiyata mudal does NOT track any amount. Amount is optional (defaults to 0 if not entered).
    const isAiya = paymentMode === 'AIYATA';
    const finalAmount = isAiya ? 0 : (Number(amount) > 0 ? Number(amount) : 0);
    const finalQty = Number(quantity) > 0 ? Number(quantity) : 300;

    // Automatic Real-time Timestamp at the moment of adding!
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const currentTimeString = `${formattedHours}:${formattedMinutes} ${ampm}`;

    // Map Payment Mode:
    // Sampurna mudala -> cashReceived = finalAmount, driverPayment = 0, creditAmount = 0
    // Aiyata mudal -> amount = 0, driverPayment = 0, cashReceived = 0, creditAmount = 0
    // Nayata -> creditAmount = finalAmount, cashReceived = 0, driverPayment = 0
    let paymentType: LorryPaymentType = 'FULL';
    let cashReceived = 0;
    let driverPayment = 0;
    let creditAmount = 0;

    if (paymentMode === 'SAMPURNA') {
      paymentType = 'FULL';
      cashReceived = finalAmount;
      driverPayment = 0;
      creditAmount = 0;
    } else if (paymentMode === 'AIYATA') {
      paymentType = 'AIYA';
      cashReceived = 0;
      driverPayment = 0;
      creditAmount = 0;
    } else if (paymentMode === 'NAYATA') {
      paymentType = 'CREDIT';
      cashReceived = 0;
      driverPayment = 0;
      creditAmount = finalAmount;
    }

    // Resolve customer if credit
    let customerId = selectedCustomerForCredit || undefined;
    let customerName = undefined;
    if (paymentMode === 'NAYATA') {
      if (customerId) {
        const cust = customers.find((c) => c.id === customerId);
        customerName = cust?.name;
      } else if (newCustomerName.trim()) {
        customerName = newCustomerName.trim();
      }
    }

    // Save to context & Firestore real-time DB
    addLorryTrip({
      lorryId: activeLorry.id,
      lorryName: activeLorry.name,
      date: selectedDate || getTodayDateString(),
      time: currentTimeString,
      tripType: finalMaterial,
      material: finalMaterial,
      quantity: finalQty,
      unitPrice: isAiya ? 0 : (calcMode === 'unitRate' ? unitRate : undefined),
      calculationMode: calcMode === 'unitRate' ? 'unitPrice' : 'default300',
      destination: finalMaterial,
      totalAmount: finalAmount,
      paymentType,
      cashReceived,
      driverPayment: 0,
      creditAmount,
      customerId,
      customerName,
      driverName: activeLorry.driverName || 'Driver',
      notes: tripNotes.trim() || undefined,
    });

    // Update Quick Recall Banner
    const recall: RecallEntry = {
      lorryId: activeLorry.id,
      lorryName: activeLorry.name,
      material: finalMaterial,
      quantity: finalQty,
      amount: isAiya ? 0 : finalAmount,
    };
    setLastRecall(recall);
    try {
      localStorage.setItem(RECALL_STORAGE_KEY, JSON.stringify(recall));
    } catch {
      // ignore
    }

    // Trigger Success Toast
    setSuccessToast(`✓ ${activeLorry.name} • ${finalMaterial} (${finalQty} අඩි${finalAmount > 0 ? ` • Rs. ${finalAmount}` : ''}) සුරැකිණි!`);
    setTimeout(() => setSuccessToast(null), 2500);

    // IMMEDIATELY RESET TO STEP 1 for ULTRA FAST next trip entry!
    resetToStepOne();
  };

  // Quick Apply from Recall Banner
  const handleApplyRecall = () => {
    if (!lastRecall) return;
    const l = lorries.find((item) => item.id === lastRecall.lorryId || item.name === lastRecall.lorryName);
    if (l) {
      setSelectedLorryId(l.id);
      setSelectedMaterial(lastRecall.material);
      setQuantity(lastRecall.quantity || 300);
      setAmount(lastRecall.amount || 0);
      setCalcMode('default300');
      // Jump directly to payment step!
      setCurrentStep(4);
    }
  };

  // Add New Lorry Handler
  const handleAddNewLorry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLorryName.trim()) return;

    const added = addLorry({
      name: newLorryName.trim(),
      numberPlate: newLorryPlate.trim() || newLorryName.trim(),
      type: 'Tipper (ටිපර්)',
      capacity: '3 Cube',
      driverName: newLorryDriver.trim() || 'Driver',
      status: 'active',
      notes: 'Custom added lorry',
    });

    setNewLorryName('');
    setNewLorryPlate('');
    setNewLorryDriver('');
    setShowAddLorryModal(false);

    // Preselect this lorry
    setSelectedLorryId(added.id);
    setCurrentStep(2);
  };

  const handleShareWhatsApp = () => {
    const text = generateLorryWhatsAppSummary(selectedDate);
    const opened = shareToWhatsApp(text);
    if (!opened) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Current day's trips
  const currentDayTrips = lorryTrips.filter((t) => t.date === selectedDate);

  // Group currentDayTrips by lorryId for grouped Sri Lankan records layout
  const tripsByLorry = useMemo(() => {
    const groups: Record<string, { lorryId: string; lorryName: string; trips: LorryTrip[] }> = {};
    currentDayTrips.forEach((trip) => {
      const lid = trip.lorryId;
      if (!groups[lid]) {
        groups[lid] = { lorryId: lid, lorryName: trip.lorryName, trips: [] };
      }
      groups[lid].trips.push(trip);
    });

    // Sort trips inside each group by time or createdTimestamp
    Object.values(groups).forEach((g) => {
      g.trips.sort((a, b) => (a.createdTimestamp || 0) - (b.createdTimestamp || 0));
    });

    return Object.values(groups);
  }, [currentDayTrips]);

  return (
    <div className="space-y-3 pb-24 font-sans select-none text-slate-100">
      {/* 1. TOP HEADER - LORRY MANAGER (Matching Screenshot) */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Yellow Lorry Icon in Rounded Square */}
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Truck size={22} className="fill-slate-950 stroke-slate-950" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-wide text-white flex items-center gap-1.5">
                <span>LORRY MANAGER</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    firebaseSyncStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="text-[11px] font-bold text-emerald-400">Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('addData')}
              className="px-3 py-1.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md hover:bg-amber-400 active:scale-95 transition"
            >
              <span>දත්ත ඇතුලත් කිරීම</span>
            </button>
          </div>
        </div>

        {/* RECALL BANNER (⟲ පෙර: Lorry • Material • Amount [නැවත ගන්න]) */}
        {lastRecall && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/90 rounded-2xl px-3 py-2 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium truncate">
              <RotateCcw size={14} className="text-amber-400 shrink-0" />
              <span className="truncate">
                <strong className="font-black text-amber-200">පෙර:</strong> {lastRecall.lorryName} • {lastRecall.material} • {lastRecall.quantity || 300} අඩි{lastRecall.amount > 0 ? ` • Rs. ${lastRecall.amount}` : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={handleApplyRecall}
              className="shrink-0 ml-2 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded-xl text-[11px] font-black border border-amber-500/40 active:scale-95 transition"
            >
              නැවත ගන්න
            </button>
          </div>
        )}
      </div>

      {/* SUCCESS TOAST */}
      {successToast && (
        <div className="p-3 bg-emerald-500 text-slate-950 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg animate-bounce">
          <CheckCircle2 size={16} className="text-slate-950 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 2. MAIN SUB-TABS (1. ADD DATA | 2. ANALYSIS | 3. RECORDS) */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#0b1329] p-1 rounded-2xl border border-slate-800 shadow-md">
        <button
          type="button"
          id="tab-lorry-add-data"
          onClick={() => setActiveSubTab('addData')}
          className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'addData'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus size={14} />
          <span>1. ADD DATA</span>
        </button>

        <button
          type="button"
          id="tab-lorry-analysis"
          onClick={() => setActiveSubTab('analysis')}
          className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'analysis'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 size={14} />
          <span>2. ANALYSIS</span>
        </button>

        <button
          type="button"
          id="tab-lorry-records"
          onClick={() => setActiveSubTab('records')}
          className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition relative ${
            activeSubTab === 'records'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={14} />
          <span>3. RECORDS</span>
          {currentDayTrips.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-2 right-2" />
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-VIEW 1: ULTRA FAST STEP-BY-STEP DATA ENTRY           */}
      {/* ======================================================== */}
      {activeSubTab === 'addData' && (
        <div className="space-y-3">
          {/* STEP PROGRESS TRACKER */}
          <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-4 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400">
                {currentStep === 1 && 'පියවර 1/4: ලොරිය තෝරන්න (Select Lorry)'}
                {currentStep === 2 && 'පියවර 2/4: ද්‍රව්‍ය වර්ගය තෝරන්න (Select Material)'}
                {currentStep === 3 && 'පියවර 3/4: ප්‍රමාණය තෝරන්න (Select Quantity)'}
                {currentStep === 4 && 'පියවර 4/4: මිල, සටහන සහ ගෙවීම් (Price, Note & Payment)'}
              </span>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={resetToStepOne}
                  className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 font-bold"
                >
                  <RotateCcw size={12} />
                  <span>මුල සිට</span>
                </button>
              )}
            </div>

            {/* 4 Segment Progress Bars */}
            <div className="grid grid-cols-4 gap-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  currentStep >= 1 ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all ${
                  currentStep >= 2 ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all ${
                  currentStep >= 3 ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all ${
                  currentStep >= 4 ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              />
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* STEP 1: SELECT LORRY (MATCHING SCREENSHOT)           */}
          {/* ---------------------------------------------------- */}
          {currentStep === 1 && (
            <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3.5">
              {/* Card Header with + Lorry button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
                    <Truck size={17} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white">1. ලොරිය තෝරන්න (Select Lorry)</h2>
                    <p className="text-[11px] text-slate-400">ලොරිය මත Click කල සැනින් ඊළඟ පියවරට යයි</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddLorryModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1 border border-slate-700 active:scale-95 transition"
                >
                  <Plus size={14} />
                  <span>+ Lorry</span>
                </button>
              </div>

              {/* Lorry Search Bar */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ලොරි නම සොයන්න (Search lorry)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />

                {/* Autocomplete Suggestions Dropdown */}
                {searchQuery.trim().length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-[#0b1329] border border-slate-700 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800/60">
                    {lorries
                      .filter(
                        (l) =>
                          l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (l.numberPlate && l.numberPlate.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((lorry) => (
                        <button
                          key={lorry.id}
                          type="button"
                          onClick={() => {
                            handleSelectLorry(lorry);
                            setSearchQuery('');
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-black text-white hover:bg-amber-500/10 flex items-center justify-between transition"
                        >
                          <div className="flex items-center gap-2">
                            <Truck size={13} className="text-amber-400" />
                            <span>{lorry.name}</span>
                          </div>
                          {lorry.numberPlate && (
                            <span className="text-[10px] text-slate-500 font-mono font-bold">
                              {lorry.numberPlate}
                            </span>
                          )}
                        </button>
                      ))}
                    {lorries.filter(
                      (l) =>
                        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (l.numberPlate && l.numberPlate.toLowerCase().includes(searchQuery.toLowerCase()))
                    ).length === 0 && (
                      <div className="p-3 text-xs text-slate-500 text-center font-bold">
                        මීට කලින් මෙවැනි ලොරියක් ඇතුලත් කර නැත
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FREQUENT LORRIES (THE 6 REQUESTED LORRIES AT TOP) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-black tracking-wide text-slate-300">
                    නිතර භාවිතා වන ලොරි (MAIN FREQUENT LORRIES):
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {frequentLorries.length} Lorries
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {frequentLorries.map((lorry) => (
                    <button
                      key={lorry.id}
                      type="button"
                      onClick={() => handleSelectLorry(lorry)}
                      className="p-3 bg-slate-900 hover:bg-slate-850 active:bg-amber-500/10 border border-slate-800 hover:border-amber-500/60 rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.98] group shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                          <Truck size={16} />
                        </div>
                        <span className="text-xs font-black text-white truncate">{lorry.name}</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-500 group-hover:text-amber-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* OTHER / NEWLY ADDED LORRIES */}
              {otherLorries.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-slate-400">
                      ⬇ අලුතින් එක් කල ලොරි (OTHER LORRIES):
                    </span>
                    <span className="text-[10px] text-slate-500">{otherLorries.length}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {otherLorries.map((lorry) => (
                      <button
                        key={lorry.id}
                        type="button"
                        onClick={() => handleSelectLorry(lorry)}
                        className="p-3 bg-slate-900/60 hover:bg-slate-900 active:bg-amber-500/10 border border-slate-800/80 hover:border-slate-700 rounded-2xl flex items-center justify-between text-left transition active:scale-[0.98] group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                            <Truck size={14} />
                          </div>
                          <span className="text-xs font-bold text-slate-300 truncate">{lorry.name}</span>
                        </div>
                        <ArrowRight size={13} className="text-slate-600 group-hover:text-amber-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STEP 2: SELECT MATERIAL (වර්ගය)                      */}
          {/* ---------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
              {/* Selected Lorry Badge */}
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-amber-400" />
                  <span className="text-xs font-bold text-slate-400">තෝරාගත් ලොරිය:</span>
                  <span className="text-xs font-black text-white">{activeLorry?.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-[11px] text-amber-400 font-bold hover:underline"
                >
                  වෙනස් කරන්න ↺
                </button>
              </div>

              <div>
                <h2 className="text-sm font-black text-white">2. ද්‍රව්‍ය වර්ගය තෝරන්න (Select Material)</h2>
                <p className="text-[11px] text-slate-400">වර්ගය මත Click කල සැනින් ඊළඟ පියවරට යයි</p>
              </div>

              {/* 6 Requested Materials in Big Tap Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {materialTypes.map((mat) => (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => handleSelectMaterial(mat)}
                    className="p-4 bg-slate-900 hover:bg-slate-850 active:bg-amber-500/20 border border-slate-800 hover:border-amber-500 rounded-2xl text-center font-black text-base text-white transition active:scale-95 shadow-md flex flex-col items-center justify-center gap-1 group"
                  >
                    <span className="group-hover:text-amber-400 transition">{mat}</span>
                    <span className="text-[10px] font-normal text-slate-400 group-hover:text-slate-300">
                      තෝරන්න →
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Material Toggle */}
              <div className="pt-2 border-t border-slate-800">
                {!showCustomMaterialInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomMaterialInput(true)}
                    className="w-full py-2 px-3 bg-slate-900/60 hover:bg-slate-900 border border-dashed border-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>+ වෙනත් වර්ගයක් (Type Custom Material)</span>
                  </button>
                ) : (
                  <div className="space-y-2 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <input
                      type="text"
                      value={customMaterial}
                      onChange={(e) => setCustomMaterial(e.target.value)}
                      placeholder="වර්ගයේ නම ලියන්න (e.g. ගල් කුඩු)..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (customMaterial.trim()) {
                            handleSelectMaterial(customMaterial.trim());
                          }
                        }}
                        className="flex-1 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-black active:scale-95 transition"
                      >
                        තහවුරු කරන්න
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomMaterialInput(false)}
                        className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                      >
                        අවලංගුයි
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STEP 3: SELECT QUANTITY (ප්‍රමාණය තෝරන්න)             */}
          {/* ---------------------------------------------------- */}
          {currentStep === 3 && (
            <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
              {/* Summary of Lorry & Material */}
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-black text-amber-400 truncate">{activeLorry?.name}</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-bold text-white truncate">{selectedMaterial}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-amber-400 font-bold hover:underline shrink-0 ml-2"
                >
                  ආපසු ↺
                </button>
              </div>

              {/* Step Title & Mode Toggle Option */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-850 pb-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-white">3. ප්‍රමාණය තෝරන්න (Quantity)</h2>
                  <p className="text-[11px] text-slate-400">නියමිත ප්‍රමාණයක් තෝරන්න හෝ ඇතුලත් කරන්න</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newMode = calcMode === 'default300' ? 'unitRate' : 'default300';
                    setCalcMode(newMode);
                    if (newMode === 'unitRate') {
                      setQuantity(1);
                      setAmount(0);
                      setUnitRate(0);
                    } else {
                      setQuantity(300);
                      setAmount(0);
                    }
                  }}
                  className="py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-amber-400 text-xs font-black flex items-center gap-1.5 active:scale-95 transition shrink-0"
                >
                  <Calculator size={13} />
                  <span>{calcMode === 'default300' ? 'මිල × ප්‍රමාණය' : 'සාමාන්‍ය'}</span>
                </button>
              </div>

              {/* Standard Mode Content (Screenshot 1 Style, Simplified to only 300) */}
              {calcMode === 'default300' ? (
                <div className="space-y-4">
                  {/* Big 300 Button */}
                  <div className="flex justify-center py-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuantity(300);
                        setAmount(0); // clear or keep 0 by default
                        setCurrentStep(4);
                      }}
                      className="w-full sm:w-48 py-8 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-2xl text-3xl font-black transition text-center shadow-lg shadow-amber-500/10 flex items-center justify-center border-2 border-amber-300"
                    >
                      300
                    </button>
                  </div>

                  <p className="text-center text-[11px] text-slate-400 leading-snug">
                    ඉහත බොත්තම තේරූ සැනින් ඊළඟ පියවරට යයි (Tap the 300 button to proceed instantly)
                  </p>

                  {/* Custom Quantity input below */}
                  <div className="pt-3 border-t border-slate-850 space-y-2">
                    <label htmlFor="input-custom-qty-step3" className="text-[11px] font-bold text-slate-400 block">
                      වෙනත් ඕනෑම ප්‍රමාණයක් ටයිප් කිරීමට (Custom):
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          id="input-custom-qty-step3"
                          type="number"
                          value={quantity || ''}
                          onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                          placeholder="300"
                          className="w-full py-2 px-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-lg font-black text-white text-center focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">අඩි</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!quantity) setQuantity(300);
                          setCurrentStep(4);
                        }}
                        className="py-2.5 px-4 bg-amber-500 hover:bg-amber-450 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1 shrink-0"
                      >
                        <span>ඉදිරියට</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Unit Rate Calculation Mode Content (Screenshot 2 Style) */
                <div className="bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="input-unit-rate-step3" className="text-[11px] font-bold text-slate-400 block mb-1">
                        ඒකක මිල (Price Rs.)
                      </label>
                      <input
                        id="input-unit-rate-step3"
                        type="number"
                        placeholder="e.g. 500"
                        value={unitRate || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setUnitRate(val);
                          setAmount(val * quantity);
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-sm font-bold text-white text-center focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="input-quantity-step3" className="text-[11px] font-bold text-slate-400 block mb-1">
                        ප්‍රමාණය (Quantity)
                      </label>
                      <input
                        id="input-quantity-step3"
                        type="number"
                        placeholder="1"
                        value={quantity || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setQuantity(val);
                          setAmount(unitRate * val);
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-sm font-bold text-white text-center focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Calculated total display block */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold">මුළු එකතුව (Total):</span>
                    <span className="text-lg font-black text-amber-400 font-mono">Rs. {unitRate * quantity}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAmount(unitRate * quantity);
                      setCurrentStep(4);
                    }}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-lg transition"
                  >
                    <span>තහවුරු කර ඉදිරියට (Next)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STEP 4: PAYMENT OPTIONS (සම්පූර්ණ / අයියට / ණයට)    */}
          {/* ---------------------------------------------------- */}
          {currentStep === 4 && (
            <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
              {/* Trip Summary Card */}
              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Truck size={17} className="text-amber-400" />
                    <span className="font-black text-white text-sm">{activeLorry?.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-xs font-black border border-amber-500/30">
                      {selectedMaterial}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 text-xs font-bold border border-slate-700 font-mono">
                      {quantity} අඩි
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock size={13} className="text-slate-500" />
                    <span>වේලාව: දැන් (Real-time Auto-Recorded)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block leading-tight">මුළු මුදල:</span>
                    <span className={`text-lg font-black font-mono ${amount > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {amount > 0 ? `Rs. ${amount}` : 'රු. 0 (නැත)'}
                    </span>
                  </div>
                </div>

                {tripNotes.trim() && (
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 flex items-start gap-1.5 text-[11px] text-amber-200">
                    <FileText size={13} className="text-amber-400 mt-0.5 shrink-0" />
                    <span><strong>Note:</strong> {tripNotes.trim()}</span>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-sm font-black text-white">4. මුදල් ගෙවීම / තහවුරු කිරීම (Select Payment Option)</h2>
                <p className="text-[11px] text-slate-400">
                  {amount > 0
                    ? 'මුදල් ලැබුණි නම් "සම්පූර්ණ මුදල" මත Click කරන්න. මුදල් නැතිනම් අයියාට හෝ ණයට තෝරන්න.'
                    : 'මුදලක් ඇතුළත් කර නැත (රු. 0). ට්‍රිප් එක සටහන් කිරීමට පහතින් තෝරන්න.'}
                </p>
              </div>

              {/* DIRECT AMOUNT QUICK ADJUSTER & NOTE IN STEP 4 */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    මුදල (Amount in Rs - Optional):
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {amount > 0 ? `Rs. ${amount}` : 'රු. 0 (නැත)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">Rs.</span>
                    <input
                      type="number"
                      value={amount === 0 ? '' : amount}
                      onChange={(e) => setAmount(Number(e.target.value) || 0)}
                      placeholder="0 (මුදලක් නැත)"
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-black text-white focus:outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAmount(0)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition border ${
                        amount === 0
                          ? 'bg-slate-800 text-amber-300 border-amber-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      රු. 0
                    </button>
                    {[300, 500, 1000, 1500].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAmount(p)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold font-mono transition border ${
                          amount === p
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Trip Note input right here if user wants to add/edit note */}
                <div className="pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <FileText size={13} className="text-amber-400 shrink-0" />
                    <input
                      type="text"
                      value={tripNotes}
                      onChange={(e) => setTripNotes(e.target.value)}
                      placeholder="ට්‍රිප් එකට සටහනක් (Note - අවශ්‍ය නම් ලියන්න)..."
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* 3 HIGH CONTRAST PAYMENT BUTTONS */}
              <div className="space-y-2.5">
                {/* 1. SAMPURNA MUDALA / RECORD TRIP */}
                <button
                  type="button"
                  id="btn-pay-sampurna"
                  onClick={() => handleSaveTrip('SAMPURNA')}
                  className="w-full p-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl font-black text-left flex items-center justify-between border-2 border-emerald-400/40 shadow-lg active:scale-98 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                      <DollarSign size={22} />
                    </div>
                    <div>
                      <span className="text-base font-black block leading-tight">
                        {amount > 0 ? 'සම්පූර්ණ මුදල (Full Cash)' : 'ට්‍රිප් එක සටහන් කරන්න (Record Trip)'}
                      </span>
                      <span className="text-xs text-emerald-100 font-medium block">
                        {amount > 0
                          ? `මුදල් ලැබුණි: Rs. ${amount} • මුදල් පෙට්ටියට එකතු වේ`
                          : `මුදලක් නැත (රු. 0) • ට්‍රිප් එක සහ ප්‍රමාණය (${quantity} අඩි) සටහන් වේ`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-base font-black font-mono">
                      {amount > 0 ? `Rs. ${amount}` : 'රු. 0'}
                    </span>
                    <span className="text-[10px] text-emerald-200">සුරකින්න →</span>
                  </div>
                </button>

                {/* 2. AIYATA MUDAL (NO AMOUNT STORED) */}
                <button
                  type="button"
                  id="btn-pay-aiyata"
                  onClick={() => handleSaveTrip('AIYATA')}
                  className="w-full p-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-slate-950 rounded-2xl font-black text-left flex items-center justify-between border-2 border-amber-400/50 shadow-lg active:scale-98 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/15 flex items-center justify-center text-slate-950 shrink-0">
                      <User size={22} />
                    </div>
                    <div>
                      <span className="text-base font-black block leading-tight">
                        අයියාට මුදල් (Aiyata Mudal)
                      </span>
                      <span className="text-xs text-amber-950 font-bold block">
                        මුදලක් අවශ්‍ය නැත (ගාණක් සටහන් නොවේ) • ලාච්චුවට එකතු නොවේ
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-xs font-black bg-black/20 px-2.5 py-1 rounded-lg">රු. 0 (නැත)</span>
                  </div>
                </button>

                {/* 3. NAYATA (CREDIT) */}
                <div className="bg-slate-900 border-2 border-rose-900/60 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <span className="text-sm font-black text-rose-400 block leading-tight">
                          ණයට (Naya / Credit)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {amount > 0 ? `ණය: Rs. ${amount} • ණය පොතට එකතු වේ` : 'මුදලක් නැත (රු. 0)'}
                        </span>
                      </div>
                    </div>
                    {amount > 0 && (
                      <span className="text-xs font-black font-mono text-rose-400">
                        Rs. {amount}
                      </span>
                    )}
                  </div>

                  {/* Customer Select or Type */}
                  <div className="space-y-1.5 pt-1">
                    <select
                      value={selectedCustomerForCredit}
                      onChange={(e) => setSelectedCustomerForCredit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="">-- Customer තෝරන්න (Select Customer) --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (ණය: Rs. {c.currentBalance})
                        </option>
                      ))}
                    </select>

                    {!selectedCustomerForCredit && (
                      <input
                        type="text"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder="හෝ අලුත් Customer නම ලියන්න..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    id="btn-pay-nayata"
                    onClick={() => handleSaveTrip('NAYATA')}
                    className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-98 transition shadow"
                  >
                    <span>ණයට සටහන් කරන්න (Save as Credit)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-VIEW 2: ANALYSIS & DAILY SUMMARY                     */}
      {/* ======================================================== */}
      {activeSubTab === 'analysis' && (
        <div className="space-y-3">
          {/* DAILY STATS BANNER */}
          <div className="bg-[#0b1329] border border-slate-800 text-white rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm leading-tight text-white">
                    Daily Lorry Summary ({selectedDate})
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    අද දිනයේ ලොරි ට්‍රිප් සාරාංශය
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black">
                {todaySummary.totalTripsCount} Trips
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Income (මුළු ආදායම)</span>
                <span className="text-lg font-black text-white font-mono">
                  {formatRs(todaySummary.totalLorryIncome)}
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-2xl border border-emerald-900/50">
                <span className="text-[10px] text-emerald-400 block">Cash Balance (අතට ලැබුණි)</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {formatRs(todaySummary.totalLorryCash)}
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-2xl border border-amber-900/50">
                <span className="text-[10px] text-amber-400 block">Driver / Aiya (අයියට මුදල්)</span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {formatRs(todaySummary.totalDriverPayments)}
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-2xl border border-rose-900/50">
                <span className="text-[10px] text-rose-400 block">Naya / Credit (ණයට)</span>
                <span className="text-lg font-black text-rose-400 font-mono">
                  {formatRs(todaySummary.totalLorryCredit)}
                </span>
              </div>
            </div>

            {/* WhatsApp Summary Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full py-3 px-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-xs text-white flex items-center justify-center gap-2 active:scale-95 transition shadow-lg"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Share2 size={16} />
                  <span>WHATSAPP සාරාංශය යවන්න (SEND WHATSAPP SUMMARY)</span>
                </>
              )}
            </button>
          </div>

          {/* LORRY-BY-LORRY BREAKDOWN CARDS */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
              LORRY BY LORRY BREAKDOWN ({todaySummary.lorryBreakdown.filter(item => item.tripsCount > 0).length})
            </h3>

            <div className="space-y-2">
              {todaySummary.lorryBreakdown.filter(item => item.tripsCount > 0).map((item) => {
                const lorryTripsForToday = currentDayTrips.filter((t) => t.lorryId === item.lorryId);
                
                // Group by material
                const materialCounts: Record<string, number> = {};
                lorryTripsForToday.forEach((t) => {
                  const mat = t.material || t.tripType || 'පස්';
                  materialCounts[mat] = (materialCounts[mat] || 0) + 1;
                });

                const materialsList = Object.entries(materialCounts);

                // Calculate total amount for non-Aiya trips
                const nonAiyaTotal = lorryTripsForToday
                  .filter((t) => t.paymentType !== 'AIYA')
                  .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

                return (
                  <div
                    key={item.lorryId}
                    className="bg-[#0b1329] p-4 rounded-3xl border border-slate-800 flex items-center justify-between shadow-md"
                  >
                    <div className="space-y-1.5">
                      {/* Lorry Name */}
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-amber-500 shrink-0" />
                        <span className="font-black text-white text-sm">{item.lorryName}</span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          ({item.tripsCount} trips)
                        </span>
                      </div>

                      {/* Materials List */}
                      {materialsList.length > 0 ? (
                        <div className="space-y-1 pl-6 pt-0.5">
                          {materialsList.map(([mat, count]) => (
                            <div key={mat} className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] tracking-wide">
                                {mat}
                              </span>
                              <span className="text-white font-mono">{count}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 pl-6 block">ට්‍රිප් නැත (No Trips)</span>
                      )}
                    </div>

                    {/* Total Money "මුදල් <amount>" (Show only if non-Aiya trips total > 0) */}
                    {nonAiyaTotal > 0 && (
                      <div className="text-right pl-4">
                        <span className="text-slate-400 text-[10px] font-black block uppercase tracking-wide">මුදල්</span>
                        <span className="text-base font-black text-emerald-400 font-mono">
                          Rs. {nonAiyaTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-VIEW 3: RECORDS LOG                                  */}
      {/* ======================================================== */}
      {activeSubTab === 'records' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              දිනයේ ලොරි ට්‍රිප් ලැයිස්තුව ({currentDayTrips.length})
            </h3>
            <span className="text-[11px] text-slate-500">{selectedDate}</span>
          </div>

          {currentDayTrips.length === 0 ? (
            <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-8 text-center space-y-2">
              <Truck size={32} className="mx-auto text-slate-600" />
              <p className="font-bold text-slate-300 text-sm">අද දින ට්‍රිප් සටහන් කර නොමැත.</p>
              <button
                type="button"
                onClick={() => setActiveSubTab('addData')}
                className="mt-2 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-black"
              >
                + ට්‍රිප් එකක් එක් කරන්න
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tripsByLorry.map((group) => {
                const nonAiyaTotal = group.trips
                  .filter((t) => t.paymentType !== 'AIYA')
                  .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

                return (
                  <div key={group.lorryId} className="bg-[#0b1329] border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
                    {/* Lorry Name Header */}
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <div className="flex items-center gap-2">
                        <Truck size={17} className="text-amber-500 shrink-0" />
                        <span className="font-black text-sm text-white tracking-wide">{group.lorryName}</span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                        {group.trips.length} ට්‍රිප් (Trips)
                      </span>
                    </div>

                    {/* Trips Rows under this Lorry */}
                    <div className="space-y-2">
                      {group.trips.map((trip, idx) => {
                        const isAiya = trip.paymentType === 'AIYA';
                        return (
                          <div key={trip.id} className="bg-slate-900/60 border border-slate-850 p-3 rounded-2xl space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Format: [Material] [Sequential Number] */}
                                  <span className="text-xs font-black text-white">{trip.material || trip.tripType}</span>
                                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25 font-mono">
                                    {idx + 1}
                                  </span>
                                  {trip.quantity && trip.quantity !== 300 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-mono">
                                      {trip.quantity} ft
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                                  <Clock size={11} />
                                  {trip.time}
                                  {trip.customerName && ` • Customer: ${trip.customerName}`}
                                </span>
                                {trip.notes && (
                                  <div className="mt-1 bg-slate-950/80 rounded-lg px-2 py-1 border border-slate-800/60 flex items-start gap-1.5 text-[11px] text-amber-200">
                                    <FileText size={12} className="text-amber-400 mt-0.5 shrink-0" />
                                    <span><strong className="text-slate-400 font-medium">Note:</strong> {trip.notes}</span>
                                  </div>
                                )}
                              </div>

                              <div className="text-right">
                                {isAiya ? (
                                  <span className="text-xs font-black text-slate-500 block font-mono">
                                    අයියාට (රු. 0)
                                  </span>
                                ) : (
                                  <span className="text-sm font-black text-amber-400 font-mono block">
                                    Rs. {trip.totalAmount.toLocaleString()}
                                  </span>
                                )}
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded block w-fit ml-auto mt-1 ${
                                    trip.paymentType === 'FULL'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-900/60'
                                      : trip.paymentType === 'AIYA'
                                      ? 'bg-slate-950 text-slate-400 border border-slate-800'
                                      : 'bg-rose-950 text-rose-300 border border-rose-900/60'
                                  }`}
                                >
                                  {trip.paymentType === 'FULL'
                                    ? 'සම්පූර්ණ මුදල'
                                    : trip.paymentType === 'AIYA'
                                    ? 'අයියාට මුදල්'
                                    : 'ණයට'}
                                </span>
                              </div>
                            </div>

                            {/* Row Actions: Edit & Delete */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-850">
                              <button
                                type="button"
                                onClick={() => handleOpenEditTripModal(trip)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 text-[10px] font-black transition active:scale-95 border border-slate-800/80"
                                title="Edit Trip"
                              >
                                <Pencil size={11} className="text-amber-400" />
                                <span>Edit (වෙනස් කරන්න)</span>
                              </button>

                              <div>
                                {deletingTripId === trip.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-rose-400 font-bold">මකන්නද?</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        deleteLorryTrip(trip.id);
                                        setDeletingTripId(null);
                                      }}
                                      className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black shadow"
                                    >
                                      ඔව්
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingTripId(null)}
                                      className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]"
                                    >
                                      නැත
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingTripId(trip.id)}
                                    className="text-slate-500 hover:text-rose-400 p-0.5 rounded flex items-center gap-0.5 text-[10px] transition"
                                    title="Delete Trip"
                                  >
                                    <Trash2 size={11} />
                                    <span>මකන්න</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Group Total Money (Excluded Aiyata trips) */}
                    {nonAiyaTotal > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-850 px-1 bg-slate-900/30 rounded-xl p-2 border border-slate-850/40">
                        <span className="text-slate-400 text-xs font-black">මුදල් එකතුව (Total Amount)</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          Rs. {nonAiyaTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT TRIP MODAL (ට්‍රිප් විස්තර සංස්කරණය)               */}
      {/* ======================================================== */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3.5 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#0b1329] border border-slate-700 w-full max-w-md rounded-3xl p-5 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Pencil size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">ට්‍රිප් විස්තර සංස්කරණය (Edit Trip)</h3>
                  <span className="text-[11px] text-slate-400">ඇතුලත් කළ දත්ත නිවැරදි කරන්න</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTrip(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditedTrip} className="space-y-3.5">
              {/* Lorry Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  ලොරිය තෝරන්න (Select Lorry):
                </label>
                <select
                  value={editLorryId}
                  onChange={(e) => setEditLorryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                >
                  {lorries.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.numberPlate ? `(${l.numberPlate})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Material Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  ද්‍රව්‍ය (Material):
                </label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {materialTypes.map((mat) => (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => {
                        setEditMaterial(mat);
                        setEditCustomMaterial('');
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border ${
                        editMaterial === mat
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {mat}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditMaterial('CUSTOM')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border ${
                      editMaterial === 'CUSTOM'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    වෙනත්...
                  </button>
                </div>
                {editMaterial === 'CUSTOM' && (
                  <input
                    type="text"
                    value={editCustomMaterial}
                    onChange={(e) => setEditCustomMaterial(e.target.value)}
                    placeholder="ද්‍රව්‍යයේ නම ලියන්න..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                )}
              </div>

              {/* Quantity Selector for Edit Modal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    ප්‍රමාණය (Quantity in Feet / අඩි):
                  </label>
                  <span className="text-xs font-black text-amber-400 font-mono">
                    {editQuantity} අඩි (Feet)
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <button
                    type="button"
                    onClick={() => setEditQuantity((prev) => Math.max(25, prev - 25))}
                    className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center text-xs font-black active:scale-95 transition shrink-0"
                    title="25 අඩියක් අඩු කරන්න"
                  >
                    -25
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="5"
                      min="1"
                      value={editQuantity || ''}
                      onChange={(e) => setEditQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-amber-500 font-mono text-center"
                      placeholder="300"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400/70 pointer-events-none">
                      අඩි
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditQuantity((prev) => prev + 25)}
                    className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center text-xs font-black active:scale-95 transition shrink-0"
                    title="25 අඩියක් වැඩි කරන්න"
                  >
                    +25
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[150, 200, 250, 300, 350, 400].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setEditQuantity(q)}
                      className={`py-1 rounded-lg text-xs font-bold transition border ${
                        editQuantity === q
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  මුදල් ගෙවීමේ ආකාරය (Payment Type):
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditPaymentType('FULL')}
                    className={`py-2 px-1.5 rounded-xl text-xs font-black transition border text-center ${
                      editPaymentType === 'FULL'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    සම්පූර්ණ මුදල
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditPaymentType('AIYA');
                      setEditAmount(0);
                    }}
                    className={`py-2 px-1.5 rounded-xl text-xs font-black transition border text-center ${
                      editPaymentType === 'AIYA'
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    අයියාට මුදල්
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPaymentType('CREDIT')}
                    className={`py-2 px-1.5 rounded-xl text-xs font-black transition border text-center ${
                      editPaymentType === 'CREDIT'
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    ණයට
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  මුළු මුදල (Amount in Rs):
                </label>
                {editPaymentType === 'AIYA' ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-bold flex items-center justify-between">
                    <span>අයියාට මුදල් සඳහා ගාණක් සටහන් නොවේ</span>
                    <span className="font-mono text-white bg-black/40 px-2 py-0.5 rounded">රු. 0</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        value={editAmount || ''}
                        onChange={(e) => setEditAmount(Number(e.target.value))}
                        placeholder="300"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-black text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      {[300, 500, 1000, 1500, 2000].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEditAmount(p)}
                          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition border ${
                            editAmount === p
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Selector if Credit */}
              {editPaymentType === 'CREDIT' && (
                <div className="p-3 bg-rose-950/20 border border-rose-900/50 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-rose-300 block">
                    Customer තෝරන්න (Credit Customer):
                  </label>
                  <select
                    value={editCustomerId}
                    onChange={(e) => setEditCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-rose-900 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="">-- Customer තෝරන්න --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (ණය: Rs. {c.currentBalance})
                      </option>
                    ))}
                  </select>
                  {!editCustomerId && (
                    <input
                      type="text"
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      placeholder="හෝ අලුත් Customer නම..."
                      className="w-full px-3 py-2 bg-slate-950 border border-rose-900 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  )}
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    දිනය (Date):
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    වේලාව (Time):
                  </label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  සටහන් (Notes):
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="වෙනත් විස්තර..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg active:scale-95 transition"
                >
                  වෙනස්කම් සුරකින්න (Save Changes)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTrip(null)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  අවලංගුයි
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* QUICK ADD NEW LORRY MODAL (+ Lorry)                      */}
      {/* ======================================================== */}
      {showAddLorryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0b1329] border border-slate-700 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Truck size={18} className="text-amber-400" />
                <span>අලුත් ලොරියක් එකතු කරන්න (+ Lorry)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddLorryModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewLorry} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  ලොරියේ නම (Name): *
                </label>
                <input
                  type="text"
                  required
                  value={newLorryName}
                  onChange={(e) => setNewLorryName(e.target.value)}
                  placeholder="e.g. 48 ගයාන්..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  අංක තහඩුව (Plate / Code):
                </label>
                <input
                  type="text"
                  value={newLorryPlate}
                  onChange={(e) => setNewLorryPlate(e.target.value)}
                  placeholder="e.g. WP GA-1234"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  රියදුරු (Driver):
                </label>
                <input
                  type="text"
                  value={newLorryDriver}
                  onChange={(e) => setNewLorryDriver(e.target.value)}
                  placeholder="e.g. ගයාන්"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-black shadow active:scale-95 transition"
                >
                  එකතු කරන්න
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddLorryModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  අවලංගුයි
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
