const _LOCAL = "local";
const _SYNC = "sync";

const _key = (prefix: string, studentId: string, suffix: string) =>
  studentId ? `${prefix}:${studentId}:${suffix}` : `${prefix}:${suffix}`;

// ── Sync keys (global settings, shared across devices) ──
export const _SYNC_GLOBAL_KEY = `${_SYNC}:global` as const;

// ── Legacy local keys (fallback) ──
export const _CHROME_STORAGE_INFO_KEY = `${_LOCAL}:userData` as const;
export const _CHROME_STORAGE_POINT_KEY = `${_LOCAL}:pointData` as const;
export const _CHROME_STORAGE_CALENDAR_KEY = `${_LOCAL}:calendarData` as const;
export const _CHROME_STORAGE_EXAM_KEY = `${_LOCAL}:examData` as const;

export const _DATA_SUFFIXES = [
  "userData",
  "pointData",
  "calendarData",
  "examData",
  "tuitionData",
  "userSettings"
] as const;

export const getScopedKey = (studentId: string, suffix: string) =>
  _key(_LOCAL, studentId, suffix) as `${typeof _LOCAL}:${string}`;

export const getStudentKeys = (studentId: string): string[] => _DATA_SUFFIXES.map((s) => getScopedKey(studentId, s));

export const getAvatarKey = (studentId: string) => _key(_LOCAL, studentId, "avatar") as `${typeof _LOCAL}:${string}`;

export const getUserInfoKey = (studentId: string) => getScopedKey(studentId, "userData");
export const getPointKey = (studentId: string) => getScopedKey(studentId, "pointData");
export const getCalendarKey = (studentId: string) => getScopedKey(studentId, "calendarData");
export const getExamKey = (studentId: string) => getScopedKey(studentId, "examData");
export const getTuitionKey = (studentId: string) => getScopedKey(studentId, "tuitionData");
export const getUserSettingsKey = (studentId: string) => getScopedKey(studentId, "userSettings");
