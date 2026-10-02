"use client";

import { useEffect } from "react";

import Link from "next/link";

import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const Error = ({ error, reset }: ErrorProps) => {
  useEffect(() => {
    console.error("Teachers Page Error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-12">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-10">
        {/* Subtle Top Accent Bar */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

        {/* Icon Header */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-500 shadow-sm">
          <AlertCircle size={32} strokeWidth={2} />
        </div>

        {/* Content Section */}
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Unable to Load Tutors
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
          We couldn&apos;t connect to our services to retrieve the teacher directory. This might be
          a temporary network hiccup or server maintenance.
        </p>

        {/* Technical Digest/Error Detail */}
        {error.digest && (
          <div className="mt-4 inline-block rounded-md border border-slate-200 bg-slate-100 px-3 py-1">
            <p className="font-mono text-[11px] text-slate-500">Error ID: {error.digest}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-98 sm:w-auto"
          >
            <RefreshCw size={18} />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200/80 active:scale-98 sm:w-auto"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Error;
