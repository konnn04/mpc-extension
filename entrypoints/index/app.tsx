import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { AppHeader, type ThemeMode } from "@/components/custom/app-header";
import { AppSidebar } from "@/components/custom/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useScoreStore } from "@/entrypoints/popup/PointTab/use-score-store";
import { ConfirmDialogProvider } from "@/hooks/use-confirm";
import { useGlobalStore } from "@/store/use-global-store";
import { CalendarPage } from "./pages/CalendarPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PersonalInfoPage } from "./pages/PersonalInfoPage";
import { ScorePlanPage } from "./pages/ScorePlanPage";
import { SettingsPage } from "./pages/SettingsPage";
import { BREADCRUMB_MAP, type DashboardRoute, NAV_ITEMS } from "./types";

function getInitialRoute(): DashboardRoute {
  const hash = window.location.hash.replace("#", "");
  if (["dashboard", "score-plan", "calendar", "settings", "personal-info"].includes(hash)) {
    return hash as DashboardRoute;
  }
  return "dashboard";
}

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeClass(theme: ThemeMode) {
  const root = document.documentElement;
  const resolved = theme === "system" ? getSystemTheme() : theme;
  root.classList.toggle("dark", resolved === "dark");
}

function App() {
  const [route, setRoute] = useState<DashboardRoute>(getInitialRoute);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem("mpc-theme") as ThemeMode) || "system";
  });

  const getData = useGlobalStore((s) => s.getData);
  const getScoreData = useScoreStore((s) => s.getData);
  const setupScoreWatcher = useScoreStore((s) => s.setupWatcher);

  useLayoutEffect(() => {
    getData();
    getScoreData();
    const unwatch = setupScoreWatcher();
    return () => {
      unwatch?.();
    };
  }, [getData, getScoreData, setupScoreWatcher]);

  const handleNavigate = useCallback((key: string) => {
    const r = key as DashboardRoute;
    setRoute(r);
    window.location.hash = r;
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "") as DashboardRoute;
      if (["dashboard", "score-plan", "calendar", "settings", "personal-info"].includes(hash)) {
        setRoute(hash);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    applyThemeClass(theme);
    localStorage.setItem("mpc-theme", theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyThemeClass("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setSidebarCollapsed(true);
      }
    };
    if (mq.matches) {
      setSidebarCollapsed(true);
    }
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleSidebarToggle = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const renderPage = () => {
    switch (route) {
      case "dashboard":
        return <DashboardPage />;
      case "personal-info":
        return <PersonalInfoPage />;
      case "score-plan":
        return <ScorePlanPage />;
      case "calendar":
        return <CalendarPage />;
      case "settings":
        return <SettingsPage onThemeChange={setTheme} theme={theme} />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <TooltipProvider>
      <div className='flex h-screen overflow-hidden bg-background'>
        <AppSidebar
          activeKey={route}
          collapsed={sidebarCollapsed && !mobileOpen}
          footer={
            <p className='text-center text-muted-foreground text-xs'>© 2025, 2026 MPC · Trường Đại học Mở TP.HCM</p>
          }
          isMobile={window.innerWidth < 768}
          logo={
            <div className='flex items-center gap-2'>
              <img alt='Logo' className='h-8 w-8' height={32} src='/icon/128.png' width={32} />
              <div>
                <p className='font-semibold text-sm leading-none'>MPC Extension</p>
                <p className='mt-0.5 text-muted-foreground text-xs'>Quản lý học tập</p>
              </div>
            </div>
          }
          logoCollapsed={<img alt='Logo' className='h-8 w-8' height={32} src='/icon/128.png' width={32} />}
          navItems={NAV_ITEMS}
          onClose={() => setMobileOpen(false)}
          onNavigate={handleNavigate}
          onToggle={handleSidebarToggle}
        />

        <div className='flex flex-1 flex-col overflow-hidden'>
          <AppHeader
            breadcrumbs={BREADCRUMB_MAP[route]}
            onSidebarToggle={handleSidebarToggle}
            onThemeChange={setTheme}
            theme={theme}
          />

          <main className='flex-1 overflow-y-auto p-6'>{renderPage()}</main>
        </div>
      </div>
      <ConfirmDialogProvider />
    </TooltipProvider>
  );
}

export default App;
