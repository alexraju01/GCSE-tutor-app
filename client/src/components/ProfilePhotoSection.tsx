import Image from "next/image";

import { Upload } from "lucide-react";

interface ProfilePhotoSectionProps {
  image?: string;
}

export const ProfilePhotoSection = ({ image }: ProfilePhotoSectionProps) => {
  return (
    <section className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
      <h2 className="mb-5 w-full text-left text-base font-semibold text-slate-900">
        Profile Photo
      </h2>

      <div className="relative mb-4 inline-block">
        <Image
          referrerPolicy="no-referrer"
          src={image || "/default-profile.png"}
          alt="Profile Preview"
          width={144}
          height={144}
          priority
          loading="eager"
          className="h-36 w-36 rounded-full border border-slate-100 object-cover"
        />

        <button className="absolute right-1 bottom-1 rounded-full border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm hover:bg-slate-50">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
            />
          </svg>
        </button>
      </div>

      <p className="mb-4 text-[11px] text-slate-400">JPG, PNG or WebP. Max size 2MB.</p>

      <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
        <Upload className="h-4 w-4 text-slate-500" />
        Change Photo
      </button>
    </section>
  );
};
