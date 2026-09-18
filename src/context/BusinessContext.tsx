import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Lorry,
  LorryTrip,
  Product,
  ShopSale,
  Customer,
  CreditTransaction,
  Expense,
  Worker,
  WorkerPayment,
  CashTransfer,
  CashTransferType,
  DailyCashRecord,
  LanguageMode,
  ActiveTab,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_LORRIES,
  INITIAL_WORKERS,
  INITIAL_CUSTOMERS,
  DEFAULT_EXPENSE_CATEGORIES,
} from '../data/initialData';
import { getTodayDateString, getCurrentTimeString, formatRs, formatDateShort } from '../utils/formatters';
import {
  FS_COLLECTIONS,
  SyncStatus,
  fsSaveDoc,
  fsDeleteDoc,
  fsBatchSave,
  fsSubscribeCollection,
  fsDeleteAllDocsInCollection,
  initAuth,
  testFirestoreConnection,
} from '../services/firestoreSync';

interface DailySummaryData {
  date: string;
  // Lorry
  totalLorriesCount: number;
  activeLorriesCount: number;
  totalTripsCount: number;
  totalLorryIncome: number;
  totalLorryCash: number;
  totalDriverPayments: number;
  totalLorryCredit: number;
  lorryDailyBalance: number;
  lorryBreakdown: Array<{
    lorryId: string;
    lorryName: string;
    numberPlate: string;
    tripsCount: number;
    totalIncome: number;
    driverPayment: number;
    credit: number;
    balance: number;
  }>;

  // Shop
  totalShopSalesCount: number;
  totalShopSalesAmount: number;
  shopCashSales: number;
  shopCreditSales: number;
  petrolLitres: number;
  dieselLitres: number;
  oilLitres: number;
  otherSalesAmount: number;

  // Credit
  newCreditGiven: number;
  creditPaymentsReceived: number;
  totalOutstandingCredit: number;

  // Expenses
  totalExpenses: number;
  expenseCategoryTotals: Record<string, number>;

  // Workers
  totalWorkerPayments: number;
  directWorkerPayments: number;
  tripDriverPayments: number;

  // Cash
  openingCash: number;
  isManualOpening: boolean;
  cashReceived: number; // shop cash + lorry cash + credit payments + cashFromAiya
  cashFromAiya: number; // අයියා දුන්න (Cash received from Aiya)
  transfersToAiya: number; // අයියාට දුන්න (Cash given to Aiya)
  totalInflow: number; // ලාච්චුව + අයියා දුන්න + ලොරි + කඩෙන් + ණය ලැබීම්
  cashPaidOut: number; // expenses + direct worker payments
  totalOutflow: number; // වියදම් + සේවක ගෙවීම් + අයියාට දුන්න
  transfersTotal: number;
  closingCash: number; // ඉතිරි මුදල
}

interface BusinessContextType {
  // Navigation & Date
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isToday: boolean;
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;

  // Data Collections
  lorries: Lorry[];
  lorryTrips: LorryTrip[];
  products: Product[];
  shopSales: ShopSale[];
  customers: Customer[];
  creditTransactions: CreditTransaction[];
  expenses: Expense[];
  workers: Worker[];
  workerPayments: WorkerPayment[];
  cashTransfers: CashTransfer[];
  dailyCashRecords: Record<string, DailyCashRecord>;
  expenseCategories: string[];

  // Daily Calculations
  todaySummary: DailySummaryData;
  getSummaryForDate: (date: string) => DailySummaryData;

  // Lorry Actions
  addLorryTrip: (tripData: Omit<LorryTrip, 'id' | 'createdTimestamp'>) => LorryTrip;
  editLorryTrip: (id: string, tripData: Partial<LorryTrip>) => void;
  deleteLorryTrip: (id: string) => void;
  addLorry: (lorry: Omit<Lorry, 'id'>) => Lorry;
  editLorry: (id: string, data: Partial<Lorry>) => void;
  deleteLorry: (id: string) => void;

  // Shop Actions
  addShopSale: (saleData: Omit<ShopSale, 'id' | 'createdTimestamp'>) => ShopSale;
  quickAddProductSale: (product: Product, quantity?: number, paymentMethod?: 'CASH' | 'NAYA', customerId?: string) => ShopSale;
  updateSaleQuantity: (saleId: string, delta: number) => void;
  deleteShopSale: (id: string) => void;
  addProduct: (prod: Omit<Product, 'id'>) => Product;
  updateProductPrice: (id: string, newPrice: number) => void;
  editProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Credit Actions
  receiveCreditPayment: (customerId: string, amount: number, notes?: string) => void;
  addCustomerCreditSale: (customerId: string, amount: number, notes?: string, source?: 'SHOP' | 'LORRY' | 'DIRECT') => void;
  addCustomer: (cust: Omit<Customer, 'id' | 'currentBalance' | 'totalCredit' | 'totalPaid'>) => Customer;
  editCustomer: (id: string, data: Partial<Customer>) => void;

  // Expense Actions
  addExpense: (expenseData: Omit<Expense, 'id' | 'createdTimestamp'>) => Expense;
  editExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addExpenseCategory: (category: string) => void;

  // Worker Actions
  addWorkerPayment: (paymentData: Omit<WorkerPayment, 'id' | 'createdTimestamp'>) => WorkerPayment;
  deleteWorkerPayment: (id: string) => void;
  addWorker: (worker: Omit<Worker, 'id'>) => Worker;
  editWorker: (id: string, data: Partial<Worker>) => void;

  // Cash Actions
  addCashTransfer: (amount: number, reason: string, type?: CashTransferType) => CashTransfer;
  deleteCashTransfer: (id: string) => void;
  updateOpeningCash: (date: string, amount: number, reason?: string) => void;

  // WhatsApp Messages
  generateDailyWhatsAppSummary: (date?: string) => string;
  generateLorryWhatsAppSummary: (date?: string) => string;
  generateCustomerWhatsAppStatement: (customerId: string, date?: string) => string;

  // Global search & reset
  resetToSampleData: () => void;
  resetToDefaultData: () => void;
  exportBackupJson: () => string;
  importBackupJson: (jsonStr: string) => boolean;

  // Firebase Cloud Database
  firebaseSyncStatus: SyncStatus;
  syncAllToFirebase: () => Promise<void>;
}

const STORAGE_KEYS = {
  LORRIES: 'sl_lorries_v1',
  LORRY_TRIPS: 'sl_lorry_trips_v1',
  PRODUCTS: 'sl_products_v1',
  SHOP_SALES: 'sl_shop_sales_v1',
  CUSTOMERS: 'sl_customers_v1',
  CREDIT_TXS: 'sl_credit_txs_v1',
  EXPENSES: 'sl_expenses_v1',
  WORKERS: 'sl_workers_v1',
  WORKER_PAYMENTS: 'sl_worker_payments_v1',
  CASH_TRANSFERS: 'sl_cash_transfers_v1',
  DAILY_CASH: 'sl_daily_cash_records_v1',
  EXPENSE_CATS: 'sl_expense_cats_v1',
  LANGUAGE: 'sl_language_pref_v1',
};

const PROD_CLEAN_VERSION_KEY = 'sl_prod_clean_zero_v3';

// Immediate purge of any old seed data on client load
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem(PROD_CLEAN_VERSION_KEY) !== 'v3') {
      localStorage.removeItem(STORAGE_KEYS.LORRY_TRIPS);
      localStorage.removeItem(STORAGE_KEYS.SHOP_SALES);
      localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      localStorage.removeItem(STORAGE_KEYS.CREDIT_TXS);
      localStorage.removeItem(STORAGE_KEYS.EXPENSES);
      localStorage.removeItem(STORAGE_KEYS.WORKERS);
      localStorage.removeItem(STORAGE_KEYS.WORKER_PAYMENTS);
      localStorage.removeItem(STORAGE_KEYS.CASH_TRANSFERS);
      localStorage.removeItem(STORAGE_KEYS.DAILY_CASH);
      const savedLorries = localStorage.getItem(STORAGE_KEYS.LORRIES);
      if (savedLorries) {
        try {
          const parsed = JSON.parse(savedLorries);
          const cleaned = parsed.filter(
            (l: { id?: string; name?: string }) =>
              !['Lorry 01', 'Lorry 02', 'Lorry 03', 'lorry-1', 'lorry-2', 'lorry-3'].includes(l.id || '') &&
              !['Lorry 01', 'Lorry 02', 'Lorry 03'].includes(l.name || '')
          );
          localStorage.setItem(
            STORAGE_KEYS.LORRIES,
            JSON.stringify(cleaned.length > 0 ? cleaned : INITIAL_LORRIES)
          );
        } catch {
          localStorage.removeItem(STORAGE_KEYS.LORRIES);
        }
      }
      localStorage.setItem(PROD_CLEAN_VERSION_KEY, 'v3');
    }
  } catch {
    // ignore
  }
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [language, setLanguageState] = useState<LanguageMode>('both');

  // Core Data States with lazy initialization from localStorage
  const [lorries, setLorries] = useState<Lorry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LORRIES);
    if (!saved) return INITIAL_LORRIES;
    try {
      const parsed: Lorry[] = JSON.parse(saved);
      const cleanOld = parsed.filter(
        (l) =>
          !['Lorry 01', 'Lorry 02', 'Lorry 03', 'lorry-1', 'lorry-2', 'lorry-3'].includes(l.id) &&
          !['Lorry 01', 'Lorry 02', 'Lorry 03'].includes(l.name)
      );
      const existingNames = new Set(cleanOld.map((l) => l.name));
      const missing = INITIAL_LORRIES.filter((l) => !existingNames.has(l.name));
      return [...INITIAL_LORRIES, ...cleanOld.filter((l) => !INITIAL_LORRIES.some((il) => il.name === l.name))];
    } catch {
      return INITIAL_LORRIES;
    }
  });

  const [lorryTrips, setLorryTrips] = useState<LorryTrip[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LORRY_TRIPS);
    if (!saved) return [];
    try {
      const parsed: LorryTrip[] = JSON.parse(saved);
      return parsed
        .filter((t) => !t.id.includes('seed'))
        .map((t) => {
          if (t.paymentType === 'AIYA') {
            return { ...t, totalAmount: 0, driverPayment: 0, cashReceived: 0, creditAmount: 0 };
          }
          return t;
        });
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [shopSales, setShopSales] = useState<ShopSale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOP_SALES);
    if (!saved) return [];
    try {
      const parsed: ShopSale[] = JSON.parse(saved);
      return parsed.filter((s) => !s.id.includes('seed'));
    } catch {
      return [];
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!saved) return [];
    try {
      const parsed: Customer[] = JSON.parse(saved);
      return parsed.filter((c) => !['cust-1', 'cust-2', 'cust-3'].includes(c.id));
    } catch {
      return [];
    }
  });

  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CREDIT_TXS);
    if (!saved) return [];
    try {
      const parsed: CreditTransaction[] = JSON.parse(saved);
      return parsed.filter((ctx) => !ctx.id.includes('seed'));
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!saved) return [];
    try {
      const parsed: Expense[] = JSON.parse(saved);
      return parsed.filter((e) => !e.id.includes('seed'));
    } catch {
      return [];
    }
  });

  const [workers, setWorkers] = useState<Worker[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WORKERS);
    if (!saved) return [];
    try {
      const parsed: Worker[] = JSON.parse(saved);
      return parsed.filter((w) => !['worker-1', 'worker-2', 'worker-3', 'worker-4'].includes(w.id));
    } catch {
      return [];
    }
  });

  const [workerPayments, setWorkerPayments] = useState<WorkerPayment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WORKER_PAYMENTS);
    if (!saved) return [];
    try {
      const parsed: WorkerPayment[] = JSON.parse(saved);
      return parsed.filter((wp) => !wp.id.includes('seed'));
    } catch {
      return [];
    }
  });

  const [cashTransfers, setCashTransfers] = useState<CashTransfer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CASH_TRANSFERS);
    if (!saved) return [];
    try {
      const parsed: CashTransfer[] = JSON.parse(saved);
      return parsed.filter((ct) => !ct.id.includes('seed'));
    } catch {
      return [];
    }
  });

  const [dailyCashRecords, setDailyCashRecords] = useState<Record<string, DailyCashRecord>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_CASH);
    const today = getTodayDateString();
    if (saved) {
      try {
        const parsed: Record<string, DailyCashRecord> = JSON.parse(saved);
        if (parsed[today]) return parsed;
        return {
          ...parsed,
          [today]: {
            date: today,
            openingCash: 0,
            isManualOpening: true,
            manualAdjustmentReason: 'Production opening cash',
          },
        };
      } catch {
        // fallback
      }
    }
    return {
      [today]: {
        date: today,
        openingCash: 0,
        isManualOpening: true,
        manualAdjustmentReason: 'Production opening cash',
      },
    };
  });

  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSE_CATS);
    return saved ? JSON.parse(saved) : DEFAULT_EXPENSE_CATEGORIES;
  });

  // Sync back to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LORRIES, JSON.stringify(lorries));
  }, [lorries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LORRY_TRIPS, JSON.stringify(lorryTrips));
  }, [lorryTrips]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOP_SALES, JSON.stringify(shopSales));
  }, [shopSales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CREDIT_TXS, JSON.stringify(creditTransactions));
  }, [creditTransactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORKER_PAYMENTS, JSON.stringify(workerPayments));
  }, [workerPayments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH_TRANSFERS, JSON.stringify(cashTransfers));
  }, [cashTransfers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAILY_CASH, JSON.stringify(dailyCashRecords));
  }, [dailyCashRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSE_CATS, JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    const savedLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as LanguageMode;
    if (savedLang) setLanguageState(savedLang);
  }, []);

  const setLanguage = (lang: LanguageMode) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  };

  // Firebase Real-time Sync & Initialization
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<SyncStatus>('connecting');

  useEffect(() => {
    let unsubLorries: (() => void) | undefined;
    let unsubTrips: (() => void) | undefined;
    let unsubProducts: (() => void) | undefined;
    let unsubSales: (() => void) | undefined;
    let unsubCustomers: (() => void) | undefined;
    let unsubCredit: (() => void) | undefined;
    let unsubExpenses: (() => void) | undefined;
    let unsubWorkers: (() => void) | undefined;
    let unsubWorkerPayments: (() => void) | undefined;
    let unsubTransfers: (() => void) | undefined;
    let unsubCashDays: (() => void) | undefined;

    let isSubscribed = true;

    async function initFirebaseSync() {
      try {
        setFirebaseSyncStatus('connecting');
        await initAuth();
        await testFirestoreConnection();
        if (!isSubscribed) return;
        setFirebaseSyncStatus('connected');

        // Lorries
        unsubLorries = fsSubscribeCollection<Lorry>(FS_COLLECTIONS.LORRIES, (data) => {
          if (data && data.length > 0) {
            const clean = data.filter(
              (l) =>
                !['Lorry 01', 'Lorry 02', 'Lorry 03', 'lorry-1', 'lorry-2', 'lorry-3'].includes(l.id || '') &&
                !['Lorry 01', 'Lorry 02', 'Lorry 03'].includes(l.name || '')
            );
            const existingNames = new Set(clean.map((l) => l.name));
            const missing = INITIAL_LORRIES.filter((l) => !existingNames.has(l.name));
            if (missing.length > 0) {
              const merged = [
                ...INITIAL_LORRIES,
                ...clean.filter((l) => !INITIAL_LORRIES.some((il) => il.name === l.name)),
              ];
              setLorries(merged);
              missing.forEach((m) => fsSaveDoc(FS_COLLECTIONS.LORRIES, m.id, m));
            } else {
              setLorries(clean.length > 0 ? clean : INITIAL_LORRIES);
            }
          } else {
            setLorries(INITIAL_LORRIES);
            fsBatchSave(FS_COLLECTIONS.LORRIES, INITIAL_LORRIES);
          }
        });

        // Trips
        unsubTrips = fsSubscribeCollection<LorryTrip>(FS_COLLECTIONS.LORRY_TRIPS, (data) => {
          if (data) {
            const clean = data
              .filter((t) => !t.id.includes('seed'))
              .map((t) => {
                if (t.paymentType === 'AIYA' && (t.totalAmount > 0 || t.driverPayment > 0 || t.cashReceived > 0 || t.creditAmount > 0)) {
                  const sanitized = { ...t, totalAmount: 0, driverPayment: 0, cashReceived: 0, creditAmount: 0 };
                  fsSaveDoc(FS_COLLECTIONS.LORRY_TRIPS, t.id, sanitized);
                  return sanitized;
                }
                return t;
              });
            setLorryTrips(clean);
          }
        });

        // Products
        unsubProducts = fsSubscribeCollection<Product>(FS_COLLECTIONS.PRODUCTS, (data) => {
          if (data && data.length > 0) {
            setProducts(data);
          } else if (products.length > 0) {
            fsBatchSave(FS_COLLECTIONS.PRODUCTS, products);
          }
        });

        // Shop Sales
        unsubSales = fsSubscribeCollection<ShopSale>(FS_COLLECTIONS.SHOP_SALES, (data) => {
          if (data) {
            const clean = data.filter((s) => !s.id.includes('seed'));
            setShopSales(clean);
          }
        });

        // Customers
        unsubCustomers = fsSubscribeCollection<Customer>(FS_COLLECTIONS.CUSTOMERS, (data) => {
          if (data) {
            const clean = data.filter((c) => !['cust-1', 'cust-2', 'cust-3'].includes(c.id));
            setCustomers(clean);
          }
        });

        // Credit Transactions
        unsubCredit = fsSubscribeCollection<CreditTransaction>(FS_COLLECTIONS.CREDIT_TRANSACTIONS, (data) => {
          if (data) {
            const clean = data.filter((ctx) => !ctx.id.includes('seed'));
            setCreditTransactions(clean);
          }
        });

        // Expenses
        unsubExpenses = fsSubscribeCollection<Expense>(FS_COLLECTIONS.EXPENSES, (data) => {
          if (data) {
            const clean = data.filter((e) => !e.id.includes('seed'));
            setExpenses(clean);
          }
        });

        // Workers
        unsubWorkers = fsSubscribeCollection<Worker>(FS_COLLECTIONS.WORKERS, (data) => {
          if (data) {
            const clean = data.filter(
              (w) => !['worker-1', 'worker-2', 'worker-3', 'worker-4'].includes(w.id)
            );
            setWorkers(clean);
          }
        });

        // Worker Payments
        unsubWorkerPayments = fsSubscribeCollection<WorkerPayment>(FS_COLLECTIONS.WORKER_PAYMENTS, (data) => {
          if (data) {
            const clean = data.filter((wp) => !wp.id.includes('seed'));
            setWorkerPayments(clean);
          }
        });

        // Cash Transfers
        unsubTransfers = fsSubscribeCollection<CashTransfer>(FS_COLLECTIONS.CASH_TRANSFERS, (data) => {
          if (data) {
            const clean = data.filter((ct) => !ct.id.includes('seed'));
            setCashTransfers(clean);
          }
        });

        // Daily Cash
        unsubCashDays = fsSubscribeCollection<DailyCashRecord & { id: string }>(FS_COLLECTIONS.DAILY_CASH, (data) => {
          if (data && data.length > 0) {
            const map: Record<string, DailyCashRecord> = {};
            data.forEach((item) => {
              map[item.date || item.id] = item;
            });
            setDailyCashRecords((prev) => ({ ...prev, ...map }));
          }
        });
      } catch (err) {
        console.warn('Firebase init warning:', err);
        if (isSubscribed) setFirebaseSyncStatus('offline');
      }
    }

    initFirebaseSync();

    return () => {
      isSubscribed = false;
      unsubLorries?.();
      unsubTrips?.();
      unsubProducts?.();
      unsubSales?.();
      unsubCustomers?.();
      unsubCredit?.();
      unsubExpenses?.();
      unsubWorkers?.();
      unsubWorkerPayments?.();
      unsubTransfers?.();
      unsubCashDays?.();
    };
  }, []);

  const syncAllToFirebase = async (): Promise<void> => {
    setFirebaseSyncStatus('connecting');
    try {
      await fsBatchSave(FS_COLLECTIONS.LORRIES, lorries);
      await fsBatchSave(FS_COLLECTIONS.LORRY_TRIPS, lorryTrips);
      await fsBatchSave(FS_COLLECTIONS.PRODUCTS, products);
      await fsBatchSave(FS_COLLECTIONS.SHOP_SALES, shopSales);
      await fsBatchSave(FS_COLLECTIONS.CUSTOMERS, customers);
      await fsBatchSave(FS_COLLECTIONS.CREDIT_TRANSACTIONS, creditTransactions);
      await fsBatchSave(FS_COLLECTIONS.EXPENSES, expenses);
      await fsBatchSave(FS_COLLECTIONS.WORKERS, workers);
      await fsBatchSave(FS_COLLECTIONS.WORKER_PAYMENTS, workerPayments);
      await fsBatchSave(FS_COLLECTIONS.CASH_TRANSFERS, cashTransfers);
      const cashDaysList = Object.entries(dailyCashRecords).map(([date, rec]) => ({
        id: date,
        ...rec,
      }));
      await fsBatchSave(FS_COLLECTIONS.DAILY_CASH, cashDaysList);
      setFirebaseSyncStatus('connected');
    } catch (err) {
      console.error('Failed to sync all to Firebase:', err);
      setFirebaseSyncStatus('error');
    }
  };

  const isToday = selectedDate === getTodayDateString();

  // Helper to calculate summary for any date
  const getSummaryForDate = (date: string): DailySummaryData => {
    // 1. Lorries
    const dateTrips = lorryTrips.filter((t) => t.date === date);
    const totalTripsCount = dateTrips.length;
    const totalLorryIncome = dateTrips.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const totalLorryCash = dateTrips.reduce((sum, t) => sum + (t.cashReceived || 0), 0);
    const totalDriverPayments = dateTrips.reduce((sum, t) => sum + (t.driverPayment || 0), 0);
    const totalLorryCredit = dateTrips.reduce((sum, t) => sum + (t.creditAmount || 0), 0);
    const lorryDailyBalance = totalLorryIncome - totalDriverPayments - totalLorryCredit;

    const lorryBreakdown = lorries.map((lorry) => {
      const lTrips = dateTrips.filter((t) => t.lorryId === lorry.id);
      const lIncome = lTrips.reduce((s, t) => s + (t.totalAmount || 0), 0);
      const lDriver = lTrips.reduce((s, t) => s + (t.driverPayment || 0), 0);
      const lCredit = lTrips.reduce((s, t) => s + (t.creditAmount || 0), 0);
      return {
        lorryId: lorry.id,
        lorryName: lorry.name,
        numberPlate: lorry.numberPlate,
        tripsCount: lTrips.length,
        totalIncome: lIncome,
        driverPayment: lDriver,
        credit: lCredit,
        balance: lIncome - lDriver - lCredit,
      };
    });

    // 2. Shop
    const dateSales = shopSales.filter((s) => s.date === date);
    const totalShopSalesCount = dateSales.length;
    const totalShopSalesAmount = dateSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const shopCashSales = dateSales
      .filter((s) => s.paymentMethod === 'CASH')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const shopCreditSales = dateSales
      .filter((s) => s.paymentMethod === 'NAYA')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    // Quantities
    let petrolLitres = 0;
    let dieselLitres = 0;
    let oilLitres = 0;
    let otherSalesAmount = 0;

    dateSales.forEach((s) => {
      const name = (s.productName || '').toLowerCase();
      if (s.category === 'fuel') {
        if (name.includes('petrol')) {
          if (name.includes('1/2l') || name.includes('half')) petrolLitres += 0.5 * s.quantity;
          else if (name.includes('2l')) petrolLitres += 2 * s.quantity;
          else petrolLitres += 1 * s.quantity;
        } else if (name.includes('diesel')) {
          if (name.includes('20l')) dieselLitres += 20 * s.quantity;
          else if (name.includes('10l')) dieselLitres += 10 * s.quantity;
          else if (name.includes('5l')) dieselLitres += 5 * s.quantity;
          else dieselLitres += 1 * s.quantity;
        }
      } else if (s.category === 'oil') {
        oilLitres += s.quantity;
      } else {
        otherSalesAmount += s.totalAmount;
      }
    });

    // 3. Credit
    const dateCreditTxs = creditTransactions.filter((c) => c.date === date);
    const newCreditGiven =
      dateCreditTxs.filter((c) => c.type === 'CREDIT_SALE').reduce((sum, c) => sum + c.amount, 0) +
      totalLorryCredit +
      shopCreditSales; // safeguard if recorded via sales
    const creditPaymentsReceived = dateCreditTxs
      .filter((c) => c.type === 'PAYMENT_RECEIVED')
      .reduce((sum, c) => sum + c.amount, 0);
    const totalOutstandingCredit = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);

    // 4. Expenses
    const dateExpenses = expenses.filter((e) => e.date === date);
    const totalExpenses = dateExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const expenseCategoryTotals: Record<string, number> = {};
    dateExpenses.forEach((e) => {
      expenseCategoryTotals[e.category] = (expenseCategoryTotals[e.category] || 0) + e.amount;
    });

    // 5. Worker payments
    const dateWorkerPayments = workerPayments.filter((w) => w.date === date);
    const totalWorkerPayments = dateWorkerPayments.reduce((sum, w) => sum + (w.amount || 0), 0);
    const tripDriverPayments = dateWorkerPayments
      .filter((w) => w.type === 'LORRY_TRIP')
      .reduce((sum, w) => sum + (w.amount || 0), 0);
    const directWorkerPayments = dateWorkerPayments
      .filter((w) => w.type !== 'LORRY_TRIP')
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    // 6. Cash & Aiya Transfers
    const dateTransfers = cashTransfers.filter((t) => t.date === date);
    // Cash received FROM Aiya (Inflow to till: "අයියා දුන්න")
    const cashFromAiya = dateTransfers
      .filter((t) => t.type === 'FROM_AIYA')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    // Cash given / transferred TO Aiya (Outflow from till: "අයියාට දුන්න")
    const transfersToAiya = dateTransfers
      .filter((t) => t.type !== 'FROM_AIYA')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const transfersTotal = transfersToAiya;

    // Opening cash (ලාච්චුව): check if record exists for this date, otherwise fallback to 0
    let openingCash = 0;
    let isManualOpening = false;

    if (dailyCashRecords[date]) {
      openingCash = dailyCashRecords[date].openingCash;
      isManualOpening = dailyCashRecords[date].isManualOpening;
    } else {
      openingCash = 0;
    }

    // Sri Lankan notebook equation:
    // මුළු ලැබීම් = ලාච්චුව + අයියා දුන්න + ලොරි වලින් + කඩෙන් + ණය ලැබීම්
    const cashReceived = shopCashSales + totalLorryCash + creditPaymentsReceived + cashFromAiya;
    const totalInflow = openingCash + cashReceived;

    // මුළු වියදම් / ගෙවීම් = සාමාන්‍ය වියදම් + සේවක ගෙවීම් + අයියාට දුන්න
    const cashPaidOut = totalExpenses + directWorkerPayments;
    const totalOutflow = cashPaidOut + transfersToAiya;

    // ලාච්චුවේ ඉතිරි = මුළු මුදල - වියදම්/ගෙවීම්
    const closingCash = totalInflow - totalOutflow;

    return {
      date,
      totalLorriesCount: lorries.length,
      activeLorriesCount: lorries.filter((l) => l.status === 'active').length,
      totalTripsCount,
      totalLorryIncome,
      totalLorryCash,
      totalDriverPayments,
      totalLorryCredit,
      lorryDailyBalance,
      lorryBreakdown,

      totalShopSalesCount,
      totalShopSalesAmount,
      shopCashSales,
      shopCreditSales,
      petrolLitres,
      dieselLitres,
      oilLitres,
      otherSalesAmount,

      newCreditGiven,
      creditPaymentsReceived,
      totalOutstandingCredit,

      totalExpenses,
      expenseCategoryTotals,

      totalWorkerPayments,
      directWorkerPayments,
      tripDriverPayments,

      openingCash,
      isManualOpening,
      cashReceived,
      cashFromAiya,
      transfersToAiya,
      totalInflow,
      cashPaidOut,
      totalOutflow,
      transfersTotal,
      closingCash,
    };
  };

  const todaySummary = useMemo(() => {
    return getSummaryForDate(selectedDate);
  }, [
    selectedDate,
    lorries,
    lorryTrips,
    shopSales,
    customers,
    creditTransactions,
    expenses,
    workerPayments,
    cashTransfers,
    dailyCashRecords,
  ]);

  // Actions: LORRY TRIPS
  const addLorryTrip = (tripData: Omit<LorryTrip, 'id' | 'createdTimestamp'>): LorryTrip => {
    const id = `trip-${Date.now()}`;
    const isAiya = tripData.paymentType === 'AIYA';
    const totalAmount = isAiya ? 0 : (tripData.totalAmount || 0);
    const driverPayment = 0; // Aiyata mudal doesn't have a driver wage amount (gana wadak na)
    const cashReceived = tripData.paymentType === 'FULL' ? totalAmount : 0;
    const creditAmount = tripData.paymentType === 'CREDIT' ? totalAmount : 0;

    const newTrip: LorryTrip = {
      ...tripData,
      totalAmount,
      driverPayment,
      cashReceived,
      creditAmount,
      id,
      createdTimestamp: Date.now(),
    };

    setLorryTrips((prev) => [newTrip, ...prev]);
    fsSaveDoc(FS_COLLECTIONS.LORRY_TRIPS, newTrip.id, newTrip);

    // If credit exists and customer selected, add credit transaction and update customer balance
    if (newTrip.creditAmount > 0 && newTrip.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === newTrip.customerId) {
            const prevBal = c.currentBalance;
            const newBal = prevBal + newTrip.creditAmount;
            // Record tx
            const ctx: CreditTransaction = {
              id: `ctx-${Date.now()}`,
              customerId: c.id,
              customerName: c.name,
              date: newTrip.date,
              time: newTrip.time,
              type: 'CREDIT_SALE',
              amount: newTrip.creditAmount,
              source: 'LORRY',
              sourceReferenceId: id,
              previousBalance: prevBal,
              newBalance: newBal,
              notes: `Lorry trip credit (${newTrip.lorryName} - ${newTrip.destination || newTrip.tripType})`,
              createdTimestamp: Date.now(),
            };
            setCreditTransactions((tPrev) => [ctx, ...tPrev]);
            fsSaveDoc(FS_COLLECTIONS.CREDIT_TRANSACTIONS, ctx.id, ctx);

            const updatedCust = {
              ...c,
              currentBalance: newBal,
              totalCredit: c.totalCredit + newTrip.creditAmount,
              lastTransactionDate: newTrip.date,
            };
            fsSaveDoc(FS_COLLECTIONS.CUSTOMERS, c.id, updatedCust);
            return updatedCust;
          }
          return c;
        })
      );
    }

    return newTrip;
  };

  const editLorryTrip = (id: string, tripData: Partial<LorryTrip>) => {
    setLorryTrips((prev) => {
      const existing = prev.find((t) => t.id === id);
      if (!existing) return prev;

      const merged: LorryTrip = { ...existing, ...tripData };
      const isAiya = merged.paymentType === 'AIYA';

      if (isAiya) {
        merged.totalAmount = 0;
        merged.driverPayment = 0;
        merged.cashReceived = 0;
        merged.creditAmount = 0;
      } else if (merged.paymentType === 'FULL') {
        merged.cashReceived = merged.totalAmount || 0;
        merged.driverPayment = 0;
        merged.creditAmount = 0;
      } else if (merged.paymentType === 'CREDIT') {
        merged.creditAmount = merged.totalAmount || 0;
        merged.cashReceived = 0;
        merged.driverPayment = 0;
      }

      // Revert previous credit if credit changed or customer changed or no longer credit
      const hadCredit = existing.creditAmount > 0 && existing.customerId;
      const creditChanged =
        existing.creditAmount !== merged.creditAmount ||
        existing.customerId !== merged.customerId ||
        merged.paymentType !== 'CREDIT';

      if (hadCredit && creditChanged) {
        setCustomers((cPrev) =>
          cPrev.map((c) => {
            if (c.id === existing.customerId) {
              const updated = {
                ...c,
                currentBalance: Math.max(0, c.currentBalance - existing.creditAmount),
                totalCredit: Math.max(0, c.totalCredit - existing.creditAmount),
              };
              fsSaveDoc(FS_COLLECTIONS.CUSTOMERS, c.id, updated);
              return updated;
            }
            return c;
          })
        );
        setCreditTransactions((ctxPrev) =>
          ctxPrev.filter((ctx) => ctx.sourceReferenceId !== id)
        );
      }

      // Apply new credit if merged has credit and it changed
      if (merged.creditAmount > 0 && merged.customerId && (!hadCredit || creditChanged)) {
        setCustomers((cPrev) =>
          cPrev.map((c) => {
            if (c.id === merged.customerId) {
              const prevBal = c.currentBalance;
              const newBal = prevBal + merged.creditAmount;
              const ctx: CreditTransaction = {
                id: `ctx-${Date.now()}`,
                customerId: c.id,
                customerName: c.name,
                date: merged.date,
                time: merged.time,
                type: 'CREDIT_SALE',
                amount: merged.creditAmount,
                source: 'LORRY',
                sourceReferenceId: id,
                previousBalance: prevBal,
                newBalance: newBal,
                notes: `Lorry trip credit (${merged.lorryName} - ${merged.destination || merged.tripType})`,
                createdTimestamp: Date.now(),
              };
              setCreditTransactions((tPrev) => [ctx, ...tPrev]);
              fsSaveDoc(FS_COLLECTIONS.CREDIT_TRANSACTIONS, ctx.id, ctx);

              const updatedCust = {
                ...c,
                currentBalance: newBal,
                totalCredit: c.totalCredit + merged.creditAmount,
                lastTransactionDate: merged.date,
              };
              fsSaveDoc(FS_COLLECTIONS.CUSTOMERS, c.id, updatedCust);
              return updatedCust;
            }
            return c;
          })
        );
      }

      // Ensure any obsolete worker payment for this trip is removed
      setWorkerPayments((wpPrev) => wpPrev.filter((w) => w.lorryTripId !== id));

      fsSaveDoc(FS_COLLECTIONS.LORRY_TRIPS, id, merged);
      return prev.map((t) => (t.id === id ? merged : t));
    });
  };

  const deleteLorryTrip = (id: string) => {
    const trip = lorryTrips.find((t) => t.id === id);
    if (!trip) return;

    // Remove trip
    setLorryTrips((prev) => prev.filter((t) => t.id !== id));
    fsDeleteDoc(FS_COLLECTIONS.LORRY_TRIPS, id);

    // Remove linked worker payment
    setWorkerPayments((prev) => prev.filter((w) => w.lorryTripId !== id));

    // Revert customer credit if any
    if (trip.creditAmount > 0 && trip.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === trip.customerId) {
            const updated = {
              ...c,
              currentBalance: Math.max(0, c.currentBalance - trip.creditAmount),
              totalCredit: Math.max(0, c.totalCredit - trip.creditAmount),
            };
            fsSaveDoc(FS_COLLECTIONS.CUSTOMERS, c.id, updated);
            return updated;
          }
          return c;
        })
      );
      setCreditTransactions((prev) =>
        prev.filter((ctx) => ctx.sourceReferenceId !== id)
      );
    }
  };

  const addLorry = (lorryData: Omit<Lorry, 'id'>): Lorry => {
    const id = `lorry-${Date.now()}`;
    const newLorry: Lorry = { ...lorryData, id };
    setLorries((prev) => [...prev, newLorry]);
    fsSaveDoc(FS_COLLECTIONS.LORRIES, newLorry.id, newLorry);
    return newLorry;
  };

  const editLorry = (id: string, data: Partial<Lorry>) => {
    setLorries((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
    fsSaveDoc(FS_COLLECTIONS.LORRIES, id, data);
  };

  const deleteLorry = (id: string) => {
    setLorries((prev) => prev.filter((l) => l.id !== id));
    fsDeleteDoc(FS_COLLECTIONS.LORRIES, id);
  };

  // Actions: SHOP SALES
  const addShopSale = (saleData: Omit<ShopSale, 'id' | 'createdTimestamp'>): ShopSale => {
    const id = `sale-${Date.now()}`;
    const newSale: ShopSale = {
      ...saleData,
      id,
      createdTimestamp: Date.now(),
    };

    setShopSales((prev) => [newSale, ...prev]);
    fsSaveDoc(FS_COLLECTIONS.SHOP_SALES, newSale.id, newSale);

    // If sale is on Credit (NAYA), link to customer
    if (newSale.paymentMethod === 'NAYA' && newSale.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === newSale.customerId) {
            const prevBal = c.currentBalance;
            const newBal = prevBal + newSale.totalAmount;
            const ctx: CreditTransaction = {
              id: `ctx-${Date.now()}`,
              customerId: c.id,
              customerName: c.name,
              date: newSale.date,
              time: newSale.time,
              type: 'CREDIT_SALE',
              amount: newSale.totalAmount,
              source: 'SHOP',
              sourceReferenceId: id,
              previousBalance: prevBal,
              newBalance: newBal,
              notes: `Shop purchase: ${newSale.productName} (x${newSale.quantity})`,
              createdTimestamp: Date.now(),
            };
            setCreditTransactions((tPrev) => [ctx, ...tPrev]);
            fsSaveDoc(FS_COLLECTIONS.CREDIT_TRANSACTIONS, ctx.id, ctx);

            const updatedCust = {
              ...c,
              currentBalance: newBal,
              totalCredit: c.totalCredit + newSale.totalAmount,
              lastTransactionDate: newSale.date,
            };
            fsSaveDoc(FS_COLLECTIONS.CUSTOMERS, c.id, updatedCust);
            return updatedCust;
          }
          return c;
        })
      );
    }

    return newSale;
  };

  const quickAddProductSale = (
    product: Product,
    quantity = 1,
    paymentMethod: 'CASH' | 'NAYA' = 'CASH',
    customerId?: string
  ): ShopSale => {
    const customer = customerId ? customers.find((c) => c.id === customerId) : undefined;
    return addShopSale({
      date: selectedDate,
      time: getCurrentTimeString(),
      productId: product.id,
      productName: product.name,
      category: product.category,
      unitPrice: product.unitPrice, // Snapshot price!
      unit: product.unit,
      quantity,
      totalAmount: product.unitPrice * quantity,
      paymentMethod,
      customerId,
      customerName: customer?.name,
    });
  };

  const updateSaleQuantity = (saleId: string, delta: number) => {
    setShopSales((prev) =>
      prev
        .map((sale) => {
          if (sale.id === saleId) {
            const newQty = sale.quantity + delta;
            if (newQty <= 0) {
              fsDeleteDoc(FS_COLLECTIONS.SHOP_SALES, saleId);
              return null;
            }
            const newTotal = sale.unitPrice * newQty;

            // If it was credit sale, update customer
            if (sale.paymentMethod === 'NAYA' && sale.customerId) {
              const diff = newTotal - sale.totalAmount;
              setCustomers((cPrev) =>
                cPrev.map((c) => {
                  if (c.id === sale.customerId) {
                    const updated = {
                      ...c,
                      currentBalance: c.currentBalance + diff,
                      totalCredit: c.totalCredit + diff,
                    };
                    fsSaveDoc(FS_COLLECTIONS.CUSTOMERS, c.id, updated);
                    return updated;
                  }
                  return c;
                })
              );
            }

            const updatedSale = {
              ...sale,
              quantity: newQty,
              totalAmount: newTotal,
            };
            fsSaveDoc(FS_COLLECTIONS.SHOP_SALES, saleId, updatedSale);
            return updatedSale;
          }
          return sale;
        })
        .filter(Boolean) as ShopSale[]
    );
  };

  const deleteShopSale = (id: string) => {
    const sale = shopSales.find((s) => s.id === id);
    if (!sale) return;

    if (sale.paymentMethod === 'NAYA' && sale.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === sale.customerId) {
            const updated = {
              ...c,
              currentBalance: Math.max(0, c.currentBalance - sale.totalAmount),
              totalCredit: Math.max(0, c.totalCredit - sale.totalAmount),
            };
            fsSaveDoc(FS_COLLECTIONS.CUSTOMERS, c.id, updated);
            return updated;
          }
          return c;
        })
      );
      setCreditTransactions((prev) =>
        prev.filter((ctx) => ctx.sourceReferenceId !== id)
      );
    }

    setShopSales((prev) => prev.filter((s) => s.id !== id));
    fsDeleteDoc(FS_COLLECTIONS.SHOP_SALES, id);
  };

  // Products Management
  const addProduct = (prodData: Omit<Product, 'id'>): Product => {
    const id = `prod-${Date.now()}`;
    const newProd: Product = { ...prodData, id };
    setProducts((prev) => [...prev, newProd]);
    fsSaveDoc(FS_COLLECTIONS.PRODUCTS, newProd.id, newProd);
    return newProd;
  };

  // IMPORTANT: Changing a price must NOT alter historical shopSales (they snapshot unitPrice)
  const updateProductPrice = (id: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, unitPrice: newPrice } : p))
    );
    fsSaveDoc(FS_COLLECTIONS.PRODUCTS, id, { unitPrice: newPrice });
  };

  const editProduct = (id: string, data: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    fsSaveDoc(FS_COLLECTIONS.PRODUCTS, id, data);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    fsDeleteDoc(FS_COLLECTIONS.PRODUCTS, id);
  };

  // Credit / Naya Actions
  const receiveCreditPayment = (customerId: string, amount: number, notes?: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    const prevBal = customer.currentBalance;
    const newBal = Math.max(0, prevBal - amount);

    const tx: CreditTransaction = {
      id: `ctx-${Date.now()}`,
      customerId,
      customerName: customer.name,
      date: selectedDate,
      time: getCurrentTimeString(),
      type: 'PAYMENT_RECEIVED',
      amount,
      source: 'DIRECT',
      previousBalance: prevBal,
      newBalance: newBal,
      notes: notes || 'Cash received against balance',
      createdTimestamp: Date.now(),
    };

    setCreditTransactions((prev) => [tx, ...prev]);
    fsSaveDoc(FS_COLLECTIONS.CREDIT_TRANSACTIONS, tx.id, tx);

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const updated = {
            ...c,
            currentBalance: newBal,
            totalPaid: c.totalPaid + amount,
            lastTransactionDate: selectedDate,
          };
          fsSaveDoc(FS_COLLECTIONS.CUSTOMERS, customerId, updated);
          return updated;
        }
        return c;
      })
    );
  };

  const addCustomerCreditSale = (
    customerId: string,
    amount: number,
    notes?: string,
    source: 'SHOP' | 'LORRY' | 'DIRECT' = 'DIRECT'
  ) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    const prevBal = customer.currentBalance;
    const newBal = prevBal + amount;

    const tx: CreditTransaction = {
      id: `ctx-${Date.now()}`,
      customerId,
      customerName: customer.name,
      date: selectedDate,
      time: getCurrentTimeString(),
      type: 'CREDIT_SALE',
      amount,
      source,
      previousBalance: prevBal,
      newBalance: newBal,
      notes: notes || 'Direct credit sale (ණයට)',
      createdTimestamp: Date.now(),
    };

    setCreditTransactions((prev) => [tx, ...prev]);
    fsSaveDoc(FS_COLLECTIONS.CREDIT_TRANSACTIONS, tx.id, tx);

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const updated = {
            ...c,
            currentBalance: newBal,
            totalCredit: c.totalCredit + amount,
            lastTransactionDate: selectedDate,
          };
          fsSaveDoc(FS_COLLECTIONS.CUSTOMERS, customerId, updated);
          return updated;
        }
        return c;
      })
    );
  };

  const addCustomer = (cust: Omit<Customer, 'id' | 'currentBalance' | 'totalCredit' | 'totalPaid'>): Customer => {
    const id = `cust-${Date.now()}`;
    const newCust: Customer = {
      ...cust,
      id,
      currentBalance: 0,
      totalCredit: 0,
      totalPaid: 0,
      lastTransactionDate: selectedDate,
    };
    setCustomers((prev) => [...prev, newCust]);
    fsSaveDoc(FS_COLLECTIONS.CUSTOMERS, newCust.id, newCust);
    return newCust;
  };

  const editCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    fsSaveDoc(FS_COLLECTIONS.CUSTOMERS, id, data);
  };

  // Expenses Actions
  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdTimestamp'>): Expense => {
    const id = `exp-${Date.now()}`;
    const newExp: Expense = { ...expenseData, id, createdTimestamp: Date.now() };
    setExpenses((prev) => [newExp, ...prev]);
    fsSaveDoc(FS_COLLECTIONS.EXPENSES, newExp.id, newExp);
    return newExp;
  };

  const editExpense = (id: string, data: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
    fsSaveDoc(FS_COLLECTIONS.EXPENSES, id, data);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    fsDeleteDoc(FS_COLLECTIONS.EXPENSES, id);
  };

  const addExpenseCategory = (category: string) => {
    if (!expenseCategories.includes(category)) {
      setExpenseCategories((prev) => [...prev, category]);
    }
  };

  // Worker Actions
  const addWorkerPayment = (paymentData: Omit<WorkerPayment, 'id' | 'createdTimestamp'>): WorkerPayment => {
    const id = `wp-${Date.now()}`;
    const newWp: WorkerPayment = { ...paymentData, id, createdTimestamp: Date.now() };
    setWorkerPayments((prev) => [newWp, ...prev]);
    fsSaveDoc(FS_COLLECTIONS.WORKER_PAYMENTS, newWp.id, newWp);
    return newWp;
  };

  const deleteWorkerPayment = (id: string) => {
    setWorkerPayments((prev) => prev.filter((wp) => wp.id !== id));
    fsDeleteDoc(FS_COLLECTIONS.WORKER_PAYMENTS, id);
  };

  const addWorker = (workerData: Omit<Worker, 'id'>): Worker => {
    const id = `worker-${Date.now()}`;
    const newWorker: Worker = { ...workerData, id };
    setWorkers((prev) => [...prev, newWorker]);
    fsSaveDoc(FS_COLLECTIONS.WORKERS, newWorker.id, newWorker);
    return newWorker;
  };

  const editWorker = (id: string, data: Partial<Worker>) => {
    setWorkers((prev) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)));
    fsSaveDoc(FS_COLLECTIONS.WORKERS, id, data);
  };

  // Cash & Aiya Transfer Actions
  const addCashTransfer = (
    amount: number,
    reason: string,
    type: CashTransferType = 'TO_AIYA'
  ): CashTransfer => {
    const id = `trans-${Date.now()}`;
    const transfer: CashTransfer = {
      id,
      date: selectedDate,
      time: getCurrentTimeString(),
      amount,
      type,
      reason,
      createdTimestamp: Date.now(),
    };
    setCashTransfers((prev) => [transfer, ...prev]);
    fsSaveDoc(FS_COLLECTIONS.CASH_TRANSFERS, transfer.id, transfer);
    return transfer;
  };

  const deleteCashTransfer = (id: string) => {
    setCashTransfers((prev) => prev.filter((t) => t.id !== id));
    fsDeleteDoc(FS_COLLECTIONS.CASH_TRANSFERS, id);
  };

  const updateOpeningCash = (date: string, amount: number, reason?: string) => {
    const rec = {
      date,
      openingCash: amount,
      isManualOpening: true,
      manualAdjustmentReason: reason || 'Manual opening cash adjustment',
    };
    setDailyCashRecords((prev) => ({
      ...prev,
      [date]: rec,
    }));
    fsSaveDoc(FS_COLLECTIONS.DAILY_CASH, date, { id: date, ...rec });
  };

  // WhatsApp Summary Message Generators matching Sri Lankan daily notebook
  const generateDailyWhatsAppSummary = (dateStr?: string): string => {
    const targetDate = dateStr || selectedDate;
    const s = getSummaryForDate(targetDate);
    const dateFormatted = formatDateShort(targetDate);

    return `📅 දෛනික මුදල් සාරාංශය (${dateFormatted})
-----------------------------------------
💵 ලාච්චුව (Opening): ${formatRs(s.openingCash)}
➕ අයියා දුන්න: ${formatRs(s.cashFromAiya)}
➕ ලොරි වලින්: ${formatRs(s.totalLorryCash)}
➕ කඩෙන්: ${formatRs(s.shopCashSales)}
➕ ණය ලැබීම්: ${formatRs(s.creditPaymentsReceived)}
=========================================
💰 මුළු ලැබීම් එකතුව: ${formatRs(s.totalInflow)}
-----------------------------------------
➖ වියදම් (සාමාන්‍ය): ${formatRs(s.totalExpenses)}
➖ සේවක ගෙවීම්: ${formatRs(s.directWorkerPayments)}
➖ අයියාට දුන්න: ${formatRs(s.transfersToAiya)}
=========================================
✅ ලාච්චුවේ ඉතිරි (Closing): ${formatRs(s.closingCash)}

🚛 ලොරි: ට්‍රිප් ${s.totalTripsCount} | ආදායම: ${formatRs(s.totalLorryIncome)}
🏪 කඩේ: විකුණුම් ${s.totalShopSalesCount} | ${formatRs(s.totalShopSalesAmount)}
💳 අද අලුත් ණය: ${formatRs(s.newCreditGiven)} | මුළු හිඟ ණය: ${formatRs(s.totalOutstandingCredit)}`;
  };

  const generateLorryWhatsAppSummary = (dateStr?: string): string => {
    const targetDate = dateStr || selectedDate;
    const s = getSummaryForDate(targetDate);
    const dateFormatted = formatDateShort(targetDate);

    let msg = `LORRY DAILY SUMMARY\nDate: ${dateFormatted}\n\n`;
    s.lorryBreakdown.forEach((l) => {
      msg += `${l.lorryName} (${l.numberPlate})\n`;
      msg += `Trips: ${l.tripsCount}\n`;
      msg += `Total: ${formatRs(l.totalIncome)}\n`;
      msg += `Aiya: ${formatRs(l.driverPayment)}\n`;
      msg += `Naya: ${formatRs(l.credit)}\n`;
      msg += `Balance: ${formatRs(l.balance)}\n\n`;
    });

    msg += `TOTAL TRIPS: ${s.totalTripsCount}\n`;
    msg += `TOTAL INCOME: ${formatRs(s.totalLorryIncome)}`;
    return msg;
  };

  const generateCustomerWhatsAppStatement = (customerId: string, dateStr?: string): string => {
    const targetDate = dateStr || selectedDate;
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return '';
    const dateFormatted = formatDateShort(targetDate);

    // Calculate today's credit and payments for this customer
    const custTxs = creditTransactions.filter(
      (tx) => tx.customerId === customerId && tx.date === targetDate
    );
    const todayCredit = custTxs
      .filter((tx) => tx.type === 'CREDIT_SALE')
      .reduce((s, tx) => s + tx.amount, 0);
    const todayPayment = custTxs
      .filter((tx) => tx.type === 'PAYMENT_RECEIVED')
      .reduce((s, tx) => s + tx.amount, 0);

    const prevBal = customer.currentBalance - todayCredit + todayPayment;

    return `CUSTOMER CREDIT STATEMENT\n\nCustomer: ${customer.name}\nDate: ${dateFormatted}\n\nPrevious Balance: ${formatRs(
      prevBal
    )}\nNew Credit: ${formatRs(todayCredit)}\nPayment: ${formatRs(
      todayPayment
    )}\n\nCurrent Balance: ${formatRs(customer.currentBalance)}`;
  };

  // Reset to initial clean production data (all numbers to 0)
  const resetToSampleData = () => {
    localStorage.clear();
    localStorage.setItem(PROD_CLEAN_VERSION_KEY, 'v3');
    setLorries(INITIAL_LORRIES);
    setProducts(INITIAL_PRODUCTS);
    setCustomers([]);
    setWorkers([]);
    setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
    setLorryTrips([]);
    setShopSales([]);
    setCreditTransactions([]);
    setExpenses([]);
    setWorkerPayments([]);
    setCashTransfers([]);
    const today = getTodayDateString();
    setDailyCashRecords({
      [today]: {
        date: today,
        openingCash: 0,
        isManualOpening: true,
        manualAdjustmentReason: 'Clean production opening cash',
      },
    });

    // Also purge test docs from Firestore
    try {
      fsDeleteAllDocsInCollection(FS_COLLECTIONS.LORRY_TRIPS);
      fsDeleteAllDocsInCollection(FS_COLLECTIONS.SHOP_SALES);
      fsDeleteAllDocsInCollection(FS_COLLECTIONS.CREDIT_TRANSACTIONS);
      fsDeleteAllDocsInCollection(FS_COLLECTIONS.EXPENSES);
      fsDeleteAllDocsInCollection(FS_COLLECTIONS.WORKER_PAYMENTS);
      fsDeleteAllDocsInCollection(FS_COLLECTIONS.CASH_TRANSFERS);
      fsDeleteAllDocsInCollection(FS_COLLECTIONS.CUSTOMERS);
      fsDeleteAllDocsInCollection(FS_COLLECTIONS.WORKERS);
      fsBatchSave(FS_COLLECTIONS.LORRIES, INITIAL_LORRIES);
    } catch (e) {
      console.warn('Firestore purge error on reset:', e);
    }
  };

  const exportBackupJson = (): string => {
    const backup = {
      lorries,
      lorryTrips,
      products,
      shopSales,
      customers,
      creditTransactions,
      expenses,
      workers,
      workerPayments,
      cashTransfers,
      dailyCashRecords,
      expenseCategories,
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  };

  const importBackupJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.lorries) setLorries(data.lorries);
      if (data.lorryTrips) setLorryTrips(data.lorryTrips);
      if (data.products) setProducts(data.products);
      if (data.shopSales) setShopSales(data.shopSales);
      if (data.customers) setCustomers(data.customers);
      if (data.creditTransactions) setCreditTransactions(data.creditTransactions);
      if (data.expenses) setExpenses(data.expenses);
      if (data.workers) setWorkers(data.workers);
      if (data.workerPayments) setWorkerPayments(data.workerPayments);
      if (data.cashTransfers) setCashTransfers(data.cashTransfers);
      if (data.dailyCashRecords) setDailyCashRecords(data.dailyCashRecords);
      if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        isToday,
        language,
        setLanguage,

        lorries,
        lorryTrips,
        products,
        shopSales,
        customers,
        creditTransactions,
        expenses,
        workers,
        workerPayments,
        cashTransfers,
        dailyCashRecords,
        expenseCategories,

        todaySummary,
        getSummaryForDate,

        addLorryTrip,
        editLorryTrip,
        deleteLorryTrip,
        addLorry,
        editLorry,
        deleteLorry,

        addShopSale,
        quickAddProductSale,
        updateSaleQuantity,
        deleteShopSale,
        addProduct,
        updateProductPrice,
        editProduct,
        deleteProduct,

        receiveCreditPayment,
        addCustomerCreditSale,
        addCustomer,
        editCustomer,

        addExpense,
        editExpense,
        deleteExpense,
        addExpenseCategory,

        addWorkerPayment,
        deleteWorkerPayment,
        addWorker,
        editWorker,

        addCashTransfer,
        deleteCashTransfer,
        updateOpeningCash,

        generateDailyWhatsAppSummary,
        generateLorryWhatsAppSummary,
        generateCustomerWhatsAppStatement,

        resetToSampleData,
        resetToDefaultData: resetToSampleData,
        exportBackupJson,
        importBackupJson,

        firebaseSyncStatus,
        syncAllToFirebase,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
