import { ChevronLeft, Monitor, Moon, PanelLeft, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ThemeMode = "light" | "dark" | "system";

type AppHeaderProps = {
  breadcrumbs: string[];
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  actions?: React.ReactNode;
};

const ThemeIcon = ({ theme }: { theme: ThemeMode }) => {
  if (theme === "light") {
    return <Sun className='h-4 w-4' />;
  }
  if (theme === "dark") {
    return <Moon className='h-4 w-4' />;
  }
  return <Monitor className='h-4 w-4' />;
};

export function AppHeader({
  breadcrumbs,
  onSidebarToggle,
  sidebarCollapsed,
  theme = "system",
  onThemeChange,
  actions
}: AppHeaderProps) {
  return (
    <header className='sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm'>
      {onSidebarToggle && (
        <Button
          aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          className='h-8 w-8'
          onClick={onSidebarToggle}
          size='icon'
          variant='ghost'
        >
          {sidebarCollapsed ? <PanelLeft className='h-5 w-5' /> : <ChevronLeft className='h-5 w-5' />}
        </Button>
      )}

      <nav aria-label='Breadcrumb' className='flex min-w-0 items-center gap-1.5 text-sm'>
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          const content = (
            <span
              className={cn(
                "truncate",
                isLast
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground transition-colors hover:text-foreground"
              )}
            >
              {crumb}
            </span>
          );

          return (
            <span className='flex min-w-0 items-center gap-1.5' key={crumb}>
              {idx > 0 && <span className='text-muted-foreground'>/</span>}
              {isLast ? (
                content
              ) : (
                <a className='truncate' href={crumb === "MPC" ? "#dashboard" : "#"}>
                  {content}
                </a>
              )}
            </span>
          );
        })}
      </nav>

      <div className='flex-1' />

      {actions}

      {onThemeChange && (
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
      )}
    </header>
  );
}
