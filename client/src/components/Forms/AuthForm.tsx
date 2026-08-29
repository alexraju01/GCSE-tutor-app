"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Controller,
	type DefaultValues,
	type FieldValues,
	type Path,
	type SubmitHandler,
	useForm,
} from "react-hook-form";
import { toast } from "sonner";
import type { ZodType } from "zod";
import type z from "zod";

interface AuthFormProps<T extends FieldValues> {
	schema: ZodType<T>;
	defaultValues: T;
	onSubmit: (data: T) => Promise<APIResponse>;
	formType: "SIGN-IN" | "SIGN-UP";
}

const AuthForm = <T extends FieldValues>({
	schema,
	defaultValues,
	formType,
	onSubmit,
}: AuthFormProps<T>) => {
	const router = useRouter();
	const form = useForm<z.infer<typeof schema>>({
		resolver: standardSchemaResolver(schema),
		defaultValues: defaultValues as DefaultValues<T>,
	});

	const handleSubmit: SubmitHandler<T> = async (data) => {
		const result = await onSubmit(data);

		if (result?.status === "success") {
			toast.success("Success", {
				description: formType === "SIGN-IN" ? "Signed in successfully!" : "Signed up successfully!",
			});
			router.push("/");
		} else {
			toast.error("Error", {
				description: result?.message || "Something went wrong.",
			});
		}
	};
	const isSignIn = formType === "SIGN-IN";
	const buttonText = isSignIn ? "Login In" : "Sign Up";

	const loadingText = isSignIn ? "Signing In..." : "Signing Up...";
	const displayButtonContent = form.formState.isSubmitting ? loadingText : buttonText;

	return (
		<Card className='w-full ring-0 sm:max-w-md'>
			<CardHeader>
				<CardTitle>{buttonText}</CardTitle>
				<CardDescription>
					Login to review your favorite board games and manage your collection.
				</CardDescription>
			</CardHeader>
			<CardContent className='mt-5'>
				<form id='form-rhf-demo' onSubmit={form.handleSubmit(handleSubmit)}>
					<FieldGroup>
						{Object.keys(defaultValues).map((fieldName) => (
							<Controller
								key={fieldName}
								name={fieldName as Path<T>}
								control={form.control}
								render={({ field, fieldState }) => {
									let inputType = "text";
									if (fieldName === "password" || fieldName === "confirmPassword") {
										inputType = "password";
									} else if (fieldName === "email") {
										inputType = "email";
									}

									const fieldLabel =
										fieldName === "email"
											? "Email Address"
											: fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

									return (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel htmlFor={`auth-field-${fieldName}`}>{fieldLabel}</FieldLabel>
											<Input
												{...field}
												id={`auth-field-${fieldName}`}
												// required
												type={inputType}
												className='w-full rounded-md border border-gray-300 px-4 py-6 transition outline-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-500 data-[invalid=true]:border-red-500'
												aria-invalid={fieldState.invalid}
												placeholder={fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
												autoComplete='off'
											/>
											{fieldState.invalid && (
												<div className='mt-1 text-sm font-medium text-red-500'>
													<FieldError errors={[fieldState.error]} />
												</div>
											)}
										</Field>
									);
								}}
							/>
						))}
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter className='flex-col gap-4 border-none bg-transparent'>
				<Button
					disabled={form.formState.isSubmitting}
					type='submit'
					form='form-rhf-demo'
					className='w-full rounded-md bg-blue-600 px-6 py-6 font-bold text-white shadow-md transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70'>
					{displayButtonContent}
				</Button>

				{isSignIn ? (
					<p className='text-sm text-gray-600'>
						Don&apos;t have an account?{" "}
						<Link href='/sign-up' className='font-medium text-blue-600 hover:underline'>
							Sign Up
						</Link>
					</p>
				) : (
					<p className='text-sm text-gray-600'>
						Already have an account?{" "}
						<Link href='/sign-in' className='font-medium text-blue-600 hover:underline'>
							Login In
						</Link>
					</p>
				)}
			</CardFooter>
		</Card>
	);
};

export default AuthForm;
