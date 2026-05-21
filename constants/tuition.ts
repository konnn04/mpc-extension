/** Service/fee codes that are not academic tuition (BHYT, etc.). */
export const TUITION_SERVICE_CODES = ["_BHYTTN1", "_BHYT12T", "_BHYT6T", "_BHYT12"] as const;

export type TuitionCategoryFilter = "all" | "tuition" | "service";

export const TUITION_CATEGORY_OPTIONS: { value: TuitionCategoryFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "tuition", label: "Học phí" },
  { value: "service", label: "Dịch vụ" }
];

/** Check if a course code is a service (non-tuition) code. */
export function isServiceCode(code: string): boolean {
  return TUITION_SERVICE_CODES.some((prefix) => code.startsWith(prefix));
}
