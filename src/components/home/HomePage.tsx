import React from 'react';
import {
  Cpu,
  Layers,
  ShieldCheck,
  Sparkles,
  Terminal,
  Lock,
  Package,
  KeyRound,
  HardDrive,
  Shield,
  Zap,
  Cloud,
  ArrowRight
} from 'lucide-react';
import { RoseLogo } from '../common/RoseLogo';
import type { User, LoaderInfo } from '../../api';
import type { UiContent } from '../../content';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  Cpu,
  Layers,
  ShieldCheck,
  Sparkles,
  Terminal,
  Lock,
  Package,
  KeyRound,
  HardDrive,
  Shield,
  Zap,
  Cloud
};

export interface HomePageProps {
  user: User | null;
  loaderInfo: LoaderInfo | null;
  onOpenConsole: () => void;
  onOpenLogin: () => void;
  content?: UiContent['home'];
  loadingPhase?: 'loading' | 'ready' | 'error';
}

export function HomePage({
  user,
  loaderInfo,
  onOpenConsole,
  onOpenLogin,
  content,
  loadingPhase = 'ready'
}: HomePageProps) {
  const c = content || {
    heroTitlePrefix: "Roselle Client",
    heroTitleGradient: "Pure Performance & Refined Aesthetics",
    heroDescription: "One account and injector for two distinct clients: Minecraft 26.2 and Forge 1.8.9. Choose the matching game version before injection; each version receives its own signed DLL release.",
    metrics: [
      { value: "26.2", label: "Modern client" },
      { value: "1.8.9", label: "Forge client" },
      { value: "AES-256 GCM", label: "Hardware Bound Encrypted" },
      { value: "< 10ms", label: "Realtime Token Latency" }
    ],
    features: [
      {
        icon: "Cpu",
        title: "Version-Matched Runtime",
        desc: "Separate DLL releases for the modern client and Forge 1.8.9. The injector requests only the release selected for the target game, while existing 26.2 releases remain on their original channel."
      },
      {
        icon: "Layers",
        title: "Client-Specific Rendering",
        desc: "Each client retains its own rendering stack and ClickGUI, designed for its Minecraft version. Shared account delivery does not force the two game runtimes into one implementation."
      },
      {
        icon: "ShieldCheck",
        title: "Cloud Cryptography & Safety",
        desc: "Encrypted DPAPI hardware fingerprinting, dynamic timestamp request windows, and one-time download tickets ensuring secure and exclusive client distribution."
      },
      {
        icon: "Sparkles",
        title: "Frosted Glass ClickGUI",
        desc: "Apple-inspired fluid ergonomics with cubic-bezier transition curves, real-time palette customizer, and an interactive module drawer designed for rapid in-game tuning."
      }
    ],
    launchBtn: "Launch Console",
    signInBtn: "Sign In"
  };

  const isLoading = loadingPhase === 'loading';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <section className="hero-section">
        <div
          className="rose-hero-emblem"
          onClick={user ? onOpenConsole : onOpenLogin}
          title="Roselle Sovereign Client"
          style={{ cursor: 'pointer' }}
        >
          <div className="rose-emblem-halo" />
          <div className="rose-emblem-badge">
            <RoseLogo size={46} color="var(--accent)" glow animate />
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, margin: '20px 0' }}>
            <div className="skeleton-bar" style={{ width: 340, height: 40, maxWidth: '85%' }} />
            <div className="skeleton-bar" style={{ width: 520, height: 18, maxWidth: '90%' }} />
            <div className="skeleton-bar" style={{ width: 380, height: 18, maxWidth: '75%' }} />
          </div>
        ) : (
          <>
            <h1 className="hero-title">
              {c.heroTitlePrefix} <br />
              <span className="gradient-text">{c.heroTitleGradient}</span>
            </h1>

            <p className="hero-desc">
              {c.heroDescription}
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={user ? onOpenConsole : onOpenLogin}
                style={{ padding: '11px 24px', fontSize: 14 }}
              >
                {user ? 'Open Console' : c.launchBtn} <ArrowRight size={15} />
              </button>
              {!user && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onOpenLogin}
                  style={{ padding: '11px 22px', fontSize: 14 }}
                >
                  {c.signInBtn}
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* Metrics Row */}
      <section className="metrics-strip glass-panel">
        {isLoading ? (
          [1, 2, 3, 4].map(idx => (
            <div className="metric-item" key={idx}>
              <div className="skeleton-bar" style={{ width: 68, height: 26, margin: '0 auto 6px' }} />
              <div className="skeleton-bar" style={{ width: 84, height: 14, margin: '0 auto' }} />
            </div>
          ))
        ) : (
          c.metrics.map((m, idx) => (
            <div className="metric-item" key={idx}>
              <strong>{m.value}</strong>
              <span>{m.label}</span>
            </div>
          ))
        )}
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="features-grid">
        {isLoading ? (
          [1, 2, 3, 4].map(idx => (
            <div className="glass-panel feature-card" key={idx}>
              <div className="feature-icon-box">
                <div className="skeleton-bar" style={{ width: 24, height: 24, borderRadius: 6 }} />
              </div>
              <div className="skeleton-bar" style={{ width: 160, height: 20, marginBottom: 12 }} />
              <div className="skeleton-bar" style={{ width: '100%', height: 14, marginBottom: 6 }} />
              <div className="skeleton-bar" style={{ width: '85%', height: 14 }} />
            </div>
          ))
        ) : (
          c.features.map((f, idx) => {
            const IconComponent = ICON_MAP[f.icon] || Sparkles;
            return (
              <div className="glass-panel feature-card" key={idx}>
                <div className="feature-icon-box">
                  <IconComponent size={24} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
