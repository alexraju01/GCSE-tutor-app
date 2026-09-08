"use client";

import { signInWithCredentials } from "@utils/actions/auth.action";
import { SignInSchema } from "@utils/validation";

import AuthForm from "@components/Forms/AuthForm";

const SignIn = () => {
  return (
    <AuthForm
      formType="SIGN-IN"
      schema={SignInSchema}
      defaultValues={{ email: "", password: "" }}
      onSubmit={signInWithCredentials}
    />
  );
};

export default SignIn;
