import { ScoreFilterType, ScoreSummaryType } from "@/entrypoints/popup/PointTab/type";

// biome-ignore lint/performance/noBarrelFile: config export
export { _CHROME_STORAGE_POINT_KEY } from "@/constants";

export const _DEFAULT_SCORE_SUMMARY: ScoreSummaryType = {
  semesterCount: 0,
  totalCredit: 0,
  gpa10: 0,
  gpa4: 0,
  avgTrainingPoint: 0
};
export const _DEFAULT_SCORE_FILTER: ScoreFilterType = {
  queryText: "",
  isOnlyCalcGPA: false
};

export const _DEFAULT_FORM_DATA = {
  code: "",
  name: "",
  credit: "",
  scale10: ""
};
