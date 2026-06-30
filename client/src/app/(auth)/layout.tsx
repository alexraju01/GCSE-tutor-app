import { Logo } from "@components";
import SocialAuthForm from "@components/Forms/SocialAuthForm";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <section className="flex h-auto flex-col items-center rounded-xl border border-gray-100 bg-white px-10 py-6 font-sans text-slate-800 shadow-lg sm:min-w-130 sm:px-8">
        <Logo />

        {children}
        <SocialAuthForm />
      </section>
    </main>
  );
};

export default AuthLayout;
