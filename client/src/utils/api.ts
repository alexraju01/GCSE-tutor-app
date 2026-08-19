import { fetchData } from "@utils/fetchData";
import { Teacher } from "../types/teacher";
import type { SocialLoginResponse, SocialUserData } from "../types/auth";
// import type { Lesson } from "@types/lesson";

export interface AvailabilityPayloadItem {
	startTime: string; // ISO 8601 string
	durationInMinutes: number;
}

export interface GetLessonsParams {
	page?: number;
	limit?: number;
	status?: string;
	[key: string]: unknown;
}

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

			return fetchData<SocialLoginResponse<SocialUserData>>("/auth/social-sync", {
				method: "POST",
				body: payload,
			});
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
			fetchData<APIResponse<{ totalLessons: number }>>("/dashboard/student", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}),
	},

	availability: {
		create: (data: AvailabilityPayloadItem, token?: string) =>
			fetchData<APIResponse>("/availability", {
				method: "POST",
				body: data,
				headers: token
					? {
							Authorization: `Bearer ${token}`,
						}
					: undefined,
			}),
		getAll: (token?: string) =>
			fetchData<APIResponse<AvailabilityPayloadItem[]>>("/availability", {
				method: "GET",
				headers: token
					? {
							Authorization: `Bearer ${token}`,
						}
					: undefined,
			}),
	},

	lesson: {
		getAll: (token: string, params?: GetLessonsParams) => {
			const page = params?.page ?? 1;
			const query = new URLSearchParams({ page: String(page) });

			if (params) {
				Object.entries(params).forEach(([key, value]) => {
					if (value !== undefined && key !== "page") {
						query.append(key, String(value));
					}
				});
			}

			return fetchData<APIResponse<Lesson[]>>(`/lessons?${query.toString()}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
		},
	},
};
