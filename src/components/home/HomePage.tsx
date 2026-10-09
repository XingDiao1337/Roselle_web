import React from 'react';
import { Cpu, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import { RoseLogo } from '../common/RoseLogo';
import type { User, LoaderInfo } from '../../api';

export interface HomePageProps {
  user: User | null;
  loaderInfo: LoaderInfo | null;
  onOpenConsole: () => void;
  onOpenLogin: () => void;
}

export function HomePage({
  user,
  loaderInfo,
  onOpenConsole,
  onOpenLogin
}: HomePageProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <section className="hero-section">
        <div
          className="rose-hero-emblem"
          onClick={onOpenConsole}
          title="Roselle Sovereign Client"
          style={{ cursor: 'pointer' }}
        >
          <div className="rose-emblem-halo" />
          <div className="rose-emblem-badge">
            <RoseLogo size={46} color="var(--accent)" glow animate />
          </div>
        </div>

        <h1 className="hero-title">
          Roselle Client <br />
          <span className="gradient-text">Pure Performance & Refined Aesthetics</span>
        </h1>

        <p className="hero-desc">
          One account and injector for two distinct clients: Minecraft 26.2 and Forge 1.8.9.
          Choose the matching game version before injection; each version receives its own signed DLL release.
        </p>
      </section>

      {/* Metrics Row */}
      <section className="metrics-strip glass-panel">
        <div className="metric-item">
          <strong>26.2</strong>
          <span>Modern client</span>
        </div>
        <div className="metric-item">
          <strong>1.8.9</strong>
          <span>Forge client</span>
        </div>
        <div className="metric-item">
          <strong>AES-256 GCM</strong>
          <span>Hardware Bound Encrypted</span>
        </div>
        <div className="metric-item">
          <strong>&lt; 10ms</strong>
          <span>Realtime Token Latency</span>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="features-grid">
        <div className="glass-panel feature-card">
          <div className="feature-icon-box">
            <Cpu size={24} />
          </div>
          <h3>Version-Matched Runtime</h3>
          <p>
            Separate DLL releases for the modern client and Forge 1.8.9. The injector requests only the release
            selected for the target game, while existing 26.2 releases remain on their original channel.
          </p>
        </div>

        <div className="glass-panel feature-card">
          <div className="feature-icon-box">
            <Layers size={24} />
          </div>
          <h3>Client-Specific Rendering</h3>
          <p>
            Each client retains its own rendering stack and ClickGUI, designed for its Minecraft version.
            Shared account delivery does not force the two game runtimes into one implementation.
          </p>
        </div>

        <div className="glass-panel feature-card">
          <div className="feature-icon-box">
            <ShieldCheck size={24} />
          </div>
          <h3>Cloud Cryptography & Safety</h3>
          <p>
            Encrypted DPAPI hardware fingerprinting, dynamic timestamp request windows, and one-time download
            tickets ensuring secure and exclusive client distribution.
          </p>
        </div>

        <div className="glass-panel feature-card">
          <div className="feature-icon-box">
            <Sparkles size={24} />
          </div>
          <h3>Frosted Glass ClickGUI</h3>
          <p>
            Apple-inspired fluid ergonomics with cubic-bezier transition curves, real-time palette customizer, and an
            interactive module drawer designed for rapid in-game tuning.
          </p>
        </div>
      </section>
    </div>
  );
}
