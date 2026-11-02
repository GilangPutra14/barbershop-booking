import { NextResponse } from 'next/server';

export function middleware(request) {
  const session = request.cookies.get('admin_session');
  const url = request.nextUrl.clone();

  // Jika mencoba masuk ke halaman /admin tetapi belum login
  if (url.pathname.startsWith('/admin')) {
    if (!session || session.value !== 'authenticated') {
      url.pathname = '/login';
      return NextResponse.redirect(url); // Tendang ke halaman login
    }
  }

  // Jika sudah login tetapi malah membuka halaman login lagi, arahkan langsung ke admin
  if (url.pathname.startsWith('/login') && session?.value === 'authenticated') {
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Menentukan halaman mana saja yang dijaga oleh middleware ini
export const config = {
  matcher: ['/admin/:path*', '/login'],
};
