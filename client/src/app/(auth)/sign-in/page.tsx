"use client";

import AuthForm from "@components/Forms/AuthForm";
import { SignInSchema } from "@utils/validation";

const SignIn = () => {
  return (
    <AuthForm
      formType="SIGN-UP"
      schema={SignInSchema}
      defaultValues={{ email: "", password: "" }}
      onSubmit={(data) => Promise.resolve({ success: true, data })}
    />
  );
};

export default SignIn;
