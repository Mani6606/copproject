import { NextResponse } from "next/server";

const RATE_LIMIT = 5;
const WINDOW = 60000; // 1 minute
const requestsMap = new Map();

export function middleware(req:any) {
  const { pathname, searchParams } = req.nextUrl;
  const response = NextResponse.next();

  // Set security headers
  const securityHeaders = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy": "default-src 'self'; img-src * data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com",
    "Permissions-Policy": "geolocation=(), microphone=()",
  };
  Object.entries(securityHeaders).forEach(([key, value]) => response.headers.set(key, value));

  // Define malicious patterns
  const MALICIOUS_PATTERNS = [
    /<script.*?>/i, /javascript:/i, /onerror\s*=/i, /onload\s*=/i, /alert\s*\(/i,
    /document\.cookie/i, /eval\s*\(/i, /\bselect\b.*\bfrom\b/i, /\bunion\b.*\bselect\b/i,
    /%3Cscript%3E/i
  ];

  // Validate query parameters for malicious patterns
  for (const value of searchParams.values()) {
    if (MALICIOUS_PATTERNS.some(pattern => pattern.test(value))) {
      return NextResponse.json({ message: "Forbidden: Suspicious activity detected!" }, { status: 403 });
    }
  }

  // Redirects & Rewrites
  const redirects:any = {
    "/a-page": "/b-page",
  };

  if (redirects[pathname]) {
    return NextResponse.redirect(new URL(redirects[pathname], req.url));
  }

  if (pathname === "/c-page") {
    const rewriteResponse = NextResponse.rewrite(new URL("/b-page", req.url));
    rewriteResponse.headers.set("X-Custom-Header", "rewritten by middleware");
    rewriteResponse.cookies.set("testCookie", "set by middleware", { httpOnly: true, secure: true, path: "/" });
    return rewriteResponse;
  }

  // Country-based redirection
  if (pathname === "/") {
    const country = req.headers.get("x-vercel-ip-country");
    const countryRedirects:any = { US: "/us", UK: "/uk", IN: "/india" };
    if (countryRedirects[country]) {
      return NextResponse.redirect(new URL(countryRedirects[country], req.url));
    }
  }

  // Restrict access to `/edge-check`
  if (pathname.startsWith("/edge-check") && req.cookies.get("allowAccess")?.value !== "true") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Rate limiting for `/ratelimit` and `/api/test`
  if (pathname === "/ratelimit" || pathname.startsWith("/api/test")) {
    const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    const now = Date.now();

    if (!requestsMap.has(ip)) {
      requestsMap.set(ip, { count: 1, startTime: now });
    } else {
      const data = requestsMap.get(ip);
      if (now - data.startTime < WINDOW) {
        if (data.count >= RATE_LIMIT) {
          return new NextResponse("Too many requests, try again later.", { status: 429 });
        }
        data.count++;
      } else {
        requestsMap.set(ip, { count: 1, startTime: now });
      }
    }
    response.headers.set("X-Request-Count", requestsMap.get(ip).count.toString());
  }

  return response;
}

export const config = {
  matcher: ["/ratelimit", "/edge-check", "/", "/api/test", "/b-page", "/a-page", "/c-page"],
};
