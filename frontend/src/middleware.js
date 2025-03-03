import { NextResponse } from 'next/server';

import {jwtDecode} from 'jwt-decode';
export function middleware(request) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  console.log('path: ', path);
  // Send users to the events page if they try to access the root path
  if (path == '/') {
    return NextResponse.redirect(new URL('/events', request.nextUrl));
  }

  // Define paths that are considered public (don't require authentication)
  const isPublicPath = path === '/login' || path === '/events' || path === '/register';

  //  If path is not public, check if the user is authenticated
  // Get the token from cookies
  const token = request.cookies.get('token')?.value || '';
  if (!token) {
    if (isPublicPath) {
      return NextResponse.next();
    }else{
      return NextResponse.redirect(new URL('/login', request.nextUrl));
    }
  }else{
    const role = jwtDecode(token).role;
    if (path == '/login' || path == '/register') {
      if (role == 'admin') {
        return NextResponse.redirect(new URL('/admin/events', request.nextUrl));
      }else if (role == 'user') {
        return NextResponse.redirect(new URL('/events', request.nextUrl));
      }
    }else{
      console.log('role: ', role);
      if (role == 'user') {
        if (path == '/admin/events') {
          return NextResponse.redirect(new URL('/events', request.nextUrl));
        }
      }
    }
  }

  return NextResponse.next();
}

// Specify which paths this middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/bookings/:path*',
    '/login',
    '/events',
    '/register',
    '/forgot-password',
    '/',
    '/admin/events',
  ],
};