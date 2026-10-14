// Allowed email domain policy
const ALLOWED_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.id',
  'outlook.com',
  'hotmail.com',
  'icloud.com'
];

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Static assets and API endpoints bypass middleware
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return;
  }

  // Parse cookies from request header
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    })
  );

  const token = cookies['alight_session'] || cookies['sb-access-token'];
  const userEmail = cookies['alight_user_email'];

  const isAuthPage = pathname === '/login' || pathname === '/auth' || pathname === '/register';

  // 1. Unauthenticated users visiting protected pages redirect to /login
  if (!token && !isAuthPage) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return Response.redirect(redirectUrl.toString(), 307);
  }

  // 2. Authenticated users visiting /login redirect to dashboard
  if (token && isAuthPage) {
    const dashboardUrl = new URL('/', request.url);
    return Response.redirect(dashboardUrl.toString(), 307);
  }

  // 3. Email domain validation in session
  if (userEmail) {
    const domain = userEmail.split('@')[1]?.toLowerCase();
    if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'domain_not_allowed');
      const response = Response.redirect(loginUrl.toString(), 307);
      response.headers.set('Set-Cookie', 'alight_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      return response;
    }
  }

  // 4. Admin Access: /admin only accessible by wahidrahmannn1324@gmail.com
  if (pathname.startsWith('/admin')) {
    if (userEmail?.toLowerCase() !== 'wahidrahmannn1324@gmail.com') {
      const dashboardUrl = new URL('/', request.url);
      dashboardUrl.searchParams.set('error', 'unauthorized_admin');
      return Response.redirect(dashboardUrl.toString(), 307);
    }
  }

  return;
}
