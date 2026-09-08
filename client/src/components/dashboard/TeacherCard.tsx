"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import { GraduationCap } from "lucide-react";
import BookLessonModal from "./BookLessonModal";
import type { Teacher, TeachesSubject } from "@/types/teacher";

interface TeacherCardProps {
  teacher: Teacher;
}

const TeacherCard = ({ teacher }: TeacherCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const groupedTeaches = teacher.teaches
    ? Object.groupBy(
        teacher.teaches,
        (item: TeachesSubject) => item.level || "UNKNOWN",
      )
    : {};

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />

        <div>
          <div className="flex gap-4 items-start">
            <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden ring-2 ring-slate-100 group-hover:ring-blue-100 transition-all">
              <Image
                src={teacher.image || ""}
                alt={teacher.name || "Teacher Image"}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                <Link
                  href={`/teachers/${teacher.id}` as Route}
                  className="hover:underline"
                >
                  {teacher.name}
                </Link>
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium w-full min-w-0">
                <GraduationCap size={14} className="text-blue-600 shrink-0" />
                <span className="truncate">{teacher.qualifications}</span>
              </p>
            </div>
          </div>

          {teacher.teaches && teacher.teaches.length > 0 && (
            <div className="mt-5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-3.5">
              {Object.entries(groupedTeaches).map(([level, Subjects]) => (
                <div
                  key={level}
                  className="flex gap-3 items-start last:border-0 pb-3 last:pb-0 border-b border-slate-200/60"
                >
                  <span className="w-20 shrink-0 text-center bg-blue-600 text-white font-extrabold text-[9px] tracking-wider uppercase py-1 rounded-md shadow-xs">
                    {level.replace("_", " ")}
                  </span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {Subjects?.map((item, index) => (
                      <span
                        key={index}
                        className="text-xs bg-white text-slate-700 font-medium px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs capitalize"
                      >
                        {item.subject.replaceAll("_", " ").toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-slate-600 mt-4 line-clamp-2 leading-relaxed">
            {teacher.bio}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-2xl font-extrabold text-slate-900">
              £{teacher.hourlyRate}
            </span>
            <span className="text-xs text-slate-500 font-medium"> / hr</span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/10 active:scale-98 transition-all cursor-pointer"
          >
            Book Now
          </button>
        </div>
      </div>

      <BookLessonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teacherId={teacher.id}
        teacherName={teacher.name}
        hourlyRate={teacher.hourlyRate}
      />
    </>
  );
};

export default TeacherCard;
