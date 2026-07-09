import Image from "next/image";
import { Upload } from "lucide-react";

interface ProfilePhotoSectionProps {
  image?: string;
}

export const ProfilePhotoSection = ({ image }: ProfilePhotoSectionProps) => {
  return (
    <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
      <h2 className="text-base font-semibold text-slate-900 w-full text-left mb-5">
        Profile Photo
      </h2>

      <div className="relative inline-block mb-4">
        <Image
          src={image || "/default-profile.png"}
          alt="Profile Preview"
          width={144}
          height={144}
          priority
          loading="eager"
          className="w-36 h-36 rounded-full object-cover border border-slate-100"
        />

        <button className="absolute bottom-1 right-1 p-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 text-slate-600">
          <svg
            className="w-3.5 h-3.5"
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

      <p className="text-[11px] text-slate-400 mb-4">
        JPG, PNG or WebP. Max size 2MB.
      </p>

      <button className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm w-full justify-center">
        <Upload className="w-4 h-4 text-slate-500" />
        Change Photo
      </button>
    </section>
  );
};
