export type LanguageMode = 'both' | 'si' | 'en';

export type PaymentMethod = 'CASH' | 'NAYA' | 'AIYA' | 'SPLIT' | 'TRANSFER';

export type LorryPaymentType = 'FULL' | 'SPLIT' | 'CREDIT' | 'AIYA';

export interface Lorry {
  id: string;
  name: string; // e.g. "LN සුපුන්", "LJ බබා බන්ඩාර"
  numberPlate: string; // e.g. "LN සුපුන්"
  type?: string; // e.g. "Tipper", "Demac", "10-Wheel"
  capacity?: string; // e.g. "3 Cube", "5 Cube", "10 Ton"
  driverName?: string; // e.g. "සුපුන්", "බන්ඩාර"
  driverWorkerId?: string;
  status?: 'active' | 'maintenance' | 'idle';
  notes?: string;
}

export interface LorryTrip {
  id: string;
  lorryId: string;
  lorryName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  tripType: string; // Material: e.g. "පස්", "3/4", "බොරළු", "කුඩු", "6*9", "වැලි"
  material?: string;
  quantity?: number; // e.g. 300 or unit count
  unitPrice?: number;
  calculationMode?: 'default300' | 'unitPrice';
  destination?: string;
  totalAmount: number;
  paymentType: LorryPaymentType;
  cashReceived: number; // Cash handed to owner (සම්පූර්ණ මුදල)
  driverPayment: number; // Aiyata mudal (අයියට මුදල්)
  creditAmount: number; // Nayata mudal (ණයට)
  customerId?: string; // If credit is linked to customer
  customerName?: string;
  driverWorkerId?: string;
  driverName?: string;
  notes?: string;
  createdTimestamp: number;
}

export type ProductCategory = 'fuel' | 'oil' | 'other_fuel' | 'parts' | 'other';

export interface Product {
  id: string;
  name: string;
  nameSinhala: string;
  category: ProductCategory;
  unitPrice: number;
  unit: string; // "1L", "1/2L", "5L", "20L", "Piece", etc.
  isQuickItem?: boolean;
}

export interface ShopSale {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  productId: string;
  productName: string;
  category: ProductCategory;
  unitPrice: number; // Snapshot of unit price at time of sale
  unit: string;
  quantity: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'NAYA';
  customerId?: string;
  customerName?: string;
  notes?: string;
  createdTimestamp: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  creditLimit?: number;
  currentBalance: number; // Outstanding debt amount
  totalCredit: number; // Cumulative credit taken
  totalPaid: number; // Cumulative payments made
  lastTransactionDate?: string;
}

export interface CreditTransaction {
  id: string;
  customerId: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 'CREDIT_SALE' | 'PAYMENT_RECEIVED';
  amount: number;
  source: 'SHOP' | 'LORRY' | 'DIRECT';
  sourceReferenceId?: string;
  previousBalance: number;
  newBalance: number;
  notes?: string;
  createdTimestamp: number;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: string; // "Fuel", "Food", "Repair", "Parts", "Transport", "Worker payment", "Other"
  amount: number;
  note?: string;
  createdTimestamp: number;
}

export interface Worker {
  id: string;
  name: string; // e.g. "Sunil Aiya"
  phone?: string;
  assignedLorryId?: string;
  assignedLorryName?: string;
  notes?: string;
  isActive: boolean;
}

export interface WorkerPayment {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  workerId: string;
  workerName: string;
  amount: number;
  type: 'LORRY_TRIP' | 'DIRECT_ADVANCE' | 'DAILY_WAGE';
  lorryTripId?: string;
  lorryName?: string;
  note?: string;
  createdTimestamp: number;
}

export type CashTransferType = 'TO_AIYA' | 'FROM_AIYA';

export interface CashTransfer {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  amount: number;
  type?: CashTransferType; // 'TO_AIYA' (Given to Aiya / Outflow) or 'FROM_AIYA' (Received from Aiya / Inflow)
  reason: string; // "අයියාට දුන්නා", "අයියා දුන්නා", etc.
  recipient?: string;
  createdTimestamp: number;
}

export interface DailyCashRecord {
  date: string; // YYYY-MM-DD
  openingCash: number;
  isManualOpening: boolean;
  manualAdjustmentReason?: string;
}

export type ActiveTab = 'home' | 'lorries' | 'shop' | 'credit' | 'expenses' | 'workers' | 'cash' | 'reports' | 'settings' | 'other';

export type NavigationTab = ActiveTab;
