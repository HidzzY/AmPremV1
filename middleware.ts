import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Domain email whitelist policy
const ALLOWED_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.id',
  'outlook.com',
  'hotmail.com',
  'icloud.com'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and internal API endpoints bypass middleware
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check auth cookie/session token
  const token = request.cookies.get('sb-access-token')?.value || 
                request.cookies.get('alight_session')?.value;
  const userEmail = request.cookies.get('alight_user_email')?.value;

  const isAuthPage = pathname === '/login' || pathname === '/auth' || pathname === '/register';

  // 1. Mandatory Public Gatekeeper: Unauthenticated users MUST be redirected to /login
  if (!token && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 2. If logged in and visits /login, redirect to /dashboard
  if (token && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // 3. Strict Email Domain Validation in Callback
  if (userEmail) {
    const domain = userEmail.split('@')[1]?.toLowerCase();
    if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'domain_not_allowed');
      const response = NextResponse.redirect(url);
      response.cookies.delete('sb-access-token');
      response.cookies.delete('alight_session');
      response.cookies.delete('alight_user_email');
      return response;
    }
  }

  // 4. Admin Access Control: /admin ONLY accessible by wahidrahmannn1324@gmail.com
  if (pathname.startsWith('/admin')) {
    if (userEmail?.toLowerCase() !== 'wahidrahmannn1324@gmail.com') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('error', 'unauthorized_admin');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
