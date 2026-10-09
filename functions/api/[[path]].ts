interface Env {
  BACKEND_URL?: string;
}

// Cloudflare Pages Function acting as an Edge Reverse Proxy to the backend
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);

  // Backend origin: defaults to user's IP or Cloudflare Pages env variable BACKEND_URL
  const backendBase = (context.env.BACKEND_URL || 'http://156.239.227.107:1337').replace(/\/+$/, '');
  const targetUrl = `${backendBase}${url.pathname}${url.search}`;

  // Forward request with preserved headers and client forwarding markers
  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

  const newRequest = new Request(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'manual'
  });

  try {
    return await fetch(newRequest);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Backend connection failed: ${msg}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    });
  }
};
