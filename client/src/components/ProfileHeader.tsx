import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProfileHeader = () => {
  return (
    <header className="max-w-6xl mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Update Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal information and teaching details.
        </p>
      </div>

      <Button
        variant="outline"
        className="gap-2 bg-white rounded-xl shadow-sm text-slate-700 hover:bg-slate-50 border-slate-200"
      >
        <Eye className="w-4 h-4 text-slate-500" />
        Preview Profile
      </Button>
    </header>
  );
};
