import React from 'react';
import { ProfileHeroBanner } from './ProfileHeroBanner';
import { CardActivationContainer } from './CardActivationContainer';
import { HardwareSecurityContainer } from './HardwareSecurityContainer';
import { PasswordContainer } from './PasswordContainer';
import type { User } from '../../api';

export interface ProfileContainerProps {
  user: User;
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  setUser: (u: User | null) => void;
  notify: (msg: string, err?: boolean) => void;
}

export function ProfileContainer({
  user,
  pending,
  run,
  setUser,
  notify
}: ProfileContainerProps) {
  return (
    <div className="glass-panel profile-unified-card">
      {/* Header Banner: Avatar, Identity & Key Stats */}
      <ProfileHeroBanner
        user={user}
        run={run}
        setUser={setUser}
        notify={notify}
      />

      {/* Interior Sections: License Activation, Hardware Binding, Credentials */}
      <div className="profile-body-grid">
        {/* Card Key Activation & License Container */}
        <CardActivationContainer
          user={user}
          pending={pending}
          setUser={setUser}
          notify={notify}
        />

        {/* Detailed Hardware & Device Security Container */}
        <HardwareSecurityContainer
          user={user}
          pending={pending}
          run={run}
          setUser={setUser}
          notify={notify}
        />

        {/* Change Password Form Container */}
        <PasswordContainer
          pending={pending}
          run={run}
          setUser={setUser}
          notify={notify}
        />
      </div>
    </div>
  );
}
