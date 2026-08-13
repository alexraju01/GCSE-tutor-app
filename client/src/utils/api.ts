import { fetchData } from "@utils/fetchData";
import { Teacher } from "../types/teacher";
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
			role?: "Student" | "Teacher",
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
				role: role || "Student",
			};

			const res = await fetchData<SocialLoginResponse<SocialUserData>>("/auth/social-sync", {
				method: "POST",
				body: payload,
			});
			return res;
		},
	},
	teacher: {
		getAll: () => fetchData<APIResponse<Teacher[]>>("/teachers"),
		getOne: (id: string) => fetchData<APIResponse<Teacher>>(`/teachers/${id}`),
		getMyProfile: (token: string) =>
			fetchData<APIResponse<Teacher>>("/teachers/me", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}),
		updateOne: (id: string, data: Partial<Teacher>) =>
			fetchData<APIResponse<Teacher>>(`/teachers/${id}`, {
				method: "PATCH",
				body: data,
			}),
	},

	dashboard: {
		teacherDashboard: (token: string) =>
			fetchData<APIResponse<TeacherDashboardData>>("/dashboard/teacher", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}),

		studentDashboard: (token: string) =>
			fetchData<APIResponse<{ totalBookings: number }>>("/dashboard/student", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}),
	},

	lessons: {
		getAll: (token: string) =>
			fetchData<APIResponse<Lesson[]>>("/bookings", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}),
	},
};
