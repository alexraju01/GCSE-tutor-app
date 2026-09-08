import TeacherCard from "@components/dashboard/TeacherCard";
import { api } from "@utils/api";
import { BookOpen, Search } from "lucide-react";

const TeachersPage = async () => {
  const { data: teachers, results } = await api.teacher.getAll();

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-white border-b border-slate-200 py-12 px-6">
        <div className="max-w-6xl mx-auto text-center md:text-left flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Find Your Perfect Tutor
            </h1>
            <p className="mt-2 text-lg text-slate-600">
              Verified Grade 9 specialist educators tailored to your curriculum.
            </p>
          </div>

          <div className="w-full md:max-w-md flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition">
            <Search className="text-slate-400 shrink-0" size={20} />
            <input
              type="text"
              placeholder="Search subjects (e.g., Chemistry, Physics)..."
              className="bg-transparent text-sm w-full outline-none text-slate-800"
            />
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {teachers?.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>

        {results === 0 && (
          <div className="text-center bg-white border rounded-2xl p-12 mt-4">
            <BookOpen className="mx-auto text-slate-300 mb-3" size={40} />
            <h3 className="font-bold text-lg">No active teachers listed</h3>
            <p className="text-sm text-slate-500 mt-1">
              Please verify your server database seeding files or API layer.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeachersPage;