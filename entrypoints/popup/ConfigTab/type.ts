export type _SITE_URL_FIELD = Exclude<
  keyof _SITE_MAPPING[_SITE_CATE],
  "label" | "homepageRegex" | "pointRegex" | "infoRegex" | "classCalendarRegex" | "examCalendarRegex"
>;
