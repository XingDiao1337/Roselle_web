export type User = { id:string;username:string;role:'ADMIN'|'USER';disabled:boolean;expiresAt:number;active:boolean;hardwareBound:boolean;hardwareHash:string;avatar:string;createdAt:number };
export type Card = { id:string;hint:string;durationHours:number;redeemedBy:string|null;redeemedAt:number|null;createdAt:number };
export type Release = { id:string;version:string;channel:'modern'|'legacy';sha256:string;bytes:number;createdAt:number };
export type LoaderInfo = { exists:boolean;filename?:string;bytes?:number;sha256?:string;updatedAt?:number };

export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('pages.dev') ? '' : 'https://roselle-web.pages.dev')
).replace(/\/+$/, '');

export async function api<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  if (!path.startsWith('/api/web/')) throw new Error('Web client only consumes web endpoints');
  const form = data instanceof FormData;
  const targetUrl = API_BASE ? `${API_BASE}${path}` : path;

  const headers: Record<string, string> = form ? {} : { 'Content-Type': 'application/json' };
  const savedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('roselle_token') : null;
  if (savedToken) {
    headers['X-Roselle-Token'] = savedToken;
  }

  const res = await fetch(targetUrl, {
    method,
    credentials: 'include',
    headers,
    body: data === undefined ? undefined : form ? data : JSON.stringify(data)
  });

  const tokenHeader = res.headers.get('X-Roselle-Token');
  if (tokenHeader && typeof localStorage !== 'undefined') {
    localStorage.setItem('roselle_token', tokenHeader);
  }
  if ((path === '/api/web/auth/logout' || (res.status === 401 && path === '/api/web/me')) && typeof localStorage !== 'undefined') {
    localStorage.removeItem('roselle_token');
  }

  const text = await res.text();
  let body: Record<string, unknown> | null = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    if (body && typeof body.error === 'string') {
      throw new Error(body.error);
    }
    if (text.includes('1003') || text.includes('Direct IP Access Not Allowed')) {
      throw new Error('Cloudflare Error 1003: Direct IP Access Not Allowed. Please configure a domain name for BACKEND_URL.');
    }
    throw new Error(text && text.length < 160 ? text : `Request failed (${res.status})`);
  }
  return body as T;
}
