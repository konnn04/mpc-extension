import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CATEGORY_COLORS,
  DATE_MATCH_REGEX,
  SUBJECT_COLOR_DEFAULT,
  SUBJECT_COLOR_PALETTE,
  SUBJECT_HEX_DEFAULT,
  SUBJECT_HEX_PALETTE,
  WEEK_YEAR_REGEX
} from "@/constants";
import type { CalendarEntry, SemesterData } from "@/types";

export type DaySchedule = {
  date: Date;
  schedule: CalendarEntry[];
};

function extractYear(weekString: string): string {
  const weekYearMatch = weekString.match(WEEK_YEAR_REGEX);
  return weekYearMatch ? weekYearMatch[1] : new Date().getFullYear().toString();
}

function extractDateParts(dayString: string): { day: string; month: string } | null {
  const dateMatch = dayString.match(DATE_MATCH_REGEX);
  if (!dateMatch) {
    return null;
  }
  const [, day, month] = dateMatch;
  return { day, month };
}

function addEntryToMap(map: Map<string, CalendarEntry[]>, dateKey: string, entry: CalendarEntry): void {
  if (!map.has(dateKey)) {
    map.set(dateKey, []);
  }
  const entries = map.get(dateKey);
  if (entries) {
    entries.push(entry);
  }
}

export function buildScheduleMap(data: SemesterData[]): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>();

  for (const semester of data) {
    for (const weekData of semester.weeks) {
      const year = extractYear(weekData.week);

      for (const entry of weekData.schedule) {
        const dateParts = extractDateParts(entry.day);
        if (dateParts) {
          const paddedMonth = dateParts.month.padStart(2, "0");
          const paddedDay = dateParts.day.padStart(2, "0");
          const dateKey = `${year}-${paddedMonth}-${paddedDay}`;
          addEntryToMap(map, dateKey, entry);
        }
      }
    }
  }

  return map;
}

export function getScheduleForDate(date: Date, scheduleMap: Map<string, CalendarEntry[]>): CalendarEntry[] {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateKey = `${year}-${month}-${day}`;

  return scheduleMap.get(dateKey) || [];
}

export function hasSchedule(date: Date, scheduleMap: Map<string, CalendarEntry[]>): boolean {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateKey = `${year}-${month}-${day}`;

  const schedule = scheduleMap.get(dateKey);
  return Boolean(schedule && schedule.length > 0);
}

export function formatDate(date: Date): string {
  return format(date, "EEEE, dd/MM/yyyy", { locale: vi });
}

export function formatTime(time: string): string {
  return time || "";
}

export function getSubjectColor(code: string): string {
  const hash = code.split("").reduce((acc, char) => char.charCodeAt(0) + acc * 33, 0);
  return SUBJECT_COLOR_PALETTE[Math.abs(hash) % SUBJECT_COLOR_PALETTE.length] || SUBJECT_COLOR_DEFAULT;
}

export function getSubjectHexColor(code: string): string {
  if (!code) {
    return SUBJECT_HEX_DEFAULT;
  }
  const hash = code.split("").reduce((acc, char) => char.charCodeAt(0) + acc * 33, 0);
  return SUBJECT_HEX_PALETTE[Math.abs(hash) % SUBJECT_HEX_PALETTE.length] || SUBJECT_HEX_DEFAULT;
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.OTHER;
}

export function getCategoryLabel(category?: string): string {
  switch (category) {
    case "COURSE":
      return "Lý thuyết";
    case "LAB":
      return "Thực hành";
    case "EXAM":
      return "Thi cử";
    case "HOLIDAY":
      return "Ngày nghỉ";
    default:
      return "Khác";
  }
}

export function getLocationLabel(location?: string): string {
  switch (location) {
    case "NB":
      return "Nhà Bè";
    case "MLA":
      return "Mai Thị Lựu";
    case "VVT":
      return "Võ Văn Tần";
    case "GP":
      return "Gia Phú";
    case "LB":
      return "Long Bình Tân";
    default:
      return location || "";
  }
}
