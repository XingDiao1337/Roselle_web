interface Env {
  BACKEND_URL?: string;
}

// Cloudflare Pages Function acting as an Edge Reverse Proxy to the backend
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);

  // Backend origin: defaults to user domain or Cloudflare Pages env variable BACKEND_URL
  const backendBase = (context.env.BACKEND_URL || 'https://roselle.yuzaki.xyz').replace(/\/+$/, '');
  const targetUrl = `${backendBase}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

  // Ensure Host header matches the destination domain
  try {
    const targetParsed = new URL(targetUrl);
    headers.set('Host', targetParsed.host);
  } catch {}

  const newRequest = new Request(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'manual'
  });

  try {
    const res = await fetch(newRequest);
    // Intercept Cloudflare Error 1003 when a raw IP is supplied
    if (res.status === 403) {
      const clone = res.clone();
      const text = await clone.text();
      if (text.includes('1003') || text.includes('Direct IP Access Not Allowed')) {
        return new Response(
          JSON.stringify({
            error: 'Cloudflare Error 1003: Direct IP Access Not Allowed. Please configure BACKEND_URL with a domain name (e.g. https://roselle.yuzaki.xyz or http://api.yuzaki.xyz:1337) instead of a raw IP.'
          }),
          {
            status: 502,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' }
          }
        );
      }
    }
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Backend connection failed: ${msg}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    });
  }
};
