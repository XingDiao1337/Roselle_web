import React from 'react';
import { DEFAULT_CONTENT, type UiContent } from './content';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileHeroBanner } from './components/dashboard/ProfileHeroBanner';
import { CardActivationContainer } from './components/dashboard/CardActivationContainer';
import { HardwareSecurityContainer } from './components/dashboard/HardwareSecurityContainer';
import { PasswordContainer } from './components/dashboard/PasswordContainer';
import { ReleasesLoaderContainer } from './components/dashboard/ReleasesLoaderContainer';
import { KeyGeneratorContainer } from './components/dashboard/KeyGeneratorContainer';
import { UserManagementContainer } from './components/dashboard/UserManagementContainer';
import { DashboardNav } from './components/dashboard/DashboardNav';
import type { User, Card, Release, LoaderInfo } from './api';

// Cloudflare-hosted container content and text manifest
export const cloudContent: UiContent = DEFAULT_CONTENT;

export interface RemoteLoginProps {
  pending: boolean;
  onSubmit: (kind: 'login' | 'register', data: Record<string, string>) => void;
  content?: UiContent['auth'];
}

export function RenderLoginContent(props: RemoteLoginProps) {
  return <AuthModal {...props} />;
}

export interface RemoteProfileBannerProps {
  user: User;
  run: (work: () => Promise<void>) => Promise<void>;
  setUser: (u: User | null) => void;
  notify: (msg: string, err?: boolean) => void;
}

export function RenderProfileBannerContent(props: RemoteProfileBannerProps) {
  return <ProfileHeroBanner {...props} />;
}

export interface RemoteActivationProps {
  user: User;
  pending: boolean;
  setUser: (u: User | null) => void;
  notify: (msg: string, err?: boolean) => void;
}

export function RenderLicenseActivationContent(props: RemoteActivationProps) {
  return <CardActivationContainer {...props} />;
}

export interface RemoteHardwareProps {
  user: User;
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  setUser: (u: User | null) => void;
  notify: (msg: string, err?: boolean) => void;
}

export function RenderHardwareBindingContent(props: RemoteHardwareProps) {
  return <HardwareSecurityContainer {...props} />;
}

export interface RemotePasswordProps {
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  setUser: (u: User | null) => void;
  notify: (msg: string, err?: boolean) => void;
}

export function RenderPasswordContent(props: RemotePasswordProps) {
  return <PasswordContainer {...props} />;
}

export interface RemoteReleasesProps {
  releases: Release[];
  loaderInfo: LoaderInfo | null;
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  refreshAdmin: () => Promise<void>;
  notify: (msg: string, err?: boolean) => void;
}

export function RenderReleasesLoaderContent(props: RemoteReleasesProps) {
  return <ReleasesLoaderContainer {...props} />;
}

export interface RemoteKeyGenProps {
  cards: Card[];
  generated: string[];
  setGenerated: (g: string[]) => void;
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  refreshAdmin: () => Promise<void>;
  notify: (msg: string, err?: boolean) => void;
}

export function RenderKeyGeneratorContent(props: RemoteKeyGenProps) {
  return <KeyGeneratorContainer {...props} />;
}

export interface RemoteUserMgmtProps {
  users: User[];
  selectedUser: User | null;
  setSelectedUser: (u: User | null) => void;
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  refreshAdmin: () => Promise<void>;
  notify: (msg: string, err?: boolean) => void;
}

export function RenderUserManagementContent(props: RemoteUserMgmtProps) {
  return <UserManagementContainer {...props} />;
}

export function RenderDashboardNav(props: {
  user: User;
  dashTab: string;
  setDashTab: (tab: string) => void;
  pending: boolean;
  onLogout: () => void;
}) {
  return <DashboardNav {...props} />;
}
