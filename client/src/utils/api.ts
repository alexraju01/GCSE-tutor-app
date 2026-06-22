import { fetchData } from "@utils/fetchData";

import type { SocialLoginResponse, SocialUserData } from "../types/auth";

export const api = {
  auth: {
    signUp: (data: AuthCredentials) =>
      fetchData<APIResponse>("/users/signup", {
        method: "POST",
        body: data,
      }),

    signIn: (data: Pick<AuthCredentials, "email" | "password">) =>
      fetchData<AuthResponse>("/users/login", {
        method: "POST",
        body: data,
      }),
  },

  socialAuth: {
    signInWithProvider: async (
      user: {
        email?: string | null;
        name?: string | null;
        image?: string | null;
      },
      account: { provider: string; providerAccountId: string },
      role?: "STUDENT" | "TEACHER",
    ): Promise<SocialLoginResponse> => {
      if (!user.email || !user.name) {
        throw new Error("Missing required user info for social login");
      }

      const payload = {
        email: user.email,
        name: user.name,
        image: user.image ?? undefined,
        provider: account.provider,
        providerId: account.providerAccountId,
        role: role || "STUDENT",
      };

      const res = await fetchData<SocialLoginResponse<SocialUserData>>(
        "/auth/social-sync",
        {
          method: "POST",
          body: payload,
        },
      );

      return res;
    },
  },
};
