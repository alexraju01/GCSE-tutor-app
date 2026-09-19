"use server";

import { signIn, signOut } from "@auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import action from "@utils/actions/action";
import { api } from "@utils/api";
import { getAuthErrorMessage } from "@utils/authError";
import { type AuthCredentials, SignInSchema, SignUpSchema } from "@utils/validation";

export async function signUpWithCredentials(params: AuthCredentials): Promise<APIResponse> {
	const validationResult = await action({ params, schema: SignUpSchema });

	if (validationResult instanceof Error) {
		return {
			status: "error",
			message: validationResult.message || "Invalid input",
		};
	}

	const { name, email, password, confirmPassword = "" } = validationResult.params!;

	try {
		const res = await api.auth.signUp({
			name,
			email,
			password,
			confirmPassword,
		});

		if (!res.status || res.status === "error") {
			return { status: "error", message: res.message || "Signup failed" };
		}

		try {
			const loginResult = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			// A failed login returns `error` here, it doesn't throw.
			if (!loginResult || loginResult.error) {
				return {
					status: "error",
					message: "Account created, but automatic sign-in failed. Please log in manually.",
				};
			}

			return { status: "success", message: "Account created successfully!" };
		} catch (loginError: unknown) {
			if (loginError instanceof AuthError) {
				return {
					status: "error",
					message: getAuthErrorMessage(
						loginError,
						"Account created, but automatic sign-in failed. Please log in manually.",
					),
				};
			}
			throw loginError;
		}
	} catch (error: unknown) {
		return {
			status: "error",
			message: error instanceof Error ? error.message : "An unexpected error occurred",
		};
	}
}

export async function signInWithCredentials(
	params: Pick<AuthCredentials, "email" | "password">,
): Promise<APIResponse> {
	const validationResult = await action({
		params,
		schema: SignInSchema,
	});

	if (validationResult instanceof Error) {
		return {
			status: "error",
			message: validationResult.message || "Invalid input",
		};
	}

	const { email, password } = validationResult.params!;
	let isSuccess = false;

	try {
		const loginResult = await signIn("credentials", {
			email,
			password,
			redirect: false,
		});

		if (!loginResult || loginResult.error) {
			// Defensive fallback — no exception here means no API error to unwrap.
			return {
				status: "error",
				message: "Invalid email or password.",
			};
		}

		isSuccess = true;
	} catch (error: unknown) {
		if (error instanceof Error && error.message === "NEXT_REDIRECT") {
			throw error;
		}

		return {
			status: "error",
			message: getAuthErrorMessage(error, "Invalid email or password."),
		};
	}

	if (isSuccess) redirect("/dashboard");

	return {
		status: "error",
		message: "An unresolved login routing error occurred.",
	};
}

export async function handleSignOut() {
	await signOut({
		redirectTo: "/",
	});
}
