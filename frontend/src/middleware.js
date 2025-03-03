// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define paths that are considered public (don't require authentication)
  const isPublicPath = path === '/login' || path === '/register' || path === '/forgot-password';

  // Get the token from cookies
  const token = request.cookies.get('token')?.value || '';

  // If the path requires authentication and no token is present, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // If user is logged in and tries to access login page, redirect to dashboard
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  // Otherwise, continue with the request
  return NextResponse.next();
}

// Specify which paths this middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/events/:path*',
    '/bookings/:path*',
    '/login',
    '/register',
    '/forgot-password'
  ],
};