import { auth } from "@auth";
import { Settings2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AvailabilityPlanner from "@components/dashboard/availability/AvailabilityPlanner";
import { api, type OwnAvailabilitySlot } from "@utils/api";
import { addDaysToKey, ukInstant, ukWeekStartKey } from "@utils/ukTime";

const hoursLabel = (hours: number) => {
  if (hours === 0) return "any time";
  if (hours % 24 === 0) return `${hours / 24} day${hours === 24 ? "" : "s"}`;
  return `${hours} hours`;
};

const AvailabilityPage = async () => {
  const session = await auth();

  if (session?.user?.role !== "Teacher" || !session.backendToken) {
    redirect("/dashboard");
  }

  const token = session.backendToken;
  const weekStartKey = ukWeekStartKey(new Date());

  const [slotsResponse, profileResponse] = await Promise.all([
    api.availability
      .getMine({ from: ukInstant(weekStartKey), to: ukInstant(addDaysToKey(weekStartKey, 7)) }, token)
      .catch(() => null),
    api.teacher.getMyProfile(token).catch(() => null),
  ]);

  const initialSlots: OwnAvailabilitySlot[] = slotsResponse?.data ?? [];
  const policy = profileResponse?.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Availability
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Drag across the grid to add teaching hours, or click a slot to manage it.
          </p>
        </div>

        {policy && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-600 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <div className="space-y-0.5">
              <p>
                Students book {hoursLabel(policy.minNoticeHours)} to {policy.maxAdvanceDays} days ahead
                {policy.requireApproval ? " · you approve each booking" : ""}
              </p>
              <p className="text-slate-400">
                Free cancellation until {hoursLabel(policy.cancellationCutoffHours)} before
              </p>
            </div>
            <Link
              href={"/dashboard/teacher/profile#booking-policy" as Route}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Settings2 size={13} /> Booking rules
            </Link>
          </div>
        )}
      </div>

      <AvailabilityPlanner initialWeekStartKey={weekStartKey} initialSlots={initialSlots} />
    </div>
  );
};

export default AvailabilityPage;
