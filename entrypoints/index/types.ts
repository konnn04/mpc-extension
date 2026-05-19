import { CalendarDays, GraduationCap, LayoutDashboard, Settings } from "lucide-react";
import type { SidebarNavItem } from "@/components/custom/app-sidebar";

export type DashboardRoute = "dashboard" | "score-plan" | "calendar" | "settings";

export const NAV_ITEMS: SidebarNavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "score-plan", label: "Kế hoạch điểm số", icon: GraduationCap },
  { key: "calendar", label: "Lịch học tập", icon: CalendarDays },
  { key: "settings", label: "Cài đặt", icon: Settings }
];

export const BREADCRUMB_MAP: Record<DashboardRoute, string[]> = {
  dashboard: ["MPC", "Dashboard"],
  "score-plan": ["MPC", "Kế hoạch điểm số"],
  calendar: ["MPC", "Lịch học tập"],
  settings: ["MPC", "Cài đặt"]
};
