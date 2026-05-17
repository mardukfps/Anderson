import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, onSnapshot as onFirestoreSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  updateUserName: (newName: string) => Promise<void>;
  updateUserPhoto: (photoURL: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set persistence explicitly for better stability in iframe environments
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.warn('Firebase persistence failed:', err);
    });

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
      }
    });

    return unsubAuth;
  }, []);

  // Profile listener
  useEffect(() => {
    if (!user) return;

    const unsubProfile = onFirestoreSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data());
      }
      setLoading(false);
    }, (error) => {
      console.error('Profile listener error:', error);
      setLoading(false);
    });

    return unsubProfile;
  }, [user]);

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (pass.length < 8) {
      throw new Error('A senha deve ter no mínimo 8 caracteres.');
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(result.user, { displayName: name });
      await sendEmailVerification(result.user);
    } catch (error) {
      throw error;
    }
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (error) {
        console.error('Error resending verification email:', error);
        throw error;
      }
    }
  };

  const updateUserName = async (newName: string) => {
    if (auth.currentUser) {
      try {
        // Update Firebase Auth
        await updateProfile(auth.currentUser, { displayName: newName });
        
        // Update Firestore via API
        const { apiService } = await import('../services/api');
        await apiService.updateUserName(auth.currentUser.uid, newName);
        
        // Force state update in React by cloning the user object
        setUser({ ...auth.currentUser });
      } catch (error) {
        console.error('Error updating user name:', error);
        throw error;
      }
    }
  };

  const updateUserPhoto = async (photoURL: string) => {
    if (auth.currentUser) {
      try {
        // Update Firebase Auth ONLY if photoURL is short (Firebase Auth has ~2048 chars limit)
        // Data URLs can be very large, so we check the length.
        if (photoURL.length < 2000) {
          await updateProfile(auth.currentUser, { photoURL });
        }
        
        // Update Firestore via API (Firestore has 1MB limit)
        const { apiService } = await import('../services/api');
        await apiService.updateUserPhoto(auth.currentUser.uid, photoURL);
        
        // We don't need to manually update state here because the onFirestoreSnapshot listener 
        // will handle it automatically and predictably.
      } catch (error) {
        console.error('Error updating user photo:', error);
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      const userId = auth.currentUser?.uid;
      await signOut(auth);
      if (userId) {
        import('../services/api').then(({ apiService }) => {
          apiService.clearCache(userId);
        });
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile,
      loading, 
      signInWithEmail, 
      signUpWithEmail, 
      resendVerification, 
      updateUserName,
      updateUserPhoto,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
