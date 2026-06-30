import type { UserRole } from "./next-auth";

export interface UserSession {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string;
  role: UserRole;
}

// If passing the whole session object
export interface SessionData {
  user?: UserSession;
  expires: string;
  backendToken?: string;
}

// types.ts
export interface SocialUserData {
  id: number;
  email: string;
  name: string;
  provider: string;
  providerId: string;
  image?: string;
  role: UserRole;
  passwordChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLoginResponse<T = SocialUserData> {
  status: string;
  token: string;
  data: {
    user: T;
  };
}
