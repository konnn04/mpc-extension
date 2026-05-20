// Only type imports are safe for functions injected via executeScript
import type { CalendarEntry, ProgressCallback, SemesterData, WeekData } from "@/types";

const getCalendars = async (onProgress?: ProgressCallback): Promise<SemesterData[]> => {
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const SUBJECT_CODE_REGEX = /\((.*?)\)/;
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const WEEK_MATCH_REGEX = /Tuần \(\d{2}\/\d{2}\/(\d{4}) - \d{2}\/\d{2}\/(\d{4})\)/;
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const WEEK_SORT_REGEX = /Tuần \((\d{2})\/(\d{2})\/(\d{4})/;
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const DATE_RANGE_REGEX = /(\d{2}\/\d{2}\/\d{2})\s*đến\s*(\d{2}\/\d{2}\/\d{2})/;
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const SINGLE_DATE_REGEX = /(\d{2}\/\d{2}\/\d{2})/;
  const PERIOD_TIME_MAP_GROUP_1: Record<number, { start: string; end: string }> = {
    1: { start: "07:00", end: "07:50" },
    2: { start: "07:50", end: "08:40" },
    3: { start: "08:40", end: "09:45" },
    4: { start: "09:45", end: "10:35" },
    5: { start: "10:35", end: "11:25" },
    6: { start: "12:45", end: "13:35" },
    7: { start: "13:35", end: "14:25" },
    8: { start: "14:25", end: "15:30" },
    9: { start: "15:30", end: "16:20" },
    10: { start: "16:20", end: "17:10" },
    11: { start: "17:30", end: "18:20" },
    12: { start: "18:20", end: "19:10" },
    13: { start: "19:10", end: "20:00" },
    14: { start: "20:00", end: "20:50" },
    15: { start: "20:50", end: "21:40" }
  };

  const PERIOD_TIME_MAP_GROUP_2: Record<number, { start: string; end: string }> = {
    1: { start: "07:30", end: "08:20" },
    2: { start: "08:20", end: "09:10" },
    3: { start: "09:10", end: "10:15" },
    4: { start: "10:15", end: "11:05" },
    5: { start: "11:05", end: "11:55" },
    6: { start: "13:00", end: "13:50" },
    7: { start: "13:50", end: "14:40" },
    8: { start: "14:40", end: "15:45" },
    9: { start: "15:45", end: "16:35" },
    10: { start: "16:35", end: "17:25" },
    11: { start: "17:30", end: "18:20" },
    12: { start: "18:20", end: "19:10" },
    13: { start: "19:10", end: "20:00" },
    14: { start: "20:00", end: "20:50" },
    15: { start: "20:50", end: "21:40" }
  };

  // ==================== CONFIGURATION ====================
  const CONFIG = {
    selectors: {
      semesterSelect: "div.col-lg-4 div.ng-input", // Updated based on DOM "col-lg-4 col-md-6 col-12 mb-2" for "Học kỳ"
      semesterDropdown: "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel div.scrollable-content",
      semesterItems: "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel div.scrollable-content > div",
      table: "#printArea > div.table-responsive-lg table.table",
      tableRows: "tbody tr"
    },
    timeouts: {
      dropdownOpen: 300,
      dropdownClose: 200,
      scrollWait: 100,
      tableUpdateLong: 15_000,
      tableUpdateShort: 1000,
      errorDisplay: 2000,
      completionDelay: 500
    },
    limits: {
      maxScrollRetries: 15
    },
    overlayIds: {
      overlay: "mpc-crawl-overlay",
      progressBar: "mpc-crawl-progress-bar",
      progressText: "mpc-crawl-progress-text",
      message: "mpc-crawl-message",
      semesterInfo: "mpc-crawl-semester-info"
    }
  };

  // ==================== HELPER FUNCTIONS ====================
  const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

  const createOverlay = (): HTMLDivElement => {
    const overlay = document.createElement("div");
    overlay.id = CONFIG.overlayIds.overlay;
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif";

    const card = document.createElement("div");
    card.style.cssText =
      "background:#fff;border-radius:8px;padding:24px;width:90%;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.15)";

    const title = document.createElement("h3");
    title.textContent = "Đang đọc lịch học";
    title.style.cssText = "margin:0 0 4px 0;font-size:16px;font-weight:600;color:#0f172a";

    const message = document.createElement("p");
    message.id = CONFIG.overlayIds.message;
    message.textContent = "Đang lấy danh sách học kỳ...";
    message.style.cssText = "margin:0 0 16px 0;font-size:14px;color:#64748b";

    const progressBg = document.createElement("div");
    progressBg.style.cssText = "background:#f1f5f9;border-radius:4px;height:8px;overflow:hidden;margin-bottom:8px";

    const progressBar = document.createElement("div");
    progressBar.id = CONFIG.overlayIds.progressBar;
    progressBar.style.cssText = "height:100%;background:#0f172a;width:0%;transition:width 0.3s ease";
    progressBg.appendChild(progressBar);

    const info = document.createElement("div");
    info.style.cssText = "display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:16px";

    const progressText = document.createElement("span");
    progressText.id = CONFIG.overlayIds.progressText;
    progressText.textContent = "0%";

    const semesterInfo = document.createElement("span");
    semesterInfo.id = CONFIG.overlayIds.semesterInfo;

    info.appendChild(progressText);
    info.appendChild(semesterInfo);

    const warning = document.createElement("div");
    warning.style.cssText =
      "background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px;font-size:13px;color:#991b1b;line-height:1.5";
    warning.innerHTML =
      "<strong>⚠️ Lưu ý:</strong> Không tắt hay thu nhỏ cửa sổ, tắt popup hay chuyển trang. Quá trình này có thể mất vài phút tùy vào số lượng dữ liệu.";

    card.append(title, message, progressBg, info, warning);
    overlay.appendChild(card);
    return overlay;
  };

  const showOverlay = (): void => {
    const existing = document.getElementById(CONFIG.overlayIds.overlay);
    if (existing) {
      existing.remove();
    }
    document.body.appendChild(createOverlay());
    document.body.style.overflow = "hidden";
  };

  const updateOverlay = (progress: number, message: string): void => {
    const progressBar = document.getElementById(CONFIG.overlayIds.progressBar);
    const progressText = document.getElementById(CONFIG.overlayIds.progressText);
    const messageEl = document.getElementById(CONFIG.overlayIds.message);

    if (progressBar) {
      progressBar.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
    }
    if (progressText) {
      progressText.textContent = `${Math.round(progress)}%`;
    }
    if (messageEl) {
      messageEl.textContent = message;
    }
  };

  const updateSemesterInfo = (info: string): void => {
    const el = document.getElementById(CONFIG.overlayIds.semesterInfo);
    if (el) {
      el.textContent = info;
    }
  };

  const hideOverlay = (): void => {
    const overlay = document.getElementById(CONFIG.overlayIds.overlay);
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.3s ease";
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = "";
      }, 300);
    }
  };

  const scrollDropdownToLoadAll = async (scrollableContent: Element): Promise<void> => {
    let lastHeight = 0;
    let retries = 0;

    while (retries < CONFIG.limits.maxScrollRetries) {
      scrollableContent.scrollTop = scrollableContent.scrollHeight;
      await wait(CONFIG.timeouts.scrollWait);

      const currentHeight = scrollableContent.scrollHeight;
      if (currentHeight === lastHeight) {
        break;
      }

      lastHeight = currentHeight;
      retries++;
    }

    scrollableContent.scrollTop = 0;
    await wait(CONFIG.timeouts.scrollWait);
  };

  const getSemesters = async (): Promise<string[]> => {
    // Capture the currently selected semester BEFORE any DOM interaction
    const getCurrentSelected = (): string | null => {
      const labelEl =
        document.querySelector("ng-select[bindvalue='hoc_ky'] .ng-value-label") ||
        document.querySelector("ng-select[bindlabel='ten_hoc_ky'] .ng-value-label") ||
        document.querySelector(".ng-value-label");
      return labelEl?.textContent?.trim() || null;
    };

    const savedCurrent = getCurrentSelected();
    console.log("📌 Học kỳ hiện tại:", savedCurrent);

    const semesterSelect = document.querySelector(CONFIG.selectors.semesterSelect);
    if (!semesterSelect) {
      if (savedCurrent) {
        return [savedCurrent];
      }
      throw new Error("Không tìm thấy selector học kỳ. Hãy đảm bảo bạn đang ở trang TKB Học kỳ.");
    }

    semesterSelect.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await wait(CONFIG.timeouts.dropdownOpen);

    const scrollableContent = document.querySelector(CONFIG.selectors.semesterDropdown);
    if (scrollableContent) {
      await scrollDropdownToLoadAll(scrollableContent);
    }

    const items = document.querySelectorAll(CONFIG.selectors.semesterItems);
    const semesters = Array.from(items).map((node) => node.textContent?.trim() || "");

    semesterSelect.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await wait(CONFIG.timeouts.dropdownClose);
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await wait(100);

    if (semesters.length === 0 && savedCurrent) {
      console.warn("Dropdown không có items, fallback về học kỳ hiện tại:", savedCurrent);
      return [savedCurrent];
    }

    return semesters.reverse();
  };

  const waitForTableUpdate = (): Promise<void> =>
    new Promise((resolve) => {
      const table = document.querySelector(CONFIG.selectors.table);
      if (!table) {
        setTimeout(() => resolve(), CONFIG.timeouts.tableUpdateLong);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const hasChanges = mutations.some((m) => m.type === "childList" && m.addedNodes.length > 0);

        if (hasChanges) {
          obs.disconnect();
          setTimeout(() => resolve(), CONFIG.timeouts.tableUpdateShort);
        }
      });

      observer.observe(table, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, CONFIG.timeouts.tableUpdateLong);
    });

  const selectSemester = async (semesterText: string): Promise<void> => {
    // If already showing the requested semester, skip dropdown interaction
    const currentLabel =
      document.querySelector("ng-select[bindlabel='ten_hoc_ky'] .ng-value-label")?.textContent?.trim() ||
      document.querySelector("ng-select .ng-value-label")?.textContent?.trim();
    if (currentLabel === semesterText) {
      console.log(`Đang ở học kỳ "${semesterText}", bỏ qua bước chọn.`);
      return;
    }

    const table = document.querySelector(CONFIG.selectors.table);
    let originalHtml = "";
    if (table) {
      originalHtml = table.innerHTML;
    }

    const semesterSelect = document.querySelector(CONFIG.selectors.semesterSelect);
    if (!semesterSelect) {
      throw new Error("Không tìm thấy selector học kỳ");
    }

    semesterSelect.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await wait(CONFIG.timeouts.dropdownOpen);

    const scrollableContent = document.querySelector(CONFIG.selectors.semesterDropdown);
    if (scrollableContent) {
      await scrollDropdownToLoadAll(scrollableContent);
    }

    const items = document.querySelectorAll(CONFIG.selectors.semesterItems);
    const targetItem = Array.from(items).find((node) => node.textContent?.trim() === semesterText) as HTMLElement;

    if (!targetItem) {
      semesterSelect.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      await wait(CONFIG.timeouts.dropdownClose);
      console.warn(`Không tìm thấy học kỳ "${semesterText}" trong dropdown, dùng dữ liệu hiện tại.`);
      return;
    }

    targetItem.scrollIntoView({ block: "nearest" });
    await wait(CONFIG.timeouts.scrollWait);
    targetItem.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    targetItem.click();
    await wait(CONFIG.timeouts.dropdownClose);

    // Wait for table to update
    const startTime = Date.now();
    let isUpdated = false;
    let isWarningFound = false;

    while (Date.now() - startTime < CONFIG.timeouts.tableUpdateLong) {
      const warningText = document.querySelector(".alert-warning")?.textContent || "";
      if (
        warningText.includes("Không tìm thấy dữ liệu") ||
        document.body.textContent?.includes("Không tìm thấy dữ liệu")
      ) {
        isWarningFound = true;
        break;
      }

      const currentTable = document.querySelector(CONFIG.selectors.table);
      if (currentTable && currentTable.innerHTML !== originalHtml) {
        isUpdated = true;
        break;
      }

      await wait(CONFIG.timeouts.scrollWait);
    }

    if (!(isUpdated || isWarningFound)) {
      console.warn(`Bảng dữ liệu có thể không được cập nhật cho học kỳ: ${semesterText}`);
    }

    await wait(CONFIG.timeouts.tableUpdateShort);
  };

  const parseDateString = (dateStr: string): Date => {
    const [d, m, y] = dateStr.split("/");
    const fullYear = Number.parseInt(y, 10) + 2000;
    return new Date(fullYear, Number.parseInt(m, 10) - 1, Number.parseInt(d, 10));
  };

  const getDayOffset = (dayStr: string): number => {
    if (dayStr.toUpperCase() === "CN" || dayStr === "8") {
      return 0;
    }
    return Number.parseInt(dayStr, 10) - 1;
  };

  type TempSubject = {
    code: string;
    title: string;
    group: string;
    teacherFallback: string;
  };

  const parseRoomInfo = (
    roomStr: string,
    hasLink: boolean
  ): {
    category: "COURSE" | "LAB" | "OTHER";
    locationType: "NB" | "MLA" | "VVT" | "GP" | "LB" | "OTHER";
    formattedRoom: string;
  } => {
    let category: "COURSE" | "LAB" | "OTHER" = "COURSE";
    let locationType: "NB" | "MLA" | "VVT" | "GP" | "LB" | "OTHER" = "OTHER";
    let locationText = "";
    const lowerRoom = roomStr.trim();

    const rules = [
      { prefix: "NB.PM", cat: "LAB", locText: "Cơ sở Nhơn Đức (Nhà Bè)", locType: "NB" },
      { prefix: "NB.PDN", cat: "OTHER", locText: "Cơ sở Nhơn Đức (Nhà Bè)", locType: "NB" },
      { prefix: "NB", cat: "COURSE", locText: "Cơ sở Nhơn Đức (Nhà Bè)", locType: "NB" },
      { prefix: "LB.GDQP", cat: "OTHER", locText: "Cơ sở Long Hưng (Long Bình Tân)", locType: "LB" },
      { prefix: "LB", cat: "OTHER", locText: "Cơ sở Long Hưng (Long Bình Tân)", locType: "LB" },
      { prefix: "MLA", cat: "COURSE", locText: "Cơ sở Mai Thị Lựu", locType: "MLA" },
      { prefix: "MLD", cat: "COURSE", locText: "Cơ sở Mai Thị Lựu", locType: "MLA" },
      { prefix: "A.PM", cat: "LAB", locText: "Cơ sở Võ Văn Tần", locType: "VVT" },
      { prefix: "A", cat: "COURSE", locText: "Cơ sở Võ Văn Tần", locType: "VVT" },
      { prefix: "GP", cat: "COURSE", locText: "Cơ sở Gia Phú", locType: "GP" }
    ] as const;

    const matchedRule = rules.find((rule) => lowerRoom.startsWith(rule.prefix));
    if (matchedRule) {
      category = matchedRule.cat as "COURSE" | "LAB" | "OTHER";
      locationText = matchedRule.locText;
      locationType = matchedRule.locType as "NB" | "MLA" | "VVT" | "GP" | "LB";
    }

    if (hasLink || lowerRoom.toLowerCase().includes("online")) {
      locationText = locationText ? `${locationText} (Online)` : "Online";
    }

    const formattedRoom = lowerRoom ? `${lowerRoom}${locationText ? `, ${locationText}` : ""}` : locationText;
    return { category, locationType, formattedRoom };
  };

  const generateEntriesFromRow = (
    subject: TempSubject,
    dayStr: string,
    startPeriodStr: string,
    numPeriodsStr: string,
    roomText: string,
    link: string,
    teacher: string,
    dateRangeStr: string
  ): { date: Date; entry: CalendarEntry }[] => {
    const startPeriod = Number.parseInt(startPeriodStr, 10);
    const numPeriods = Number.parseInt(numPeriodsStr, 10);
    const endPeriod = startPeriod + numPeriods - 1;

    const { category, locationType, formattedRoom } = parseRoomInfo(roomText, !!link);

    const timeMap = ["NB", "LB"].includes(locationType) ? PERIOD_TIME_MAP_GROUP_2 : PERIOD_TIME_MAP_GROUP_1;

    const { start: startTime, end: endTime } = {
      start: timeMap[startPeriod]?.start || "",
      end: timeMap[endPeriod]?.end || ""
    };

    const description = link ? `Link học: ${link}` : "";

    // Parse date range: e.g. "05/02/26 đến 12/03/26"
    const match = dateRangeStr.match(DATE_RANGE_REGEX);
    let startDate: Date;
    let endDate: Date;

    if (match) {
      startDate = parseDateString(match[1]);
      endDate = parseDateString(match[2]);
    } else {
      const singleMatch = dateRangeStr.match(SINGLE_DATE_REGEX);
      if (singleMatch) {
        startDate = parseDateString(singleMatch[1]);
        endDate = startDate;
      } else {
        return [];
      }
    }

    const targetDay = getDayOffset(dayStr);
    const results: { date: Date; entry: CalendarEntry }[] = [];
    const currDate = new Date(startDate);

    while (currDate <= endDate) {
      if (currDate.getDay() === targetDay) {
        const dd = String(currDate.getDate()).padStart(2, "0");
        const mm = String(currDate.getMonth() + 1).padStart(2, "0");
        const formattedDay = `Thứ ${dayStr} (${dd}/${mm})`;

        results.push({
          date: new Date(currDate),
          entry: {
            category,
            eventType: "STUDY",
            locationType,
            day: formattedDay, // Format matching old "Thứ X (dd/mm)"
            startPeriod,
            endPeriod,
            startTime,
            endTime,
            title: subject.title,
            code: subject.code,
            group: subject.group,
            room: formattedRoom,
            teacher,
            description,
            link
          }
        });
      }
      currDate.setDate(currDate.getDate() + 1);
    }

    return results;
  };

  const getWeekStartEnd = (date: Date): { start: Date; end: Date } => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const start = new Date(date);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const formatWeekString = (start: Date, end: Date): string => {
    const ddStart = String(start.getDate()).padStart(2, "0");
    const mmStart = String(start.getMonth() + 1).padStart(2, "0");
    const yyyyStart = start.getFullYear();

    const ddEnd = String(end.getDate()).padStart(2, "0");
    const mmEnd = String(end.getMonth() + 1).padStart(2, "0");
    const yyyyEnd = end.getFullYear();

    // Format matching "Tuần ... (dd/mm/yyyy - dd/mm/yyyy)" so existing regex works
    return `Tuần (${ddStart}/${mmStart}/${yyyyStart} - ${ddEnd}/${mmEnd}/${yyyyEnd})`;
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: the scraping logic is complex but linear
  const scrapeScheduleTable = (): WeekData[] => {
    const table = document.querySelector(CONFIG.selectors.table);
    if (!table) {
      console.warn("Không tìm thấy bảng TKB");
      return [];
    }

    const rows = [...table.querySelectorAll(CONFIG.selectors.tableRows)];
    const allEntries: { date: Date; entry: CalendarEntry }[] = [];
    let currentSubjectInfo: TempSubject | null = null;

    for (const row of rows) {
      const cells = [...row.querySelectorAll("td")];
      if (cells.length === 0) {
        continue;
      }

      if (cells.length >= 15) {
        // First row of a subject (usually 21 columns)
        const getText = (index: number) => cells[index]?.textContent?.trim() || "";
        const codeText = getText(0);
        const titleLine = getText(1);
        const title = titleLine.split("(")[0].trim();
        const code = titleLine.match(SUBJECT_CODE_REGEX)?.[1] || codeText;
        const group = getText(3);

        if (code.startsWith("_")) {
          currentSubjectInfo = null;
          continue;
        }

        const dayStr = getText(9); // 10th col (index 9)
        const startPeriodStr = getText(10);
        const numPeriodsStr = getText(11);

        const roomCell = cells[12];
        let roomText = roomCell?.textContent?.trim() || "";
        const linkEl = roomCell?.querySelector("a");
        let link = linkEl?.href || "";

        if (!link) {
          const urlMatch = roomText.match(/(https?:\/\/[^\s,]+)/);
          if (urlMatch) {
            link = urlMatch[1];
          }
        }

        if (link) {
          const linkTextToRemove = linkEl?.textContent?.trim() || link;
          roomText = roomText
            .replace(linkTextToRemove, "")
            .replace(/(?:,\s*)?Online\s*$/i, "")
            .trim();
        }

        const teacher = getText(14);
        const dateRangeStr = getText(15);

        currentSubjectInfo = {
          code,
          title,
          group,
          teacherFallback: teacher
        };

        if (numPeriodsStr === "0") {
          continue;
        }

        const entries = generateEntriesFromRow(
          currentSubjectInfo,
          dayStr,
          startPeriodStr,
          numPeriodsStr,
          roomText,
          link,
          teacher,
          dateRangeStr
        );
        allEntries.push(...entries);
      } else {
        if (!currentSubjectInfo) {
          continue;
        }

        const getText = (index: number) => cells[index]?.textContent?.trim() || "";
        const dayStr = getText(0); // 1st col
        const startPeriodStr = getText(1);
        const numPeriodsStr = getText(2);

        const roomCell = cells[3];
        let roomText = roomCell?.textContent?.trim() || "";
        const linkEl = roomCell?.querySelector("a");
        let link = linkEl?.href || "";

        if (!link) {
          const urlMatch = roomText.match(/(https?:\/\/[^\s,]+)/);
          if (urlMatch) {
            link = urlMatch[1];
          }
        }

        if (link) {
          const linkTextToRemove = linkEl?.textContent?.trim() || link;
          roomText = roomText
            .replace(linkTextToRemove, "")
            .replace(/(?:,\s*)?Online\s*$/i, "")
            .trim();
        }

        let teacher = getText(5);
        if (teacher) {
          currentSubjectInfo.teacherFallback = teacher;
        } else {
          teacher = currentSubjectInfo.teacherFallback;
        }

        const dateRangeStr = getText(6); // 7th col

        if (numPeriodsStr === "0") {
          continue;
        }

        const entries = generateEntriesFromRow(
          currentSubjectInfo,
          dayStr,
          startPeriodStr,
          numPeriodsStr,
          roomText,
          link,
          teacher,
          dateRangeStr
        );
        allEntries.push(...entries);
      }
    }

    // Group all generated entries by week
    const weekMap = new Map<string, CalendarEntry[]>();

    for (const { date, entry } of allEntries) {
      const { start, end } = getWeekStartEnd(date);
      const weekStr = formatWeekString(start, end);

      if (!weekMap.has(weekStr)) {
        weekMap.set(weekStr, []);
      }
      weekMap.get(weekStr)?.push(entry);
    }

    const sortedWeeks = Array.from(weekMap.entries())
      .map(([week, schedule]) => {
        const match = week.match(WEEK_MATCH_REGEX);
        const year = match ? Number.parseInt(match[1], 10) : 0;
        return { week, schedule };
      })
      .sort((a, b) => {
        const aMatch = a.week.match(WEEK_SORT_REGEX);
        const bMatch = b.week.match(WEEK_SORT_REGEX);
        if (aMatch && bMatch) {
          const dateA = new Date(
            Number.parseInt(aMatch[3], 10),
            Number.parseInt(aMatch[2], 10) - 1,
            Number.parseInt(aMatch[1], 10)
          ).getTime();
          const dateB = new Date(
            Number.parseInt(bMatch[3], 10),
            Number.parseInt(bMatch[2], 10) - 1,
            Number.parseInt(bMatch[1], 10)
          ).getTime();
          return dateA - dateB;
        }
        return 0;
      });

    return sortedWeeks;
  };

  // ==================== MAIN EXECUTION ====================
  try {
    console.log("🚀 Bắt đầu lấy dữ liệu lịch học (TKB Học Kỳ)...");

    if (!window.location.hash.includes("/tkb-hocky")) {
      throw new Error("Vui lòng chuyển đến trang 'Thời khóa biểu dạng học kỳ' để thực hiện thao tác này.");
    }

    showOverlay();
    onProgress?.(0, "Đang lấy danh sách học kỳ...");
    updateOverlay(0, "Đang lấy danh sách học kỳ...");

    const semesters = await getSemesters();
    if (semesters.length === 0) {
      throw new Error("Không tìm thấy học kỳ nào");
    }

    const allData: SemesterData[] = [];
    const totalSemesters = semesters.length;

    for (let semesterIndex = 0; semesterIndex < semesters.length; semesterIndex++) {
      const semester = semesters[semesterIndex];
      const semesterProgress = (semesterIndex / totalSemesters) * 100;

      onProgress?.(semesterProgress, `Đang xử lý học kỳ: ${semester}`);
      updateOverlay(semesterProgress, `Đang xử lý học kỳ: ${semester}`);
      updateSemesterInfo(`${semesterIndex + 1}/${totalSemesters}`);

      await selectSemester(semester);

      console.log(`📋 Crawl học kỳ: ${semester}`);
      const weeks = scrapeScheduleTable();
      allData.push({ semester, weeks });
    }

    onProgress?.(100, "Hoàn thành!");
    updateOverlay(100, "Hoàn thành! Đang lưu dữ liệu...");

    await wait(CONFIG.timeouts.completionDelay);
    hideOverlay();

    return allData;
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu lịch học:", err);
    const errorMsg = `Lỗi: ${err instanceof Error ? err.message : String(err)}`;

    onProgress?.(-1, errorMsg);
    updateOverlay(0, errorMsg);

    await wait(CONFIG.timeouts.errorDisplay);
    hideOverlay();

    throw err;
  }
};

export type {
  CalendarEntry,
  ProgressCallback,
  SemesterData,
  WeekData
} from "@/types";
export { getCalendars };
export const getExamCalendars = async (onProgress?: any): Promise<any[]> => {
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const WEEK_MATCH_REGEX = /Tuần \(\d{2}\/\d{2}\/(\d{4}) - \d{2}\/\d{2}\/(\d{4})\)/;
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const WEEK_SORT_REGEX = /Tuần \((\d{2})\/(\d{2})\/(\d{4})/;

  // ==================== CONFIGURATION ====================
  const CONFIG = {
    selectors: {
      semesterSelect: "ng-select[bindlabel='ten_hoc_ky'] div.ng-input",
      semesterDropdown: "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel div.scrollable-content",
      semesterItems: "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel div.scrollable-content > div",
      table: "#printArea div.table-responsive-lg table.table",
      tableRows: "tbody tr"
    },
    timeouts: {
      dropdownOpen: 300,
      dropdownClose: 200,
      scrollWait: 100,
      tableUpdateLong: 15_000,
      tableUpdateShort: 1000,
      errorDisplay: 2000,
      completionDelay: 500
    },
    limits: {
      maxScrollRetries: 15
    },
    overlayIds: {
      overlay: "mpc-crawl-overlay",
      progressBar: "mpc-crawl-progress-bar",
      progressText: "mpc-crawl-progress-text",
      message: "mpc-crawl-message",
      semesterInfo: "mpc-crawl-semester-info"
    }
  };

  // ==================== HELPER FUNCTIONS ====================
  const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

  const createOverlay = (): HTMLDivElement => {
    const overlay = document.createElement("div");
    overlay.id = CONFIG.overlayIds.overlay;
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif";

    const card = document.createElement("div");
    card.style.cssText =
      "background:#fff;border-radius:8px;padding:24px;width:90%;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.15)";

    const title = document.createElement("h3");
    title.textContent = "Đang đọc lịch thi";
    title.style.cssText = "margin:0 0 4px 0;font-size:16px;font-weight:600;color:#0f172a";

    const message = document.createElement("p");
    message.id = CONFIG.overlayIds.message;
    message.textContent = "Đang lấy danh sách học kỳ...";
    message.style.cssText = "margin:0 0 16px 0;font-size:14px;color:#64748b";

    const progressBg = document.createElement("div");
    progressBg.style.cssText = "background:#f1f5f9;border-radius:4px;height:8px;overflow:hidden;margin-bottom:8px";

    const progressBar = document.createElement("div");
    progressBar.id = CONFIG.overlayIds.progressBar;
    progressBar.style.cssText = "height:100%;background:#0f172a;width:0%;transition:width 0.3s ease";
    progressBg.appendChild(progressBar);

    const info = document.createElement("div");
    info.style.cssText = "display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:16px";

    const progressText = document.createElement("span");
    progressText.id = CONFIG.overlayIds.progressText;
    progressText.textContent = "0%";

    const semesterInfo = document.createElement("span");
    semesterInfo.id = CONFIG.overlayIds.semesterInfo;

    info.appendChild(progressText);
    info.appendChild(semesterInfo);

    const warning = document.createElement("div");
    warning.style.cssText =
      "background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px;font-size:13px;color:#991b1b;line-height:1.5";
    warning.innerHTML =
      "<strong>⚠️ Lưu ý:</strong> Không tắt hay thu nhỏ cửa sổ, tắt popup hay chuyển trang. Quá trình này có thể mất vài phút tùy vào số lượng dữ liệu.";

    card.append(title, message, progressBg, info, warning);
    overlay.appendChild(card);
    return overlay;
  };

  const showOverlay = (): void => {
    const existing = document.getElementById(CONFIG.overlayIds.overlay);
    if (existing) {
      existing.remove();
    }
    document.body.appendChild(createOverlay());
    document.body.style.overflow = "hidden";
  };

  const updateOverlay = (progress: number, message: string): void => {
    const progressBar = document.getElementById(CONFIG.overlayIds.progressBar);
    const progressText = document.getElementById(CONFIG.overlayIds.progressText);
    const messageEl = document.getElementById(CONFIG.overlayIds.message);

    if (progressBar) {
      progressBar.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
    }
    if (progressText) {
      progressText.textContent = `${Math.round(progress)}%`;
    }
    if (messageEl) {
      messageEl.textContent = message;
    }
  };

  const updateSemesterInfo = (info: string): void => {
    const el = document.getElementById(CONFIG.overlayIds.semesterInfo);
    if (el) {
      el.textContent = info;
    }
  };

  const hideOverlay = (): void => {
    const overlay = document.getElementById(CONFIG.overlayIds.overlay);
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.3s ease";
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = "";
      }, 300);
    }
  };

  const scrollDropdownToLoadAll = async (scrollableContent: Element): Promise<void> => {
    let lastHeight = 0;
    let retries = 0;

    while (retries < CONFIG.limits.maxScrollRetries) {
      scrollableContent.scrollTop = scrollableContent.scrollHeight;
      await wait(CONFIG.timeouts.scrollWait);

      const currentHeight = scrollableContent.scrollHeight;
      if (currentHeight === lastHeight) {
        break;
      }

      lastHeight = currentHeight;
      retries++;
    }

    scrollableContent.scrollTop = 0;
    await wait(CONFIG.timeouts.scrollWait);
  };

  const getSemesters = async (): Promise<string[]> => {
    // Capture the currently selected semester BEFORE any DOM interaction
    const getCurrentSelected = (): string | null => {
      const labelEl =
        document.querySelector("ng-select[bindvalue='hoc_ky'] .ng-value-label") ||
        document.querySelector("ng-select[bindlabel='ten_hoc_ky'] .ng-value-label") ||
        document.querySelector(".ng-value-label");
      return labelEl?.textContent?.trim() || null;
    };

    const savedCurrent = getCurrentSelected();
    console.log("📌 Học kỳ hiện tại:", savedCurrent);

    const inputDiv =
      document.querySelector("ng-select[bindlabel='ten_hoc_ky'] div.ng-input") ||
      document.querySelector("ng-select div.ng-input");

    if (!inputDiv) {
      if (savedCurrent) {
        return [savedCurrent];
      }
      throw new Error("Không tìm thấy bộ chọn học kỳ");
    }

    inputDiv.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await wait(CONFIG.timeouts.dropdownOpen);

    const dropdownSelectors = [
      "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel div.scrollable-content",
      "ng-select ng-dropdown-panel div.scrollable-content",
      "ng-dropdown-panel div.scrollable-content"
    ];
    let scrollableContent: Element | null = null;
    for (const sel of dropdownSelectors) {
      scrollableContent = document.querySelector(sel);
      if (scrollableContent) {
        break;
      }
    }

    if (scrollableContent) {
      await scrollDropdownToLoadAll(scrollableContent);
    }

    const itemSelectors = [
      "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel div.scrollable-content > div",
      "ng-select ng-dropdown-panel div.scrollable-content > div",
      "ng-dropdown-panel div.scrollable-content > div",
      "ng-dropdown-panel .ng-option"
    ];
    let items: NodeListOf<Element> | null = null;
    for (const sel of itemSelectors) {
      const found = document.querySelectorAll(sel);
      if (found.length > 0) {
        items = found;
        break;
      }
    }

    const semesters = items
      ? Array.from(items)
          .map((item) => item.textContent?.trim())
          .filter((text): text is string => Boolean(text))
      : [];

    inputDiv.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await wait(CONFIG.timeouts.dropdownClose);
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await wait(100);

    if (semesters.length === 0 && savedCurrent) {
      console.warn("Dropdown không có items, fallback về học kỳ hiện tại:", savedCurrent);
      return [savedCurrent];
    }

    return semesters.reverse();
  };

  const selectSemester = async (semesterName: string): Promise<void> => {
    // If already showing the requested semester, skip dropdown interaction
    const currentLabel =
      document.querySelector("ng-select[bindlabel='ten_hoc_ky'] .ng-value-label")?.textContent?.trim() ||
      document.querySelector("ng-select .ng-value-label")?.textContent?.trim();
    if (currentLabel === semesterName) {
      console.log(`Đang ở học kỳ "${semesterName}", bỏ qua bước chọn.`);
      return;
    }

    const table = document.querySelector(CONFIG.selectors.table);
    let originalHtml = "";
    if (table) {
      originalHtml = table.innerHTML;
    }

    const inputDiv =
      document.querySelector("ng-select[bindlabel='ten_hoc_ky'] div.ng-input") ||
      document.querySelector("ng-select div.ng-input");
    const clickTarget = inputDiv || (document.querySelector("ng-select[bindlabel='ten_hoc_ky']") as HTMLElement);

    if (!clickTarget) {
      throw new Error("Không tìm thấy bộ chọn học kỳ để tải dữ liệu");
    }

    clickTarget.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await wait(CONFIG.timeouts.dropdownOpen);

    const dropdownSelectors = [
      "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel div.scrollable-content",
      "ng-select ng-dropdown-panel div.scrollable-content",
      "ng-dropdown-panel div.scrollable-content"
    ];
    let scrollableContent: Element | null = null;
    for (const sel of dropdownSelectors) {
      scrollableContent = document.querySelector(sel);
      if (scrollableContent) {
        break;
      }
    }
    if (scrollableContent) {
      await scrollDropdownToLoadAll(scrollableContent);
    }

    const itemSelectors = [
      "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel div.scrollable-content > div",
      "ng-select ng-dropdown-panel div.scrollable-content > div",
      "ng-dropdown-panel div.scrollable-content > div",
      "ng-dropdown-panel .ng-option"
    ];
    let targetItem: Element | undefined;
    for (const sel of itemSelectors) {
      const found = document.querySelectorAll(sel);
      if (found.length > 0) {
        targetItem = Array.from(found).find((item) => item.textContent?.trim() === semesterName);
        if (targetItem) {
          break;
        }
      }
    }

    if (!targetItem) {
      // Close dropdown and give up - assume data is already correct
      clickTarget.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      await wait(CONFIG.timeouts.dropdownClose);
      console.warn(`Không tìm thấy học kỳ "${semesterName}" trong dropdown, dùng dữ liệu hiện tại.`);
      return;
    }

    (targetItem as HTMLElement).scrollIntoView({ block: "nearest" });
    await wait(CONFIG.timeouts.scrollWait);
    (targetItem as HTMLElement).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    (targetItem as HTMLElement).click();
    await wait(CONFIG.timeouts.dropdownClose);

    // Wait for table to update
    const startTime = Date.now();
    let isUpdated = false;
    let isWarningFound = false;

    while (Date.now() - startTime < CONFIG.timeouts.tableUpdateLong) {
      const warningText = document.querySelector(".alert-warning")?.textContent || "";
      if (
        warningText.includes("Không tìm thấy dữ liệu") ||
        document.body.textContent?.includes("Không tìm thấy dữ liệu")
      ) {
        isWarningFound = true;
        break;
      }

      const currentTable = document.querySelector(CONFIG.selectors.table);
      if (currentTable && currentTable.innerHTML !== originalHtml) {
        isUpdated = true;
        break;
      }

      await wait(CONFIG.timeouts.scrollWait);
    }

    if (!(isUpdated || isWarningFound)) {
      console.warn(`Bảng dữ liệu có thể không được cập nhật cho học kỳ: ${semesterName}`);
    }

    await wait(CONFIG.timeouts.tableUpdateShort);
  };

  const getWeekStartEnd = (dateStr: string): { start: Date; end: Date } => {
    const [day, month, year] = dateStr.split("/").map(Number);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

    const start = new Date(d.setDate(diff));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  };

  const formatWeekString = (start: Date, end: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const sStr = `${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()}`;
    const eStr = `${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()}`;
    return `Tuần (${sStr} - ${eStr})`;
  };

  const calculateEndTime = (startTime: string, durationInPeriods: number): string => {
    const [hour, min] = startTime.split(":").map(Number);
    // Assuming each period is 50 minutes, wait, let's just do hours and minutes
    const totalMinutes = hour * 60 + min + durationInPeriods * 50; // Just a rough estimate
    const endHour = Math.floor(totalMinutes / 60);
    const endMin = totalMinutes % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(endHour)}:${pad(endMin)}`;
  };

  const scrapeScheduleTable = () => {
    const rows = document.querySelectorAll(CONFIG.selectors.tableRows);
    const allEntries: { date: string; entry: any }[] = [];

    // Skip the first row if it's the search/filter row
    // Filter rows with class "bg-white text-center align-middle ng-star-inserted"
    const dataRows = Array.from(rows).filter(
      (row) => row.classList.contains("bg-white") && row.querySelectorAll("td").length >= 10
    );

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const cells = row.querySelectorAll("td");

      // Based on DOM:
      // 1: Mã MH, 2: Tên môn, 3: Nhóm, 4: Sĩ số, 5: Ngày, 6: Giờ bắt đầu, 7: Phòng, 8: Địa điểm, 11: Tiết bắt đầu (duration)
      const code = cells[1]?.textContent?.trim() || "";
      const title = cells[2]?.textContent?.trim() || "";
      const group = cells[3]?.textContent?.trim() || "";
      const date = cells[5]?.textContent?.trim() || "";
      const startTime = cells[6]?.textContent?.trim() || "";
      const roomStr = cells[7]?.textContent?.trim() || "";
      const locationText = cells[8]?.innerText?.trim().replace(/\n/g, " - ") || cells[8]?.textContent?.trim() || "";

      const room = roomStr ? `${roomStr}${locationText ? ` - ${locationText}` : ""}` : locationText;

      const durationStr = "2"; // Default 2 periods

      if (!(date && startTime)) {
        continue;
      }

      const numPeriods = Number.parseInt(durationStr, 10);
      const endTime = calculateEndTime(startTime, numPeriods);

      const [dayPart, monthPart, yearPart] = date.split("/");
      const dDate = new Date(Number(yearPart), Number(monthPart) - 1, Number(dayPart));
      const dayOfWeek = dDate.getDay();
      const dayNames = ["CN", "2", "3", "4", "5", "6", "7"];
      const formattedDay = `Thứ ${dayNames[dayOfWeek]} (${dayPart.padStart(2, "0")}/${monthPart.padStart(2, "0")})`;

      const entry = {
        id: `exam-${code}-${date.replace(/\//g, "")}`,
        code,
        title,
        group,
        date,
        day: formattedDay,
        startPeriod: 1,
        numPeriods,
        startTime,
        endTime,
        room,
        teacher: "",
        link: "",
        category: "EXAM",
        eventType: "EXAM"
      };

      allEntries.push({ date, entry });
    }

    const weekMap = new Map<string, any[]>();

    for (const { date, entry } of allEntries) {
      const { start, end } = getWeekStartEnd(date);
      const weekStr = formatWeekString(start, end);

      if (!weekMap.has(weekStr)) {
        weekMap.set(weekStr, []);
      }
      weekMap.get(weekStr)?.push(entry);
    }

    const sortedWeeks = Array.from(weekMap.entries())
      .map(([week, schedule]) => {
        const match = week.match(WEEK_MATCH_REGEX);
        const year = match ? Number.parseInt(match[1], 10) : 0;
        return { week, schedule };
      })
      .sort((a, b) => {
        const aMatch = a.week.match(WEEK_SORT_REGEX);
        const bMatch = b.week.match(WEEK_SORT_REGEX);
        if (aMatch && bMatch) {
          const dateA = new Date(
            Number.parseInt(aMatch[3], 10),
            Number.parseInt(aMatch[2], 10) - 1,
            Number.parseInt(aMatch[1], 10)
          ).getTime();
          const dateB = new Date(
            Number.parseInt(bMatch[3], 10),
            Number.parseInt(bMatch[2], 10) - 1,
            Number.parseInt(bMatch[1], 10)
          ).getTime();
          return dateA - dateB;
        }
        return 0;
      });

    return sortedWeeks;
  };

  // ==================== MAIN EXECUTION ====================
  try {
    console.log("🚀 Bắt đầu lấy dữ liệu lịch thi (TKB Cá Nhân)...");

    if (!window.location.hash.includes("/lichthi")) {
      throw new Error("Vui lòng chuyển đến trang 'Xem lịch thi' để thực hiện thao tác này.");
    }

    showOverlay();
    onProgress?.(0, "Đang lấy danh sách học kỳ...");
    updateOverlay(0, "Đang lấy danh sách học kỳ...");

    let semesters = await getSemesters();
    if (semesters.length === 0) {
      throw new Error("Không tìm thấy học kỳ nào");
    }

    // Giới hạn 15 học kỳ mới nhất
    semesters = semesters.slice(0, 15);

    const allData: any[] = [];
    const totalSemesters = semesters.length;

    for (let semesterIndex = 0; semesterIndex < semesters.length; semesterIndex++) {
      const semester = semesters[semesterIndex];
      const semesterProgress = (semesterIndex / totalSemesters) * 100;

      onProgress?.(semesterProgress, `Đang xử lý học kỳ: ${semester}`);
      updateOverlay(semesterProgress, `Đang xử lý học kỳ: ${semester}`);
      updateSemesterInfo(`${semesterIndex + 1}/${totalSemesters}`);

      await selectSemester(semester);

      console.log(`📋 Crawl lịch thi: ${semester}`);
      const weeks = scrapeScheduleTable();
      allData.push({ semester, weeks });
    }

    onProgress?.(100, "Hoàn thành!");
    updateOverlay(100, "Hoàn thành! Đang lưu dữ liệu...");

    await wait(CONFIG.timeouts.completionDelay);
    hideOverlay();

    return allData;
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu lịch thi:", err);
    const errorMsg = `Lỗi: ${err instanceof Error ? err.message : String(err)}`;

    onProgress?.(-1, errorMsg);
    updateOverlay(0, errorMsg);

    await wait(CONFIG.timeouts.errorDisplay);
    hideOverlay();

    throw err;
  }
};
