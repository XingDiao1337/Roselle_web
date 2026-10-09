import React, { useState } from 'react';
import { Palette, Monitor, Moon, Sun, ArrowRight } from 'lucide-react';
import { RoseLogo } from './RoseLogo';
import type { User } from '../../api';

export interface PaletteOption {
  name: string;
  hex: string;
  glow: string;
  text: string;
}

export const PALETTES: PaletteOption[] = [
  { name: 'Rose', hex: '#e7b8c9', glow: 'rgba(231, 184, 201, 0.35)', text: '#20161c' },
  { name: 'Iris', hex: '#a78bfa', glow: 'rgba(167, 139, 250, 0.35)', text: '#1b142e' },
  { name: 'Sky', hex: '#38bdf8', glow: 'rgba(56, 189, 248, 0.35)', text: '#0a1d2e' },
  { name: 'Emerald', hex: '#34d399', glow: 'rgba(52, 211, 153, 0.35)', text: '#092419' },
  { name: 'Amber', hex: '#fbbf24', glow: 'rgba(251, 191, 36, 0.35)', text: '#261a03' }
];

export const ROSE_QUOTES = [
  "Pure Love & Passionate Devotion",
  "Beauty, Grace & Endless Affection",
  "Romance Etched in Petals & Thorns",
  "Radiant Passion & Eternal Loyalty"
];

export interface NavbarProps {
  user: User | null;
  currentView: 'home' | 'login' | 'dashboard';
  onNavigate: (view: 'home' | 'login' | 'dashboard') => void;
  palette: PaletteOption;
  onSelectPalette: (palette: PaletteOption) => void;
  themeMode: 'system' | 'dark' | 'light';
  onSelectThemeMode: (mode: 'system' | 'dark' | 'light') => void;
}

export function Navbar({
  user,
  currentView,
  onNavigate,
  palette,
  onSelectPalette,
  themeMode,
  onSelectThemeMode
}: NavbarProps) {
  const [roseQuoteIdx, setRoseQuoteIdx] = useState(0);
  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);

  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        <div className="nav-brand" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
          <span className="brand-badge brand-badge-rose">
            <RoseLogo size={20} color="var(--accent-text)" />
          </span>
          <span>Roselle<span className="dot">.</span></span>
        </div>

        {/* Flower Language Centerpiece */}
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
                style={{
                  animationDelay: `${index * 26}ms`
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>
        </div>

        <div className="nav-actions">
          {/* Palette & Theme Switcher */}
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
                        onSelectPalette(p);
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
                    onClick={() => onSelectThemeMode('system')}
                  >
                    <Monitor size={13} /> Auto
                  </button>
                  <button
                    type="button"
                    className={`theme-mode-btn ${themeMode === 'dark' ? 'active' : ''}`}
                    onClick={() => onSelectThemeMode('dark')}
                  >
                    <Moon size={13} /> Dark
                  </button>
                  <button
                    type="button"
                    className={`theme-mode-btn ${themeMode === 'light' ? 'active' : ''}`}
                    onClick={() => onSelectThemeMode('light')}
                  >
                    <Sun size={13} /> Light
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Auth Status / Action */}
          {user ? (
            <div
              className="user-nav-badge"
              onClick={() => onNavigate(currentView === 'dashboard' ? 'home' : 'dashboard')}
              title={currentView === 'dashboard' ? 'Return to Home' : 'Open Console'}
              style={{ cursor: 'pointer' }}
            >
              {user.avatar ? (
                <img src={user.avatar} className="avatar-sm" alt="User" />
              ) : (
                <div className="avatar-sm">{user.username.slice(0, 1).toUpperCase()}</div>
              )}
              <span style={{ fontSize: 13, fontWeight: 600 }}>{user.username}</span>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => onNavigate('login')}>
              Sign In <ArrowRight size={15} />
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
