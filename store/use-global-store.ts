import { create } from "zustand";
import { _DEFAULT_FIXED_POINT, _DEFAULT_IGNORE_SUBJECT_DATA, _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { _CHROME_STORAGE_GLOBAL_KEY } from "@/entrypoints/popup/default";
import { _TAB_CATE } from "@/entrypoints/popup/type";

type GlobalStorageType = {
  tab: _TAB_CATE;
  fixedPoint: number;
  ignoreList: string[];
  siteURLMapping: _SITE_MAPPING;
};

type GlobalState = {
  tab: _TAB_CATE;
  siteCurr: _SITE_CATE;
  siteCurrURL: string;
  fixedPoint: number;
  ignoreList: string[];
  siteURLMapping: _SITE_MAPPING;
  setFixedPoint: (point: number) => void;
  setIgnoreList: (list: string[]) => void;
  setSiteURLMapping: (mapping: _SITE_MAPPING) => void;
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
  fixedPoint: _DEFAULT_FIXED_POINT,
  ignoreList: _DEFAULT_IGNORE_SUBJECT_DATA,
  siteURLMapping: _DEFAULT_SITE_URL_MAPPING,
  setTab: (tab: _TAB_CATE) => {
    set({ tab });
    get().saveData();
  },
  setSiteCurr: (siteCurr: _SITE_CATE) => set({ siteCurr }),
  setSiteCurrURL: (siteCurrURL: string) => set({ siteCurrURL }),
  setFixedPoint: (point: number) => set({ fixedPoint: point }),
  setIgnoreList: (list: string[]) => set({ ignoreList: list }),
  setSiteURLMapping: (mapping: _SITE_MAPPING) => set({ siteURLMapping: mapping }),
  saveData: async () => {
    const data: GlobalStorageType = {
      tab: get().tab,
      fixedPoint: get().fixedPoint,
      ignoreList: get().ignoreList,
      siteURLMapping: get().siteURLMapping
    };
    await storage.setItem(_CHROME_STORAGE_GLOBAL_KEY, JSON.stringify(data));
  },
  getData: async () => {
    const savedData = JSON.parse((await storage.getItem(_CHROME_STORAGE_GLOBAL_KEY)) || "{}");
    if (savedData?.tab) {
      set({ tab: savedData.tab });
    }
    if (savedData?.fixedPoint) {
      set({ fixedPoint: savedData.fixedPoint });
    }
    if (savedData?.ignoreList) {
      set({ ignoreList: savedData.ignoreList });
    }
    if (savedData?.siteURLMapping) {
      const merged: _SITE_MAPPING = { ..._DEFAULT_SITE_URL_MAPPING };
      for (const key of Object.keys(savedData.siteURLMapping) as _SITE_CATE[]) {
        if (merged[key]) {
          merged[key] = { ...merged[key], ...savedData.siteURLMapping[key] };
        }
      }
      set({ siteURLMapping: merged });
    }
  }
}));
