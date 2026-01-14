import { create } from "zustand";
import type { CalendarStorageType, SemesterData } from "./type";

const STORAGE_KEY = "calendar_data";

type CalendarState = {
  calendarData: SemesterData[] | null;
  lastUpdate: Date | null;
  setCalendarData: (data: SemesterData[]) => void;
  setLastUpdate: (date: Date | null) => void;
  getData: () => Promise<void>;
  saveData: () => Promise<void>;
  clearData: () => Promise<void>;
};

export const useCalendarStore = create<CalendarState>((set, get) => ({
  calendarData: null,
  lastUpdate: null,

  setCalendarData: (data: SemesterData[]) => set({ calendarData: data }),

  setLastUpdate: (date: Date | null) => set({ lastUpdate: date }),

  getData: async () => {
    try {
      const result = await browser.storage.local.get(STORAGE_KEY);
      if (result[STORAGE_KEY]) {
        const storageData = result[STORAGE_KEY] as CalendarStorageType;
        set({
          calendarData: storageData.data,
          lastUpdate: storageData.updatedAt ? new Date(storageData.updatedAt) : null
        });
      }
    } catch (error) {
      console.error("[Calendar Store] Error loading data:", error);
    }
  },

  saveData: async () => {
    try {
      const data: CalendarStorageType = {
        data: get().calendarData || [],
        updatedAt: new Date().toISOString()
      };
      await browser.storage.local.set({ [STORAGE_KEY]: data });
      set({ lastUpdate: new Date() });
    } catch (error) {
      console.error("[Calendar Store] Error saving data:", error);
    }
  },

  clearData: async () => {
    try {
      await browser.storage.local.remove(STORAGE_KEY);
      set({ calendarData: null, lastUpdate: null });
    } catch (error) {
      console.error("[Calendar Store] Error clearing data:", error);
    }
  }
}));
