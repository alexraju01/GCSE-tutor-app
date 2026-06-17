import { Logo } from "@components";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			<main className='flex min-h-screen items-center justify-center'>
				<section className=' flex  flex-col  items-center bg-white font-sans text-slate-800 rounded-xl border border-gray-100 sm:min-w-130 sm:px-8 h-auto px-10 py-6 shadow-lg'>
					<Logo />

					{children}

					{/* <SocialAuthForm /> */}
				</section>
			</main>
		</>
	);
};

export default AuthLayout;
