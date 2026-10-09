import React, { type FormEvent } from 'react';
import { api, type User } from '../../api';

export interface UserManagementContainerProps {
  users: User[];
  selectedUser: User | null;
  setSelectedUser: (u: User | null) => void;
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  refreshAdmin: () => Promise<void>;
  notify: (msg: string, err?: boolean) => void;
}

export function UserManagementContainer({
  users,
  selectedUser,
  setSelectedUser,
  pending,
  run,
  refreshAdmin,
  notify
}: UserManagementContainerProps) {
  const formatDate = (ms: number) =>
    ms ? new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not activated';

  const handleEditSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    run(async () => {
      const data: Record<string, unknown> = {
        username: d.username,
        disabled: d.disabled === 'yes',
        expiresAt: d.expiresAt ? new Date(d.expiresAt).getTime() : 0,
        resetHardware: d.resetHardware === 'on'
      };
      if (d.password) data.password = d.password;
      await api(`/api/web/admin/users/${selectedUser.id}`, 'PATCH', data);
      setSelectedUser(null);
      await refreshAdmin();
      notify('User updated successfully!');
    });
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    if (window.confirm(`Delete user ${selectedUser.username}?`)) {
      run(async () => {
        await api(`/api/web/admin/users/${selectedUser.id}`, 'DELETE');
        setSelectedUser(null);
        await refreshAdmin();
        notify('User deleted!');
      });
    }
  };

  return (
    <div className="glass-panel dash-card">
      <div className="dash-card-header">
        <h3>User Management</h3>
        <span>{users.length} Total Users</span>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <strong>{u.username}</strong>
                  <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{u.id.slice(0, 8)}…</div>
                </td>
                <td>{u.role}</td>
                <td>
                  {u.disabled ? (
                    <span className="badge badge-danger">Disabled</span>
                  ) : u.active ? (
                    <span className="badge badge-active">Active</span>
                  ) : (
                    <span className="badge badge-inactive">Inactive</span>
                  )}
                </td>
                <td>{formatDate(u.expiresAt)}</td>
                <td>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 11.5 }}
                    disabled={u.role === 'ADMIN'}
                    onClick={() => setSelectedUser(u)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div
          className="glass-panel"
          style={{
            marginTop: 20,
            padding: 24,
            border: '1px solid var(--accent)'
          }}
        >
          <h4 style={{ marginBottom: 16 }}>Edit User: {selectedUser.username}</h4>
          <form
            onSubmit={handleEditSubmit}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}
          >
            <div className="form-group">
              <label>Username</label>
              <input className="form-input" name="username" defaultValue={selectedUser.username} required />
            </div>
            <div className="form-group">
              <label>Account Status</label>
              <select className="form-input" name="disabled" defaultValue={selectedUser.disabled ? 'yes' : 'no'}>
                <option value="no">Active / Normal</option>
                <option value="yes">Disabled / Banned</option>
              </select>
            </div>
            <div className="form-group">
              <label>Reset Password (leave empty to keep)</label>
              <input className="form-input" name="password" type="password" />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1', display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-primary" disabled={pending}>
                Save Changes
              </button>
              <button type="button" className="btn-secondary" onClick={() => setSelectedUser(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={pending}
                onClick={handleDeleteUser}
              >
                Delete User
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
