import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isSuperAdmin(authData: any): boolean {
  if (!authData?.user?.roles) return false;
  return authData.user.roles.some((role: any) => role.name === "ROLE_SUPER_ADMIN");
}

export function middleware(request: NextRequest) {
  const authData = request.cookies.get('auth-storage')?.value;
  const pathname = request.nextUrl.pathname;

  // Ruta raíz: redirigir a /dashboard (el middleware validará auth allí)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Ruta pública: login
  if (pathname === '/login') {
    // Si ya está autenticado como super admin, redirigir al dashboard
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed?.token && isSuperAdmin(parsed)) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch (error) {
        // Cookie corrupta, permitir acceso al login
      }
    }
    return NextResponse.next();
  }

  // Rutas protegidas: todo lo de /dashboard
  if (!authData) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let parsed;
  try {
    parsed = JSON.parse(authData);
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const token = parsed?.token;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Validar que sea SUPER_ADMIN
  if (!isSuperAdmin(parsed)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login',
  ],
};
