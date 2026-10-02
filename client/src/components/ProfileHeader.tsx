import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

export const ProfileHeader = () => {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-8 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Update Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal information and teaching details.
        </p>
      </div>

      <Button
        variant="outline"
        className="gap-2 rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <Eye className="h-4 w-4 text-slate-500" />
        Preview Profile
      </Button>
    </header>
  );
};
