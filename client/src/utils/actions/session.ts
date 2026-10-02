import type { Route } from "next";
import { redirect } from "next/navigation";

import "server-only";

import { auth } from "@auth";

import { ROUTES, dashboardHomeFor } from "@/constants/routes";
import type { UserRole } from "@/types/role";

type AccountRole = "Teacher" | "Student";

// the signed-in user's backend token for server actions, or null if they're
// signed out (or don't have the required role). keeps the token server side
export const getBackendSession = async (role?: AccountRole) => {
  const session = await auth();
  if (!session?.backendToken) return null;
  if (role && session.user?.role !== role) return null;
  return { token: session.backendToken, role: session.user?.role };
};

// for server components/pages: signed out, or a role we don't recognise,
// goes to sign-in. never redirects to another role-guarded page, so two
// guarded pages can't bounce a user between each other
export const requireSession = async () => {
  const session = await auth();
  const user = session?.user;

  if (!session || !user || !dashboardHomeFor(user.role)) {
    redirect(ROUTES.SIGN_IN);
  }

  return {
    user,
    role: user.role,
    token: session.backendToken ?? "",
    isTeacher: user.role === "Teacher",
  };
};

// the proxy checks this too, but it's only an optimistic check - pages
// shouldn't rely on it alone. the wrong role goes to their own dashboard
export const requireRole = async (role: UserRole) => {
  const session = await requireSession();

  if (session.role !== role) {
    redirect(dashboardHomeFor(session.role) as Route);
  }

  return session;
};
