import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { api, type User, type Card, type Release, type LoaderInfo } from './api';
import { RoseLogo } from './components/common/RoseLogo';
import { CloudflareLogo } from './components/common/CloudflareLogo';
import { Toast } from './components/common/Toast';
import { PALETTES, type PaletteOption } from './components/common/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { Palette, Monitor, Moon, Sun, ArrowLeft, LogOut } from 'lucide-react';
import './style.css';

// Link back to user's server Portal Index
export const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || '/';

export function CloudflareApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
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

  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);

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
      .catch(() => {
        // Not logged in: open auth modal by default
        setAuthOpen(true);
      })
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
    if (user?.role === 'ADMIN') {
      refreshAdmin();
    }
  }, [user?.id, dashTab]);

  const logout = () =>
    run(async () => {
      await api('/api/web/auth/logout', 'POST');
      setUser(null);
      setAuthOpen(true);
      notify('Signed out successfully');
    });

  const returnToPortal = () => {
    window.location.href = PORTAL_URL;
  };

  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="glass-panel" style={{ padding: '36px 44px', textAlign: 'center' }}>
          <div className="brand-badge brand-badge-rose" style={{ width: 54, height: 54, margin: '0 auto 16px' }}>
            <RoseLogo size={32} color="var(--accent-text)" glow animate />
          </div>
          <h3 style={{ marginBottom: 6 }}>Connecting to Roselle Cloud</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Initializing secure session…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Cloudflare App Navbar */}
      <div className="navbar-wrapper">
        <nav className="navbar">
          <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <span className="brand-badge brand-badge-rose">
              <RoseLogo size={20} color="var(--accent-text)" />
            </span>
            <span>Roselle Console<span className="dot">.</span></span>
          </div>

          <div className="nav-actions">
            {/* Theme & Palette Switcher */}
            <div className="popover-container">
              <button
                type="button"
                className="btn-icon"
                title="Theme & Accent Palette"
                onClick={() => setPaletteMenuOpen(!paletteMenuOpen)}
              >
                <Palette size={17} />
              </button>
              {paletteMenuOpen && (
                <div className="palette-menu">
                  <span className="palette-title">Accent Color</span>
                  <div className="palette-swatches">
                    {PALETTES.map(p => (
                      <button
                        key={p.name}
                        type="button"
                        className={`swatch-btn ${palette.name === p.name ? 'active' : ''}`}
                        style={{ backgroundColor: p.hex }}
                        title={p.name}
                        onClick={() => {
                          setPalette(p);
                          setPaletteMenuOpen(false);
                        }}
                      />
                    ))}
                  </div>

                  <span className="palette-title">Theme Mode</span>
                  <div className="theme-mode-row">
                    <button
                      type="button"
                      className={`theme-mode-btn ${themeMode === 'system' ? 'active' : ''}`}
                      onClick={() => setThemeMode('system')}
                    >
                      <Monitor size={13} /> Auto
                    </button>
                    <button
                      type="button"
                      className={`theme-mode-btn ${themeMode === 'dark' ? 'active' : ''}`}
                      onClick={() => setThemeMode('dark')}
                    >
                      <Moon size={13} /> Dark
                    </button>
                    <button
                      type="button"
                      className={`theme-mode-btn ${themeMode === 'light' ? 'active' : ''}`}
                      onClick={() => setThemeMode('light')}
                    >
                      <Sun size={13} /> Light
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Link back to Main Server Portal */}
            <button className="btn-secondary" onClick={returnToPortal} title="Return to Portal Homepage">
              <ArrowLeft size={14} /> 返回官网
            </button>

            {user ? (
              <div className="user-nav-badge" onClick={logout} title="Click to Sign Out" style={{ cursor: 'pointer' }}>
                {user.avatar ? (
                  <img src={user.avatar} className="avatar-sm" alt="User" />
                ) : (
                  <div className="avatar-sm">{user.username.slice(0, 1).toUpperCase()}</div>
                )}
                <span style={{ fontSize: 13, fontWeight: 600 }}>{user.username}</span>
                <LogOut size={13} style={{ marginLeft: 4, opacity: 0.6 }} />
              </div>
            ) : (
              <button className="btn-primary" onClick={() => setAuthOpen(true)}>
                登录账号
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* Main Containers */}
      {!user && authOpen ? (
        <AuthModal
          pending={pending}
          onBack={returnToPortal}
          onSubmit={(kind, data) =>
            run(async () => {
              const u = await api<User>(`/api/web/auth/${kind}`, 'POST', data);
              setUser(u);
              setAuthOpen(false);
              notify(kind === 'register' ? 'Account registered successfully!' : 'Welcome back!');
            })
          }
        />
      ) : user ? (
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
      ) : (
        <div className="auth-wrapper">
          <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Please log in to access the Roselle console.</p>
            <button className="btn-primary" onClick={() => setAuthOpen(true)}>
              登录账号
            </button>
          </div>
        </div>
      )}

      <footer className="app-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 16px' }}>
        <div>Roselle Cloud Console · Minecraft 26.2 + Forge 1.8.9</div>
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
    <CloudflareApp />
  </React.StrictMode>
);
