"use client";

import { useState } from "react";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { GraduationCap } from "lucide-react";

import type { Teacher, TeachesSubject } from "@/types/teacher";

import { buttonClass } from "@components/ui/styles";
import { formatSubject } from "@utils/format";

import BookLessonModal from "./BookLessonModal/BookLessonModal";

interface TeacherCardProps {
  teacher: Teacher;
}

const TeacherCard = ({ teacher }: TeacherCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const groupedTeaches = teacher.teaches
    ? Object.groupBy(teacher.teaches, (item: TeachesSubject) => item.level || "UNKNOWN")
    : {};
  return (
    <>
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
        <div className="absolute top-0 right-0 left-0 h-1 origin-left scale-x-0 bg-blue-600 transition-transform duration-300 group-hover:scale-x-100" />

        <div>
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 ring-slate-100 transition-all group-hover:ring-blue-100">
              <Image
                referrerPolicy="no-referrer"
                src={teacher.image || ""}
                alt={teacher.name || "Teacher Image"}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                <Link href={`/teachers/${teacher.id}` as Route} className="hover:underline">
                  {teacher.name}
                </Link>
              </h2>
              <p className="mt-1 flex w-full min-w-0 items-center gap-1 text-xs font-medium text-slate-500">
                <GraduationCap size={14} className="shrink-0 text-blue-600" />
                <span className="truncate">{teacher.qualifications}</span>
              </p>
            </div>
          </div>

          {teacher.teaches && teacher.teaches.length > 0 && (
            <div className="mt-5 space-y-3.5 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              {Object.entries(groupedTeaches).map(([level, Subjects]) => (
                <div
                  key={level}
                  className="flex items-start gap-3 border-b border-slate-200/60 pb-3 last:border-0 last:pb-0"
                >
                  <span className="w-20 shrink-0 rounded-md bg-blue-600 py-1 text-center text-[9px] font-extrabold tracking-wider text-white uppercase shadow-xs">
                    {level.replace("_", " ")}
                  </span>
                  <div className="flex flex-1 flex-wrap gap-1.5">
                    {Subjects?.map((item, index) => (
                      <span
                        key={index}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 capitalize shadow-2xs"
                      >
                        {formatSubject(item.subject).toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-slate-600">{teacher.bio}</p>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <span className="text-2xl font-extrabold text-slate-900">£{teacher.hourlyRate}</span>
            <span className="text-xs font-medium text-slate-500"> / hr</span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={buttonClass("primary", "md", "px-5 py-2.5 text-sm")}
          >
            Book now
          </button>
        </div>
      </div>

      <BookLessonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teacher={teacher}
      />
    </>
  );
};

export default TeacherCard;
