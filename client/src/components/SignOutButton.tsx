"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { buttonClass } from "@components/ui/styles";

const SignOutButton = () => (
  <button
    type="button"
    onClick={() => signOut({ callbackUrl: "/" })}
    className={buttonClass("danger")}
  >
    <LogOut size={14} /> Sign out
  </button>
);

export default SignOutButton;
