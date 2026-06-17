import { FeaturesSection, HeroSection } from "@components";

export default function LandingPage() {
	return (
		<div className='flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-[#0b0f19] dark:text-slate-200 antialiased selection:bg-blue-500/30 overflow-x-hidden transition-colors duration-500'>
			<div className='absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-linear-to-r from-transparent via-blue-500/20 dark:via-blue-500/40 to-transparent' />

			<HeroSection />
			<FeaturesSection />
		</div>
	);
}
