import { ROUTES } from "@constants/routes";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

const Logo = () => {
	return (
		<Link href={ROUTES.HOME} className='flex items-center gap-2 font-bold text-xl text-blue-600'>
			<GraduationCap size={28} />
			<span>GCSE Ace</span>
		</Link>
	);
};

export default Logo;
