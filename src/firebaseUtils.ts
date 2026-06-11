import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Separador, Lancamento } from './types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// OPERAÇÕES DO FIRESTORE (SEPARADORES)
// ==========================================

export async function salvarSeparadorFirestore(separador: Separador): Promise<void> {
  const path = `separadores/${separador.id}`;
  try {
    await setDoc(doc(db, 'separadores', separador.id), separador);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function excluirSeparadorFirestore(id: string): Promise<void> {
  const path = `separadores/${id}`;
  try {
    await deleteDoc(doc(db, 'separadores', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function escutarSeparadores(callback: (dados: Separador[]) => void, onError?: (err: any) => void) {
  const path = 'separadores';
  return onSnapshot(
    collection(db, 'separadores'),
    (snapshot) => {
      const lista: Separador[] = [];
      snapshot.forEach((d) => {
        lista.push(d.data() as Separador);
      });
      callback(lista);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

// ==========================================
// OPERAÇÕES DO FIRESTORE (LANÇAMENTOS)
// ==========================================

export async function salvarLancamentoFirestore(lancamento: Lancamento): Promise<void> {
  const path = `lancamentos/${lancamento.id}`;
  try {
    await setDoc(doc(db, 'lancamentos', lancamento.id), lancamento);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function excluirLancamentoFirestore(id: string): Promise<void> {
  const path = `lancamentos/${id}`;
  try {
    await deleteDoc(doc(db, 'lancamentos', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function escutarLancamentos(callback: (dados: Lancamento[]) => void, onError?: (err: any) => void) {
  const path = 'lancamentos';
  return onSnapshot(
    collection(db, 'lancamentos'),
    (snapshot) => {
      const lista: Lancamento[] = [];
      snapshot.forEach((d) => {
        lista.push(d.data() as Lancamento);
      });
      callback(lista);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}
