import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // Check for the auth cookie
    const token = request.cookies.get("pg_access_token")?.value;

    // Define protected routes
    const protectedRoutes = ["/dashboard", "/analyze", "/upload", "/processing", "/results"];

    const isProtectedRoute = protectedRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute && !token) {
        // Redirect to login if accessing protected route without token
        const loginUrl = new URL("/login", request.url);
        // Optional: Add redirect param to return after login
        loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from auth pages
    if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") && token) {
        return NextResponse.redirect(new URL("/dashboard/analyze", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
