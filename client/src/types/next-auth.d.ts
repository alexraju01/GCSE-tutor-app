import { type DefaultSession, type DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

type UserRole = "STUDENT" | "TEACHER";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      role: UserRole;
    } & DefaultSession["user"];
    backendToken?: string;
  }

  interface User extends DefaultUser {
    role?: UserRole;
    backendJwt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    backendJwt?: string;
    accessToken?: string;
    role?: UserRole;
  }
}
