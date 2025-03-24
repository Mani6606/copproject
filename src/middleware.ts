import {  NextResponse } from "next/server";

const RATE_LIMIT = 5; 
const WINDOW = 60000; 
const requestsMap = new Map<string, { count: number; startTime: number }>();

export function middleware(req: any) {
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    const country = req.headers.get('x-vercel-ip-country'); // Default to 'IN'

    console.log(`User from country: ${country}`);
    const countryRedirects: Record<string, string> = {
      US: '/us',
      UK: '/uk',
      IN: '/india',
    };

    // Redirect if a mapping exists for the country
    if (countryRedirects[country]) {
      return NextResponse.redirect(new URL(countryRedirects[country], req.url));
    }
  }

  console.log(req,"req")
  const allowAccess = req.cookies.get("allowAccess")?.value;

  if (req.nextUrl.pathname.startsWith("/edge-check")) {
    if (allowAccess !== "true") {
      return new NextResponse("Unauthorized - Access Denied", { status: 401 });
    }
  }
  
  if (req.nextUrl.pathname !== "/ratelimit") {
    return NextResponse.next();
  }
  

  const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
  console.log(ip,"ip from the incomming the request");
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
  response.headers.set("X-Request-Count", count.toString()); // Attach request count as a header
  return response;
}

export const config = {
  matcher: ["/ratelimit", "/edge-check","/"],
};
