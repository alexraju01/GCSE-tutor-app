import { FeaturesSection, HeroSection } from "@components";
import SignIn from "@components/sign-in";

const HomePage = () => {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 text-slate-900 antialiased transition-colors duration-500 selection:bg-blue-500/30 dark:bg-[#0b0f19] dark:text-slate-200">
      <div className="absolute top-0 left-1/2 h-px w-full max-w-7xl -translate-x-1/2 bg-linear-to-r from-transparent via-blue-500/20 to-transparent dark:via-blue-500/40" />
      <SignIn />
      <HeroSection />
      <FeaturesSection />
    </div>
  );
};
export default HomePage;
