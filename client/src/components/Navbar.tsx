import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { ActiveLink, UserMenu, Logo } from "@components";

const MOCK_USER_STATES = {
  TEACHER: {
    id: "mock-teacher-id",
    name: "Alex Raju",
    email: "alex@example.com",
    role: "TEACHER",
  },
  STUDENT: {
    id: "mock-student-id",
    name: "John Doe",
    email: "john@example.com",
    role: "STUDENT",
  },
  GUEST: null,
};

const CURRENT_MOCK_STATE: "TEACHER" | "STUDENT" | "GUEST" = "TEACHER";

export default async function Navbar() {
  const user = MOCK_USER_STATES[CURRENT_MOCK_STATE];

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b bg-white px-6 py-4">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-8">
        <Logo />
        <ActiveLink href="/teachers">Teachers</ActiveLink>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <ActiveLink
              href={
                user.role === "TEACHER"
                  ? "/dashboard/teacher"
                  : "/dashboard/student"
              }
            >
              <LayoutDashboard size={16} className="opacity-80" />
              Dashboard
            </ActiveLink>
            <UserMenu user={user} />
          </>
        ) : (
          <Link
            href="/sign-in"
            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Get Started
          </Link>
        )}
      </div>
    </nav>
  );
}
