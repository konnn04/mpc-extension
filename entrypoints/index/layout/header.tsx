import { Menu, Monitor, Moon, Sun } from "lucide-react";
import { UserMenu } from "@/components/custom/user-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BREADCRUMB_MAP, type DashboardRoute } from "../types";

type Theme = "light" | "dark" | "system";

type HeaderProps = {
  currentRoute: DashboardRoute;
  onSidebarToggle: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

const ThemeIcon = ({ theme }: { theme: Theme }) => {
  if (theme === "light") {
    return <Sun className='h-4 w-4' />;
  }
  if (theme === "dark") {
    return <Moon className='h-4 w-4' />;
  }
  return <Monitor className='h-4 w-4' />;
};

export function Header({ currentRoute, onSidebarToggle, theme, onThemeChange }: HeaderProps) {
  const breadcrumbs = BREADCRUMB_MAP[currentRoute];

  return (
    <header className='sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm'>
      {/* Mobile menu toggle */}
      <Button aria-label='Toggle sidebar' className='md:hidden' onClick={onSidebarToggle} size='icon' variant='ghost'>
        <Menu className='h-5 w-5' />
      </Button>

      {/* Breadcrumb */}
      <nav aria-label='Breadcrumb' className='flex items-center gap-1.5 text-sm'>
        <span className='font-medium text-muted-foreground'>MPC</span>
        {breadcrumbs.map((crumb, idx) => (
          <span className='flex items-center gap-1.5' key={crumb}>
            <span className='text-muted-foreground'>/</span>
            <span
              className={cn(idx === breadcrumbs.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground")}
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Spacer */}
      <div className='flex-1' />

      {/* User menu */}
      <UserMenu />

      {/* Theme toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label='Đổi giao diện' className='h-8 w-8' size='icon' variant='ghost'>
            <ThemeIcon theme={theme} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-36'>
          <DropdownMenuItem onClick={() => onThemeChange("light")}>
            <Sun className='mr-2 h-4 w-4' />
            Sáng
            {theme === "light" && <span className='ml-auto text-primary'>✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onThemeChange("dark")}>
            <Moon className='mr-2 h-4 w-4' />
            Tối
            {theme === "dark" && <span className='ml-auto text-primary'>✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onThemeChange("system")}>
            <Monitor className='mr-2 h-4 w-4' />
            Hệ thống
            {theme === "system" && <span className='ml-auto text-primary'>✓</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
