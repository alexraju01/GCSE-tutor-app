"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@constants/routes";
import { Avatar } from "@components";

interface UserMenuProps {
  user: undefined | null;
}

const UserMenu = ({ user }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center px-4">
        <Link
          href="/sign-in"
          className="bg-custom-accent rounded-md px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 lg:text-base"
        >
          Login
        </Link>
      </div>
    );
  }

  // --- 2. Authenticated UI ---
  return (
    <div className="relative flex items-center px-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="group-hover:border-custom-accent flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-transparent bg-blue-600 transition-all">
          {user.image ? (
            <Image
              src={user.image}
              width={40}
              height={40}
              alt={user.name || "User"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-white">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </span>
          )}
        </div>
      </button>

      {/* The Avatar component handles the dropdown items/sign out */}
      {isOpen && <Avatar user={user} setIsOpen={setIsOpen} />}
    </div>
  );
};

export default UserMenu;
