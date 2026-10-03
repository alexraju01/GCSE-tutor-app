import type { Route } from "next";
import { redirect } from "next/navigation";

import { dashboardHomeFor } from "@/constants/routes";

import { requireSession } from "@utils/actions/session";

const DashboardGatewayPage = async () => {
  const { role } = await requireSession();

  redirect(dashboardHomeFor(role) as Route);
};

export default DashboardGatewayPage;
