type _CHROME_STORAGE_CATE = "local" | "session" | "sync" | "managed";

type _SITE_CATE = "sv" | "kcq";
type _SITE_MAPPING = Record<
  _SITE_CATE,
  {
    label: string;
    /** Plain URL used for navigation / display */
    homepage: string;
    /** Regex pattern to detect if current URL is on homepage */
    homepageRegex: string;
    point: string;
    pointRegex: string;
    info: string;
    infoRegex: string;
    classCalendar: string;
    classCalendarRegex: string;
    examCalendar: string;
    examCalendarRegex: string;
  }
>;

declare module "*.htm" {
  const content: string;
  export default content;
}

declare module "*.md?raw" {
  const content: string;
  export default content;
}
