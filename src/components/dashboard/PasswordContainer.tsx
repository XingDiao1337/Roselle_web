import React, { type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { api, type User } from '../../api';

export interface PasswordContainerProps {
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  setUser: (u: User | null) => void;
  notify: (msg: string, err?: boolean) => void;
}

export function PasswordContainer({
  pending,
  run,
  setUser,
  notify
}: PasswordContainerProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    run(async () => {
      await api('/api/web/profile/password', 'PATCH', d);
      setUser(null);
      notify('Password updated. Please sign in again.');
    });
  };

  return (
    <div className="profile-section-box">
      <div className="profile-section-title">
        <Lock size={18} />
        <div>
          <h4>Security & Password</h4>
          <span>Update Account Credentials</span>
        </div>
      </div>

      <p className="profile-section-desc">
        Updating your password immediately invalidates active web sessions for enhanced security. You will need to sign in again.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group">
          <label>Current Password</label>
          <input className="form-input" name="oldPassword" type="password" required />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input
            className="form-input"
            name="password"
            type="password"
            minLength={8}
            placeholder="At least 8 characters"
            required
          />
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={pending}
          style={{ marginTop: 4, width: '100%', justifyContent: 'center' }}
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
