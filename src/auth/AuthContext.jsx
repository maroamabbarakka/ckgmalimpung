import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { logActivity } from '../utils/logger';
import {
  getActiveUserProfile,
  signInWithUsernameAndPin,
  signOutAuth
} from '../services/authService';

const AuthContext = createContext(null);
let currentUser = null;

// eslint-disable-next-line react-refresh/only-export-components
export const getStoredUser = () => currentUser;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        currentUser = null;
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const signedUser = await getActiveUserProfile(firebaseUser);
        if (!signedUser) {
          await signOutAuth();
          currentUser = null;
          setUser(null);
          return;
        }

        currentUser = signedUser;
        setUser(signedUser);
      } catch (error) {
        console.error('Auth state restore error:', error);
        currentUser = null;
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async ({ username, pin }) => {
    setLoading(true);
    const normalizedUsername = username.toLowerCase().replace(/\s/g, '');
    try {
      const signedUser = await signInWithUsernameAndPin(normalizedUsername, pin);
      if (!signedUser) {
        return { success: false, message: 'Profil pengguna belum aktif atau belum terdaftar.' };
      }

      currentUser = signedUser;
      setUser(signedUser);
      await logActivity('Berhasil masuk ke dalam sistem aplikasi', 'Autentikasi Sistem');
      return { success: true, user: signedUser };
    } catch (error) {
      console.error('Auth signIn error:', error);
      return { success: false, message: 'Username/PIN salah atau akun Firebase Auth belum aktif.' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await logActivity('Keluar dari sistem aplikasi', 'Autentikasi Sistem');
    await signOutAuth();
    currentUser = null;
    setUser(null);
  };

  const hasRole = useMemo(
    () =>
      (role) => {
        if (!user?.roles) return false;
        return user.roles.includes('admin') || user.roles.includes(role);
      },
    [user]
  );

  const hasAnyRole = useMemo(
    () =>
      (roles = []) => {
        if (!user?.roles) return false;
        if (user.roles.includes('admin')) return true;
        return roles.some((role) => user.roles.includes(role));
      },
    [user]
  );

  const value = {
    user,
    isAuthenticated: Boolean(user?.isAuthenticated),
    loading,
    signIn,
    signOut,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
