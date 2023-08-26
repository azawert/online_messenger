import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuth = await getToken({ req: request });
  const isLoginPage = pathname.startsWith("/login");
  const sensitiveRoutes = ["/dashboard"];
  const isAccessingSensitiveRoute = sensitiveRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isLoginPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }
  if (!isAuth && isAccessingSensitiveRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
