import { create } from "zustand";
import { getTuitionKey } from "@/constants/storage";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import type { SemesterTuitionDetail, TuitionStorageType, TuitionSummaryEntry } from "@/types";

type TuitionState = {
  summary: TuitionSummaryEntry[];
  details: Record<string, SemesterTuitionDetail>;
  lastUpdate: Date | null;
  setData: (summary: TuitionSummaryEntry[], details: Record<string, SemesterTuitionDetail>, studentId?: string) => void;
  setLastUpdate: (date: Date | null) => void;
  getData: () => Promise<void>;
  saveData: (studentId?: string) => Promise<void>;
  clearData: () => Promise<void>;
};

export const useTuitionStore = create<TuitionState>((set, get) => ({
  summary: [],
  details: {},
  lastUpdate: null,

  setData: (summary: TuitionSummaryEntry[], details: Record<string, SemesterTuitionDetail>, studentId?: string) => {
    set({ summary, details });
    get().saveData(studentId);
  },

  setLastUpdate: (date: Date | null) => set({ lastUpdate: date }),

  getData: async () => {
    const sid = useCurrentUserStore.getState().studentId;
    if (!sid) {
      return;
    }
    const key = getTuitionKey(sid);
    const saved = await storage.getItem<TuitionStorageType>(key);
    if (saved?.summary) {
      set({
        summary: saved.summary,
        details: saved.details || {},
        lastUpdate: saved.updatedAt ? new Date(saved.updatedAt) : null
      });
    }
  },

  saveData: async (studentIdParam?: string) => {
    const gsid = useCurrentUserStore.getState();
    const key = getTuitionKey(studentIdParam || gsid.studentId);
    const data: TuitionStorageType = {
      summary: get().summary,
      details: get().details,
      updatedAt: new Date().toISOString()
    };
    await storage.setItem(key, data);
    set({ lastUpdate: new Date() });
  },

  clearData: async () => {
    const key = getTuitionKey(useCurrentUserStore.getState().studentId);
    await storage.removeItem(key);
    set({ summary: [], details: {}, lastUpdate: null });
  }
}));
