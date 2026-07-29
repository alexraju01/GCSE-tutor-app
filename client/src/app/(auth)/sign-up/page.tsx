"use client";

import { signUpWithCredentials } from "@utils/actions/auth.action";
import { SignUpSchema } from "@utils/validation";

import AuthForm from "@components/Forms/AuthForm";

const SignUp = () => {
	return (
		<AuthForm
			formType='SIGN-UP'
			schema={SignUpSchema}
			defaultValues={{ name: "", email: "", password: "", confirmPassword: "" }}
			onSubmit={signUpWithCredentials}
		/>
	);
};

export default SignUp;
