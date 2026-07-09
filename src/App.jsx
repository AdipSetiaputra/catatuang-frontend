import { useState, useRef, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquareText, History, LayoutDashboard, LogOut, Moon, Sun } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';


function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  useEffect(() => {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }, [theme]);

  const toggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <button 
      onClick={toggle}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '8px', 
        width: '100%', padding: '10px 12px', 
        background: 'transparent', border: 'none', 
        color: 'var(--text-primary)', fontSize: '0.9rem',
        cursor: 'pointer', borderRadius: '4px', textAlign: 'left'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} 
      {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
    </button>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
  in: { opacity: 1, y: 0, filter: 'blur(0px)' },
  out: { opacity: 0, y: -10, filter: 'blur(4px)' }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3
};

function PageWrapper({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D0C12' }}>
        <img src="/logo.png" alt="Loading..." style={{ width: '80px', height: '80px', animation: 'pulse 1.5s infinite ease-in-out' }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitial = () => {
    if (!user?.name) return '?';
    return user.name.charAt(0).toUpperCase();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="Montra Logo" style={{ height: '28px', width: '28px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', textTransform: 'lowercase' }}>montra</h1>
        </div>
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div
            className="header-avatar"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ cursor: 'pointer' }}
          >
            {getInitial()}
          </div>
          
          <AnimatePresence>
            {showDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  right: 0, 
                  marginTop: '8px',
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '4px',
                  minWidth: '150px',
                  zIndex: 100
                }}
              >
                <ThemeToggle />
                <button 
                  onClick={() => { setShowDropdown(false); logout(); }}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    width: '100%', padding: '10px 12px', 
                    background: 'transparent', border: 'none', 
                    color: 'var(--text-danger)', fontSize: '0.9rem',
                    cursor: 'pointer', borderRadius: '4px', textAlign: 'left'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-danger)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={16} /> Keluar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Page Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><ChatPage /></PageWrapper>} />
            <Route path="/history" element={<PageWrapper><HistoryPage /></PageWrapper>} />
            <Route path="/dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <nav className="nav-bar">
        <button
          className={`nav-item ${isActive('/') ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <MessageSquareText size={24} strokeWidth={isActive('/') ? 2.5 : 2} style={{ filter: isActive('/') ? 'drop-shadow(0px 2px 6px rgba(6, 182, 212, 0.5))' : 'none', transition: 'all 0.3s ease' }} />
          Chat
        </button>

        <button
          className={`nav-item ${isActive('/history') ? 'active' : ''}`}
          onClick={() => navigate('/history')}
        >
          <History size={24} strokeWidth={isActive('/history') ? 2.5 : 2} style={{ filter: isActive('/history') ? 'drop-shadow(0px 2px 6px rgba(6, 182, 212, 0.5))' : 'none', transition: 'all 0.3s ease' }} />
          Riwayat
        </button>

        <button
          className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <LayoutDashboard size={24} strokeWidth={isActive('/dashboard') ? 2.5 : 2} style={{ filter: isActive('/dashboard') ? 'drop-shadow(0px 2px 6px rgba(6, 182, 212, 0.5))' : 'none', transition: 'all 0.3s ease' }} />
          Dashboard
        </button>
      </nav>
    </div>
  );
}

function RootRoutes() {
  const location = useLocation();
  // We use the top-level path as key so entering/leaving auth pages animates smoothly
  const key = location.pathname.split('/')[1] || 'app';
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={key}>
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function BackButtonHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastBackPress = useRef(0);

  useEffect(() => {
    let toastEl = null;

    const backButtonListener = CapacitorApp.addListener('backButton', () => {
      const rootPages = ['/', '/dashboard', '/history', '/login'];
      const currentPath = location.pathname;

      if (rootPages.includes(currentPath)) {
        const now = Date.now();
        if (now - lastBackPress.current < 2000) {
          CapacitorApp.exitApp();
        } else {
          lastBackPress.current = now;
          // Show toast
          if (toastEl && document.body.contains(toastEl)) {
             document.body.removeChild(toastEl);
          }
          toastEl = document.createElement('div');
          toastEl.className = 'toast';
          toastEl.style.bottom = '90px'; // above bottom nav
          toastEl.style.top = 'auto'; // override default top toast
          toastEl.textContent = 'Tekan sekali lagi untuk keluar';
          document.body.appendChild(toastEl);

          setTimeout(() => {
            if (toastEl && document.body.contains(toastEl)) {
              document.body.removeChild(toastEl);
            }
          }, 2000);
        }
      } else {
        navigate(-1);
      }
    });

    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [location, navigate]);

  return null;
}

export default function App() {
  // Initialize theme on app load so login page also gets it
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

    // Remove splash screen added in index.html
    const splash = document.getElementById('splash-screen');
    if (splash) {
      setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 400);
      }, 500); // give app time to render
    }
  }, []);

  return (
    <BrowserRouter>
      <BackButtonHandler />
      <AuthProvider>
        <RootRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
