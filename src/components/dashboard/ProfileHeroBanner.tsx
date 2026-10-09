import React, { useState } from 'react';
import { Upload, ShieldCheck, AlertCircle, Copy, Check, Download } from 'lucide-react';
import { api, type User } from '../../api';

export interface ProfileHeroBannerProps {
  user: User;
  run: (work: () => Promise<void>) => Promise<void>;
  setUser: (u: User | null) => void;
  notify: (msg: string, err?: boolean) => void;
}

export function ProfileHeroBanner({
  user,
  run,
  setUser,
  notify
}: ProfileHeroBannerProps) {
  const [copiedUid, setCopiedUid] = useState(false);

  const copyUid = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedUid(true);
    notify('User ID copied to clipboard!');
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const formatDate = (ms: number) =>
    ms ? new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not activated';

  return (
    <div className="profile-hero-banner">
      <div className="profile-avatar-wrapper">
        {user.avatar ? (
          <img src={user.avatar} alt="Avatar" className="profile-avatar-img" />
        ) : (
          <div className="profile-avatar-fallback">
            {user.username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <label className="profile-avatar-upload-btn" title="Change Avatar">
          <Upload size={12} />
          <span>Upload</span>
          <input
            type="file"
            accept="image/png,image/jpeg"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              run(async () => {
                const form = new FormData();
                form.set('file', file);
                const updated = await api<User>('/api/web/profile/avatar', 'POST', form);
                setUser(updated);
                notify('Avatar updated successfully!');
              });
              e.target.value = '';
            }}
          />
        </label>
      </div>

      <div className="profile-hero-info">
        <div className="profile-hero-name-row">
          <h2>{user.username}</h2>
          <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-role'}`}>
            {user.role === 'ADMIN' ? 'Administrator' : 'Standard User'}
          </span>
          {user.active ? (
            <span className="badge badge-active">
              <ShieldCheck size={13} /> Active Subscription
            </span>
          ) : (
            <span className="badge badge-inactive">
              <AlertCircle size={13} /> Inactive Subscription
            </span>
          )}
        </div>

        <div className="profile-hero-meta-strip">
          <div className="profile-meta-item">
            <span className="meta-label">User ID:</span>
            <button
              type="button"
              className="meta-code-btn"
              onClick={() => copyUid(user.id)}
              title="Click to copy UID"
            >
              {user.id.slice(0, 12)}… {copiedUid ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
            </button>
          </div>
          <div className="profile-meta-item">
            <span className="meta-label">Member Since:</span>
            <span className="meta-value">{formatDate(user.createdAt)}</span>
          </div>
          <div className="profile-meta-item">
            <span className="meta-label">Subscription Expiry:</span>
            <span className="meta-value" style={{ color: user.active ? 'var(--accent)' : 'inherit', fontWeight: 600 }}>
              {user.expiresAt ? formatDate(user.expiresAt) : 'Not Activated'}
            </span>
          </div>
        </div>
      </div>

      {user.active && (
        <div className="profile-hero-action">
          <a
            href="/api/web/loader/download"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', fontSize: 13.5 }}
            download="RoselleLoader.exe"
          >
            <Download size={16} /> Download Loader
          </a>
        </div>
      )}
    </div>
  );
}
