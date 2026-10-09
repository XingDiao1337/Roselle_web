import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { api, type User, type Card, type Release, type LoaderInfo } from './api';
import { RoseLogo } from './components/common/RoseLogo';
import { CloudflareLogo } from './components/common/CloudflareLogo';
import { Toast } from './components/common/Toast';
import { Navbar, PALETTES, type PaletteOption } from './components/common/Navbar';
import { HomePage } from './components/home/HomePage';
import { AuthModal } from './components/auth/AuthModal';
import { DashboardView } from './components/dashboard/DashboardView';
import './style.css';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'login' | 'dashboard'>('home');
  const [dashTab, setDashTab] = useState('profile');
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const [pending, setPending] = useState(false);
  const [loaderInfo, setLoaderInfo] = useState<LoaderInfo | null>(null);

  // Theme & Palette State
  const [palette, setPalette] = useState<PaletteOption>(() => {
    const saved = localStorage.getItem('roselle_palette');
    return PALETTES.find(p => p.name === saved) || PALETTES[0];
  });
  const [themeMode, setThemeMode] = useState<'system' | 'dark' | 'light'>(() => {
    return (localStorage.getItem('roselle_theme') as 'system' | 'dark' | 'light') || 'system';
  });

  // Administrative Data State
  const [users, setUsers] = useState<User[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [generated, setGenerated] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const notify = (text: string, error = false) => setToast({ text, error });

  // Apply theme & palette tokens to root DOM
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', palette.hex);
    root.style.setProperty('--accent-glow', palette.glow);
    root.style.setProperty('--accent-text', palette.text);
    localStorage.setItem('roselle_palette', palette.name);

    const updateTheme = () => {
      let resolved = themeMode;
      if (resolved === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      root.setAttribute('data-theme', resolved);
    };

    updateTheme();
    localStorage.setItem('roselle_theme', themeMode);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (themeMode === 'system') updateTheme();
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [palette, themeMode]);

  // Initial user check & loader info
  useEffect(() => {
    api<User>('/api/web/me')
      .then(u => {
        setUser(u);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    api<LoaderInfo>('/api/web/loader/latest')
      .then(info => setLoaderInfo(info))
      .catch(() => {});
  }, []);

  // Auto toast dismiss after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function run(work: () => Promise<void>) {
    if (pending) return;
    setPending(true);
    try {
      await work();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Operation failed', true);
    } finally {
      setPending(false);
    }
  }

  async function refreshAdmin() {
    if (user?.role !== 'ADMIN') return;
    try {
      const [u, c, r, l] = await Promise.all([
        api<User[]>('/api/web/admin/users'),
        api<Card[]>('/api/web/admin/cards'),
        api<Release[]>('/api/web/admin/releases'),
        api<LoaderInfo>('/api/web/loader/latest').catch(() => null)
      ]);
      setUsers(u);
      setCards(c);
      setReleases(r);
      if (l) setLoaderInfo(l);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to load administrative data', true);
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN' && view === 'dashboard') {
      refreshAdmin();
    }
  }, [user?.id, view, dashTab]);

  const logout = () =>
    run(async () => {
      await api('/api/web/auth/logout', 'POST');
      setUser(null);
      setView('home');
      notify('Signed out successfully');
    });

  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="glass-panel" style={{ padding: '36px 44px', textAlign: 'center' }}>
          <div className="brand-badge brand-badge-rose" style={{ width: 54, height: 54, margin: '0 auto 16px' }}>
            <RoseLogo size={32} color="var(--accent-text)" glow animate />
          </div>
          <h3 style={{ marginBottom: 6 }}>Connecting to Roselle</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Initializing cloud session…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Global Navigation Bar */}
      <Navbar
        user={user}
        currentView={view}
        onNavigate={targetView => setView(targetView)}
        palette={palette}
        onSelectPalette={setPalette}
        themeMode={themeMode}
        onSelectThemeMode={setThemeMode}
      />

      {/* Main View Router */}
      {view === 'home' && (
        <HomePage
          user={user}
          loaderInfo={loaderInfo}
          onOpenConsole={() => setView(user ? 'dashboard' : 'login')}
          onOpenLogin={() => setView('login')}
        />
      )}

      {view === 'login' && (
        <AuthModal
          pending={pending}
          onBack={() => setView('home')}
          onSubmit={(kind, data) =>
            run(async () => {
              const u = await api<User>(`/api/web/auth/${kind}`, 'POST', data);
              setUser(u);
              setView('dashboard');
              notify(kind === 'register' ? 'Account registered successfully!' : 'Welcome back!');
            })
          }
        />
      )}

      {view === 'dashboard' && user && (
        <DashboardView
          user={user}
          dashTab={dashTab}
          setDashTab={setDashTab}
          pending={pending}
          run={run}
          setUser={setUser}
          notify={notify}
          logout={logout}
          users={users}
          cards={cards}
          releases={releases}
          loaderInfo={loaderInfo}
          generated={generated}
          setGenerated={setGenerated}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          refreshAdmin={refreshAdmin}
        />
      )}

      <footer className="app-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 16px' }}>
        <div>Roselle Cloud & Client Platform · Minecraft 26.2 + Forge 1.8.9</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
          <span>Powered by</span>
          <CloudflareLogo size={18} />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>Cloudflare</span>
        </div>
      </footer>
    </>
  );
}

const rootEl = document.getElementById('root')!;
const root = (window as unknown as { _reactRoot?: ReturnType<typeof createRoot> })._reactRoot || createRoot(rootEl);
(window as unknown as { _reactRoot?: ReturnType<typeof createRoot> })._reactRoot = root;

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
