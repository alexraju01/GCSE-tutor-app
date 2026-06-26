"use client";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "../ui/button";

const handleSignIn = async (provider: "google" | "github") => {
  try {
    await signIn(provider, {
      redirectTo: "/dashboard", // Redirect to dashboard after successful sign-in
      redirect: true,
    });
  } catch (error) {
    toast.error("Sign-in Failed", {
      description:
        error instanceof Error
          ? error.message
          : "An error occured during sign-in",
    });
  }
};

const SocialAuthForm = () => {
  const buttonClass =
    "background-dark400_light900 body-medium text-dark200_light800 min-h-12 flex-1 rounded-2 px-4 py-3.5";

  return (
    <div className="mt-7 flex flex-wrap gap-2.5">
      <Button onClick={() => handleSignIn("github")}>
        <Image
          src="/icons/github.svg"
          //   className="invert-colors"
          alt="Github Icon"
          height={20}
          width={20}
        />
        <span>Sign in with Github</span>
      </Button>
      <Button className={buttonClass} onClick={() => handleSignIn("google")}>
        <Image
          src="/icons/google.svg"
          className=""
          alt="Google Icon"
          height={20}
          width={20}
        />
        <span>Sign in with Google</span>
      </Button>
    </div>
  );
};

export default SocialAuthForm;
