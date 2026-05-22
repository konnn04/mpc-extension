import { create } from "zustand";
import { getAvatarKey } from "@/constants/storage";

const _KEY = "local:currentUser";

type CurrentUserState = {
  studentId: string;
  displayName: string;
  avatar: string;
  viewStudentId: string;
  effectiveStudentId: string;
  setCurrentUser: (studentId: string, displayName: string, avatar: string) => void;
  clearCurrentUser: () => void;
  setViewStudentId: (id: string) => void;
  load: () => Promise<void>;
};

export const useCurrentUserStore = create<CurrentUserState>((set, get) => ({
  studentId: "",
  displayName: "",
  avatar: "",
  viewStudentId: "",
  get effectiveStudentId() {
    return get().viewStudentId || get().studentId;
  },
  setCurrentUser: (studentId: string, displayName: string, avatar: string) => {
    set({ studentId, displayName, avatar, viewStudentId: "" });
    storage.setItem(_KEY, JSON.stringify({ studentId, displayName }));
    if (avatar) {
      storage.setItem(getAvatarKey(studentId), avatar);
    }
  },
  clearCurrentUser: () => {
    set({ studentId: "", displayName: "", avatar: "", viewStudentId: "" });
    storage.setItem(_KEY, "{}");
  },
  setViewStudentId: (id: string) => set({ viewStudentId: id }),
  load: async () => {
    try {
      const raw = await storage.getItem(_KEY);
      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        if (parsed.studentId) {
          let avatar = "";
          try {
            avatar = (await storage.getItem<string>(getAvatarKey(parsed.studentId))) || "";
          } catch {
            /* ignore */
          }
          set({ studentId: parsed.studentId, displayName: parsed.displayName || "", avatar });
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
  }
}));
