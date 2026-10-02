import Link from "next/link";

import { GraduationCap } from "lucide-react";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
      <GraduationCap size={28} />
      <span>GCSE Ace</span>
    </Link>
  );
};

export default Logo;
