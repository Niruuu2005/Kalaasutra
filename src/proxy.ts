import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  // Add the current pathname to request headers so Server Components can read it
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // Run middleware on all paths except static assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\..*$).*)'
  ],
};
