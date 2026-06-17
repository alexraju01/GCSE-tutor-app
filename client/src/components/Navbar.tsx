import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import UserMenu from "@components/UserMenu";
import { ROUTES } from "@constants/routes";
import ActiveLink from "@components/ActiveLink";
import Logo from "@components/Logo";

const MOCK_USER_STATES = {
	TEACHER: {
		id: "mock-teacher-id",
		name: "Alex Raju",
		email: "alex@example.com",
		role: "TEACHER",
	},
	STUDENT: {
		id: "mock-student-id",
		name: "John Doe",
		email: "john@example.com",
		role: "STUDENT",
	},
	GUEST: null,
};

const CURRENT_MOCK_STATE: "TEACHER" | "STUDENT" | "GUEST" = "TEACHER";

export default async function Navbar() {
	const user = MOCK_USER_STATES[CURRENT_MOCK_STATE];

	return (
		<nav className='border-b bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-50'>
			{/* LEFT SIDE */}
			<div className='flex items-center gap-8'>
				<Logo />
				<ActiveLink href={ROUTES.TEACHERS}>Teachers</ActiveLink>
			</div>

			{/* RIGHT SIDE */}
			<div className='flex gap-4 items-center'>
				{user ? (
					<>
						<ActiveLink
							href={user.role === "TEACHER" ? ROUTES.DASHBOARD.TEACHER : ROUTES.DASHBOARD.STUDENT}>
							<LayoutDashboard size={16} className='opacity-80' />
							Dashboard
						</ActiveLink>
						<UserMenu user={user} />
					</>
				) : (
					<Link
						href={ROUTES.SIGN_IN}
						className='bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors'>
						Get Started
					</Link>
				)}
			</div>
		</nav>
	);
}
