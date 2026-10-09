import React, { useState, type FormEvent } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { RoseLogo } from '../common/RoseLogo';

export interface AuthModalProps {
  pending: boolean;
  onBack: () => void;
  onSubmit: (kind: 'login' | 'register', data: Record<string, string>) => void;
}

export function AuthModal({ pending, onBack, onSubmit }: AuthModalProps) {
  const [kind, setKind] = useState<'login' | 'register'>('login');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    onSubmit(kind, data);
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-panel auth-card">
        <div className="auth-card-header">
          <button type="button" className="back-btn" onClick={onBack}>
            ← Back to Home
          </button>
          <div className="brand-badge brand-badge-rose" style={{ width: 48, height: 48, margin: '0 auto 14px' }}>
            <RoseLogo size={28} color="var(--accent-text)" glow />
          </div>
          <h2>{kind === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{kind === 'login' ? 'Sign in to access your cloud console' : 'Register your Roselle account'}</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${kind === 'login' ? 'active' : ''}`}
            onClick={() => setKind('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${kind === 'register' ? 'active' : ''}`}
            onClick={() => setKind('register')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              className="form-input"
              name="username"
              required
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9_]+"
              placeholder="e.g. roselle_user"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className="form-input"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              autoComplete={kind === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: 8, padding: 12 }}
            disabled={pending}
          >
            {pending ? 'Connecting…' : kind === 'login' ? 'Sign In to Account' : 'Create Free Account'}
            <ArrowRight size={16} />
          </button>
        </form>

        <p
          style={{
            fontSize: 11.5,
            color: 'var(--text-subtle)',
            textAlign: 'center',
            marginTop: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <Lock size={13} />
          AES-256 Encrypted Session · Standalone Injector Security
        </p>
      </div>
    </div>
  );
}
