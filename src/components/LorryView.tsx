import React, { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatRs, shareToWhatsApp, getTodayDateString } from '../utils/formatters';
import { PRIMARY_LORRY_NAMES, PRIMARY_MATERIAL_TYPES } from '../data/initialData';
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
} from 'lucide-react';
import { Lorry, LorryPaymentType } from '../types';

interface RecallEntry {
  lorryId: string;
  lorryName: string;
  material: string;
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
    deleteLorryTrip,
    addLorry,
    firebaseSyncStatus,
    generateLorryWhatsAppSummary,
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
  // Default is 300 as specified by user!
  const [calcMode, setCalcMode] = useState<'default300' | 'unitRate'>('default300');
  const [amount, setAmount] = useState<number>(300);
  const [unitCount, setUnitCount] = useState<number>(3);
  const [unitRate, setUnitRate] = useState<number>(100);

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

  // Keep amount updated when unit count or rate changes in unitRate mode
  useEffect(() => {
    if (calcMode === 'unitRate') {
      setAmount((unitCount || 0) * (unitRate || 0));
    }
  }, [calcMode, unitCount, unitRate]);

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
    setCalcMode('default300');
    setAmount(300);
    setUnitCount(3);
    setUnitRate(100);
    setSelectedCustomerForCredit('');
    setNewCustomerName('');
    setTripNotes('');
    setCurrentStep(1);
  };

  // Save Trip and Trigger Instant Next Entry flow
  const handleSaveTrip = async (paymentMode: 'SAMPURNA' | 'AIYATA' | 'NAYATA') => {
    if (!activeLorry) return;

    const finalMaterial = showCustomMaterialInput && customMaterial.trim() ? customMaterial.trim() : selectedMaterial;
    const finalAmount = amount > 0 ? amount : 300;

    // Automatic Real-time Timestamp at the moment of adding!
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const currentTimeString = `${formattedHours}:${formattedMinutes} ${ampm}`;

    // Map Payment Mode as requested:
    // Sampurna mudala -> cashReceived = finalAmount (Dawase anthiyama ekathu wenna one sampurna mudal vitharai)
    // Aiyata mudal -> driverPayment = finalAmount, cashReceived = 0
    // Nayata -> creditAmount = finalAmount, cashReceived = 0
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
      driverPayment = finalAmount;
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
      quantity: calcMode === 'unitRate' ? unitCount : finalAmount,
      unitPrice: calcMode === 'unitRate' ? unitRate : undefined,
      calculationMode: calcMode === 'unitRate' ? 'unitPrice' : 'default300',
      destination: finalMaterial,
      totalAmount: finalAmount,
      paymentType,
      cashReceived,
      driverPayment,
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
      amount: finalAmount,
    };
    setLastRecall(recall);
    try {
      localStorage.setItem(RECALL_STORAGE_KEY, JSON.stringify(recall));
    } catch {
      // ignore
    }

    // Trigger Success Toast
    setSuccessToast(`✓ ${activeLorry.name} • ${finalMaterial} (Rs. ${finalAmount}) සුරැකිණි!`);
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
      setAmount(lastRecall.amount);
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
                <strong className="font-black text-amber-200">පෙර:</strong> {lastRecall.lorryName} • {lastRecall.material} • Rs. {lastRecall.amount}
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
                {currentStep === 3 && 'පියවර 3/4: ප්‍රමාණය සහ මිල (Quantity & Rate)'}
                {currentStep === 4 && 'පියවර 4/4: මුදල් ගෙවීම (Payment Option)'}
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
                {PRIMARY_MATERIAL_TYPES.map((mat) => (
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
          {/* STEP 3: QUANTITY & AMOUNT (ප්‍රමාණය & මිල)          */}
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

              <div>
                <h2 className="text-sm font-black text-white">3. ප්‍රමාණය සහ මුදල (Quantity & Amount)</h2>
                <p className="text-[11px] text-slate-400">Default ප්‍රමාණය 300 ක් වේ හෝ ඒකක ගණන × මිලෙන් දමන්න</p>
              </div>

              {/* Mode Switcher Toggle */}
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setCalcMode('default300')}
                  className={`py-2 px-3 rounded-xl font-black transition ${
                    calcMode === 'default300'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  සාමාන්‍ය (Default: 300)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalcMode('unitRate');
                    setAmount((unitCount || 0) * (unitRate || 0));
                  }}
                  className={`py-2 px-3 rounded-xl font-black transition ${
                    calcMode === 'unitRate'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ඒකක × මිල (Rate)
                </button>
              </div>

              {/* MODE A: DEFAULT 300 + PRESETS */}
              {calcMode === 'default300' && (
                <div className="space-y-3">
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="text-xs text-slate-400 block mb-1">නියමිත මුදල (Amount in Rs):</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-black text-amber-400 font-mono">
                        Rs. {amount}
                      </span>
                    </div>
                  </div>

                  {/* Preset Amount Pills */}
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block mb-1.5 px-1">
                      ඉක්මන් ප්‍රමාණ (Quick Presets):
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[300, 200, 250, 350, 400, 500, 600, 1000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleSelectPresetAmount(preset)}
                          className={`py-2 px-2 rounded-xl text-xs font-black transition border ${
                            amount === preset
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                          }`}
                        >
                          {preset} {preset === 300 ? '★' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Amount Input */}
                  <div className="pt-2">
                    <label className="text-[11px] text-slate-400 font-bold block mb-1 px-1">
                      වෙනත් මුදලක් ඇතුලත් කරන්න (Custom Amount):
                    </label>
                    <input
                      type="number"
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-base font-black text-white focus:outline-none focus:border-amber-500 font-mono text-center"
                      placeholder="300"
                    />
                  </div>
                </div>
              )}

              {/* MODE B: UNIT COUNT × UNIT PRICE */}
              {calcMode === 'unitRate' && (
                <div className="space-y-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        ඒකක ගණන (Units/Cubes):
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={unitCount || ''}
                        onChange={(e) => setUnitCount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-black text-white focus:outline-none focus:border-amber-500 font-mono text-center"
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        ඒකකයක මිල (Rs):
                      </label>
                      <input
                        type="number"
                        value={unitRate || ''}
                        onChange={(e) => setUnitRate(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-black text-white focus:outline-none focus:border-amber-500 font-mono text-center"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  {/* Computed Total Strip */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">
                      ගණනය කළ මුළු මුදල ({unitCount} × Rs. {unitRate}):
                    </span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      Rs. {amount}
                    </span>
                  </div>
                </div>
              )}

              {/* Advance to Step 4 Button */}
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg active:scale-98 transition"
              >
                <span>මුදල් ගෙවීමට යන්න (Next to Payment)</span>
                <ArrowRight size={16} />
              </button>
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
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-xs font-black border border-amber-500/30">
                    {selectedMaterial}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock size={13} className="text-slate-500" />
                    <span>වේලාව: දැන් (Real-time Auto-Recorded)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block leading-tight">මුළු මුදල:</span>
                    <span className="text-xl font-black text-amber-400 font-mono">
                      Rs. {amount}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-black text-white">4. මුදල් ගෙවීම (Select Payment Option)</h2>
                <p className="text-[11px] text-slate-400">
                  දවසේ අවසානයට මුදල් පෙට්ටියට එකතු වන්නේ සම්පූර්ණ මුදල පමණි
                </p>
              </div>

              {/* 3 HIGH CONTRAST PAYMENT BUTTONS */}
              <div className="space-y-2.5">
                {/* 1. SAMPURNA MUDALA (FULL CASH TO BUSINESS) */}
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
                        සම්පූර්ණ මුදල (Full Cash)
                      </span>
                      <span className="text-xs text-emerald-100 font-normal">
                        මුදල් ලැබුණි • දවසේ මුදල් පෙට්ටියට එකතු වේ
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-white shrink-0" />
                </button>

                {/* 2. AIYATA MUDAL (DRIVER WAGE / ADVANCE) */}
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
                        අයියට මුදල් (Driver Wage)
                      </span>
                      <span className="text-xs text-amber-950 font-semibold">
                        රියදුරුට මුදල් දුනි/තබාගති • පෙට්ටියට එකතු නොවේ
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-950 shrink-0" />
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
                        <span className="text-[11px] text-slate-400">ණය පොතට (Customer Balance) එකතු වේ</span>
                      </div>
                    </div>
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
              LORRY BY LORRY BREAKDOWN ({todaySummary.lorryBreakdown.length})
            </h3>

            <div className="space-y-2">
              {todaySummary.lorryBreakdown.map((item) => (
                <div
                  key={item.lorryId}
                  className="bg-[#0b1329] p-3.5 rounded-2xl border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-amber-400" />
                      <span className="font-black text-white text-sm">{item.lorryName}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      {item.tripsCount} ට්‍රිප්
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="bg-slate-900 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 block">Total</span>
                      <span className="font-black text-white">{formatRs(item.totalIncome)}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl">
                      <span className="text-[10px] text-amber-500 block">Driver</span>
                      <span className="font-black text-amber-400">{formatRs(item.driverPayment)}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-emerald-950">
                      <span className="text-[10px] text-emerald-500 block">Cash</span>
                      <span className="font-black text-emerald-400">
                        {formatRs(item.totalIncome - item.driverPayment - item.credit)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
            <div className="space-y-2">
              {currentDayTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-[#0b1329] border border-slate-800 rounded-2xl p-3.5 space-y-2 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white">{trip.lorryName}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {trip.material || trip.tripType}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        {trip.time}
                        {trip.customerName && ` • Customer: ${trip.customerName}`}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-amber-400 font-mono block">
                        {formatRs(trip.totalAmount)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          trip.paymentType === 'FULL'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : trip.paymentType === 'AIYA'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {trip.paymentType === 'FULL'
                          ? 'සම්පූර්ණ මුදල'
                          : trip.paymentType === 'AIYA'
                          ? 'අයියට මුදල්'
                          : 'ණයට'}
                      </span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="flex justify-end pt-1 border-t border-slate-800/60">
                    {deletingTripId === trip.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-rose-400 font-bold">මකන්නද?</span>
                        <button
                          type="button"
                          onClick={() => {
                            deleteLorryTrip(trip.id);
                            setDeletingTripId(null);
                          }}
                          className="px-2 py-1 bg-rose-600 text-white rounded text-[11px] font-black"
                        >
                          ඔව්
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTripId(null)}
                          className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[11px]"
                        >
                          නැත
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingTripId(trip.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded"
                        title="Delete Trip"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
