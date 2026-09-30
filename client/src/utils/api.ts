import { fetchData } from "@utils/fetchData";
import type { BookingPolicy, Teacher } from "../types/teacher";
import type { SocialLoginResponse, SocialUserData } from "../types/auth";

export interface AvailabilityPayloadItem {
  startTime: string; // ISO 8601 string
  durationInMinutes: number;
}

// A weekly pattern in UK wall-clock time; days are 0 = Monday … 6 = Sunday.
export interface RecurringAvailabilityPayload {
  days: number[];
  startDate: string; // "YYYY-MM-DD"
  from: string; // "HH:mm"
  to: string; // "HH:mm"
  lessonLength: number;
  weeks: number;
  exclude?: string[]; // "YYYY-MM-DD|HH:mm" slots removed from the preview
}

export interface TeacherAvailabilitySlot {
  id: string;
  teacherId: string;
  startTime: string;
  endTime: string;
}

// teacher's own view - includes booked slots and who booked them
export interface OwnAvailabilitySlot extends TeacherAvailabilitySlot {
  seriesId: string | null;
  isBooked: boolean;
  lesson: {
    id: string;
    status: LessonStatus;
    subject: string;
    topic: string | null;
    studentName: string | null;
    studentImage: string | null;
  } | null;
}

export interface BookableAvailabilityResponse
  extends APIResponse<TeacherAvailabilitySlot[]> {
  policy: BookingPolicy;
  bookableWindow: { from: string; to: string };
}

export interface LessonBookingPayloadItem {
  teacherProfileId: string;
  availabilityId: string;
  subject: string;
  topic?: string;
  notes?: string;
}

// comes back in ApiError.details when a booking is rejected, one per bad slot
export interface BookingConflict {
  availabilityId: string;
  reason:
    | "not_found"
    | "wrong_teacher"
    | "slot_taken"
    | "policy"
    | "subject"
    | "student_overlap";
  message: string;
}

export interface AppNotification {
  id: string;
  lessonId: string | null;
  type:
    | "LessonBooked"
    | "LessonRequested"
    | "LessonConfirmed"
    | "LessonDeclined"
    | "LessonCancelled";
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

const rangeQuery = ({ from, to }: DateRange) =>
  new URLSearchParams({ from: from.toISOString(), to: to.toISOString() }).toString();

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
  scope?: "upcoming";
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
    // only bookable slots (unbooked + inside the tutor's booking window) + the policy
    getBookableAvailabilities: (id: string, range: DateRange) =>
      fetchData<BookableAvailabilityResponse>(
        `/teachers/${encodeURIComponent(id)}/availabilities?${rangeQuery(range)}`,
      ),
    getMyProfile: (token: string) =>
      fetchData<APIResponse<Teacher>>("/teachers/me", {
        headers: authHeaders(token),
      }),
    updateMyBookingPolicy: (data: Partial<BookingPolicy>, token: string) =>
      fetchData<APIResponse<Teacher>>("/teachers/me", {
        method: "PATCH",
        body: data,
        headers: authHeaders(token),
      }),
  },

  dashboard: {
    teacherDashboard: (token: string) =>
      fetchData<APIResponse<TeacherDashboardData>>("/dashboard/teacher", {
        headers: authHeaders(token),
      }),

    studentDashboard: (token: string) =>
      fetchData<APIResponse<StudentDashboardData>>("/dashboard/student", {
        headers: authHeaders(token),
      }),
  },

  availability: {
    // all slots (booked or not) in the date range
    getMine: (range: DateRange, token?: string) =>
      fetchData<APIResponse<OwnAvailabilitySlot[]>>(
        `/availability/me?${rangeQuery(range)}`,
        { headers: authHeaders(token) },
      ),

    // Batch create — all-or-nothing, one transaction on the server.
    createMany: (data: AvailabilityPayloadItem[], token?: string) =>
      fetchData<APIResponse<TeacherAvailabilitySlot[]>>("/availability", {
        method: "POST",
        body: data,
        headers: authHeaders(token),
      }),

    // The server expands the weekly pattern itself; slots clashing with
    // existing availability come back in `skipped` instead of failing.
    createRecurring: (data: RecurringAvailabilityPayload, token?: string) =>
      fetchData<
        APIResponse<TeacherAvailabilitySlot[]> & {
          skipped?: string[];
          seriesId?: string;
        }
      >("/availability/recurring", {
        method: "POST",
        body: data,
        headers: authHeaders(token),
      }),

    removeMany: (ids: string[], token?: string) =>
      fetchData<void>("/availability", {
        method: "DELETE",
        body: { ids },
        headers: authHeaders(token),
      }),

    // removes upcoming unbooked slots in a series, booked ones are kept
    removeSeries: (seriesId: string, token?: string) =>
      fetchData<APIResponse<{ deleted: string[]; keptBooked: string[] }>>(
        `/availability/series/${encodeURIComponent(seriesId)}`,
        { method: "DELETE", headers: authHeaders(token) },
      ),
  },

  lesson: {
    // same idempotencyKey on a retry returns the original booking instead of a duplicate
    create: (
      items: LessonBookingPayloadItem[],
      token: string,
      idempotencyKey?: string,
    ) =>
      fetchData<APIResponse<Lesson[]>>("/lessons", {
        method: "POST",
        body: items,
        headers: {
          ...authHeaders(token),
          ...(idempotencyKey && { "Idempotency-Key": idempotencyKey }),
        },
      }),

    cancel: (
      lessonId: string,
      token: string,
      options: { reason?: string; reopenSlot?: boolean } = {},
    ) =>
      fetchData<void>(`/lessons/${encodeURIComponent(lessonId)}`, {
        method: "DELETE",
        body: options,
        headers: authHeaders(token),
      }),

    respond: (
      lessonId: string,
      token: string,
      decision: "approve" | "decline",
      reason?: string,
    ) =>
      fetchData<void>(`/lessons/${encodeURIComponent(lessonId)}/respond`, {
        method: "PATCH",
        body: { decision, ...(reason && { reason }) },
        headers: authHeaders(token),
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
        headers: authHeaders(token),
      });
    },
  },

  notifications: {
    getMine: (token: string) =>
      fetchData<APIResponse<AppNotification[]> & { unreadCount: number }>(
        "/notifications/me",
        { headers: authHeaders(token) },
      ),

    markRead: (id: string, token: string) =>
      fetchData<void>(`/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
        headers: authHeaders(token),
      }),

    markAllRead: (token: string) =>
      fetchData<void>("/notifications/read-all", {
        method: "PATCH",
        headers: authHeaders(token),
      }),
  },
};
