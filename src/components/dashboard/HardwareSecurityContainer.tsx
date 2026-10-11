import React from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';
import { api, type User } from '../../api';
import type { UiContent } from '../../content';

export interface HardwareSecurityContainerProps {
  user: User;
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  setUser: (u: User | null) => void;
  notify: (msg: string, err?: boolean) => void;
  content?: UiContent['hardware'];
}

export function HardwareSecurityContainer({
  user,
  pending,
  run,
  setUser,
  notify,
  content
}: HardwareSecurityContainerProps) {
  const c = content || {
    title: 'Hardware & Device Binding',
    subtitle: 'Cryptographic Machine Identification',
    description: 'Your account binds cryptographically to your Windows PC on client injection. If you switch computers, reset your hardware binding below.',
    statusLabel: 'Binding Status',
    boundStatus: 'Bound to Device',
    unboundStatus: 'Unbound / Flexible',
    signatureLabel: 'Hardware Signature',
    clientAccessLabel: 'Client Access',
    resetBtn: 'Reset Hardware Binding'
  };

  return (
    <div className="profile-section-box">
      <div className="profile-section-title">
        <HardDrive size={18} />
        <div>
          <h4>{c.title}</h4>
          <span>{c.subtitle}</span>
        </div>
      </div>

      <p className="profile-section-desc">
        {c.description}
      </p>

      <div className="detail-row">
        <span className="detail-label">{c.statusLabel}</span>
        <span className="detail-value">
          {user.hardwareBound ? (
            <span className="badge badge-active">{c.boundStatus}</span>
          ) : (
            <span className="badge badge-inactive">{c.unboundStatus}</span>
          )}
        </span>
      </div>

      <div className="detail-row">
        <span className="detail-label">{c.signatureLabel}</span>
        <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {user.hardwareHash ? `${user.hardwareHash.slice(0, 24)}…` : 'None (Pending Injection)'}
        </span>
      </div>

      <div className="detail-row">
        <span className="detail-label">{c.clientAccessLabel}</span>
        <span className="detail-value">
          {user.active ? 'Subscription Active' : 'Subscription Required'}
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          className="btn-secondary"
          disabled={pending || !user.hardwareBound}
          onClick={() =>
            run(async () => {
              const updated = await api<User>('/api/web/profile/hardware/reset', 'POST', {});
              setUser(updated);
              notify('Hardware binding reset. You can now login on a new machine.');
            })
          }
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <RefreshCw size={14} /> {c.resetBtn}
        </button>
      </div>
    </div>
  );
}
