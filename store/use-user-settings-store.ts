import { create } from "zustand";
import { _DEFAULT_USER_SETTINGS } from "@/constants/default";
import { getUserSettingsKey } from "@/constants/storage";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import type { UserSettingsType } from "@/types";

type UserSettingsState = {
  settings: UserSettingsType;
  setSettings: (s: Partial<UserSettingsType>) => void;
  getData: () => Promise<void>;
  saveData: () => Promise<void>;
};

export const useUserSettingsStore = create<UserSettingsState>((set, get) => ({
  settings: { ..._DEFAULT_USER_SETTINGS },
  setSettings: (partial: Partial<UserSettingsType>) => {
    set((s) => ({ settings: { ...s.settings, ...partial } }));
    get().saveData();
  },
  getData: async () => {
    const key = getUserSettingsKey(useCurrentUserStore.getState().effectiveStudentId);
    const raw = await storage.getItem<UserSettingsType>(key);
    if (raw) {
      set({ settings: { ..._DEFAULT_USER_SETTINGS, ...raw } });
    } else {
      set({ settings: { ..._DEFAULT_USER_SETTINGS } });
    }
  },
  saveData: async () => {
    const key = getUserSettingsKey(useCurrentUserStore.getState().effectiveStudentId);
    await storage.setItem(key, get().settings);
  }
}));
