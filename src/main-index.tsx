import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { api, type User } from './api';
import { RoseLogo } from './components/common/RoseLogo';
import { Toast } from './components/common/Toast';
import { PALETTES, ROSE_QUOTES, type PaletteOption } from './components/common/Navbar';
import { HomePage } from './components/home/HomePage';
import { CloudflareLogo } from './components/common/CloudflareLogo';
import { Palette, Monitor, Moon, Sun, ArrowRight, ExternalLink, WifiOff, RefreshCw, X, LogOut } from 'lucide-react';
import './style.css';

// Target URL for the Cloudflare Pages App / Dashboard
export const APP_URL = (import.meta.env.VITE_APP_URL || 'https://roselle-web.pages.dev').replace(/\/+$/, '');

interface RemoteContainerModalProps {
  container: 'auth' | 'console';
  appUrl: string;
  themeMode: string;
  palette: PaletteOption;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

function RemoteContainerModal({
  container,
  appUrl,
  themeMode,
  palette,
  onClose,
  onLoginSuccess
}: RemoteContainerModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ reason: string; details?: string } | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const iframeSrc = `${appUrl}/?embed=true&container=${container}&theme=${themeMode}&palette=${palette.name}&v=${retryKey}`;

  // Network and timeout watchdog
  useEffect(() => {
    setLoading(true);
    setError(null);

    if (!navigator.onLine) {
      setError({
        reason: '网络连接已断开 (Client Offline)',
        details: '当前设备无互联网连接，无法从 Cloudflare Pages 传输界面容器。'
      });
      setLoading(false);
      return;
    }

    // 10-second watchdog timeout for Cloudflare edge loading
    const timer = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          setError({
            reason: 'Cloudflare 界面容器获取超时 (Connection Timeout)',
            details: `超过 10 秒未从 ${appUrl} 收到界面就绪响应。可能是网络代理异常或 Cloudflare 边缘节点延迟过高。`
          });
          return false;
        }
        return false;
      });
    }, 10000);

    return () => clearTimeout(timer);
  }, [retryKey, container, appUrl]);

  // Listen to postMessage events from the embedded Cloudflare container
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'roselle:container_ready') {
        setLoading(false);
        setError(null);
      } else if (e.data.type === 'roselle:close') {
        onClose();
      } else if (e.data.type === 'roselle:login_success' && e.data.user) {
        setLoading(false);
        onLoginSuccess(e.data.user);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('message', handleMsg);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('message', handleMsg);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onLoginSuccess]);

  return (
    <div className="remote-container-backdrop" onClick={onClose}>
      <div
        className={`remote-container-window ${container === 'console' ? 'wide' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          className="remote-container-close-btn"
          onClick={onClose}
          title="关闭容器 (Esc)"
        >
          <X size={16} />
        </button>

        {loading && (
          <div className="remote-container-loading">
            <div className="brand-badge brand-badge-rose" style={{ width: 54, height: 54, margin: '0 auto 12px' }}>
              <RoseLogo size={32} color="var(--accent-text)" glow animate />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>正在传输界面容器</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, maxWidth: 320 }}>
              从 Cloudflare Pages 边缘节点传输 {container === 'auth' ? '认证登录界面' : '云端控制台界面'}…
            </p>
          </div>
        )}

        {error && (
          <div className="remote-container-error">
            <div className="error-badge">
              <WifiOff size={26} color="#ef4444" />
            </div>
            <h3>界面获取失败</h3>
            <p className="error-reason">{error.reason}</p>
            {error.details && <p className="error-details">{error.details}</p>}
            <div className="error-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setRetryKey(k => k + 1)}
              >
                <RefreshCw size={14} /> 重新获取界面
              </button>
              <a
                className="btn-secondary"
                href={`${appUrl}/?container=${container}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={14} /> 在新标签页打开
              </a>
            </div>
          </div>
        )}

        <iframe
          src={iframeSrc}
          className="remote-container-iframe"
          title="Cloudflare Remote Container"
          allow="clipboard-write"
          onLoad={() => {
            // Backup ready trigger in case postMessage arrives earlier or is delayed
            setTimeout(() => setLoading(false), 500);
          }}
          onError={() => {
            setError({
              reason: '无法加载远程页面资源 (Frame Error)',
              details: `浏览器被安全策略阻止或无法建立与 ${appUrl} 的连接。`
            });
            setLoading(false);
          }}
        />
      </div>
    </div>
  );
}

export function PortalApp() {
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const [activeContainer, setActiveContainer] = useState<'auth' | 'console' | null>(null);

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

  // Initial user check
  useEffect(() => {
    api<User>('/api/web/me')
      .then(u => setUser(u))
      .catch(() => {});
  }, []);

  // Auto toast dismiss
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const openContainer = (type: 'auth' | 'console') => {
    setActiveContainer(type);
  };

  const closeContainer = () => {
    setActiveContainer(null);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    notify(`Welcome back, ${loggedInUser.username}!`);
    // After login, keep in console container
    setActiveContainer('console');
  };

  const logout = async () => {
    try {
      await api('/api/web/auth/logout', 'POST');
      setUser(null);
      notify('Signed out successfully');
    } catch {}
  };

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Remote Container Modal (Transmitted from Cloudflare Pages) */}
      {activeContainer && (
        <RemoteContainerModal
          container={activeContainer}
          appUrl={APP_URL}
          themeMode={themeMode}
          palette={palette}
          onClose={closeContainer}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Portal Navbar */}
      <div className="navbar-wrapper">
        <nav className="navbar">
          <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <span className="brand-badge brand-badge-rose">
              <RoseLogo size={20} color="var(--accent-text)" />
            </span>
            <span>Roselle<span className="dot">.</span></span>
          </div>

          {/* Rose Language Quote Stream */}
          <div
            key={roseQuoteIdx}
            className="nav-rose-centerpiece"
            onClick={() => setRoseQuoteIdx(prev => (prev + 1) % ROSE_QUOTES.length)}
            title="Click to reveal the next language of roses"
            style={{ cursor: 'pointer' }}
          >
            <span className="rose-quote-stream">
              {ROSE_QUOTES[roseQuoteIdx].split('').map((char, index) => (
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
              <button className="btn-secondary" onClick={() => openContainer('auth')} title="Sign in via Cloudflare container">
                Sign In
              </button>
            )}

            {/* Launch Console Remote Container */}
            <button className="btn-primary" onClick={() => openContainer(user ? 'console' : 'auth')} title="Open Roselle Console Container">
              Launch Console <ArrowRight size={15} />
            </button>
          </div>
        </nav>
      </div>

      {/* Portal Homepage Content */}
      <HomePage
        user={user}
        loaderInfo={null}
        onOpenConsole={() => openContainer(user ? 'console' : 'auth')}
        onOpenLogin={() => openContainer('auth')}
      />

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
    <PortalApp />
  </React.StrictMode>
);

