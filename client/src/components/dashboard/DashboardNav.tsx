"use client";

import type { Route } from "next";

import {
  BookOpen,
  Calendar,
  CalendarRange,
  LayoutDashboard,
  MessageSquare,
  Settings,
} from "lucide-react";

import ActiveLink from "@/components/ActiveLink";
import { ROUTES, dashboardHomeFor } from "@/constants/routes";
import { UserRole } from "@/types/role";

interface NavItem {
  label: string;
  href: Route;
  icon: React.ReactNode;
  // overview only highlights on exact match, so it isn't active on /profile
  exact?: boolean;
}

const buildNavItems = (role: UserRole): NavItem[] => [
  {
    label: "Overview",
    href: (dashboardHomeFor(role) ?? ROUTES.DASHBOARD.ROOT) as Route,
    icon: <LayoutDashboard size={18} />,
    exact: true,
  },
  {
    label: "Lessons",
    href: ROUTES.DASHBOARD.LESSONS as Route,
    icon: <BookOpen size={18} />,
  },
  {
    label: "Schedule",
    href: ROUTES.DASHBOARD.SCHEDULE as Route,
    icon: <Calendar size={18} />,
  },
  ...(role === UserRole.Teacher
    ? [
        {
          label: "Availability",
          href: ROUTES.DASHBOARD.AVAILABILITY as Route,
          icon: <CalendarRange size={18} />,
        },
      ]
    : []),
  {
    label: "Messages",
    href: ROUTES.DASHBOARD.MESSAGES as Route,
    icon: <MessageSquare size={18} />,
  },
  {
    label: "Settings",
    href: ROUTES.DASHBOARD.SETTINGS as Route,
    icon: <Settings size={18} />,
  },
];

interface DashboardNavProps {
  role: UserRole;
  // lets the mobile drawer close itself when a link is picked
  onNavigate?: () => void;
}

const DashboardNav = ({ role, onNavigate }: DashboardNavProps) => (
  <nav className="flex flex-1 flex-col gap-1.5 font-medium">
    {buildNavItems(role).map((item) => (
      <ActiveLink key={item.href} href={item.href} exact={item.exact} onClick={onNavigate}>
        <div className="flex items-center gap-3">
          {item.icon}
          <span>{item.label}</span>
        </div>
      </ActiveLink>
    ))}
  </nav>
);

export default DashboardNav;
