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
      if (networkError.hasError && networkError.reason.includes('离线')) {
        probeConnection();
      }
    };

    const handleOffline = () => {
      setNetworkError({
        hasError: true,
        reason: '系统网络检测已断开 (Client Offline)',
        details: '浏览器检测到当前处于脱机断网状态，无法与 Roselle 服务端通信。',
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
        throw new Error('当前系统网络未连接，处于离线状态');
      }
      // Probe backend endpoint
      const res = await fetch('/api/web/releases/latest', {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok && res.status >= 500) {
        throw new Error(`服务端异常状态响应 (HTTP ${res.status})`);
      }
      // Probe passed, clear network error
      setNetworkError({ hasError: false, reason: '' });
      notify('网络连接已恢复正常！');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      let detailedReason = '无法与后端服务 (http://127.0.0.1:1337) 建立通信连接';
      if (!navigator.onLine) {
        detailedReason = '本地网络连接断开 (Offline)';
      } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('connection refused')) {
        detailedReason = '连接被拒绝或目标服务器未启动 (ERR_CONNECTION_REFUSED / Server Unreachable)';
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
        reason: '网络离线，无法提交卡密激活请求',
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
      notify('卡密激活成功！订阅有效期已累加延长。');
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
          reason: '卡密激活请求未能送达服务器，网络连接超时或中断',
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
          <span>卡密授权与订阅激活容器</span>
        </div>
      </div>

      {networkError.hasError ? (
        /* ==================== 界面获取失败 (网络异常视图) ==================== */
        <div className="card-activation-error-state glass-panel">
          <div className="activation-error-header">
            <div className="activation-error-icon-box">
              <WifiOff size={22} color="#f87171" />
            </div>
            <div>
              <h4 className="activation-error-title">界面获取失败</h4>
              <span className="activation-error-subtitle">
                卡密激活服务网络通信异常，无法加载最新激活容器
              </span>
            </div>
          </div>

          <div className="activation-error-reason-box">
            <div className="reason-label">
              <AlertTriangle size={14} color="#f87171" style={{ verticalAlign: 'middle', marginRight: 4 }} />
              失败原因：
            </div>
            <div className="reason-desc">{networkError.reason}</div>
            {networkError.details && (
              <div className="reason-raw-details">
                <code>详细诊断信息: {networkError.details}</code>
              </div>
            )}
          </div>

          <div className="activation-error-troubleshoot">
            <span>排查建议：</span>
            <ul>
              <li>检查本机网络连接是否正常，Wi-Fi 或网线是否处于连接状态</li>
              <li>检查后端服务是否已在 <code>127.0.0.1:1337</code> 启动监听</li>
              <li>若使用云端或反向代理，请确认 <code>/api/web/cards/*</code> 路径未被防火墙阻断</li>
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
              {isRetrying ? '正在重试连接…' : '重试获取界面'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setNetworkError({ hasError: false, reason: '' })}
            >
              忽略并强制展示输入框
            </button>
          </div>
        </div>
      ) : (
        /* ==================== 正常卡密激活表单视图 ==================== */
        <>
          <p className="profile-section-desc">
            在下方输入您购买或获取的卡密激活码，系统将即时核销并为您自动累计延长订阅时长。
          </p>

          <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>激活卡密 (Card Key)</label>
              <input
                className="form-input"
                placeholder="例如: ROS-XXXX-XXXX"
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
              {submitting ? '正在核销卡密…' : '激活卡密授权 (Activate License)'}
            </button>
          </form>

          <div className="detail-row" style={{ marginTop: 'auto', paddingTop: 10 }}>
            <span className="detail-label">当前授权状态</span>
            <span className="detail-value">
              {user.active ? (
                <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={12} /> 订阅生效中
                </span>
              ) : (
                <span className="badge badge-inactive">未激活 / 已过期</span>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
