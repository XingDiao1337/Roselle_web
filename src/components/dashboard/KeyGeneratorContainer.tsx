import React, { type FormEvent } from 'react';
import { Copy } from 'lucide-react';
import { api, type Card } from '../../api';

export interface KeyGeneratorContainerProps {
  cards: Card[];
  generated: string[];
  setGenerated: (keys: string[]) => void;
  pending: boolean;
  run: (work: () => Promise<void>) => Promise<void>;
  refreshAdmin: () => Promise<void>;
  notify: (msg: string, err?: boolean) => void;
}

export function KeyGeneratorContainer({
  cards,
  generated,
  setGenerated,
  pending,
  run,
  refreshAdmin,
  notify
}: KeyGeneratorContainerProps) {
  const formatDate = (ms: number) =>
    ms ? new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not activated';

  const formatHours = (n: number) => (n % 24 === 0 ? `${n / 24} Days` : `${n} Hours`);

  const handleGenerate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    run(async () => {
      const out = await api<{ codes: string[] }>('/api/web/admin/cards', 'POST', {
        count: Number(d.count),
        durationHours: Number(d.durationHours)
      });
      setGenerated(out.codes);
      await refreshAdmin();
      notify(`${out.codes.length} cards generated successfully!`);
    });
  };

  return (
    <div className="dash-grid-2">
      <div className="glass-panel dash-card">
        <div className="dash-card-header">
          <h3>Generate Card Keys</h3>
          <span>Batch Creation</span>
        </div>
        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label>Count (Cards to Generate)</label>
            <input className="form-input" type="number" name="count" defaultValue="1" min="1" max="100" required />
          </div>
          <div className="form-group">
            <label>Duration (Hours)</label>
            <input className="form-input" type="number" name="durationHours" defaultValue="720" min="1" max="87600" required />
          </div>
          <button type="submit" className="btn-primary" disabled={pending}>
            Generate Keys
          </button>
        </form>

        {generated.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>Newly Generated Keys ({generated.length})</strong>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '3px 10px', fontSize: 11.5 }}
                onClick={() => {
                  navigator.clipboard.writeText(generated.join('\n'));
                  notify('Copied to clipboard!');
                }}
              >
                <Copy size={13} /> Copy All
              </button>
            </div>
            <textarea
              readOnly
              className="form-input"
              style={{ height: 120, fontFamily: 'monospace', fontSize: 12 }}
              value={generated.join('\n')}
            />
          </div>
        )}
      </div>

      <div className="glass-panel dash-card">
        <div className="dash-card-header">
          <h3>Card Key History</h3>
          <span>{cards.length} Total Keys</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Key Hint</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(c => (
                <tr key={c.id}>
                  <td>
                    <code style={{ fontSize: 12 }}>•••• {c.hint}</code>
                  </td>
                  <td>{formatHours(c.durationHours)}</td>
                  <td>
                    {c.redeemedAt ? (
                      <span className="badge badge-inactive">Used</span>
                    ) : (
                      <span className="badge badge-active">Available</span>
                    )}
                  </td>
                  <td>{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
