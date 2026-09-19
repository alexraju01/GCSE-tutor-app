import { fetchData } from "@utils/fetchData";
import { Teacher } from "../types/teacher";
import type { SocialLoginResponse, SocialUserData } from "../types/auth";
// import type { Lesson } from "@types/lesson";

export interface AvailabilityPayloadItem {
  startTime: string; // ISO 8601 string
  durationInMinutes: number;
}

export interface TeacherAvailabilitySlot {
  id: string;
  teacherId: string;
  startTime: string;
  endTime: string;
}

export interface LessonBookingPayloadItem {
  teacherProfileId: string;
  availabilityId: string;
  subject: string;
  topic?: string;
  notes?: string;
}

const authHeaders = (token?: string) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

export interface GetLessonsParams {
  page?: number;
  limit?: number;
  status?: string;
  subject?: string;
  year?: number;
  month?: number;
  sort?: SortDirection;
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

      return fetchData<SocialLoginResponse<SocialUserData>>(
        "/auth/social-sync",
        {
          method: "POST",
          body: payload,
          // server-only secret so the backend knows this came from the next.js
          // server and not a browser (see auth.ts signIn callback)
          headers: {
            "x-internal-secret": process.env.BACKEND_INTERNAL_SECRET ?? "",
          },
        },
      );
    },
  },

  teacher: {
    getAll: () => fetchData<APIResponse<Teacher[]>>("/teachers"),
    getOne: (id: string, token?: string) =>
      fetchData<APIResponse<Teacher>>(`/teachers/${encodeURIComponent(id)}`, {
        headers: authHeaders(token),
      }),
    getAvailabilities: (
      id: string,
      params?: { limit?: number; page?: number },
      token?: string,
    ) => {
      const query = new URLSearchParams();
      if (params?.limit !== undefined) query.set("limit", String(params.limit));
      if (params?.page !== undefined) query.set("page", String(params.page));
      const qs = query.toString();

      return fetchData<APIResponse<TeacherAvailabilitySlot[]>>(
        `/teachers/${encodeURIComponent(id)}/availabilities${qs ? `?${qs}` : ""}`,
        { headers: authHeaders(token) },
      );
    },
    getMyProfile: (token: string) =>
      fetchData<APIResponse<Teacher>>("/teachers/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    updateOne: (id: string, data: Partial<Teacher>) =>
      fetchData<APIResponse<Teacher>>(`/teachers/${encodeURIComponent(id)}`, {
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
      fetchData<APIResponse<StudentDashboardData>>("/dashboard/student", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
  },

  availability: {
    getByTeacherId: (teacherId: string, token?: string) =>
      fetchData<APIResponse<AvailabilityPayloadItem[]>>(
        `/availability/${encodeURIComponent(teacherId)}`,
        {
          method: "GET",
          headers: authHeaders(token),
        },
      ),

    getMyTeacherAvailabilities: (token?: string) =>
      fetchData<APIResponse<AvailabilityPayloadItem[]>>(`/availability/me`, {
        method: "GET",
        headers: authHeaders(token),
      }),

    create: (data: AvailabilityPayloadItem, token?: string) =>
      fetchData<APIResponse<TeacherAvailabilitySlot>>("/availability", {
        method: "POST",
        body: data,
        headers: authHeaders(token),
      }),

    remove: (id: string, token?: string) =>
      fetchData<void>(`/availability/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: authHeaders(token),
      }),

    removeMany: (ids: string[], token?: string) =>
      fetchData<void>("/availability", {
        method: "DELETE",
        body: { ids },
        headers: authHeaders(token),
      }),
  },

  lesson: {
    create: (items: LessonBookingPayloadItem[], token: string) =>
      fetchData<APIResponse<Lesson[]>>("/lessons", {
        method: "POST",
        body: items,
        headers: { Authorization: `Bearer ${token}` },
      }),

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
