import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  DocumentData,
  QuerySnapshot,
  QueryDocumentSnapshot,
  FirestoreError,
} from 'firebase/firestore';
import { db, initAuth, testFirestoreConnection } from '../firebase';

export const FS_COLLECTIONS = {
  LORRIES: 'lorries',
  LORRY_TRIPS: 'lorry_trips',
  PRODUCTS: 'products',
  SHOP_SALES: 'shop_sales',
  CUSTOMERS: 'customers',
  CREDIT_TRANSACTIONS: 'credit_transactions',
  EXPENSES: 'expenses',
  WORKERS: 'workers',
  WORKER_PAYMENTS: 'worker_payments',
  CASH_TRANSFERS: 'cash_transfers',
  DAILY_CASH: 'daily_cash_records',
  SETTINGS: 'business_settings',
} as const;

export type SyncStatus = 'connecting' | 'connected' | 'offline' | 'error';

// Helper to remove any undefined values before writing to Firestore
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

/**
 * Save single document to Firestore (creates or updates with merge)
 */
export async function fsSaveDoc<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, String(docId));
    const cleanData = sanitizeForFirestore(data);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.error(`Error saving to ${collectionName}/${docId}:`, error);
  }
}

/**
 * Delete a single document from Firestore
 */
export async function fsDeleteDoc(collectionName: string, docId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, String(docId));
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting from ${collectionName}/${docId}:`, error);
  }
}

/**
 * Batch save an array of entities
 */
export async function fsBatchSave<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    // Firestore batches are limited to 500 operations
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += 400) {
      chunks.push(items.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, collectionName, String(item.id));
        batch.set(docRef, sanitizeForFirestore(item), { merge: true });
      }
      await batch.commit();
    }
  } catch (error) {
    console.error(`Error batch saving to ${collectionName}:`, error);
  }
}

/**
 * Subscribe to a collection in real time
 */
export function fsSubscribeCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, collectionName);
  const unsubscribe = onSnapshot(
    colRef,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items = snapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
        id: d.id,
        ...d.data(),
      })) as unknown as T[];
      onData(items);
    },
    (error: FirestoreError) => {
      console.warn(`Snapshot listener error on ${collectionName}:`, error);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

/**
 * Check if a collection has any documents
 */
export async function fsIsCollectionEmpty(collectionName: string): Promise<boolean> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    return snap.empty;
  } catch {
    return true;
  }
}

/**
 * Delete all documents in a Firestore collection
 */
export async function fsDeleteAllDocsInCollection(collectionName: string): Promise<void> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (snap.empty) return;
    const batch = writeBatch(db);
    for (const d of snap.docs) {
      batch.delete(d.ref);
    }
    await batch.commit();
  } catch (err) {
    console.error(`Error deleting all docs in ${collectionName}:`, err);
  }
}

export { initAuth, testFirestoreConnection };
