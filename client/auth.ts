import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { api } from "@utils/api";
import { SignInSchema } from "@utils/validation";

export const { handlers, auth, signIn, signOut } = NextAuth({
	trustHost: true,
	providers: [
		GitHub,
		Google,
		Credentials({
			id: "credentials",
			async authorize(credentials) {
				if (!credentials) return null;

				// Validate fields
				const validated = SignInSchema.safeParse(credentials);
				if (!validated.success) return null;

				const { email, password } = validated.data;

				try {
					// Call backend login endpoint
					const res = await api.auth.signIn({ email, password });
					if (!res?.data?.user) return null;
					const {
						data: { user },
						token,
					} = res;
					// Return user object with minimal required fields
					return {
						id: String(user.id),
						name: user.name,
						email: user.email,
						image: user.image ?? null,
						role: user.role,
						backendJwt: token,
					};
				} catch (err) {
					console.error("Credentials authorize error:", err);
					return null;
				}
			},
		}),
	],
	callbacks: {
		async signIn({ user, account }) {
			// Only sync if it's an OAuth provider
			if (account && account.provider !== "credentials") {
				if (!user.email || !user.name) return false;

				try {
					const syncedUser = await api.socialAuth.signInWithProvider(user, {
						provider: account.provider,
						providerAccountId: account.providerAccountId!,
					});

					// Store backend ID and JWT for the jwt callback
					user.id = String(syncedUser.data.user.id);
					user.backendJwt = syncedUser.token;
					user.role = syncedUser.data.user.role;

					return true;
				} catch (err) {
					console.error("Social auth sync error:", err);
					return false;
				}
			}

			// ✅ Always allow credentials logins
			return true;
		},

		async jwt({ token, user, account }) {
			if (user) {
				token.id = user.id;
				token.backendJwt = user.backendJwt;
				token.role = user.role;
			}

			if (account) {
				token.accessToken = account.access_token;
			}

			return token;
		},

		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.role = token.role as "Student" | "Teacher";
			}
			session.backendToken = token.backendJwt as string;
			return session;
		},
	},
});
