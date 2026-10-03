"use client";

import { useState } from "react";

import { ChevronDown, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { TeachesSubject } from "../types/teacher";

interface TeachingInformationSectionProps {
  teaches?: TeachesSubject[];
}

const formatSubjectName = (rawSubject: string) => {
  if (!rawSubject) return "";
  return rawSubject
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const TeachingInformationSection = ({ teaches = [] }: TeachingInformationSectionProps) => {
  const [subjects, setSubjects] = useState<TeachesSubject[]>(teaches);

  const removeSubject = (idToRemove: string) => {
    setSubjects(subjects.filter((sub) => sub.id !== idToRemove));
  };

  const groupedSubjects = Object.groupBy(subjects, (sub) => {
    const level = sub.level?.toUpperCase();
    if (level === "A_LEVEL" || level === "A_LEVELS") return "aLevel";
    if (level === "GCSE" || level === "GCSES") return "gcse";
    return "other";
  });

  // Access them safely in your JSX using optional chaining
  const gcseSubjects = groupedSubjects.gcse || [];
  const aLevelSubjects = groupedSubjects.aLevel || [];

  return (
    <Card className="rounded-2xl border-slate-100 bg-white shadow-sm">
      <CardHeader className="pb-5">
        <CardTitle className="text-base font-semibold text-slate-900">
          Teaching Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Subjects Grouped by Level */}
        <div className="space-y-4">
          <Label className="block text-xs font-medium text-slate-600">Subjects You Teach</Label>

          {/* GCSE Nested Row */}
          <div className="space-y-1.5 border-l-2 border-slate-100 pl-2">
            <span className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              GCSE Level
            </span>
            <div className="relative flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 pr-8">
              {gcseSubjects.length === 0 ? (
                <span className="px-1.5 py-1 text-xs text-slate-400">
                  No GCSE subjects selected...
                </span>
              ) : (
                gcseSubjects.map((sub) => (
                  <span
                    key={sub.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600"
                  >
                    {formatSubjectName(sub.subject)}
                    <X
                      className="h-3 w-3 cursor-pointer transition-colors hover:text-blue-800"
                      onClick={() => removeSubject(sub.id)}
                    />
                  </span>
                ))
              )}
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* A-Level Nested Row */}
          <div className="space-y-1.5 border-l-2 border-slate-100 pl-2">
            <span className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              A-Level
            </span>
            <div className="relative flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 pr-8">
              {aLevelSubjects.length === 0 ? (
                <span className="px-1.5 py-1 text-xs text-slate-400">
                  No A-Level subjects selected...
                </span>
              ) : (
                aLevelSubjects.map((sub) => (
                  <span
                    key={sub.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600"
                  >
                    {formatSubjectName(sub.subject)}
                    <X
                      className="h-3 w-3 cursor-pointer transition-colors hover:text-blue-800"
                      onClick={() => removeSubject(sub.id)}
                    />
                  </span>
                ))
              )}
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
