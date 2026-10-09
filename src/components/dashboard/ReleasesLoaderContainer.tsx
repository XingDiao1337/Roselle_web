import React, { type FormEvent } from 'react';
import { Download, Upload } from 'lucide-react';
import { api, type Release, type LoaderInfo } from '../../api';

export interface ReleasesLoaderContainerProps {
  releases: Release[];
  loaderInfo: LoaderInfo | null;
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  refreshAdmin: () => Promise<void>;
  notify: (msg: string, err?: boolean) => void;
}

export function ReleasesLoaderContainer({
  releases,
  loaderInfo,
  pending,
  run,
  refreshAdmin,
  notify
}: ReleasesLoaderContainerProps) {
  const formatDate = (ms: number) =>
    ms ? new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not activated';

  const handleUploadLoader = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    run(async () => {
      await api('/api/web/admin/loader', 'POST', form);
      await refreshAdmin();
      notify('Injector (RoselleLoader.exe) published successfully!');
    });
  };

  const handleUploadRelease = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    run(async () => {
      await api('/api/web/admin/releases', 'POST', form);
      await refreshAdmin();
      notify('Release published successfully!');
    });
  };

  return (
    <div className="tab-pane-animated" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Injector Management Grid */}
      <div className="dash-grid-2">
        <div className="glass-panel dash-card">
          <div className="dash-card-header">
            <h3>Native Injector Status</h3>
            <span>RoselleLoader.exe</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            The standalone Windows x64 client that authenticates hardware, checks cloud licenses, and injects Roselle.
          </p>
          <div style={{ marginTop: 12 }}>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className="detail-value">
                {loaderInfo?.exists ? (
                  <span className="badge badge-active">Deployed & Ready</span>
                ) : (
                  <span className="badge badge-inactive">Not Uploaded</span>
                )}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Binary Size</span>
              <span className="detail-value">
                {loaderInfo?.bytes ? `${(loaderInfo.bytes / 1024).toFixed(1)} KB` : 'N/A'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">SHA-256</span>
              <span className="detail-value">
                <code style={{ fontSize: 11 }} title={loaderInfo?.sha256}>
                  {loaderInfo?.sha256 ? `${loaderInfo.sha256.slice(0, 16)}…` : 'N/A'}
                </code>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Last Updated</span>
              <span className="detail-value">
                {loaderInfo?.updatedAt ? formatDate(loaderInfo.updatedAt) : 'N/A'}
              </span>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <a
              href="/api/web/loader/download"
              className="btn-secondary"
              download="RoselleLoader.exe"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px' }}
            >
              <Download size={15} /> Download Injector (.exe)
            </a>
          </div>
        </div>

        <div className="glass-panel dash-card">
          <div className="dash-card-header">
            <h3>Publish Injector</h3>
            <span>Target x64 Executable</span>
          </div>
          <form onSubmit={handleUploadLoader}>
            <div className="form-group">
              <label>Injector Binary File (.exe)</label>
              <input className="form-input" type="file" name="file" accept=".exe" required />
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
              Upload the compiled <code>RoselleLoader.exe</code>. Once uploaded, it becomes immediately downloadable
              across the homepage and user consoles.
            </p>
            <button type="submit" className="btn-primary" disabled={pending}>
              <Upload size={15} /> Publish Injector
            </button>
          </form>
        </div>
      </div>

      {/* DLL Releases Grid */}
      <div className="dash-grid-2">
        <div className="glass-panel dash-card">
          <div className="dash-card-header">
            <h3>Publish New Release</h3>
            <span>Version-specific x64 DLL</span>
          </div>
          <form onSubmit={handleUploadRelease}>
            <div className="form-group">
              <label>Game Version</label>
              <select className="form-input" name="channel" defaultValue="modern" required>
                <option value="modern">Minecraft 26.2</option>
                <option value="legacy">Forge 1.8.9</option>
              </select>
            </div>
            <div className="form-group">
              <label>Release Version</label>
              <input className="form-input" name="version" placeholder="e.g. 26.2-r1 or 1.8.9-r1" required />
            </div>
            <div className="form-group">
              <label>DLL Binary File (.dll)</label>
              <input className="form-input" type="file" name="file" accept=".dll" required />
            </div>
            <button type="submit" className="btn-primary" disabled={pending}>
              <Upload size={15} /> Publish Release
            </button>
          </form>
        </div>

        <div className="glass-panel dash-card">
          <div className="dash-card-header">
            <h3>Release Records</h3>
            <span>{releases.length} Published Versions</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Game Version</th>
                  <th>Version</th>
                  <th>DLL Payload</th>
                  <th>Published</th>
                </tr>
              </thead>
              <tbody>
                {releases.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span className="badge badge-active">
                        {r.channel === 'legacy' ? 'Forge 1.8.9' : 'Minecraft 26.2'}
                      </span>
                    </td>
                    <td>
                      <strong>{r.version}</strong>
                    </td>
                    <td>
                      <div>{(r.bytes / 1024 / 1024).toFixed(2)} MB</div>
                      <code style={{ fontSize: 11 }} title={r.sha256}>
                        {r.sha256.slice(0, 10)}…
                      </code>
                    </td>
                    <td>{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
