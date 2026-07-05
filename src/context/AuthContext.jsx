import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth as firebaseAuth, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!Capacitor.isNativePlatform()) {
          const result = await getRedirectResult(firebaseAuth);
          if (result) {
            const user = result.user;
            const res = await api.post('/auth/firebase/login', {
              email: user.email,
              name: user.displayName,
              google_id: user.uid,
              avatar: user.photoURL
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Redirect Login Error", err);
      }

      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
        // Verify token is still valid
        api.get('/user')
          .then((res) => {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          })
          .catch(() => {
            logout();
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, passwordConfirmation) => {
    const res = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const loginWithToken = (token) => {
    localStorage.setItem('token', token);
    return api.get('/user').then((res) => {
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data;
    });
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const loginWithGoogle = async () => {
    try {
      // Use native Firebase Authentication for mobile, web SDK for web
      let userResult;
      
      if (Capacitor.isNativePlatform()) {
        // Native mobile - use Capacitor Firebase plugin
        userResult = await FirebaseAuthentication.signInWithGoogle();
        const user = userResult.user;
        const res = await api.post('/auth/firebase/login', {
          email: user.email,
          name: user.displayName,
          google_id: user.uid,
          avatar: user.photoURL
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data;
      } else {
        // Web - use Firebase web SDK with Popup
        const result = await signInWithPopup(firebaseAuth, googleProvider);
        const user = result.user;
        const res = await api.post('/auth/firebase/login', {
          email: user.email,
          name: user.displayName,
          google_id: user.uid,
          avatar: user.photoURL
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data;
      }
    } catch (error) {
      console.error("Firebase Login Error:", error);
      if (error.response?.data?.message) {
        throw new Error("Backend: " + error.response.data.message);
      } else if (error.code) {
        throw new Error("Firebase: " + error.message);
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, loginWithGoogle, loginWithToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
