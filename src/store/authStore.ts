import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '../config/firebase';
import type { User as AppUser, AuthState } from '../types';

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initialize: () => () => void;
}

const mapFirebaseUser = (firebaseUser: FirebaseUser): AppUser => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
  createdAt: new Date(),
});

const saveUserToFirestore = async (user: AppUser) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      ...user,
      createdAt: new Date(),
    });
  }
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = mapFirebaseUser(result.user);
      set({ user, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Login failed', loading: false });
      throw error;
    }
  },

  signup: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user: AppUser = {
        ...mapFirebaseUser(result.user),
        displayName,
      };
      await saveUserToFirestore(user);
      set({ user, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Signup failed', loading: false });
      throw error;
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = mapFirebaseUser(result.user);
      await saveUserToFirestore(user);
      set({ user, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Google login failed', loading: false });
      throw error;
    }
  },

  loginWithGithub: async () => {
    set({ loading: true, error: null });
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const user = mapFirebaseUser(result.user);
      await saveUserToFirestore(user);
      set({ user, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'GitHub login failed', loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await signOut(auth);
      set({ user: null, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Logout failed', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const user = mapFirebaseUser(firebaseUser);
        set({ user, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    });
    return unsubscribe;
  },
}));
