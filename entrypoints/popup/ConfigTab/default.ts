import { _SITE_URL_FIELD } from "@/entrypoints/popup/ConfigTab/type";

const URL_FIELD_LABELS: Record<_SITE_URL_FIELD, string> = {
  homepage: "Trang chủ",
  point: "Bảng điểm",
  classCalendar: "Lịch học",
  examCalendar: "Lịch thi",
  info: "Thông tin cá nhân"
};

const URL_FIELDS: _SITE_URL_FIELD[] = ["homepage", "point", "classCalendar", "examCalendar", "info"];

export { URL_FIELD_LABELS, URL_FIELDS };
