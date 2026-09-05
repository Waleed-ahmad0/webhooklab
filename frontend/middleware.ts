// middleware.ts (at your project root, alongside next.config.ts)
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const backendUrl = new URL(BACKEND_URL);

  const proxyUrl = new URL(url.pathname + url.search, backendUrl);

  return NextResponse.rewrite(proxyUrl, {
    request: {
      headers: new Headers({
        ...Object.fromEntries(request.headers),
        "x-forwarded-host": url.host,
        "x-forwarded-proto": url.protocol.replace(":", ""),
      }),
    },
  });
}

export const config = {
  matcher: ["/auth/:path*", "/webhook/:path*", "/api/:path*"],
};