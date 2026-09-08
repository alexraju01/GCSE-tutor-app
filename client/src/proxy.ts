import { auth } from "@auth";
import { UserRole } from "./types/role";
import { NextResponse } from "next/server";
// import { UserRole } from "./types/role"; // Real JS object imported at runtime

const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  "/dashboard/teacher": [UserRole.Teacher],
  "/dashboard/student": [UserRole.Student],
};

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const userRole = req.auth?.user?.role;

  const matchedPath = Object.keys(PROTECTED_ROUTES).find((path) =>
    nextUrl.pathname.startsWith(path),
  );

  if (matchedPath) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/sign-in", nextUrl));
    }

    const allowedRoles = PROTECTED_ROUTES[matchedPath];
    if (!userRole || !allowedRoles.includes(userRole as UserRole)) {
      const fallbackRoute =
        userRole === UserRole.Teacher
          ? "/dashboard/teacher"
          : "/dashboard/student";
      return NextResponse.redirect(new URL(fallbackRoute, nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
