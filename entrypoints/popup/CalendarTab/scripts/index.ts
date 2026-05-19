import { type CalendarEntry, type ProgressCallback, type SemesterData } from "../type";

const getCalendars = async (onProgress?: ProgressCallback): Promise<SemesterData[]> => {
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection
  const SUBJECT_CODE_REGEX = /\((.*?)\)/;
  const TIME_REGEX = /\d{2}:\d{2}/g;
  // ==================== CONFIGURATION ====================
  const CONFIG = {
    selectors: {
      semesterSelect: "div.col-lg-3 div.ng-input",
      semesterDropdown: "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel div.scrollable-content",
      semesterItems: "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel div.scrollable-content > div",
      weekValue: "ng-select[bindlabel='thong_tin_tuan'] .ng-value-label",
      nextWeekBtn:
        "#printArea > div.table-responsive-lg.table-frame.mt-3.ng-star-inserted table.table td.clickable.dieuhuong:last-child",
      table: "#printArea > div.table-responsive-lg.table-frame.mt-3.ng-star-inserted table.table",
      tableHeader: "tr:first-child td",
      tableRows: "tbody tr",
      periodCell: "td.bg-primary"
    },
    timeouts: {
      dropdownOpen: 300,
      dropdownClose: 200,
      scrollWait: 100,
      weekChange: 100,
      tableUpdateLong: 5000,
      tableUpdateShort: 500,
      errorDisplay: 2000,
      completionDelay: 500
    },
    limits: {
      maxScrollRetries: 10,
      maxWeeks: 100
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
    const semesters = Array.from(items).map((node) => node.textContent?.trim() || "");

    semesterSelect.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await wait(CONFIG.timeouts.dropdownClose);

    return semesters.reverse();
  };

  const getCurrentWeek = (): string => {
    const weekValue = document.querySelector(CONFIG.selectors.weekValue);
    return weekValue?.textContent?.trim() || "";
  };

  const clickNextWeek = async (): Promise<void> => {
    const nextBtn = document.querySelectorAll(CONFIG.selectors.nextWeekBtn)[0] as HTMLElement;
    if (!nextBtn) {
      throw new Error("Không tìm thấy nút chuyển tuần");
    }

    nextBtn.click();
    await wait(CONFIG.timeouts.weekChange);
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
      throw new Error(`Không tìm thấy học kỳ: ${semesterText}`);
    }

    targetItem.scrollIntoView({ block: "nearest" });
    await wait(CONFIG.timeouts.scrollWait);
    targetItem.click();
    await waitForTableUpdate();
  };

  const getCellType = (cell: Element): "COURSE" | "LAB" | "OTHER" => {
    if (cell.classList.contains("table-primary")) {
      return "COURSE";
    }
    if (cell.classList.contains("table-danger")) {
      return "LAB";
    }
    return "OTHER";
  };

  const processRow = (row: Element, headerCells: string[]): CalendarEntry[] => {
    const periodCell = row.querySelector(CONFIG.selectors.periodCell);
    if (!periodCell) {
      return [];
    }

    const periodText = periodCell.textContent?.replace("Tiết", "").trim() || "";
    const currentPeriod = Number.parseInt(periodText, 10);

    const cells = [...row.querySelectorAll("td")].filter((td) => td.getAttribute("rowspan"));
    const rowEntries: CalendarEntry[] = [];

    for (const cell of cells) {
      const colspanIndex = [...row.children].indexOf(cell);
      const day = headerCells[colspanIndex - 1];
      const rowspan = Number.parseInt(cell.getAttribute("rowspan") || "1", 10);

      const getText = (selector: string) => cell.querySelector(selector)?.textContent?.trim() || "";

      const subjectLine = getText("p.font-weight-bold");
      const subject = subjectLine.split("(")[0].trim();
      const code = subjectLine.match(SUBJECT_CODE_REGEX)?.[1] || "";
      const group = getText("p:nth-of-type(2)").replace("Nhóm:", "").trim();
      const room = getText("p:nth-of-type(3)").replace("Phòng:", "").trim();
      const teacher = getText("p:nth-of-type(4)").replace("GV:", "").trim();
      const time = getText("p:nth-of-type(5)").replace(/\s+/g, " ");
      const [startTime, endTime] = time.match(TIME_REGEX) || [];

      const type = getCellType(cell);

      rowEntries.push({
        category: type,
        day,
        startPeriod: currentPeriod,
        endPeriod: currentPeriod + rowspan - 1,
        startTime: startTime || "",
        endTime: endTime || "",
        title: subject,
        code,
        group,
        room,
        teacher
      });
    }
    return rowEntries;
  };

  const scrapeScheduleTable = (): CalendarEntry[] => {
    const table = document.querySelector(CONFIG.selectors.table);
    if (!table) {
      console.warn("Không tìm thấy bảng TKB");
      return [];
    }

    const headerCells = [...table.querySelectorAll(CONFIG.selectors.tableHeader)]
      .map((td) => td.textContent?.trim() || "")
      .filter((text) => text.includes("Thứ") || text.includes("Chủ"));

    const rows = [...table.querySelectorAll(CONFIG.selectors.tableRows)];
    const result: CalendarEntry[] = [];

    for (const row of rows) {
      result.push(...processRow(row, headerCells));
    }

    return result;
  };

  // ==================== MAIN EXECUTION ====================
  try {
    console.log("🚀 Bắt đầu lấy dữ liệu lịch học...");

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

      const semesterData: SemesterData = { semester, weeks: [] };
      const firstWeek = getCurrentWeek();

      if (!firstWeek) {
        console.warn(`Không đọc được tuần đầu cho học kỳ: ${semester}`);
        allData.push(semesterData);
        continue;
      }

      console.log(`🎯 Bắt đầu từ: ${firstWeek}`);
      let weekCount = 0;
      let currentWeek = firstWeek;

      while (weekCount < CONFIG.limits.maxWeeks) {
        weekCount++;

        const currentProgress = ((semesterIndex + weekCount / 20) / totalSemesters) * 100;
        const progressMsg = `Học kỳ: ${semester} - ${currentWeek}`;

        onProgress?.(Math.min(currentProgress, 99), progressMsg);
        updateOverlay(Math.min(currentProgress, 99), progressMsg);
        updateSemesterInfo(`${semesterIndex + 1}/${totalSemesters} - Tuần ${weekCount}`);

        console.log(`📋 Crawl ${currentWeek}`);

        const schedule = scrapeScheduleTable();
        semesterData.weeks.push({ week: currentWeek, schedule });

        await clickNextWeek();
        const newWeek = getCurrentWeek();

        if (newWeek === firstWeek) {
          console.log(`🔄 Đã loop hết, quay về ${firstWeek}`);
          break;
        }

        currentWeek = newWeek;
      }

      allData.push(semesterData);
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
} from "../type";
export { getCalendars };
