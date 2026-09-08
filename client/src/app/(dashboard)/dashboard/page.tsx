import { auth } from "@auth";
import { UserRole } from "@/types/role";
import { redirect } from "next/navigation";

const DashboardGatewayPage = async () => {
  const session = await auth();

  if (!session?.user) redirect("/sign-in");

  const { role } = session.user;

  if (role === UserRole.Teacher) {
    redirect("/dashboard/teacher");
  } else {
    redirect("/dashboard/student");
  }
};

export default DashboardGatewayPage;
