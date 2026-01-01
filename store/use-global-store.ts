import { create } from "zustand";
import { _CHROME_STORAGE_GLOBAL_KEY } from "@/entrypoints/popup/default";
import { _TAB_CATE } from "@/entrypoints/popup/type";

type GlobalStorageType = {
  tab: _TAB_CATE;
};

type GlobalState = {
  tab: _TAB_CATE;
  siteCurr: _SITE_CATE;
  siteCurrURL: string;
  setTab: (tab: _TAB_CATE) => void;
  setSiteCurr: (siteCurr: _SITE_CATE) => void;
  setSiteCurrURL: (siteCurrURL: string) => void;
  saveData: () => Promise<void>;
  getData: () => Promise<void>;
};

export const useGlobalStore = create<GlobalState>((set, get) => ({
  tab: "point",
  siteCurr: "sv",
  siteCurrURL: "",
  setTab: (tab: _TAB_CATE) => {
    set({ tab });
    get().saveData();
  },
  setSiteCurr: (siteCurr: _SITE_CATE) => set({ siteCurr }),
  setSiteCurrURL: (siteCurrURL: string) => set({ siteCurrURL }),
  saveData: async () => {
    const data: GlobalStorageType = {
      tab: get().tab
    };
    await storage.setItem(_CHROME_STORAGE_GLOBAL_KEY, JSON.stringify(data));
  },
  getData: async () => {
    const savedData = JSON.parse((await storage.getItem(_CHROME_STORAGE_GLOBAL_KEY)) || "{}");
    if (savedData?.tab) {
      set({ tab: savedData.tab });
    }
  }
}));
