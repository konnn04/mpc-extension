import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ExternalLinkIcon,
  FacebookIcon,
  GithubIcon,
  Monitor,
  Moon,
  Sun,
  User
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ButtonNavSite } from "@/components/custom/button-nav-site";
import { InfoDialog } from "@/components/custom/info-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { _FACEBOOK_URL, _GITHUB_URL } from "@/constants";
import { useCalendarStore } from "@/store/use-calendar-store";
import { useGlobalStore } from "@/store/use-global-store";
import { useInfoStore } from "@/store/use-info-store";
import { useScoreStore } from "@/store/use-score-store";
import { isMatchURL } from "@/utils";
import { PopupContent } from "./components/popup-content";
import { useImportActions } from "./hooks/use-import-actions";

const WEEK_SORT_REGEX = /Tuần \((\d{2})\/(\d{2})\/(\d{4})/;

function App() {
  const { siteURLMapping } = useGlobalStore();
  const [currURL, setCurrURL] = useState("");
  const [siteCurr, setSiteCurr] = useState<"sv" | "kcq" | null>(null);

  const { getData: getInfoData } = useInfoStore();
  const { getData: getScoreData } = useScoreStore();
  const { getData: getCalendarData } = useCalendarStore();

  type ThemeMode = "light" | "dark" | "system";

  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem("mpc-theme") as ThemeMode) || "system";
  });

  const getSystemTheme = useCallback((): "light" | "dark" => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);

  const applyTheme = useCallback(
    (mode: ThemeMode) => {
      const resolved = mode === "system" ? getSystemTheme() : mode;
      document.documentElement.classList.toggle("dark", resolved === "dark");
    },
    [getSystemTheme]
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const handleThemeChange = useCallback((mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem("mpc-theme", mode);
  }, []);

  const themeIcons = { light: Sun, dark: Moon, system: Monitor } as const;
  const ThemeIcon = themeIcons[theme];

  useEffect(() => {
    const loadData = async () => {
      await getInfoData();
      await getScoreData();
      await getCalendarData();
    };
    loadData();
  }, [getInfoData, getScoreData, getCalendarData]);

  useEffect(() => {
    const checkURL = async (tabId?: number) => {
      const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabId !== undefined && activeTab?.id !== tabId) {
        return;
      }
      const url = activeTab?.url ?? "";
      setCurrURL(url);

      let matchedSite: "sv" | "kcq" | null = null;
      for (const [key, site] of Object.entries(siteURLMapping)) {
        if (isMatchURL(site.homepageRegex, site.homepage, url)) {
          matchedSite = key as "sv" | "kcq";
          break;
        }
      }
      setSiteCurr(matchedSite);
    };

    checkURL();

    const onUpdated = (tabId: number, changeInfo: { url?: string }) => {
      if (changeInfo.url) {
        checkURL(tabId);
      }
    };

    browser.tabs.onUpdated.addListener(onUpdated);
    return () => {
      browser.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [siteURLMapping]);

  const openDashboard = (tab?: string) => {
    browser.tabs.create({ url: browser.runtime.getURL(`/index.html${tab ? `#${tab}` : ""}`) });
  };

  const navTo = (url: string) => {
    browser.tabs.create({ url });
  };

  const {
    isLoading,
    hasInfo,
    hasScore,
    hasCalendar,
    hasExam,
    handleImportInfo,
    handleImportScore,
    handleImportCalendar
  } = useImportActions();

  const navToSchoolPage = async (path: string) => {
    const hashIndex = currURL.indexOf("#/");
    const baseUrl = hashIndex >= 0 ? currURL.substring(0, hashIndex) : currURL;
    const url = `${baseUrl}#/${path}`;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      browser.tabs.update(tab.id, { url });
    } else {
      navTo(url);
    }
  };

  return (
    <div className='flex min-h-[400px] w-[350px] flex-col bg-background'>
      <header className='flex items-center justify-between border-b bg-muted/40 px-4 py-3'>
        <div className='flex items-center gap-2'>
          <img alt='MPC' className='h-7 w-7 rounded-md' height={28} src='icon/128.png' width={28} />
          <h1 className='font-bold text-base text-primary tracking-tight'>MPC Extension</h1>
        </div>
        <div className='flex items-center gap-1'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label='Đổi giao diện' className='h-8 w-8' size='icon' variant='ghost'>
                <ThemeIcon className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-36'>
              <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                <Sun className='mr-2 h-4 w-4' />
                Sáng
                {theme === "light" && <span className='ml-auto text-primary'>✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                <Moon className='mr-2 h-4 w-4' />
                Tối
                {theme === "dark" && <span className='ml-auto text-primary'>✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange("system")}>
                <Monitor className='mr-2 h-4 w-4' />
                Hệ thống
                {theme === "system" && <span className='ml-auto text-primary'>✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className='h-8 gap-1.5 px-3' onClick={() => openDashboard()} size='sm'>
            <ExternalLinkIcon className='h-3.5 w-3.5' />
            Dashboard
          </Button>
        </div>
      </header>

      <main className='flex flex-1 flex-col justify-center'>
        <PopupContent
          currURL={currURL}
          handleImportCalendar={handleImportCalendar}
          handleImportInfo={handleImportInfo}
          handleImportScore={handleImportScore}
          hasCalendar={hasCalendar}
          hasExam={hasExam}
          hasInfo={hasInfo}
          hasScore={hasScore}
          isLoading={isLoading}
          kcqHomepage={siteURLMapping.kcq.homepage}
          navTo={navTo}
          openDashboard={openDashboard}
          siteCurr={siteCurr}
          svHomepage={siteURLMapping.sv.homepage}
        />
      </main>

      {siteCurr && (
        <div className='border-t px-3 py-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className='w-full gap-1.5' disabled={isLoading} size='sm' variant='outline'>
                <ClipboardList className='h-3.5 w-3.5' />
                Đến trang nhập liệu
                <ChevronDown className='ml-auto h-3 w-3' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='center' className='w-48'>
              <DropdownMenuLabel className='text-muted-foreground text-xs'>Mở trong tab hiện tại</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navToSchoolPage("home?mode=userinfo")}>
                <User className='mr-2 h-4 w-4' />
                Thông tin cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navToSchoolPage("diem")}>
                <CheckCircle2 className='mr-2 h-4 w-4' />
                Điểm số
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navToSchoolPage("tkb-hocky")}>
                <BookOpen className='mr-2 h-4 w-4' />
                Lịch học
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navToSchoolPage("lichthi")}>
                <CalendarClock className='mr-2 h-4 w-4' />
                Lịch thi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <footer className='mt-auto flex flex-col items-center border-t bg-secondary py-3 text-muted-foreground text-xs'>
        <div className='mb-1 flex items-center gap-2'>© 2025, 2026 by MPC. Made with ❤️</div>
        <div className='flex items-center gap-1'>
          <ButtonNavSite className='h-6 px-2' isBlank rel='noopener' size='sm' url={_FACEBOOK_URL} variant='link'>
            <FacebookIcon className='mr-1 h-4 w-4' /> Facebook
          </ButtonNavSite>
          <ButtonNavSite className='h-6 px-2' isBlank rel='noopener' size='sm' url={_GITHUB_URL} variant='link'>
            <GithubIcon className='mr-1 h-4 w-4' /> Github
          </ButtonNavSite>
          <div className='origin-left scale-75'>
            <InfoDialog />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
