import {  NextResponse } from "next/server";

const RATE_LIMIT = 5; 
const WINDOW = 60000; 
const requestsMap = new Map<string, { count: number; startTime: number }>();

export function middleware(req: any) {
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
  matcher: "/ratelimit",
};
