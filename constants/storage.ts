export type _CHROME_STORAGE_CATE = "local" | "sync" | "session" | "managed";
const _CHROME_STORAGE_TYPE: _CHROME_STORAGE_CATE = "local";

// Info
export const _CHROME_STORAGE_INFO_KEY = `${_CHROME_STORAGE_TYPE}:userData` as const;

// Point
export const _CHROME_STORAGE_POINT_KEY = `${_CHROME_STORAGE_TYPE}:pointData` as const;

// Calendar
export const _CHROME_STORAGE_CALENDAR_KEY = `${_CHROME_STORAGE_TYPE}:calendarData` as const;
export const _CHROME_STORAGE_EXAM_KEY = `${_CHROME_STORAGE_TYPE}:examData` as const;

// Config
export const _CHROME_STORAGE_CONFIG_KEY = `${_CHROME_STORAGE_TYPE}:configData` as const;
