import { NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/plans', '/payment-history'];
const AUTH_ROUTES = ['/login', '/signup'];

// Next.js 16: function must be named 'proxy' (previously 'middleware')
export function proxy(request) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('rzp_auth_token')?.value;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/plans', '/payment-history', '/login', '/signup'],
};
