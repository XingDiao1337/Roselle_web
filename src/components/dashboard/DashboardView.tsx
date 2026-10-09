import React from 'react';
import { DashboardNav } from './DashboardNav';
import { ProfileContainer } from './ProfileContainer';
import { UserManagementContainer } from './UserManagementContainer';
import { KeyGeneratorContainer } from './KeyGeneratorContainer';
import { ReleasesLoaderContainer } from './ReleasesLoaderContainer';
import type { User, Card, Release, LoaderInfo } from '../../api';

export interface DashboardViewProps {
  user: User;
  dashTab: string;
  setDashTab: (t: string) => void;
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  setUser: (u: User | null) => void;
  notify: (msg: string, err?: boolean) => void;
  logout: () => void;
  users: User[];
  cards: Card[];
  releases: Release[];
  loaderInfo: LoaderInfo | null;
  generated: string[];
  setGenerated: (g: string[]) => void;
  selectedUser: User | null;
  setSelectedUser: (u: User | null) => void;
  refreshAdmin: () => Promise<void>;
}

export function DashboardView({
  user,
  dashTab,
  setDashTab,
  pending,
  run,
  setUser,
  notify,
  logout,
  users,
  cards,
  releases,
  loaderInfo,
  generated,
  setGenerated,
  selectedUser,
  setSelectedUser,
  refreshAdmin
}: DashboardViewProps) {
  return (
    <div className="dashboard-container">
      {/* Top Header Navigation Tabs */}
      <DashboardNav
        user={user}
        dashTab={dashTab}
        setDashTab={setDashTab}
        pending={pending}
        onLogout={logout}
      />

      {/* Profile Tab & Integrated Containers */}
      {dashTab === 'profile' && (
        <ProfileContainer
          user={user}
          pending={pending}
          run={run}
          setUser={setUser}
          notify={notify}
        />
      )}

      {/* Admin Tab: User Management Container */}
      {dashTab === 'users' && user.role === 'ADMIN' && (
        <UserManagementContainer
          users={users}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          pending={pending}
          run={run}
          refreshAdmin={refreshAdmin}
          notify={notify}
        />
      )}

      {/* Admin Tab: Key Generator Container */}
      {dashTab === 'cards' && user.role === 'ADMIN' && (
        <KeyGeneratorContainer
          cards={cards}
          generated={generated}
          setGenerated={setGenerated}
          pending={pending}
          run={run}
          refreshAdmin={refreshAdmin}
          notify={notify}
        />
      )}

      {/* Admin Tab: Releases & Injector Container */}
      {dashTab === 'releases' && user.role === 'ADMIN' && (
        <ReleasesLoaderContainer
          releases={releases}
          loaderInfo={loaderInfo}
          pending={pending}
          run={run}
          refreshAdmin={refreshAdmin}
          notify={notify}
        />
      )}
    </div>
  );
}
