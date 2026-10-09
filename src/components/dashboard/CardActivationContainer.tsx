import React, { useState, useEffect, type FormEvent } from 'react';
import { KeyRound, Sparkles, WifiOff, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api, type User } from '../../api';

export interface CardActivationContainerProps {
  user: User;
  pending: boolean;
  setUser: (u: User | null) => void;
  notify: (msg: string, err?: boolean) => void;
}

interface NetworkErrorInfo {
  hasError: boolean;
  reason: string;
  details?: string;
  timestamp?: number;
}

export function CardActivationContainer({
  user,
  pending,
  setUser,
  notify
}: CardActivationContainerProps) {
  const [cardKey, setCardKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [networkError, setNetworkError] = useState<NetworkErrorInfo>({
    hasError: false,
    reason: ''
  });
  const [isRetrying, setIsRetrying] = useState(false);

  // Monitor browser network status
  useEffect(() => {
    const handleOnline = () => {
      // If we previously had an offline error, attempt recovery
      if (networkError.hasError && (networkError.reason.includes('Offline') || networkError.reason.includes('offline'))) {
        probeConnection();
      }
    };

    const handleOffline = () => {
      setNetworkError({
        hasError: true,
        reason: 'Client Offline (No Internet Connection)',
        details: 'The browser detected an offline state and cannot communicate with Roselle Cloud.',
        timestamp: Date.now()
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [networkError.hasError, networkError.reason]);

  // Connection probe helper to verify server reachability
  const probeConnection = async () => {
    setIsRetrying(true);
    try {
      if (!navigator.onLine) {
        throw new Error('System network is currently offline');
      }
      // Probe backend endpoint
      const res = await fetch('/api/web/releases/latest', {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok && res.status >= 500) {
        throw new Error(`Server returned error status (HTTP ${res.status})`);
      }
      // Probe passed, clear network error
      setNetworkError({ hasError: false, reason: '' });
      notify('Network connection restored!');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      let detailedReason = 'Unable to establish connection with Roselle Backend service';
      if (!navigator.onLine) {
        detailedReason = 'Local Network Disconnected (Offline)';
      } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('connection refused')) {
        detailedReason = 'Connection refused or target server unreachable (ERR_CONNECTION_REFUSED)';
      }
      setNetworkError({
        hasError: true,
        reason: detailedReason,
        details: errMsg,
        timestamp: Date.now()
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleActivate = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = cardKey.trim();
    if (!trimmed) return;

    if (!navigator.onLine) {
      setNetworkError({
        hasError: true,
        reason: 'Network offline: unable to submit card key activation request',
        details: 'navigator.onLine = false',
        timestamp: Date.now()
      });
      return;
    }

    setSubmitting(true);
    try {
      const updated = await api<User>('/api/web/cards/activate', 'POST', { code: trimmed });
      setUser(updated);
      setCardKey('');
      setNetworkError({ hasError: false, reason: '' });
      notify('License activated successfully! Active subscription extended.');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isNetworkIssue =
        !navigator.onLine ||
        errMsg.includes('Failed to fetch') ||
        errMsg.includes('NetworkError') ||
        errMsg.includes('Load failed') ||
        errMsg.includes('Network request failed') ||
        errMsg.includes('timeout') ||
        errMsg.includes('ERR_CONNECTION');

      if (isNetworkIssue) {
        setNetworkError({
          hasError: true,
          reason: 'Activation request failed to reach the server. Connection timed out or was interrupted.',
          details: errMsg,
          timestamp: Date.now()
        });
      } else {
        // Business error (e.g. invalid code, already redeemed)
        notify(errMsg, true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-section-box card-activation-container">
      <div className="profile-section-title">
        <KeyRound size={18} />
        <div>
          <h4>License Activation</h4>
          <span>Cryptographic License & Subscription Container</span>
        </div>
      </div>

      {networkError.hasError ? (
        /* ==================== Network Error / Failed to Load View ==================== */
        <div className="card-activation-error-state glass-panel">
          <div className="activation-error-header">
            <div className="activation-error-icon-box">
              <WifiOff size={22} color="#f87171" />
            </div>
            <div>
              <h4 className="activation-error-title">Interface Load Failed</h4>
              <span className="activation-error-subtitle">
                Communication error with activation service. Unable to load latest container.
              </span>
            </div>
          </div>

          <div className="activation-error-reason-box">
            <div className="reason-label">
              <AlertTriangle size={14} color="#f87171" style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Failure Reason:
            </div>
            <div className="reason-desc">{networkError.reason}</div>
            {networkError.details && (
              <div className="reason-raw-details">
                <code>Diagnostic Info: {networkError.details}</code>
              </div>
            )}
          </div>

          <div className="activation-error-troubleshoot">
            <span>Troubleshooting Tips:</span>
            <ul>
              <li>Check your network connection to ensure Wi-Fi or Ethernet is active</li>
              <li>Ensure the backend service is running and accessible on port 1337</li>
              <li>If using a proxy or Cloudflare Pages, verify <code>/api/web/cards/*</code> is forwarded properly</li>
            </ul>
          </div>

          <div className="activation-error-action-row">
            <button
              type="button"
              className="btn-primary retry-btn"
              onClick={probeConnection}
              disabled={isRetrying}
            >
              <RefreshCw size={14} className={isRetrying ? 'spin-animation' : ''} />
              {isRetrying ? 'Retrying Connection…' : 'Retry Loading Interface'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setNetworkError({ hasError: false, reason: '' })}
            >
              Dismiss & Show Form
            </button>
          </div>
        </div>
      ) : (
        /* ==================== Normal License Form View ==================== */
        <>
          <p className="profile-section-desc">
            Enter your purchased license card key below. The cloud verifies and automatically extends your subscription.
          </p>

          <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>License Card Key</label>
              <input
                className="form-input"
                placeholder="e.g. ROS-XXXX-XXXX"
                value={cardKey}
                onChange={e => setCardKey(e.target.value)}
                disabled={submitting || pending}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || pending || !cardKey.trim()}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Sparkles size={14} />
              {submitting ? 'Verifying Card Key…' : 'Activate License Key'}
            </button>
          </form>

          <div className="detail-row" style={{ marginTop: 'auto', paddingTop: 10 }}>
            <span className="detail-label">Current License Status</span>
            <span className="detail-value">
              {user.active ? (
                <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={12} /> Active Subscription
                </span>
              ) : (
                <span className="badge badge-inactive">Inactive / Expired</span>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
