import { NextResponse } from "next/server";

const RATE_LIMIT = 5;
const WINDOW = 60000; // 1 minute
const requestsMap = new Map<string, { count: number; startTime: number }>();

export function middleware(req: any) {
  const { pathname } = req.nextUrl;
  
  if (pathname === "/a-page") {
    const url = new URL("/b-page", req.url);
    return NextResponse.redirect(url);
  }
  
  if (pathname === "/c-page") {

    const response = NextResponse.rewrite(new URL("/b-page", req.url));
    response.headers.set("X-Custom-Header", "rewrited by middleware");
    response.cookies.set("testCookie", "setted by middleware", {
      httpOnly: true,
      secure: true,
      path: "/",
    })
    return response
  }

  // Redirect users based on country
  if (pathname === "/") {
    const country = req.headers.get("x-vercel-ip-country");

    console.log(`User from country: ${country}`);
    const countryRedirects: Record<string, string> = {
      US: "/us",
      UK: "/uk",
      IN: "/india",
    };

    if (countryRedirects[country]) {
      return NextResponse.redirect(new URL(countryRedirects[country], req.url));
    }
  }

  console.log(req, "req");
  const allowAccess = req.cookies.get("allowAccess")?.value;

  // Restrict access to /edge-check
  if (pathname.startsWith("/edge-check") && allowAccess !== "true") {
        return NextResponse.redirect(new URL("/login", req.url));

  }

  // Apply rate limit to both `/ratelimit` and `/api/test`
  if (pathname === "/ratelimit" || pathname.startsWith("/api/test")) {
    const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    console.log(ip, "ip from the incoming request");

    const now = Date.now();
    let count = 1;

    if (!requestsMap.has(ip)) {
      requestsMap.set(ip, { count: 1, startTime: now });
    } else {
      const data = requestsMap.get(ip)!;

      if (now - data.startTime < WINDOW) {
        if (data.count >= RATE_LIMIT) {
          return new NextResponse("Too many requests, try again later.", { status: 429 });
        }
        data.count++;
        count = data.count;
      } else {
        // Reset the counter after the window period
        requestsMap.set(ip, { count: 1, startTime: now });
      }
    }

    const response = NextResponse.next();
    response.headers.set("X-Request-Count", count.toString());
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ratelimit", "/edge-check", "/", "/api/test","/b-page", "/a-page", "/c-page"],
};
