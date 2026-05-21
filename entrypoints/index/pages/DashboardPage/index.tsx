import { BookOpenIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChartConfig } from "@/components/ui/chart";
import { _DEFAULT_SCORE_SUMMARY } from "@/constants/default";
import { useGlobalStore } from "@/store/use-global-store";
import { useScoreStore } from "@/store/use-score-store";
import { useUserSettingsStore } from "@/store/use-user-settings-store";
import type { ScoreGroupType, ScoreSummaryType } from "@/types";
import { getAcademicRank } from "@/utils/academic-compute";
import { computeScoreHash } from "@/utils/hash";
import { formatSemesterShort, GRADE_COLORS, getScoreSummary } from "@/utils/score";
import { AcademicStatus } from "./components/academic-status";
import { CreditProgress, GpaChart, GradeDistribution, TrainingChart } from "./components/charts";
import { GoalBanner } from "./components/goal-banner";
import { SummaryCards } from "./components/summary-cards";

function DashboardPage() {
  const scores = useScoreStore((s) => s.scores);
  const originalScores = useScoreStore((s) => s.originalScores);
  const savedScoresHash = useScoreStore((s) => s.savedScoresHash);
  const fixedPoint = useGlobalStore((s) => s.fixedPoint);
  const { settings: userSettings } = useUserSettingsStore();
  const trainingSemesters = userSettings.trainingSemesters;
  const totalProgramCredits = userSettings.totalProgramCredits;
  const targetCredit = totalProgramCredits;
  const [summary, setSummary] = useState<ScoreSummaryType>(_DEFAULT_SCORE_SUMMARY);

  const displayScores = originalScores.length > 0 ? originalScores : scores;

  const updateSummary = useCallback(
    (data: ScoreGroupType[]) => setSummary(getScoreSummary(data, trainingSemesters)),
    [trainingSemesters]
  );

  useEffect(() => {
    updateSummary(displayScores);
  }, [displayScores, updateSummary]);

  const rank = getAcademicRank(summary.gpa4);
  const originalHash = useMemo(() => computeScoreHash(originalScores), [originalScores]);
  const hasPlan = savedScoresHash !== "" && originalHash !== "" && savedScoresHash !== originalHash;
  const plannedSummary = useMemo(
    () => (hasPlan ? getScoreSummary(scores, trainingSemesters) : null),
    [hasPlan, scores, trainingSemesters]
  );

  const semestersReversed = [...displayScores].reverse();

  const chartDataTerm = semestersReversed.map((sem, idx) => {
    const slice = semestersReversed.slice(0, idx + 1);
    const sum = getScoreSummary(slice, trainingSemesters);
    const validPts = slice.filter((s) => s.trainingPoint !== null && s.trainingPoint !== undefined);
    const cumulativeTraining =
      validPts.length === 0 ? 0 : validPts.reduce((a, b) => a + (b.trainingPoint ?? 0), 0) / validPts.length;
    return {
      term: formatSemesterShort(sem.title),
      gpa4: sem.avgPoint.scale4 ?? 0,
      cumulativeGpa4: sum.gpa4,
      training: sem.trainingPoint ?? 0,
      cumulativeTraining,
      credit: sem.totalCredit,
      cumulativeCredit: sum.totalCredit
    };
  });

  const gradeCount: Record<string, number> = {};
  for (const sem of displayScores) {
    for (const sub of sem.data) {
      if (sub.isIgnore || !sub.point.character) {
        continue;
      }
      gradeCount[sub.point.character] = (gradeCount[sub.point.character] || 0) + 1;
    }
  }

  const chartDataGrade = Object.keys(GRADE_COLORS)
    .filter((g) => (gradeCount[g] ?? 0) > 0)
    .map((g) => ({ grade: g, count: gradeCount[g] ?? 0, fill: GRADE_COLORS[g] }));
  const chartConfigGrade: ChartConfig = Object.keys(GRADE_COLORS).reduce(
    (acc, g) => {
      acc[g] = { label: g, color: GRADE_COLORS[g] };
      return acc;
    },
    { count: { label: "Số lượng" } } as ChartConfig
  );

  if (displayScores.length === 0) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center space-y-4'>
        <div className='mb-4 rounded-full bg-muted p-6'>
          <BookOpenIcon className='h-12 w-12 text-muted-foreground' />
        </div>
        <h2 className='font-semibold text-2xl'>Chưa có dữ liệu điểm số</h2>
        <p className='max-w-md text-center text-muted-foreground'>
          Hệ thống chưa tìm thấy dữ liệu điểm của bạn. Vui lòng truy cập trang web Xem điểm của trường và mở tiện ích
          (popup) để đồng bộ dữ liệu nhé!
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {hasPlan && plannedSummary && (
        <GoalBanner currentGpa4={summary.gpa4} fixedPoint={fixedPoint} plannedGpa4={plannedSummary.gpa4} />
      )}

      <SummaryCards
        avgTrainingPoint={summary.avgTrainingPoint}
        fixedPoint={fixedPoint}
        gpa4={summary.gpa4}
        gpa10={summary.gpa10}
        semesterCount={summary.semesterCount}
        totalCredit={summary.totalCredit}
        totalSubject={summary.totalSubject ?? 0}
        trainingSemesters={trainingSemesters}
      />

      <AcademicStatus gpa4={summary.gpa4} rank={rank} />

      <div className='grid gap-6 lg:grid-cols-2'>
        <GpaChart data={chartDataTerm} />
        <TrainingChart data={chartDataTerm} />
        <GradeDistribution config={chartConfigGrade} data={chartDataGrade} />
        <CreditProgress
          data={chartDataTerm}
          targetCredit={targetCredit}
          totalCredit={summary.totalCredit}
          totalProgramCredits={totalProgramCredits}
        />
      </div>
    </div>
  );
}

export { DashboardPage };
