import { auth } from "@auth";
import { NextResponse } from "next/server";

import { dashboardHomeFor, ROUTES } from "./constants/routes";
import { UserRole } from "./types/role";

// optimistic check only - pages still call requireRole/requireSession
const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  [ROUTES.DASHBOARD.TEACHER]: [UserRole.Teacher],
  [ROUTES.DASHBOARD.STUDENT]: [UserRole.Student],
  [ROUTES.DASHBOARD.AVAILABILITY]: [UserRole.Teacher],
};

export default auth((req) => {
  const { nextUrl } = req;
  const userRole = req.auth?.user?.role;
  const home = dashboardHomeFor(userRole);

  // every dashboard page needs a signed-in user with a known role
  if (!req.auth || !home) {
    return NextResponse.redirect(new URL(ROUTES.SIGN_IN, nextUrl));
  }

  const matchedPath = Object.keys(PROTECTED_ROUTES).find(
    (path) =>
      nextUrl.pathname === path || nextUrl.pathname.startsWith(`${path}/`),
  );

  if (
    matchedPath &&
    !PROTECTED_ROUTES[matchedPath].includes(userRole as UserRole)
  ) {
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
