import { BookOpen, Search } from "lucide-react";

import TeacherCard from "@components/dashboard/TeacherCard";
import { api } from "@utils/api";

const TeachersPage = async () => {
  const { data: teachers, results } = await api.teacher.getAll();

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="border-b border-slate-200 bg-white px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Find Your Perfect Tutor
            </h1>
            <p className="mt-2 text-lg text-slate-600">
              Verified Grade 9 specialist educators tailored to your curriculum.
            </p>
          </div>

          <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 md:max-w-md">
            <Search className="shrink-0 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search subjects (e.g., Chemistry, Physics)..."
              className="w-full bg-transparent text-sm text-slate-800 outline-none"
            />
          </div>
        </div>
      </div>

      <main className="mx-auto mt-12 max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {teachers?.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>

        {results === 0 && (
          <div className="mt-4 rounded-2xl border bg-white p-12 text-center">
            <BookOpen className="mx-auto mb-3 text-slate-300" size={40} />
            <h3 className="text-lg font-bold">No active teachers listed</h3>
            <p className="mt-1 text-sm text-slate-500">
              Please verify your server database seeding files or API layer.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeachersPage;
