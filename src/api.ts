export type User = { id:string;username:string;role:'ADMIN'|'USER';disabled:boolean;expiresAt:number;active:boolean;hardwareBound:boolean;hardwareHash:string;avatar:string;createdAt:number };
export type Card = { id:string;hint:string;durationHours:number;redeemedBy:string|null;redeemedAt:number|null;createdAt:number };
export type Release = { id:string;version:string;channel:'modern'|'legacy';sha256:string;bytes:number;createdAt:number };
export type LoaderInfo = { exists:boolean;filename?:string;bytes?:number;sha256?:string;updatedAt?:number };

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export async function api<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  if (!path.startsWith('/api/web/')) throw new Error('Web client only consumes web endpoints');
  const form = data instanceof FormData;
  const targetUrl = API_BASE ? `${API_BASE}${path}` : path;
  const res = await fetch(targetUrl, {
    method,
    credentials: 'include',
    headers: form ? {} : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : form ? data : JSON.stringify(data)
  });

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
