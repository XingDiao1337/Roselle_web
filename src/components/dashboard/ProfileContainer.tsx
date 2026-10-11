import React from 'react';
import { ProfileHeroBanner } from './ProfileHeroBanner';
import { CardActivationContainer } from './CardActivationContainer';
import { HardwareSecurityContainer } from './HardwareSecurityContainer';
import { PasswordContainer } from './PasswordContainer';
import type { User } from '../../api';
import type { UiContent } from '../../content';

export interface ProfileContainerProps {
  user: User;
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  setUser: (u: User | null) => void;
  notify: (msg: string, err?: boolean) => void;
  content?: UiContent;
}

export function ProfileContainer({
  user,
  pending,
  run,
  setUser,
  notify,
  content
}: ProfileContainerProps) {
  return (
    <div className="glass-panel profile-unified-card">
      {/* Header Banner: Avatar, Identity & Key Stats */}
      <ProfileHeroBanner
        user={user}
        run={run}
        setUser={setUser}
        notify={notify}
        content={content?.profile}
      />

      {/* Interior Sections: License Activation, Hardware Binding, Credentials */}
      <div className="profile-body-grid">
        {/* Card Key Activation & License Container */}
        <CardActivationContainer
          user={user}
          pending={pending}
          setUser={setUser}
          notify={notify}
          content={content?.activation}
        />

        {/* Detailed Hardware & Device Security Container */}
        <HardwareSecurityContainer
          user={user}
          pending={pending}
          run={run}
          setUser={setUser}
          notify={notify}
          content={content?.hardware}
        />

        {/* Change Password Form Container */}
        <PasswordContainer
          pending={pending}
          run={run}
          setUser={setUser}
          notify={notify}
          content={content?.password}
        />
      </div>
    </div>
  );
}
