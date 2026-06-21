import { LayoutDashboard } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import ActiveLink from "./ActiveLink";
import Logo from "./Logo";
import UserMenu from "./UserMenu";
import { auth } from "../../auth";

const Navbar = async () => {
  const session = await auth();
  const user = session?.user;

  const dashboardHref: Route =
    user?.role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/student";

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
            <ActiveLink href={dashboardHref}>
              {/* The component handles active states, but we can pass a dynamic icon style too */}
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
};

export default Navbar;
