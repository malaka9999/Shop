import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatRs, formatRsNumber } from '../utils/formatters';
import {
  Settings,
  Tag,
  Truck,
  Users,
  RotateCcw,
  Check,
  Edit2,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  Cloud,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Product, Lorry } from '../types';

interface SettingsViewProps {
  initialSection?: 'prices' | 'lorries' | 'workers' | 'general';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialSection = 'prices' }) => {
  const {
    products,
    lorries,
    workers,
    updateProductPrice,
    addProduct,
    deleteProduct,
    addLorry,
    editLorry,
    deleteLorry,
    editProduct,
    resetToDefaultData,
    firebaseSyncStatus,
    syncAllToFirebase,
    materialTypes,
    addMaterialType,
    editMaterialType,
    deleteMaterialType,
  } = useBusiness();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(false);

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    try {
      await syncAllToFirebase();
      setSyncSuccessMsg(true);
      setTimeout(() => setSyncSuccessMsg(false), 3000);
    } catch {
      // error handled in context
    } finally {
      setIsSyncing(false);
    }
  };

  const [activeSection, setActiveSection] = useState<'prices' | 'lorries' | 'general'>(
    initialSection === 'workers' ? 'prices' : (initialSection as any)
  );

  // Product Edit Modal (extended to edit everything)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductSinhala, setNewProductSinhala] = useState<string>('');
  const [newProductCategory, setNewProductCategory] = useState<string>('');
  const [newProductUnit, setNewProductUnit] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Add Product Modal
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addProductName, setAddProductName] = useState('');
  const [addProductSinhala, setAddProductSinhala] = useState('');
  const [addProductCategory, setAddProductCategory] = useState('fuel');
  const [addProductUnit, setAddProductUnit] = useState('1L');
  const [addProductPrice, setAddProductPrice] = useState('');

  // New Lorry Modal
  const [showAddLorry, setShowAddLorry] = useState(false);
  const [lorryName, setLorryName] = useState('');
  const [lorryPlate, setLorryPlate] = useState('');
  const [lorryDriver, setLorryDriver] = useState('');
  const [lorryCapacity, setLorryCapacity] = useState('3 Cube');

  // Edit Lorry Modal
  const [editingLorry, setEditingLorry] = useState<Lorry | null>(null);
  const [editLorryName, setEditLorryName] = useState('');
  const [editLorryPlate, setEditLorryPlate] = useState('');
  const [editLorryDriver, setEditLorryDriver] = useState('');
  const [editLorryCapacity, setEditLorryCapacity] = useState('');
  const [editLorryNotes, setEditLorryNotes] = useState('');

  // Materials State inside Settings
  const [newMaterialType, setNewMaterialType] = useState('');
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [editMaterialName, setEditMaterialName] = useState('');

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleOpenPriceModal = (product: Product) => {
    setEditingProduct(product);
    setNewProductName(product.name);
    setNewProductSinhala(product.nameSinhala || '');
    setNewProductCategory(product.category);
    setNewProductUnit(product.unit);
    setNewPrice(String(product.unitPrice));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) return;

    editProduct(editingProduct.id, {
      name: newProductName.trim(),
      nameSinhala: newProductSinhala.trim(),
      category: newProductCategory as any,
      unit: newProductUnit.trim(),
      unitPrice: priceNum,
    });

    setSaveSuccess(`Updated ${newProductName.trim()}`);
    setTimeout(() => setSaveSuccess(null), 3000);
    setEditingProduct(null);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(addProductPrice);
    if (!addProductName.trim() || isNaN(priceNum) || priceNum < 0) return;

    addProduct({
      name: addProductName.trim(),
      nameSinhala: addProductSinhala.trim(),
      category: addProductCategory as any,
      unit: addProductUnit.trim(),
      unitPrice: priceNum,
      isQuickItem: true,
    });

    setSaveSuccess(`Added product: ${addProductName.trim()}`);
    setTimeout(() => setSaveSuccess(null), 3000);

    setAddProductName('');
    setAddProductSinhala('');
    setAddProductCategory('fuel');
    setAddProductUnit('1L');
    setAddProductPrice('');
    setShowAddProduct(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
      setEditingProduct(null);
      setSaveSuccess('Product deleted successfully');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  const handleCreateLorry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lorryName.trim() || !lorryPlate.trim()) return;

    addLorry({
      name: lorryName.trim(),
      numberPlate: lorryPlate.trim().toUpperCase(),
      capacity: lorryCapacity,
      driverName: lorryDriver.trim() || undefined,
      status: 'active',
    });

    setLorryName('');
    setLorryPlate('');
    setLorryDriver('');
    setLorryCapacity('3 Cube');
    setShowAddLorry(false);
  };

  const handleOpenEditLorryModal = (lorry: Lorry) => {
    setEditingLorry(lorry);
    setEditLorryName(lorry.name);
    setEditLorryPlate(lorry.numberPlate);
    setEditLorryDriver(lorry.driverName || '');
    setEditLorryCapacity(lorry.capacity || '');
    setEditLorryNotes(lorry.notes || '');
  };

  const handleSaveLorry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLorry) return;

    editLorry(editingLorry.id, {
      name: editLorryName.trim(),
      numberPlate: editLorryPlate.trim().toUpperCase(),
      driverName: editLorryDriver.trim() || undefined,
      capacity: editLorryCapacity.trim(),
      notes: editLorryNotes.trim() || undefined,
    });

    setSaveSuccess(`Updated Lorry ${editLorryName}`);
    setTimeout(() => setSaveSuccess(null), 3000);
    setEditingLorry(null);
  };

  const handleDeleteLorry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this lorry?')) {
      deleteLorry(id);
      setEditingLorry(null);
      setSaveSuccess('Lorry deleted successfully');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  const handleAddMaterialType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialType.trim()) return;
    addMaterialType(newMaterialType.trim());
    setNewMaterialType('');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header */}
      <div className="bg-neutral-900 text-white rounded-3xl p-5 shadow-md border border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-emerald-400">
            <Settings size={18} />
          </div>
          <div>
            <h2 className="font-extrabold text-base leading-tight">
              Settings & Prices (සැකසුම් සහ මිල ගණන්)
            </h2>
            <p className="text-xs text-neutral-400">
              Manage fuel prices, lorries, workers, and data
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="grid grid-cols-3 gap-1.5 mt-4 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveSection('prices')}
            className={`py-2 rounded-xl transition ${
              activeSection === 'prices'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            PRICES (මිල)
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('lorries')}
            className={`py-2 rounded-xl transition ${
              activeSection === 'lorries'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            LORRIES (ලොරි)
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('general')}
            className={`py-2 rounded-xl transition ${
              activeSection === 'general'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            DATA (දත්ත)
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl text-emerald-900 font-bold text-xs flex items-center gap-2">
          <Check size={16} className="text-emerald-700" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* SECTION 1: PRODUCT PRICES */}
      {activeSection === 'prices' && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 font-semibold flex items-center gap-2">
            <Tag size={16} className="text-amber-700 shrink-0" />
            <span>
              Tap any item to update its name, category, or unit price. Historical sales remain
              unchanged!
            </span>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-neutral-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-xs font-black text-neutral-800 uppercase tracking-wide">
                Fuel & Oil Price List ({products.length} Items)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProduct(true)}
                className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl flex items-center gap-1 active:scale-95 transition"
              >
                <Plus size={14} />
                <span>+ Add Product</span>
              </button>
            </div>

            <div className="divide-y divide-neutral-100">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleOpenPriceModal(p)}
                  className="py-3 px-2 flex items-center justify-between hover:bg-neutral-50 rounded-xl cursor-pointer transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900">{p.name}</span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                        {p.category}
                      </span>
                    </div>
                    {p.nameSinhala && p.nameSinhala !== p.name && (
                      <span className="text-xs text-neutral-400 block">{p.nameSinhala}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-emerald-800">
                      {formatRs(p.unitPrice)}
                    </span>
                    <button
                      type="button"
                      className="p-1.5 text-neutral-400 hover:text-emerald-700 rounded-lg"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: LORRIES */}
      {activeSection === 'lorries' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-neutral-800 uppercase tracking-wide">
                Active Fleet ({lorries.length} Lorries)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddLorry(true)}
                className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl flex items-center gap-1 active:scale-95 transition"
              >
                <Plus size={14} />
                <span>+ Add Lorry</span>
              </button>
            </div>

            <div className="space-y-2">
              {lorries.map((l) => (
                <div
                  key={l.id}
                  className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs flex items-center justify-between hover:border-neutral-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black text-sm">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-neutral-900">{l.name}</h4>
                      <span className="text-xs font-mono font-bold text-neutral-500 block">
                        {l.numberPlate} • {l.capacity} {l.driverName ? `• Driver: ${l.driverName}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditLorryModal(l)}
                      className="p-2 text-neutral-400 hover:text-emerald-700 hover:bg-neutral-50 rounded-xl transition"
                      title="Edit Lorry"
                    >
                      <Edit2 size={15} />
                    </button>
                    {lorries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteLorry(l.id)}
                        className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-neutral-50 rounded-xl transition"
                        title="Delete Lorry"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Material Types Management Section */}
          <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-neutral-900">
                Lorry Trip Material Types (ද්‍රව්‍ය වර්ග)
              </h3>
              <p className="text-[11px] text-neutral-500">
                Manage materials selectable when entering lorry trips.
              </p>
            </div>

            <form onSubmit={handleAddMaterialType} className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: කළුගල් / බොරළු (New Material Name)"
                value={newMaterialType}
                onChange={(e) => setNewMaterialType(e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-emerald-750 font-bold placeholder-neutral-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 active:scale-95 transition whitespace-nowrap"
              >
                <Plus size={14} />
                Add
              </button>
            </form>

            <div className="grid grid-cols-2 gap-2">
              {materialTypes.map((mat) => (
                <div
                  key={mat}
                  className="px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between text-xs"
                >
                  {editingMaterial === mat ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="text"
                        value={editMaterialName}
                        onChange={(e) => setEditMaterialName(e.target.value)}
                        className="flex-1 px-1.5 py-0.5 border border-neutral-300 rounded text-[11px] font-bold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editMaterialName.trim()) {
                            editMaterialType(mat, editMaterialName.trim());
                          }
                          setEditingMaterial(null);
                        }}
                        className="p-1 text-emerald-650 hover:bg-emerald-50 rounded"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingMaterial(null)}
                        className="p-1 text-neutral-400 hover:bg-neutral-50 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-neutral-800">{mat}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMaterial(mat);
                            setEditMaterialName(mat);
                          }}
                          className="p-1 text-neutral-400 hover:text-emerald-700 rounded-md"
                        >
                          <Edit2 size={13} />
                        </button>
                        {materialTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete material type "${mat}"?`)) {
                                deleteMaterialType(mat);
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-rose-600 rounded-md"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: GENERAL & BACKUP */}
      {activeSection === 'general' && (
        <div className="space-y-4">
          {/* Firebase Cloud Card */}
          <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Cloud size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-neutral-900 flex items-center gap-2">
                    <span>Firebase Cloud Database</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        firebaseSyncStatus === 'connected'
                          ? 'bg-emerald-100 text-emerald-800'
                          : firebaseSyncStatus === 'connecting'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          firebaseSyncStatus === 'connected'
                            ? 'bg-emerald-500 animate-pulse'
                            : firebaseSyncStatus === 'connecting'
                            ? 'bg-amber-500'
                            : 'bg-neutral-400'
                        }`}
                      />
                      {firebaseSyncStatus === 'connected'
                        ? 'සක්‍රීයයි (Connected)'
                        : firebaseSyncStatus === 'connecting'
                        ? 'සම්බන්ධ වෙමින්...'
                        : 'Offline Mode'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-500">Google Firestore Cloud Storage</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              ඔබගේ සියලුම ලොරි ට්‍රිප්, කඩේ බඩු විකිණුම්, ණය පොත (Credit) සහ වියදම් තොරතුරු Google Firebase Firestore Cloud Database එකෙහි සජීවීව සුරැකේ (Live Cloud Sync).
            </p>

            <div className="bg-emerald-50/70 rounded-2xl p-3 border border-emerald-100 text-xs space-y-1 text-emerald-950 font-medium">
              <div className="flex justify-between">
                <span className="text-neutral-500">Database Engine:</span>
                <span className="font-bold">Firestore Native</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Persistence Mode:</span>
                <span className="font-bold">Offline Cache + Cloud Mirror</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Cloud Status:</span>
                <span className="font-bold text-emerald-700">
                  {firebaseSyncStatus === 'connected' ? 'Real-time Synchronized' : firebaseSyncStatus}
                </span>
              </div>
            </div>

            {syncSuccessMsg && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                <span>සියලු දත්ත සාර්ථකව Cloud එකට යවන ලදී (All data successfully synced to Firebase)!</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSyncToCloud}
              disabled={isSyncing}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 active:scale-98 transition shadow-sm"
            >
              <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Cloud එකට යවමින්...' : 'Sync All Data to Cloud Now (දත්ත Cloud එකට යවන්න)'}</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-xs space-y-3">
            <h3 className="font-black text-sm text-neutral-900">
              Offline Storage & Backup (දත්ත ආරක්ෂාව)
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              All transactions, prices, lorry trips, and credit balances are stored safely and
              instantly inside this phone&apos;s local storage. No high-speed internet is needed for daily
              use.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95"
              >
                <RotateCcw size={15} />
                <span>Clean Production Reset (සියල්ල 0 කර ආරම්භ කරන්න)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div>
                <h3 className="font-black text-base text-neutral-900">
                  Edit Product (බඩු සංශෝධනය)
                </h3>
                <p className="text-xs text-neutral-500">{editingProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Product Name (English / ලේබලය)
                </label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-sm text-neutral-900"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Product Name (Sinhala / සිංහල නම)
                </label>
                <input
                  type="text"
                  value={newProductSinhala}
                  onChange={(e) => setNewProductSinhala(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-sm text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Category (වර්ගය)
                  </label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-xs text-neutral-950 bg-white"
                  >
                    <option value="fuel">Fuel (ඩීසල්)</option>
                    <option value="oil">Oil (ඔයිල්)</option>
                    <option value="other_fuel">Other Fuel (වෙනත් ඉන්ධන)</option>
                    <option value="parts">Parts (කොටස්)</option>
                    <option value="other">Other Items (වෙනත් බඩු)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Unit (මිනුම් ඒකකය)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1L, Can, Set, Item"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-xs text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Unit Price (Rs.) (ඒකක මිල)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-black text-lg text-neutral-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(editingProduct.id)}
                  className="px-3.5 rounded-xl border border-rose-250 text-rose-600 hover:bg-rose-50 font-bold flex items-center justify-center transition"
                  title="Delete Product"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-black text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-black text-base text-neutral-900">
                Add New Product (නව බඩුවක් එක් කිරීම)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProduct(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Product Name (English / ලේබලය)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engine Oil 15W40"
                  value={addProductName}
                  onChange={(e) => setAddProductName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-sm text-neutral-900"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Product Name (Sinhala / සිංහල නම)
                </label>
                <input
                  type="text"
                  placeholder="e.g. එන්ජින් ඔයිල්"
                  value={addProductSinhala}
                  onChange={(e) => setAddProductSinhala(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-sm text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Category (වර්ගය)
                  </label>
                  <select
                    value={addProductCategory}
                    onChange={(e) => setAddProductCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-xs text-neutral-950 bg-white"
                  >
                    <option value="fuel">Fuel (ඩීසල්)</option>
                    <option value="oil">Oil (ඔයිල්)</option>
                    <option value="other_fuel">Other Fuel (වෙනත් ඉන්ධන)</option>
                    <option value="parts">Parts (කොටස්)</option>
                    <option value="other">Other Items (වෙනත් බඩු)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Unit (මිනුම් ඒකකය)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1L, Can, Set, Item"
                    value={addProductUnit}
                    onChange={(e) => setAddProductUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-xs text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Unit Price (Rs.) (ඒකක මිල)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={addProductPrice}
                  onChange={(e) => setAddProductPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-black text-lg text-neutral-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-black text-white"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD LORRY MODAL */}
      {showAddLorry && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-black text-base text-neutral-900">
                Add New Lorry (නව ලොරියක් එක් කිරීම)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddLorry(false)}
                className="p-1 text-neutral-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLorry} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Lorry Name / Nickname (ලොරි නම / හඳුන්වන නම)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LN සුපුන් / Lorry 04"
                  value={lorryName}
                  onChange={(e) => setLorryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-sm text-neutral-900"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Registration Number Plate (ලියාපදිංචි අංකය)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WP ND-4489"
                  value={lorryPlate}
                  onChange={(e) => setLorryPlate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono font-bold focus:outline-none focus:border-emerald-600 text-sm text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Driver Name (රියදුරු නම)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={lorryDriver}
                    onChange={(e) => setLorryDriver(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-xs text-neutral-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Capacity (ධාරිතාව)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3 Cube / 4 Cube"
                    value={lorryCapacity}
                    onChange={(e) => setLorryCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-xs text-neutral-900"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLorry(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-black text-white"
                >
                  Save Lorry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LORRY MODAL */}
      {editingLorry && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-black text-base text-neutral-900">
                Edit Lorry (ලොරි සංශෝධනය)
              </h3>
              <button
                type="button"
                onClick={() => setEditingLorry(null)}
                className="p-1 text-neutral-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLorry} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Lorry Name / Nickname (ලොරි නම / හඳුන්වන නම)
                </label>
                <input
                  type="text"
                  required
                  value={editLorryName}
                  onChange={(e) => setEditLorryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-sm text-neutral-900"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Registration Number Plate (ලියාපදිංචි අංකය)
                </label>
                <input
                  type="text"
                  required
                  value={editLorryPlate}
                  onChange={(e) => setEditLorryPlate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono font-bold focus:outline-none focus:border-emerald-600 text-sm text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Driver Name (රියදුරු නම)
                  </label>
                  <input
                    type="text"
                    value={editLorryDriver}
                    onChange={(e) => setEditLorryDriver(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-xs text-neutral-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Capacity (ධාරිතාව)
                  </label>
                  <input
                    type="text"
                    required
                    value={editLorryCapacity}
                    onChange={(e) => setEditLorryCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-xs text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Notes (සටහන්)
                </label>
                <textarea
                  value={editLorryNotes}
                  onChange={(e) => setEditLorryNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-xs text-neutral-900"
                  rows={2}
                  placeholder="Notes..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteLorry(editingLorry.id)}
                  className="px-3.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold flex items-center justify-center transition"
                  title="Delete Lorry"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingLorry(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-black text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET SAMPLE DATA CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl space-y-3 text-center">
            <AlertTriangle size={36} className="mx-auto text-amber-500" />
            <h4 className="font-black text-base text-neutral-900">
              Clear All to 0 (සියල්ල 0 කරන්නද?)
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              මෙමගින් සියලුම ට්‍රිප්, කඩේ විකිණුම්, වියදම් සහ ගනුදෙනු මකා දමා 0 කරනු ඇත. ඔබ ලබා දුන් ලොරි (LN, LJ, JW, LL, GN) සහ බඩු ලැයිස්තුව පමණක් පවතිනු ඇත.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-neutral-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDefaultData();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-black text-xs text-white"
              >
                Yes, Reset to 0
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
