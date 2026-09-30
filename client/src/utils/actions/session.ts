import "server-only";

import { auth } from "@auth";

type AccountRole = "Teacher" | "Student";

// the signed-in user's backend token for server actions, or null if they're
// signed out (or don't have the required role). keeps the token server side
export const getBackendSession = async (role?: AccountRole) => {
  const session = await auth();
  if (!session?.backendToken) return null;
  if (role && session.user?.role !== role) return null;
  return { token: session.backendToken, role: session.user?.role };
};
