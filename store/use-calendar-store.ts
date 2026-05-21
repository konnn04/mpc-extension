import { create } from "zustand";
import { getCalendarKey, getExamKey } from "@/constants/storage";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import type { CalendarEntry, CalendarStorageType, SemesterData } from "@/types";
import { buildScheduleMap } from "@/utils/calendar-format";

type CalendarState = {
  calendarData: SemesterData[];
  examData: SemesterData[];
  lastUpdate: Date | null;
  scheduleMap: Map<string, CalendarEntry[]>;
  setCalendarData: (data: SemesterData[]) => void;
  setExamData: (data: SemesterData[]) => void;
  setLastUpdate: (date: Date | null) => void;
  getData: () => Promise<void>;
  saveData: (studentId?: string) => Promise<void>;
  clearData: () => Promise<void>;
};

export const useCalendarStore = create<CalendarState>((set, get) => ({
  calendarData: [],
  examData: [],
  lastUpdate: null,
  scheduleMap: new Map(),

  setCalendarData: (data: SemesterData[]) => {
    const map = buildScheduleMap([...data, ...get().examData]);
    set({ calendarData: data, scheduleMap: map });
  },

  setExamData: (data: SemesterData[]) => {
    const map = buildScheduleMap([...get().calendarData, ...data]);
    set({ examData: data, scheduleMap: map });
  },

  setLastUpdate: (date: Date | null) => set({ lastUpdate: date }),

  getData: async () => {
    try {
      const studentId = useCurrentUserStore.getState().studentId;
      if (!studentId) {
        return;
      }
      const [storageData, examStorageData] = await Promise.all([
        storage.getItem<CalendarStorageType>(getCalendarKey(studentId)),
        storage.getItem<CalendarStorageType>(getExamKey(studentId))
      ]);

      const calendarData = storageData?.data || [];
      const examData = examStorageData?.data || [];
      const map = buildScheduleMap([...calendarData, ...examData]);

      const updated1 = storageData?.updatedAt ? new Date(storageData.updatedAt).getTime() : 0;
      const updated2 = examStorageData?.updatedAt ? new Date(examStorageData.updatedAt).getTime() : 0;
      const maxUpdate = Math.max(updated1, updated2);

      set({
        calendarData,
        examData,
        lastUpdate: maxUpdate > 0 ? new Date(maxUpdate) : null,
        scheduleMap: map
      });
    } catch (error) {
      console.error("[Calendar Store] Error loading data:", error);
    }
  },

  saveData: async (studentIdParam?: string) => {
    try {
      const studentId = studentIdParam || useCurrentUserStore.getState().studentId;
      const updatedAt = new Date().toISOString();
      const data: CalendarStorageType = { data: get().calendarData, updatedAt };
      const examData: CalendarStorageType = { data: get().examData, updatedAt };

      await Promise.all([
        storage.setItem(getCalendarKey(studentId), data),
        storage.setItem(getExamKey(studentId), examData)
      ]);

      set({ lastUpdate: new Date() });
    } catch (error) {
      console.error("[Calendar Store] Error saving data:", error);
    }
  },

  clearData: async () => {
    try {
      const studentId = useCurrentUserStore.getState().studentId;
      await Promise.all([storage.removeItem(getCalendarKey(studentId)), storage.removeItem(getExamKey(studentId))]);
      set({ calendarData: [], examData: [], lastUpdate: null, scheduleMap: new Map() });
    } catch (error) {
      console.error("[Calendar Store] Error clearing data:", error);
    }
  }
}));
