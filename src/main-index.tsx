import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RoseLogo } from './components/common/RoseLogo';
import { Toast } from './components/common/Toast';
import { PALETTES, ROSE_QUOTES, type PaletteOption } from './components/common/Navbar';
import { HomePage } from './components/home/HomePage';
import { CloudflareLogo } from './components/common/CloudflareLogo';
import { Palette, Monitor, Moon, Sun, ArrowRight, ExternalLink } from 'lucide-react';
import './style.css';

// Target URL for the Cloudflare Pages App / Dashboard
export const APP_URL = (import.meta.env.VITE_APP_URL || 'https://roselle-web.pages.dev').replace(/\/+$/, '');

export function PortalApp() {
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);

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

  const goToApp = () => {
    window.location.href = APP_URL || '/app';
  };

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

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

            {/* Jump to Cloudflare Pages App / Console */}
            <button className="btn-primary" onClick={goToApp} title="Open Roselle Web Console">
              进入控制台 <ArrowRight size={15} />
            </button>
          </div>
        </nav>
      </div>

      {/* Portal Homepage Content */}
      <HomePage
        user={null}
        loaderInfo={null}
        onOpenConsole={goToApp}
        onOpenLogin={goToApp}
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
