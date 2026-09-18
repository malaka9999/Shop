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
      unitPrice: activeProduct.unitPrice,
      unit: activeProduct.unit,
      quantity,
      totalAmount: activeProduct.unitPrice * quantity,
      paymentMethod: 'CASH',
    });

    setLastAddedFeedback(`Sold ${quantity}x ${activeProduct.name} for ${formatRs(activeProduct.unitPrice * quantity)} (CASH)`);
    setTimeout(() => setLastAddedFeedback(null), 3000);

    setActiveProduct(null);
    setQuantity(1);
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
      unitPrice: activeProduct.unitPrice,
      unit: activeProduct.unit,
      quantity,
      totalAmount: activeProduct.unitPrice * quantity,
      paymentMethod: 'NAYA',
      customerId,
      customerName: customer?.name || 'Customer',
    });

    setLastAddedFeedback(
      `Added ${quantity}x ${activeProduct.name} to ${customer?.name}'s Naya! (${formatRs(
        activeProduct.unitPrice * quantity
      )})`
    );
    setTimeout(() => setLastAddedFeedback(null), 3500);

    setActiveProduct(null);
    setQuantity(1);
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

          <button
            type="button"
            id="btn-shop-settings-prices"
            onClick={onOpenSettingsPrices}
            className="text-xs font-bold bg-amber-800 hover:bg-amber-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-amber-100 border border-amber-600/50 transition active:scale-95"
          >
            <Settings size={14} />
            <span>Edit Prices</span>
          </button>
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

          {/* Quantity Stepper, Presets & Total */}
          <div className="bg-white rounded-2xl p-3 border border-emerald-200 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-600 block">Quantity (ප්‍රමාණය):</span>
                <span className="text-[11px] text-neutral-400">Unit: {activeProduct.unit || 'Litre'}</span>
              </div>

              {/* Precise Quantity Input with steppers */}
              <div className="flex items-center gap-1.5">
                {activeProduct.category === 'oil' && (
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(0.5, Number((prev - 0.5).toFixed(2))))}
                    className="px-2 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold active:scale-90"
                    title="-0.5"
                  >
                    -0.5
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(activeProduct.category === 'oil' ? 0.5 : 1, Number((prev - 1).toFixed(2))))}
                  className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold active:scale-90"
                >
                  <Minus size={16} />
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
                  className="w-16 text-center text-lg font-black text-neutral-900 border border-emerald-300 rounded-lg py-1 focus:outline-none focus:border-emerald-600"
                />

                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Number((prev + 1).toFixed(2)))}
                  className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold active:scale-90"
                >
                  <Plus size={16} />
                </button>
                {activeProduct.category === 'oil' && (
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Number((prev + 0.5).toFixed(2)))}
                    className="px-2 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold active:scale-90"
                    title="+0.5"
                  >
                    +0.5
                  </button>
                )}
              </div>

              <div className="text-right">
                <span className="text-[11px] text-neutral-500 block">Total Amount</span>
                <span className="text-xl font-black text-emerald-900">
                  {formatRs(Math.round(activeProduct.unitPrice * quantity))}
                </span>
              </div>
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
    </div>
  );
};
