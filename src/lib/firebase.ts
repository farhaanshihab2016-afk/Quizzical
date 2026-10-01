import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { LeaderboardEntry, PlayerProfile } from '../types';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics safely
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {});
}

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with specific databaseId if specified
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice: Please check your Firebase configuration or connectivity.');
    }
  }
}
testConnection();

// Authenticate anonymously
export async function initAuth() {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (err) {
    console.warn('Firebase anonymous auth warning:', err);
  }
}

// Fetch global leaderboard from Firestore
export async function fetchFirestoreLeaderboard(): Promise<LeaderboardEntry[]> {
  const path = 'leaderboard';
  try {
    const lbRef = collection(db, path);
    const q = query(lbRef, orderBy('score', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];
    querySnapshot.forEach((docSnap) => {
      entries.push({ id: docSnap.id, ...docSnap.data() } as LeaderboardEntry);
    });
    return entries;
  } catch (e) {
    console.warn('Error fetching Firestore leaderboard, fallback to local:', e);
    return [];
  }
}

// Subscribe to real-time leaderboard updates
export function subscribeLeaderboard(callback: (entries: LeaderboardEntry[]) => void) {
  const path = 'leaderboard';
  try {
    const lbRef = collection(db, path);
    const q = query(lbRef, orderBy('score', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        snapshot.forEach((docSnap) => {
          entries.push({ id: docSnap.id, ...docSnap.data() } as LeaderboardEntry);
        });
        callback(entries);
      },
      (error) => {
        console.warn('Firestore onSnapshot notice:', error);
      }
    );
  } catch (e) {
    console.warn('Error subscribing to Firestore leaderboard:', e);
    return () => {};
  }
}

// Save or Update Leaderboard Entry in Firestore
export async function saveFirestoreLeaderboardEntry(entry: LeaderboardEntry) {
  const docId = entry.heroName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  try {
    const docRef = doc(db, 'leaderboard', docId);
    await setDoc(
      docRef,
      {
        heroName: entry.heroName,
        score: entry.score,
        hostName: entry.hostName,
        category: entry.category,
        correct: entry.correct,
        rounds: entry.rounds,
        date: entry.date,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Error saving entry to Firestore leaderboard:', e);
  }
}

// Sync player profile to Firestore
export async function syncFirestoreProfile(profile: PlayerProfile) {
  if (!profile.heroName) return;
  const docId = profile.heroName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  try {
    const docRef = doc(db, 'profiles', docId);
    await setDoc(
      docRef,
      {
        heroName: profile.heroName,
        highScore: profile.highScore,
        totalGames: profile.totalGames,
        bestStreak: profile.bestStreak,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Error syncing profile to Firestore:', e);
  }
}
