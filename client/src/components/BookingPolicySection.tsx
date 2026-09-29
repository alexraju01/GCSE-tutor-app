"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BookingPolicy } from "@/types/teacher";
import { updateBookingPolicyAction } from "@utils/actions/lesson.action";

interface BookingPolicySectionProps {
  policy: BookingPolicy;
}

// keep within the ranges in teacherPolicyShape on the server
const NOTICE_OPTIONS = [0, 2, 6, 12, 24, 48];
const ADVANCE_OPTIONS = [14, 30, 60, 90, 180];
const CUTOFF_OPTIONS = [0, 12, 24, 48];

const hoursOption = (hours: number) => {
  if (hours === 0) return "No minimum";
  if (hours % 24 === 0) return `${hours / 24} day${hours === 24 ? "" : "s"}`;
  return `${hours} hours`;
};

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none";

export const BookingPolicySection = ({ policy: initialPolicy }: BookingPolicySectionProps) => {
  const [policy, setPolicy] = useState(initialPolicy);
  const [saved, setSaved] = useState(initialPolicy);
  const [isPending, startTransition] = useTransition();

  const isDirty = JSON.stringify(policy) !== JSON.stringify(saved);
  const update = (patch: Partial<BookingPolicy>) => setPolicy((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateBookingPolicyAction(policy);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPolicy(result.data);
      setSaved(result.data);
      toast.success("Booking rules saved.");
    });
  };

  return (
    <Card id="booking-policy" className="scroll-mt-24 rounded-2xl border-slate-100 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">Booking rules</CardTitle>
        <p className="text-xs text-slate-500">
          Students see these before they book. Changes apply to new bookings and cancellations.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5">
          <input
            type="checkbox"
            checked={policy.requireApproval}
            onChange={(e) => update({ requireApproval: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-blue-600"
          />
          <span className="text-sm text-slate-700">
            <span className="block font-medium text-slate-900">Approve each booking myself</span>
            <span className="text-xs text-slate-500">
              Bookings arrive as requests you accept or decline. Unanswered requests expire at the lesson time.
            </span>
          </span>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="policy-notice" className="mb-1.5 block text-xs font-medium text-slate-600">
              Minimum notice
            </label>
            <select
              id="policy-notice"
              value={policy.minNoticeHours}
              onChange={(e) => update({ minNoticeHours: Number(e.target.value) })}
              className={selectClass}
            >
              {[...new Set([...NOTICE_OPTIONS, policy.minNoticeHours])].sort((a, b) => a - b).map((h) => (
                <option key={h} value={h}>
                  {hoursOption(h)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="policy-advance" className="mb-1.5 block text-xs font-medium text-slate-600">
              Book up to
            </label>
            <select
              id="policy-advance"
              value={policy.maxAdvanceDays}
              onChange={(e) => update({ maxAdvanceDays: Number(e.target.value) })}
              className={selectClass}
            >
              {[...new Set([...ADVANCE_OPTIONS, policy.maxAdvanceDays])].sort((a, b) => a - b).map((d) => (
                <option key={d} value={d}>
                  {d} days ahead
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="policy-cutoff" className="mb-1.5 block text-xs font-medium text-slate-600">
              Free cancellation until
            </label>
            <select
              id="policy-cutoff"
              value={policy.cancellationCutoffHours}
              onChange={(e) => update({ cancellationCutoffHours: Number(e.target.value) })}
              className={selectClass}
            >
              {[...new Set([...CUTOFF_OPTIONS, policy.cancellationCutoffHours])].sort((a, b) => a - b).map((h) => (
                <option key={h} value={h}>
                  {h === 0 ? "The lesson starts" : `${hoursOption(h)} before`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isPending}
            className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save booking rules"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
