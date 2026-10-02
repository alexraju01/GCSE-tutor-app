"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { BookingPolicy } from "@/types/teacher";

import { buttonClass, labelClass } from "@components/ui/styles";
import { updateBookingPolicyAction } from "@utils/actions/lesson.action";
import { formatHours } from "@utils/format";

interface BookingPolicySectionProps {
  policy: BookingPolicy;
}

// keep within the ranges in teacherPolicyShape on the server
const NOTICE_OPTIONS = [0, 2, 6, 12, 24, 48];
const ADVANCE_OPTIONS = [14, 30, 60, 90, 180];
const CUTOFF_OPTIONS = [0, 12, 24, 48];

const hoursOption = (hours: number) => (hours === 0 ? "No minimum" : formatHours(hours));

// include the current value in case it was set outside these presets
const withCurrent = (presets: number[], current: number) =>
  [...new Set([...presets, current])].sort((a, b) => a - b);

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
    <Card
      id="booking-policy"
      className="scroll-mt-24 rounded-2xl border-slate-100 bg-white shadow-sm"
    >
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
              Bookings arrive as requests you accept or decline. Unanswered requests expire at the
              lesson time.
            </span>
          </span>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="policy-notice" className={labelClass}>
              Minimum notice
            </label>
            <Select
              id="policy-notice"
              value={policy.minNoticeHours}
              onChange={(minNoticeHours) => update({ minNoticeHours })}
              options={withCurrent(NOTICE_OPTIONS, policy.minNoticeHours).map((h) => ({
                value: h,
                label: hoursOption(h),
              }))}
            />
          </div>

          <div>
            <label htmlFor="policy-advance" className={labelClass}>
              Book up to
            </label>
            <Select
              id="policy-advance"
              value={policy.maxAdvanceDays}
              onChange={(maxAdvanceDays) => update({ maxAdvanceDays })}
              options={withCurrent(ADVANCE_OPTIONS, policy.maxAdvanceDays).map((d) => ({
                value: d,
                label: `${d} days ahead`,
              }))}
            />
          </div>

          <div>
            <label htmlFor="policy-cutoff" className={labelClass}>
              Free cancellation until
            </label>
            <Select
              id="policy-cutoff"
              value={policy.cancellationCutoffHours}
              onChange={(cancellationCutoffHours) => update({ cancellationCutoffHours })}
              options={withCurrent(CUTOFF_OPTIONS, policy.cancellationCutoffHours).map((h) => ({
                value: h,
                label: h === 0 ? "The lesson starts" : `${hoursOption(h)} before`,
              }))}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isPending}
            className={buttonClass("primary")}
          >
            {isPending ? "Saving..." : "Save booking rules"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
