interface Env {
  BACKEND_URL?: string;
}

// Cloudflare Pages Function acting as an Edge Reverse Proxy to the backend
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const requestOrigin = request.headers.get('Origin');

  // Handle preflight OPTIONS request directly at edge
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': requestOrigin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, roselle_web, X-Roselle-Token',
        'Access-Control-Expose-Headers': 'X-Roselle-Token, Set-Cookie',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // Backend origin: defaults to user domain or Cloudflare Pages env variable BACKEND_URL
  const backendBase = (context.env.BACKEND_URL || 'http://api.yuzakitsukasa.top:1337').replace(/\/+$/, '');
  const targetUrl = `${backendBase}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

  // Ensure Host header matches the destination domain
  try {
    const targetParsed = new URL(targetUrl);
    headers.set('Host', targetParsed.host);
  } catch {}

  // Strip Origin and Referer when forwarding to the backend server.
  // This prevents Spring Boot's internal RequestPolicy from rejecting the proxy request with 403 "Web origin rejected"
  headers.delete('origin');
  headers.delete('referer');

  // Support token header fallback in case cross-origin cookies are restricted by client browser
  const tokenHeader = request.headers.get('X-Roselle-Token') || request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  const currentCookie = headers.get('Cookie') || '';
  if (tokenHeader && !currentCookie.includes('roselle_web=')) {
    headers.set('Cookie', currentCookie ? `${currentCookie}; roselle_web=${tokenHeader}` : `roselle_web=${tokenHeader}`);
  }

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
            error: 'Cloudflare Error 1003: Direct IP Access Not Allowed. Please configure BACKEND_URL with a domain name (e.g. http://api.yuzakitsukasa.top:1337) instead of a raw IP.'
          }),
          {
            status: 502,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' }
          }
        );
      }
    }

    const responseHeaders = new Headers(res.headers);

    // Attach CORS headers so caller portal (roselle.yuzaki.xyz) and CF Pages can read responses
    if (requestOrigin) {
      responseHeaders.set('Access-Control-Allow-Origin', requestOrigin);
      responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    }
    responseHeaders.set('Access-Control-Expose-Headers', 'X-Roselle-Token, Set-Cookie');

    // Rewrite Set-Cookie to allow cross-origin / embedded container usage
    const setCookie = responseHeaders.get('Set-Cookie');
    if (setCookie) {
      let rewritten = setCookie.replace(/SameSite=Strict/gi, 'SameSite=None; Secure');
      if (!rewritten.includes('Partitioned')) {
        rewritten += '; Partitioned';
      }
      responseHeaders.set('Set-Cookie', rewritten);

      // Extract roselle_web token and expose in custom header as resilient fallback
      const tokenMatch = setCookie.match(/roselle_web=([^;]+)/);
      if (tokenMatch && tokenMatch[1]) {
        responseHeaders.set('X-Roselle-Token', tokenMatch[1]);
      }
    }

    // Remove any restrictive X-Frame-Options on API responses
    responseHeaders.delete('X-Frame-Options');

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Backend connection failed: ${msg}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    });
  }
};

