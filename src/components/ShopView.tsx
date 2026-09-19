import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatRs, formatRsNumber } from '../utils/formatters';
import {
  ShoppingBag,
  Fuel,
  Droplet,
  Flame,
  Wrench,
  Plus,
  Minus,
  Check,
  CreditCard,
  Banknote,
  Trash2,
  Settings,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Product, ShopSale } from '../types';

interface ShopViewProps {
  onOpenSettingsPrices: () => void;
  initialCategoryFilter?: 'fuel' | 'oil';
}

export const ShopView: React.FC<ShopViewProps> = ({
  onOpenSettingsPrices,
  initialCategoryFilter,
}) => {
  const {
    products,
    shopSales,
    customers,
    selectedDate,
    todaySummary,
    addShopSale,
    deleteShopSale,
    addProduct,
    editProduct,
    deleteProduct,
  } = useBusiness();

  // Active Category Filter Tab
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'fuel' | 'oil' | 'parts'>(
    initialCategoryFilter || 'all'
  );

  useEffect(() => {
    if (initialCategoryFilter) {
      setCategoryFilter(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  // Active Sale Builder (Staging state for rapid 1-3 tap sales)
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [customSalePrice, setCustomSalePrice] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showNayaCustomerPicker, setShowNayaCustomerPicker] = useState<boolean>(false);
  const [lastAddedFeedback, setLastAddedFeedback] = useState<string | null>(null);
  const [selectedOilQtyPreset, setSelectedOilQtyPreset] = useState<number>(1);

  // Custom Item Modal
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<'parts' | 'other'>('parts');
  const [customPrice, setCustomPrice] = useState('');
  const [customUnit, setCustomUnit] = useState('Item');

  // Product Manager Modal & Form States
  const [showProductManagerModal, setShowProductManagerModal] = useState<boolean>(false);
  const [managerSearchQuery, setManagerSearchQuery] = useState<string>('');
  const [managerCategoryFilter, setManagerCategoryFilter] = useState<'all' | 'fuel' | 'oil' | 'parts' | 'other'>('all');
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState<boolean>(false);
  
  const [prodFormName, setProdFormName] = useState<string>('');
  const [prodFormNameSinhala, setProdFormNameSinhala] = useState<string>('');
  const [prodFormCategory, setProdFormCategory] = useState<'fuel' | 'oil' | 'parts' | 'other' | 'other_fuel'>('parts');
  const [prodFormUnitPrice, setProdFormUnitPrice] = useState<string>('');
  const [prodFormUnit, setProdFormUnit] = useState<string>('Item');
  const [prodFormIsQuick, setProdFormIsQuick] = useState<boolean>(true);

  // Today's sales
  const currentSales = shopSales.filter((s) => s.date === selectedDate);

  // Group products
  const petrolProducts = products.filter(
    (p) => p.category === 'fuel' && p.name.toLowerCase().includes('petrol')
  );
  const dieselProducts = products.filter(
    (p) => p.category === 'fuel' && p.name.toLowerCase().includes('diesel')
  );
  const oilProducts = products.filter((p) => p.category === 'oil');
  const otherFuelProducts = products.filter((p) => p.category === 'other_fuel');
  const partsAndOtherProducts = products.filter(
    (p) => p.category === 'parts' || p.category === 'other'
  );

  // Tapping a product card activates it with desired default quantity
  const handleSelectProduct = (product: Product, defaultQty?: number) => {
    setActiveProduct(product);
    const qtyToSet = defaultQty !== undefined ? defaultQty : product.category === 'oil' ? selectedOilQtyPreset : 1;
    setQuantity(qtyToSet);
    setCustomSalePrice(product.unitPrice);
    setSelectedCustomerId('');
    setShowNayaCustomerPicker(false);
  };

  // Complete Sale: CASH
  const handleConfirmCashSale = () => {
    if (!activeProduct) return;
    addShopSale({
      date: selectedDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      productId: activeProduct.id,
      productName: activeProduct.name,
      category: activeProduct.category,
      unitPrice: customSalePrice,
      unit: activeProduct.unit,
      quantity,
      totalAmount: customSalePrice * quantity,
      paymentMethod: 'CASH',
    });

    setLastAddedFeedback(`Sold ${quantity}x ${activeProduct.name} for ${formatRs(customSalePrice * quantity)} (CASH)`);
    setTimeout(() => setLastAddedFeedback(null), 3000);

    setActiveProduct(null);
    setQuantity(1);
    setCustomSalePrice(0);
  };

  // Complete Sale: NAYA
  const handleConfirmNayaSale = (customerId: string) => {
    if (!activeProduct || !customerId) return;
    const customer = customers.find((c) => c.id === customerId);

    addShopSale({
      date: selectedDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      productId: activeProduct.id,
      productName: activeProduct.name,
      category: activeProduct.category,
      unitPrice: customSalePrice,
      unit: activeProduct.unit,
      quantity,
      totalAmount: customSalePrice * quantity,
      paymentMethod: 'NAYA',
      customerId,
      customerName: customer?.name || 'Customer',
    });

    setLastAddedFeedback(
      `Added ${quantity}x ${activeProduct.name} to ${customer?.name}'s Naya! (${formatRs(
        customSalePrice * quantity
      )})`
    );
    setTimeout(() => setLastAddedFeedback(null), 3500);

    setActiveProduct(null);
    setQuantity(1);
    setCustomSalePrice(0);
    setShowNayaCustomerPicker(false);
    setSelectedCustomerId('');
  };

  const handleSaveCustomProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(customPrice);
    if (!customName.trim() || isNaN(priceNum) || priceNum <= 0) return;

    const newP = addProduct({
      name: customName.trim(),
      nameSinhala: customName.trim(),
      category: customCategory,
      unitPrice: priceNum,
      unit: customUnit.trim() || 'Item',
      isQuickItem: true,
    });

    setCustomName('');
    setCustomPrice('');
    setShowAddCustomModal(false);
    handleSelectProduct(newP);
  };

  const handleOpenAddProductForm = () => {
    setEditingProduct(null);
    setProdFormName('');
    setProdFormNameSinhala('');
    setProdFormCategory('parts');
    setProdFormUnitPrice('');
    setProdFormUnit('Item');
    setProdFormIsQuick(true);
    setShowProductForm(true);
  };

  const handleOpenEditProductForm = (p: Product) => {
    setEditingProduct(p);
    setProdFormName(p.name);
    setProdFormNameSinhala(p.nameSinhala || p.name);
    setProdFormCategory(p.category as any);
    setProdFormUnitPrice(p.unitPrice.toString());
    setProdFormUnit(p.unit);
    setProdFormIsQuick(p.isQuickItem || false);
    setShowProductForm(true);
  };

  const handleSaveProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(prodFormUnitPrice);
    if (!prodFormName.trim() || isNaN(priceNum) || priceNum < 0) return;

    const prodData = {
      name: prodFormName.trim(),
      nameSinhala: prodFormNameSinhala.trim() || prodFormName.trim(),
      category: prodFormCategory,
      unitPrice: priceNum,
      unit: prodFormUnit.trim() || 'Item',
      isQuickItem: prodFormIsQuick,
    };

    if (editingProduct) {
      editProduct(editingProduct.id, prodData);
      setLastAddedFeedback(`Updated "${prodFormName}" details successfully!`);
    } else {
      const newP = addProduct(prodData);
      setLastAddedFeedback(`Added "${prodFormName}" as new product!`);
    }
    
    setTimeout(() => setLastAddedFeedback(null), 3000);
    setShowProductForm(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Top Shop Summary Header */}
      <div className="bg-amber-900 text-white rounded-3xl p-5 shadow-md border border-amber-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-800 flex items-center justify-center text-amber-200">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">
                Shop / Kade Sales (කඩේ විකිණුම්)
              </h2>
              <p className="text-xs text-amber-300">
                {todaySummary.totalShopSalesCount} Transactions today
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-end">
            <button
              type="button"
              onClick={() => setShowProductManagerModal(true)}
              className="text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow transition active:scale-95"
            >
              <Plus size={14} />
              <span>+ බඩු එකතු කිරීම / වෙනස් කිරීම (Manage Items)</span>
            </button>
            <button
              type="button"
              id="btn-shop-settings-prices"
              onClick={onOpenSettingsPrices}
              className="text-xs font-bold bg-amber-800 hover:bg-amber-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-amber-100 border border-amber-600/50 transition active:scale-95 animate-pulse"
            >
              <Settings size={14} />
              <span>Edit Prices</span>
            </button>
          </div>
        </div>

        {/* Quantities & Grand Totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <div className="bg-amber-950/60 rounded-xl p-2.5 border border-amber-800">
            <span className="text-[11px] text-amber-300 block">Total Sales (එකතුව)</span>
            <span className="text-lg font-black text-white">
              {formatRs(todaySummary.totalShopSalesAmount)}
            </span>
          </div>

          <div className="bg-amber-950/60 rounded-xl p-2.5 border border-amber-800">
            <span className="text-[11px] text-amber-300 block">Petrol (පෙට්‍රල්)</span>
            <span className="text-lg font-black text-amber-200">
              {todaySummary.petrolLitres} L
            </span>
          </div>

          <div className="bg-amber-950/60 rounded-xl p-2.5 border border-amber-800">
            <span className="text-[11px] text-amber-300 block">Diesel (ඩීසල්)</span>
            <span className="text-lg font-black text-amber-200">
              {todaySummary.dieselLitres} L
            </span>
          </div>

          <div className="bg-amber-950/60 rounded-xl p-2.5 border border-amber-800">
            <span className="text-[11px] text-amber-300 block">Oil (ඔයිල්)</span>
            <span className="text-lg font-black text-amber-200">
              {todaySummary.oilLitres} L
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification Feedback */}
      {lastAddedFeedback && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl text-emerald-900 font-bold text-xs flex items-center gap-2 shadow-sm animate-fade-in">
          <Check size={18} className="text-emerald-700 shrink-0" />
          <span>{lastAddedFeedback}</span>
        </div>
      )}

      {/* ACTIVE SALE / QUICK STAGING DRAWER (Tapping any product brings this up) */}
      {activeProduct && (
        <div className="bg-emerald-50 border-2 border-emerald-600 rounded-3xl p-4 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                Selected Item for Sale
              </span>
              <h3 className="text-lg font-black text-neutral-900">{activeProduct.name}</h3>
              <p className="text-xs text-neutral-500 font-medium">
                Unit Price: {formatRs(activeProduct.unitPrice)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveProduct(null)}
              className="text-xs text-neutral-400 hover:text-neutral-700 p-1 font-bold"
            >
              Cancel
            </button>
          </div>

          {/* Quantity Stepper, Custom Price, Presets & Total */}
          <div className="bg-white rounded-2xl p-3 border border-emerald-200 shadow-inner space-y-3 text-neutral-950">
            {/* Side-by-side Quantity & Custom Unit Price Inputs */}
            <div className="grid grid-cols-2 gap-4 pb-2.5 border-b border-dashed border-emerald-100">
              {/* Quantity Selector Section */}
              <div className="space-y-1">
                <label className="text-xs font-black text-neutral-600 block">
                  Quantity ({activeProduct.unit || 'Litre'}):
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(activeProduct.category === 'oil' ? 0.5 : 1, Number((prev - 1).toFixed(2))))}
                    className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold active:scale-90 transition shrink-0"
                  >
                    <Minus size={14} />
                  </button>

                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setQuantity(isNaN(val) ? 0 : val);
                    }}
                    className="w-14 text-center text-sm font-black text-neutral-900 border border-emerald-300 rounded-lg py-1 focus:outline-none focus:border-emerald-600"
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Number((prev + 1).toFixed(2)))}
                    className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 flex items-center justify-center font-bold active:scale-90 transition shrink-0"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Custom Unit Price Input Section */}
              <div className="space-y-1">
                <label className="text-xs font-black text-neutral-600 block">
                  Unit Price (මිල රු.):
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    value={customSalePrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCustomSalePrice(isNaN(val) ? 0 : val);
                    }}
                    className="w-full pl-8 pr-2 py-1 text-sm font-black text-neutral-900 border border-emerald-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Total calculation row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
                Total Amount
              </span>
              <span className="text-xl font-black text-emerald-900 font-mono">
                {formatRs(Math.round(customSalePrice * quantity))}
              </span>
            </div>

            {/* Quick Quantity Presets depending on category */}
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Quick Quantity Presets (ඉක්මන් ප්‍රමාණ තේරීම):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeProduct.category === 'oil' &&
                  [0.5, 1, 2, 3, 4, 5, 10, 20].map((vol) => (
                    <button
                      key={vol}
                      type="button"
                      onClick={() => setQuantity(vol)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition active:scale-95 ${
                        quantity === vol
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200'
                      }`}
                    >
                      {vol} L {vol === 4 ? '(Can)' : vol === 20 ? '(Can/බ)' : ''}
                    </button>
                  ))}

                {(activeProduct.category === 'fuel' || activeProduct.category === 'other_fuel') &&
                  [1, 2, 3, 5, 10, 20].map((vol) => (
                    <button
                      key={vol}
                      type="button"
                      onClick={() => setQuantity(vol)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition active:scale-95 ${
                        quantity === vol
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {vol} Litres
                    </button>
                  ))}

                {(activeProduct.category === 'parts' || activeProduct.category === 'other') &&
                  [1, 2, 3, 4, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition active:scale-95 ${
                        quantity === num
                          ? 'bg-neutral-800 text-white shadow-xs'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                      }`}
                    >
                      x{num}
                    </button>
                  ))}
              </div>
            </div>

            {/* Quick Rupee Presets for Fuel / Oil */}
            {(activeProduct.category === 'fuel' || activeProduct.category === 'other_fuel' || activeProduct.category === 'oil') && (
              <div className="pt-1 border-t border-dashed border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  Or set by Rupee value (රුපියල් ගනනට අනුව):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[500, 1000, 1500, 2000, 3000, 5000].map((rupees) => (
                    <button
                      key={rupees}
                      type="button"
                      onClick={() => {
                        if (activeProduct.unitPrice > 0) {
                          const calculatedLiters = Number((rupees / activeProduct.unitPrice).toFixed(2));
                          setQuantity(calculatedLiters);
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold active:scale-95"
                    >
                      Rs. {rupees >= 1000 ? `${rupees / 1000}k` : rupees}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Payment Choices */}
          {!showNayaCustomerPicker ? (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                id="btn-confirm-shop-cash"
                onClick={handleConfirmCashSale}
                className="py-3.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
              >
                <Banknote size={20} />
                <span>CASH (අත්පිට මුදල්)</span>
              </button>

              <button
                type="button"
                id="btn-confirm-shop-naya"
                onClick={() => setShowNayaCustomerPicker(true)}
                className="py-3.5 px-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
              >
                <CreditCard size={20} />
                <span>NAYA (ණයට)</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-3 border border-orange-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-orange-900">
                  Select Customer for Naya (ණයගැතියා තෝරන්න):
                </span>
                <button
                  type="button"
                  onClick={() => setShowNayaCustomerPicker(false)}
                  className="text-xs text-neutral-400 hover:text-neutral-700 font-semibold"
                >
                  Back
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleConfirmNayaSale(c.id)}
                    className="p-2.5 rounded-xl border border-neutral-200 hover:border-orange-500 bg-neutral-50 hover:bg-orange-50 text-left transition active:scale-95"
                  >
                    <span className="block font-bold text-xs text-neutral-900">{c.name}</span>
                    <span className="block text-[11px] text-orange-700 font-semibold">
                      Bal: {formatRs(c.currentBalance)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CATEGORY TABS SELECTOR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
            categoryFilter === 'all'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
          }`}
        >
          All Items (සියල්ල)
        </button>
        <button
          type="button"
          id="tab-shop-filter-fuel"
          onClick={() => setCategoryFilter('fuel')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
            categoryFilter === 'fuel'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          <Fuel size={13} />
          <span>Fuel (පෙට්‍රල් / ඩීසල්)</span>
        </button>
        <button
          type="button"
          id="tab-shop-filter-oil"
          onClick={() => setCategoryFilter('oil')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
            categoryFilter === 'oil'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-teal-800 border border-teal-200 hover:bg-teal-50'
          }`}
        >
          <Droplet size={13} />
          <span>Oil (ඔයිල් වර්ග)</span>
        </button>
        <button
          type="button"
          id="tab-shop-filter-parts"
          onClick={() => setCategoryFilter('parts')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
            categoryFilter === 'parts'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-50'
          }`}
        >
          <Wrench size={13} />
          <span>Parts & Other (අමතර)</span>
        </button>
      </div>

      {/* QUICK SALE BUTTONS (Tap to Sell) */}
      <div className="space-y-4">
        {/* PETROL SECTION */}
        {(categoryFilter === 'all' || categoryFilter === 'fuel') && (
          <div className="bg-white rounded-3xl p-4 border border-neutral-200 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-neutral-800">
              <Fuel size={18} className="text-amber-600" />
              <h3 className="font-black text-sm uppercase tracking-wide">PETROL (පෙට්‍රල්)</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {petrolProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProduct(p)}
                  className={`p-3 rounded-2xl border-2 text-center transition active:scale-95 ${
                    activeProduct?.id === p.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black'
                      : 'border-neutral-200 hover:border-amber-500 bg-neutral-50 hover:bg-amber-50/50'
                  }`}
                >
                  <span className="block font-extrabold text-sm text-neutral-900">{p.unit}</span>
                  <span className="block text-xs text-amber-700 font-black mt-0.5">
                    Rs. {formatRsNumber(p.unitPrice)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DIESEL SECTION */}
        {(categoryFilter === 'all' || categoryFilter === 'fuel') && (
          <div className="bg-white rounded-3xl p-4 border border-neutral-200 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-neutral-800">
              <Fuel size={18} className="text-blue-600" />
              <h3 className="font-black text-sm uppercase tracking-wide">DIESEL (ඩීසල්)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {dieselProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProduct(p)}
                  className={`p-3 rounded-2xl border-2 text-center transition active:scale-95 ${
                    activeProduct?.id === p.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black'
                      : 'border-neutral-200 hover:border-blue-500 bg-neutral-50 hover:bg-blue-50/50'
                  }`}
                >
                  <span className="block font-extrabold text-sm text-neutral-900">{p.unit}</span>
                  <span className="block text-xs text-blue-700 font-black mt-0.5">
                    Rs. {formatRsNumber(p.unitPrice)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* OIL SECTION */}
        {(categoryFilter === 'all' || categoryFilter === 'oil') && (
          <div className="bg-white rounded-3xl p-4 border border-neutral-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-800">
                <Droplet size={18} className="text-teal-600" />
                <h3 className="font-black text-sm uppercase tracking-wide">OIL (ඔයිල් වර්ග)</h3>
              </div>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg">
                Default: {selectedOilQtyPreset} L
              </span>
            </div>

            {/* Quick Volume / Quantity Selector Bar for Oil */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                තෝරාගන්නා ප්‍රමාණය (Select Volume):
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[0.5, 1, 2, 3, 4, 5, 10, 20].map((vol) => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => setSelectedOilQtyPreset(vol)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition active:scale-95 ${
                      selectedOilQtyPreset === vol
                        ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-600 ring-offset-1'
                        : 'bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200'
                    }`}
                  >
                    {vol}L {vol === 4 ? '(Can)' : vol === 20 ? '(බ)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {oilProducts.map((p) => {
                // Extract short code like 40, 50, 90, 68, DELO
                const shortCode = p.name.replace(' Oil 1L', '').replace(' 1L', '');
                const totalForPreset = Math.round(p.unitPrice * selectedOilQtyPreset);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p, selectedOilQtyPreset)}
                    className={`p-2.5 rounded-2xl border-2 text-center transition active:scale-95 ${
                      activeProduct?.id === p.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black ring-2 ring-emerald-500'
                        : 'border-neutral-200 hover:border-teal-500 bg-neutral-50 hover:bg-teal-50/50'
                    }`}
                  >
                    <span className="block font-extrabold text-xs text-neutral-900">{shortCode}</span>
                    <span className="block text-[11px] text-teal-700 font-black mt-0.5">
                      Rs. {formatRsNumber(totalForPreset)}
                    </span>
                    <span className="block text-[9px] text-neutral-400 font-bold">
                      {selectedOilQtyPreset}L @ {formatRsNumber(p.unitPrice)}/L
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* OTHER FUEL / OIL (භූමි තෙල්, කළු තෙල්) */}
        {(categoryFilter === 'all' || categoryFilter === 'fuel') && (
          <div className="bg-white rounded-3xl p-4 border border-neutral-200 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-neutral-800">
              <Flame size={18} className="text-purple-600" />
              <h3 className="font-black text-sm uppercase tracking-wide">
                OTHER FUEL / OIL (වෙනත් තෙල්)
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {otherFuelProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProduct(p)}
                  className={`p-3 rounded-2xl border-2 text-center transition active:scale-95 ${
                    activeProduct?.id === p.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black'
                      : 'border-neutral-200 hover:border-purple-500 bg-neutral-50 hover:bg-purple-50/50'
                  }`}
                >
                  <span className="block font-extrabold text-sm text-neutral-900">
                    {p.nameSinhala || p.name}
                  </span>
                  <span className="block text-xs text-purple-700 font-black mt-0.5">
                    Rs. {formatRsNumber(p.unitPrice)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PARTS & OTHER CUSTOM PRODUCTS */}
        {(categoryFilter === 'all' || categoryFilter === 'parts') && (
          <div className="bg-white rounded-3xl p-4 border border-neutral-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-800">
                <Wrench size={18} className="text-neutral-700" />
                <h3 className="font-black text-sm uppercase tracking-wide">
                  PARTS & OTHER (අමතර කොටස්)
                </h3>
              </div>
              <button
                type="button"
                id="btn-add-custom-product"
                onClick={() => setShowAddCustomModal(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-emerald-200"
              >
                <Plus size={13} />
                <span>+ Custom Item</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {partsAndOtherProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProduct(p)}
                  className={`p-3 rounded-2xl border-2 text-left transition active:scale-95 ${
                    activeProduct?.id === p.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black'
                      : 'border-neutral-200 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100'
                  }`}
                >
                  <span className="block font-extrabold text-xs text-neutral-900 truncate">
                    {p.name}
                  </span>
                  <span className="block text-xs text-neutral-700 font-bold mt-0.5">
                    Rs. {formatRsNumber(p.unitPrice)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TODAY'S SALES LOG */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-neutral-600 uppercase tracking-wider">
            TODAY&apos;S SHOP SALES ({currentSales.length})
          </h3>
          <span className="text-[11px] text-neutral-400">Chronological</span>
        </div>

        {currentSales.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-neutral-300">
            <ShoppingBag size={28} className="mx-auto text-neutral-300 mb-1" />
            <p className="font-bold text-neutral-700 text-sm">No sales recorded yet today.</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Tap any button above to record a sale in 1 tap.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {currentSales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white rounded-2xl p-3 border border-neutral-200 shadow-xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs text-neutral-900 truncate">
                      {sale.productName}
                    </span>
                    <span className="text-[11px] font-bold text-neutral-500">
                      x{sale.quantity}
                    </span>
                    {sale.paymentMethod === 'CASH' ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        Cash
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                        Naya ({sale.customerName})
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">{sale.time}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-sm text-neutral-900">
                    {formatRs(sale.totalAmount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteShopSale(sale.id)}
                    className="p-1.5 text-neutral-300 hover:text-rose-600 rounded-lg"
                    title="Delete Sale"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD CUSTOM PRODUCT MODAL */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-black text-base text-neutral-900">
                Add Custom Product (අලුත් අයිතමයක්)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Product Name (නම)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brake Fluid / Clutch Cable"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as 'parts' | 'other')}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="parts">Parts (අමතර කොටස්)</option>
                    <option value="other">Other (වෙනත්)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Price (මිල Rs.)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 3500"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
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

      {/* COMPREHENSIVE PRODUCT & PRICE MANAGER MODAL */}
      {showProductManagerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs text-neutral-900">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3 shrink-0">
              <div>
                <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-amber-500" />
                  <span>බඩු කළමනාකරණය (Manage Products)</span>
                </h3>
                <p className="text-[11px] text-neutral-500 font-bold">භාණ්ඩ මිල ගණන් සහ විස්තර වෙනස් කිරීම</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProductManagerModal(false);
                  setShowProductForm(false);
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 font-bold bg-neutral-100 rounded-full hover:bg-neutral-200 transition"
              >
                ✕
              </button>
            </div>

            {/* If Form is Active (Add or Edit Product) */}
            {showProductForm ? (
              <form onSubmit={handleSaveProductForm} className="space-y-4 overflow-y-auto pr-1 pb-2">
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-900 font-bold">
                  {editingProduct 
                    ? `සංස්කරණය කරන්නේ: ${editingProduct.name}`
                    : "නව භාණ්ඩයක් ඇතුලත් කිරීම (Add New Product)"}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-extrabold text-neutral-700 block mb-1">Product Name (English / ID): *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Delo Oil 1L"
                      value={prodFormName}
                      onChange={(e) => setProdFormName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-amber-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-neutral-700 block mb-1">Name in Sinhala (සිංහල නම):</label>
                    <input
                      type="text"
                      placeholder="e.g. ඩෙලෝ ඔයිල් 1L"
                      value={prodFormNameSinhala}
                      onChange={(e) => setProdFormNameSinhala(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-amber-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-neutral-700 block mb-1">Category (ගණය): *</label>
                    <select
                      value={prodFormCategory}
                      onChange={(e) => setProdFormCategory(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-bold focus:outline-none focus:border-amber-500"
                    >
                      <option value="fuel">Fuel (පෙට්‍රල් / ඩීසල්)</option>
                      <option value="oil">Oil (ඔයිල් වර්ග)</option>
                      <option value="parts">Parts (අමතර කොටස්)</option>
                      <option value="other">Other (වෙනත් බඩු)</option>
                      <option value="other_fuel">Other Fuel (භූමිතෙල් / කළුතෙල්)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-extrabold text-neutral-700 block mb-1">Unit Price (මිල රු.): *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 1500"
                      value={prodFormUnitPrice}
                      onChange={(e) => setProdFormUnitPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-amber-500 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-neutral-700 block mb-1">Unit / Volume label (ඒකකය): *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Litre / Can / Item"
                      value={prodFormUnit}
                      onChange={(e) => setProdFormUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:border-amber-500 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="is-quick-item"
                      checked={prodFormIsQuick}
                      onChange={(e) => setProdFormIsQuick(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="is-quick-item" className="text-xs font-black text-neutral-700 cursor-pointer">
                      Quick Select Card (ඉක්මන් තේරීම)
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-neutral-150 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700 hover:bg-neutral-50 active:scale-95 transition"
                  >
                    පෙර පිටුවට (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-black text-slate-950 shadow active:scale-95 transition"
                  >
                    සුරකින්න (Save Product)
                  </button>
                </div>
              </form>
            ) : (
              /* List & Manage Existing Products */
              <div className="flex flex-col flex-1 min-h-0 space-y-3">
                {/* Search and Filter Row */}
                <div className="space-y-2 shrink-0">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={15} className="absolute left-3 top-3 text-neutral-400" />
                      <input
                        type="text"
                        value={managerSearchQuery}
                        onChange={(e) => setManagerSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-amber-500 font-semibold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddProductForm}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow transition active:scale-95 shrink-0"
                    >
                      <Plus size={14} />
                      <span>+ අලුත් එකක්</span>
                    </button>
                  </div>

                  {/* Sub-Category Select Tabs */}
                  <div className="flex gap-1 overflow-x-auto pb-1 border-b border-neutral-100">
                    {['all', 'fuel', 'oil', 'parts', 'other'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setManagerCategoryFilter(cat as any)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition shrink-0 ${
                          managerCategoryFilter === cat
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto pr-1 divide-y divide-neutral-100">
                  {products
                    .filter((p) => {
                      const matchesCat = managerCategoryFilter === 'all' || p.category === managerCategoryFilter || (managerCategoryFilter === 'fuel' && p.category === 'other_fuel');
                      const matchesSearch = p.name.toLowerCase().includes(managerSearchQuery.toLowerCase()) || 
                        (p.nameSinhala && p.nameSinhala.toLowerCase().includes(managerSearchQuery.toLowerCase()));
                      return matchesCat && matchesSearch;
                    })
                    .map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 group hover:bg-neutral-50 rounded-lg px-1 transition">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs text-neutral-900 truncate">{p.name}</span>
                            <span className="text-[9px] uppercase font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                              {p.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-500 block font-medium mt-0.5">
                            {p.nameSinhala || p.name} • {p.unit}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right mr-1">
                            <span className="font-black text-xs text-neutral-900 font-mono">Rs. {p.unitPrice.toLocaleString()}</span>
                            {p.isQuickItem && <span className="text-[9px] text-emerald-600 font-extrabold block">Quick Select</span>}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleOpenEditProductForm(p)}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-black rounded-lg transition"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`භාණ්ඩය "${p.name}" මකා දැමීමට අවශ්‍යද?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black rounded-lg transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                  {products.filter((p) => {
                    const matchesCat = managerCategoryFilter === 'all' || p.category === managerCategoryFilter || (managerCategoryFilter === 'fuel' && p.category === 'other_fuel');
                    const matchesSearch = p.name.toLowerCase().includes(managerSearchQuery.toLowerCase()) || 
                      (p.nameSinhala && p.nameSinhala.toLowerCase().includes(managerSearchQuery.toLowerCase()));
                    return matchesCat && matchesSearch;
                  }).length === 0 && (
                    <div className="text-center py-8 text-xs text-neutral-400 font-bold">
                      සොයන භාණ්ඩය හමු නොවීය (No matching products found)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
