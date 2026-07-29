// /lib/validations.ts
import { z } from "zod";

export const SignInSchema = z.object({
	email: z
		.email({ message: "Please provide a valid email address." })
		.min(1, { message: "Email is required." }),

	password: z
		.string()
		.min(6, { message: "Password must be at least 6 characters long." })
		.max(100, { message: "Password cannot exceed 100 characters." }),
});

export const SignUpSchema = z
	.object({
		name: z
			.string()
			.min(1, { message: "Name is required." })
			.max(100, { message: "Name cannot exceed 100 characters." }),

		email: z.email({ pattern: z.regexes.html5Email }).min(1, { message: "Email is required." }),

		password: z
			.string()
			.min(8, { message: "Password must be at least 8 characters long." })
			.max(150, { message: "Password cannot exceed 150 characters." })
			.regex(/[A-Z]/, {
				message: "Password must contain at least one uppercase letter.",
			})
			.regex(/[a-z]/, {
				message: "Password must contain at least one lowercase letter.",
			})
			.regex(/[0-9]/, { message: "Password must contain at least one number." })
			.regex(/[^a-zA-Z0-9]/, {
				message: "Password must contain at least one special character.",
			}),

		confirmPassword: z.string().min(1, "Confirm password is required"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"], // show error under confirmPassword field
	});

export type AuthCredentials = z.infer<typeof SignUpSchema>;
