import React, { type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { api, type User } from '../../api';
import type { UiContent } from '../../content';

export interface PasswordContainerProps {
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  setUser: (u: User | null) => void;
  notify: (msg: string, err?: boolean) => void;
  content?: UiContent['password'];
}

export function PasswordContainer({
  pending,
  run,
  setUser,
  notify,
  content
}: PasswordContainerProps) {
  const c = content || {
    title: 'Security & Password',
    subtitle: 'Update Account Credentials',
    description: 'Updating your password immediately invalidates active web sessions for enhanced security. You will need to sign in again.',
    currentLabel: 'Current Password',
    newLabel: 'New Password',
    submitBtn: 'Update Password'
  };

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
          <h4>{c.title}</h4>
          <span>{c.subtitle}</span>
        </div>
      </div>

      <p className="profile-section-desc">
        {c.description}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group">
          <label>{c.currentLabel}</label>
          <input className="form-input" name="oldPassword" type="password" required />
        </div>
        <div className="form-group">
          <label>{c.newLabel}</label>
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
          {c.submitBtn}
        </button>
      </form>
    </div>
  );
}
