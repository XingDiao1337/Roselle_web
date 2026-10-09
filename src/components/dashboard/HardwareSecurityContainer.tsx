import React from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';
import { api, type User } from '../../api';

export interface HardwareSecurityContainerProps {
  user: User;
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  setUser: (u: User | null) => void;
  notify: (msg: string, err?: boolean) => void;
}

export function HardwareSecurityContainer({
  user,
  pending,
  run,
  setUser,
  notify
}: HardwareSecurityContainerProps) {
  return (
    <div className="profile-section-box">
      <div className="profile-section-title">
        <HardDrive size={18} />
        <div>
          <h4>Hardware & Device Binding</h4>
          <span>Cryptographic Machine Identification</span>
        </div>
      </div>

      <p className="profile-section-desc">
        Your account binds cryptographically to your Windows PC on client injection. If you switch computers, reset your hardware binding below.
      </p>

      <div className="detail-row">
        <span className="detail-label">Binding Status</span>
        <span className="detail-value">
          {user.hardwareBound ? (
            <span className="badge badge-active">Bound to Device</span>
          ) : (
            <span className="badge badge-inactive">Not Bound (Binds on First Launch)</span>
          )}
        </span>
      </div>

      <div className="detail-row">
        <span className="detail-label">Hardware Signature</span>
        <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {user.hardwareHash ? `${user.hardwareHash.slice(0, 24)}…` : 'None (Pending Injection)'}
        </span>
      </div>

      <div className="detail-row">
        <span className="detail-label">Client Access</span>
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
          <RefreshCw size={14} /> Reset Hardware Binding
        </button>
      </div>
    </div>
  );
}
