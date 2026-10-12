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

  // Support token header priority and cookie deduplication
  const tokenHeader = request.headers.get('X-Roselle-Token') || request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  const currentCookie = headers.get('Cookie') || '';

  if (tokenHeader) {
    // When the client explicitly passes X-Roselle-Token, it is the active, verified session token.
    // Purge ANY stale or duplicate roselle_web cookies and inject the exact active token.
    const otherCookies = currentCookie
      .split(';')
      .map(c => c.trim())
      .filter(c => c && !c.startsWith('roselle_web='))
      .join('; ');
    headers.set('Cookie', otherCookies ? `roselle_web=${tokenHeader}; ${otherCookies}` : `roselle_web=${tokenHeader}`);
  } else if (currentCookie.includes('roselle_web=')) {
    // If no header token is provided, check for multiple roselle_web cookies in the Cookie header.
    // Browsers often accumulate duplicate cookies across paths/domains; the last one is the latest.
    const parts = currentCookie.split(';').map(c => c.trim()).filter(Boolean);
    const roselleCookies = parts.filter(c => c.startsWith('roselle_web='));
    const otherCookies = parts.filter(c => !c.startsWith('roselle_web='));
    if (roselleCookies.length > 1) {
      const latestRoselle = roselleCookies[roselleCookies.length - 1];
      headers.set('Cookie', [latestRoselle, ...otherCookies].join('; '));
    }
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
    const getSetCookieFn = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
    const rawSetCookies: string[] = typeof getSetCookieFn === 'function'
      ? getSetCookieFn.call(res.headers)
      : (res.headers.get('Set-Cookie') ? [res.headers.get('Set-Cookie')!] : []);

    if (rawSetCookies.length > 0) {
      responseHeaders.delete('Set-Cookie');
      for (const sc of rawSetCookies) {
        let rewritten = sc.replace(/SameSite=Strict/gi, 'SameSite=None; Secure');
        if (!rewritten.includes('Partitioned') && !rewritten.includes('Max-Age=0') && !rewritten.includes('expires=')) {
          rewritten += '; Partitioned';
        }
        responseHeaders.append('Set-Cookie', rewritten);

        const tokenMatch = sc.match(/roselle_web=([^;]+)/);
        if (tokenMatch && tokenMatch[1] && tokenMatch[1] !== 'deleted') {
          responseHeaders.set('X-Roselle-Token', tokenMatch[1]);
        }
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

