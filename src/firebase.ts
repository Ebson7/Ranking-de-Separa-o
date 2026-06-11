import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// @ts-ignore
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// Garante que o cliente faça login de forma anônima e silenciosa para interagir com o Firestore de forma autenticada e segura.
export async function garantirAutenticacaoAnonima() {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log('Autenticação anônima efetuada junto ao Firebase.');
    }
  } catch (error) {
    console.error('Falha ao autenticar de forma anônima:', error);
  }
}
