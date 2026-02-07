import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;

                // Allow access to auth pages without token
                if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
                    return true;
                }

                // Require token for protected routes
                if (
                    pathname.startsWith("/dashboard") ||
                    pathname.startsWith("/projects") ||
                    pathname.startsWith("/teams")
                ) {
                    return !!token;
                }

                return true;
            },
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/projects/:path*",
        "/teams/:path*",
        "/login",
        "/register",
    ],
};
