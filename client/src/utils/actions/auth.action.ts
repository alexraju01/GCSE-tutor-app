"use server";

import { AuthError } from "next-auth"; // 1. Import AuthError to trap the framework exception

import { signIn } from "@auth";
import action from "@utils/actions/action";
import { api } from "@utils/api";
import { SignUpSchema, type AuthCredentials } from "@utils/validation";

export async function signUpWithCredentials(
  params: AuthCredentials,
): Promise<APIResponse> {
  const validationResult = await action({ params, schema: SignUpSchema });

  if (validationResult instanceof Error) {
    return {
      status: "error",
      message: validationResult.message || "Invalid input",
    };
  }

  const {
    name,
    email,
    password,
    confirmPassword = "",
  } = validationResult.params!;

  try {
    // 1. CREATE USER IN EXPRESS BACKEND
    const res = await api.auth.signUp({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!res.status || res.status === "error") {
      return { status: "error", message: res.message || "Signup failed" };
    }

    // 2. AUTO-LOGIN WRAPPED SAFELY FOR AUTH.JS V5
    try {
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      return { status: "success", message: "Account created successfully!" };
    } catch (loginError: unknown) {
      // Auth.js triggers an error rejection loop intentionally on login failure
      if (loginError instanceof AuthError) {
        return {
          status: "error",
          message:
            "Account created, but automatic sign-in failed. Please log in manually.",
        };
      }
      // Re-throw if it's a Next.js core redirect pipeline instruction
      throw loginError;
    }
  } catch (error: unknown) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
