import React from 'react';
import { UserRound, Users, Ticket, Package, LogOut } from 'lucide-react';
import type { User } from '../../api';

export interface DashboardNavProps {
  user: User;
  dashTab: string;
  setDashTab: (tab: string) => void;
  pending: boolean;
  onLogout: () => void;
}

export function DashboardNav({
  user,
  dashTab,
  setDashTab,
  pending,
  onLogout
}: DashboardNavProps) {
  const navItems = [
    { id: 'profile', label: 'Profile', icon: UserRound },
    ...(user.role === 'ADMIN'
      ? [
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'cards', label: 'Key Generator', icon: Ticket },
          { id: 'releases', label: 'Releases & Loader', icon: Package }
        ]
      : [])
  ];

  return (
    <div className="dashboard-nav">
      {navItems.map(item => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className={`dashboard-tab ${dashTab === item.id ? 'active' : ''}`}
            onClick={() => setDashTab(item.id)}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          className="btn-secondary"
          style={{ padding: '6px 14px', fontSize: 12.5 }}
          onClick={onLogout}
          disabled={pending}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
}
