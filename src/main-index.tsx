import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { api, type User, type Card, type Release, type LoaderInfo } from './api';
import { fetchCloudContent, DEFAULT_CONTENT, type UiContent } from './content';
import { RoseLogo } from './components/common/RoseLogo';
import { Toast } from './components/common/Toast';
import { PALETTES, type PaletteOption } from './components/common/Navbar';
import { CloudflareLogo } from './components/common/CloudflareLogo';
import { AuthModal } from './components/auth/AuthModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { Palette, Monitor, Moon, Sun, WifiOff, RefreshCw, LogOut } from 'lucide-react';
import './style.css';

// Target URL for the Cloudflare Pages App / Dashboard / Content
export const APP_URL = (import.meta.env.VITE_APP_URL || 'https://roselle-web.pages.dev').replace(/\/+$/, '');

export function PortalApp() {
  const [content, setContent] = useState<UiContent>(DEFAULT_CONTENT);
  const [loadingPhase, setLoadingPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [progress, setProgress] = useState(15);
  const [errorInfo, setErrorInfo] = useState<{ reason: string; details?: string } | null>(null);

  // User and Dashboard State
  const [user, setUser] = useState<User | null>(null);
  const [dashTab, setDashTab] = useState('profile');
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const [pending, setPending] = useState(false);
  const [loaderInfo, setLoaderInfo] = useState<LoaderInfo | null>(null);

  // Administrative Data State
  const [users, setUsers] = useState<User[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [generated, setGenerated] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Theme & Palette State
  const [palette, setPalette] = useState<PaletteOption>(() => {
    const saved = localStorage.getItem('roselle_palette');
    return PALETTES.find(p => p.name === saved) || PALETTES[0];
  });
  const [themeMode, setThemeMode] = useState<'system' | 'dark' | 'light'>(() => {
    return (localStorage.getItem('roselle_theme') as 'system' | 'dark' | 'light') || 'system';
  });

  const [roseQuoteIdx, setRoseQuoteIdx] = useState(0);
  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);

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

  // Auto toast dismiss
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

  // Administrative data fetch
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
    if (user?.role === 'ADMIN' && loadingPhase === 'ready') {
      refreshAdmin();
    }
  }, [user?.id, dashTab, loadingPhase]);

  // Initialization: Fetch all containers, texts, and configs from Cloudflare
  const initAll = async () => {
    setLoadingPhase('loading');
    setProgress(18);
    setErrorInfo(null);

    if (!navigator.onLine) {
      setErrorInfo({
        reason: '本地网络断开 (Client Offline)',
        details: '检测到当前设备网络连接中断，无法连接至 Cloudflare 节点拉取界面容器。'
      });
      setLoadingPhase('error');
      return;
    }

    try {
      // Step 1: Pull UI Texts from Cloudflare
      setProgress(40);
      const cloudData = await fetchCloudContent(APP_URL).catch(err => {
        console.warn('Could not fetch remote content, using fallback:', err);
        return DEFAULT_CONTENT;
      });
      setContent(cloudData);

      // Step 2: Concurrently probe session & latest artifacts
      setProgress(70);
      const [currentUser, latestLoader] = await Promise.all([
        api<User>('/api/web/me').catch(() => null),
        api<LoaderInfo>('/api/web/loader/latest').catch(() => null)
      ]);

      if (currentUser) {
        setUser(currentUser);
        // Step 3: If admin, pre-fetch admin records
        if (currentUser.role === 'ADMIN') {
          setProgress(88);
          const [u, c, r] = await Promise.all([
            api<User[]>('/api/web/admin/users').catch(() => []),
            api<Card[]>('/api/web/admin/cards').catch(() => []),
            api<Release[]>('/api/web/admin/releases').catch(() => [])
          ]);
          setUsers(u);
          setCards(c);
          setReleases(r);
        }
      }

      if (latestLoader) {
        setLoaderInfo(latestLoader);
      }

      setProgress(100);
      setTimeout(() => {
        setLoadingPhase('ready');
      }, 300);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorInfo({
        reason: 'Cloudflare 界面容器获取超时或网络异常 (Fetch Failed)',
        details: `无法从 ${APP_URL} 传输组件与配置。详情: ${msg}`
      });
      setLoadingPhase('error');
    }
  };

  useEffect(() => {
    initAll();
  }, []);

  const logout = () =>
    run(async () => {
      await api('/api/web/auth/logout', 'POST');
      setUser(null);
      notify('Signed out successfully');
    });

  // Loading Screen with Autoblockin-style Progress Bar
  if (loadingPhase === 'loading') {
    return (
      <div className="auth-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '38px 44px', textAlign: 'center', width: '100%', maxWidth: 440 }}>
          <div className="brand-badge brand-badge-rose" style={{ width: 56, height: 56, margin: '0 auto 16px' }}>
            <RoseLogo size={34} color="var(--accent-text)" glow animate />
          </div>
          <h3 style={{ marginBottom: 6, fontSize: 18 }}>{content.loading.title}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
            {content.loading.subtitle}
          </p>

          {/* Autoblockin-style Animated Progress Bar */}
          <div className="autoblockin-progress-wrapper">
            <div className="autoblockin-progress-track">
              <div
                className="autoblockin-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="autoblockin-progress-labels">
              <span>Transferring Cloud Containers…</span>
              <span>{progress}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error Screen with Failure Reason & Retry
  if (loadingPhase === 'error') {
    return (
      <div className="auth-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel remote-container-error" style={{ position: 'relative', maxWidth: 460, borderRadius: 'var(--radius-lg)' }}>
          <div className="error-badge">
            <WifiOff size={28} color="#ef4444" />
          </div>
          <h3>{content.loading.errorTitle}</h3>
          <p className="error-reason">{errorInfo?.reason}</p>
          {errorInfo?.details && <p className="error-details">{errorInfo.details}</p>}
          <div className="error-actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn-primary" onClick={initAll}>
              <RefreshCw size={15} /> {content.loading.retryBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const quotesList = content.site.quotes && content.site.quotes.length > 0 ? content.site.quotes : DEFAULT_CONTENT.site.quotes;

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Global Navbar */}
      <div className="navbar-wrapper">
        <nav className="navbar">
          <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <span className="brand-badge brand-badge-rose">
              <RoseLogo size={20} color="var(--accent-text)" />
            </span>
            <span>{content.site.brand}<span className="dot">.</span></span>
          </div>

          {/* Rose Language Quotes Centerpiece Stream */}
          <div
            key={roseQuoteIdx}
            className="nav-rose-centerpiece"
            onClick={() => setRoseQuoteIdx(prev => (prev + 1) % quotesList.length)}
            title="Click to reveal the next language of roses"
            style={{ cursor: 'pointer' }}
          >
            <span className="rose-quote-stream">
              {(quotesList[roseQuoteIdx] || quotesList[0]).split('').map((char, index) => (
                <span
                  key={index}
                  className="rose-char"
                  style={{ animationDelay: `${index * 26}ms` }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </span>
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
              <span className="badge badge-active" style={{ fontSize: 12 }}>
                Cloud Secured
              </span>
            )}
          </div>
        </nav>
      </div>

      {/* Main Container Views */}
      {!user ? (
        /* Unauthenticated: Centered Frosted Glass Login Container matching 19a47354-ff6f-42bd-a54a-8378bd5d70ac.png */
        <AuthModal
          pending={pending}
          content={content.auth}
          onSubmit={(kind, data) =>
            run(async () => {
              const u = await api<User>(`/api/web/auth/${kind}`, 'POST', data);
              setUser(u);
              notify(kind === 'register' ? 'Account registered successfully!' : 'Welcome back!');
              if (u.role === 'ADMIN') {
                refreshAdmin();
              }
            })
          }
        />
      ) : (
        /* Authenticated: Integrated Dashboard Containers from user screenshots */
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

      {/* Global Footer */}
      <footer className="app-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 16px' }}>
        <div>{content.site.footer}</div>
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
    <PortalApp />
  </React.StrictMode>
);
