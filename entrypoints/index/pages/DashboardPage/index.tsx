import { ArrowRightIcon, BookOpenIcon, CalendarIcon, ClockIcon, WalletIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import { _DEFAULT_IGNORE_SEMESTER_TITLE, _DEFAULT_SCORE_SUMMARY } from "@/constants/default";
import { useCalendarStore } from "@/store/use-calendar-store";
import { useGlobalStore } from "@/store/use-global-store";
import { useScoreStore } from "@/store/use-score-store";
import { useTuitionStore } from "@/store/use-tuition-store";
import { useUserSettingsStore } from "@/store/use-user-settings-store";
import type { CalendarEntry, ScoreGroupType, ScoreSummaryType, SemesterData } from "@/types";
import { getAcademicRank } from "@/utils/academic-compute";
import { computeScoreHash } from "@/utils/hash";
import { formatSemesterShort, GRADE_COLORS, getScoreSummary } from "@/utils/score";
import { formatVNDCompact } from "@/utils/tuition-compute";
import { AcademicStatus } from "./components/academic-status";
import { CreditProgress, GpaChart, GradeDistribution, TrainingChart } from "./components/charts";
import { GoalBanner } from "./components/goal-banner";
import { SummaryCards } from "./components/summary-cards";

function computeClassStats(calendarData: SemesterData[]) {
  if (calendarData.length === 0) {
    return null;
  }
  let totalSessions = 0;
  const uniqueCourses = new Set<string>();
  for (const sem of calendarData) {
    for (const week of sem.weeks) {
      for (const entry of week.schedule) {
        if (entry.category !== "COURSE" && entry.category !== "LAB") {
          continue;
        }
        totalSessions++;
        if (entry.code) {
          uniqueCourses.add(entry.code);
        }
      }
    }
  }
  return { totalSessions, totalCourses: uniqueCourses.size, semesterCount: calendarData.length };
}

function DashboardPage() {
  const scores = useScoreStore((s) => s.scores);
  const originalScores = useScoreStore((s) => s.originalScores);
  const savedScoresHash = useScoreStore((s) => s.savedScoresHash);
  const tuitionSummary = useTuitionStore((s) => s.summary);
  const calendarData = useCalendarStore((s) => s.calendarData);
  const scheduleMap = useCalendarStore((s) => s.scheduleMap);
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

  const semestersReversed = [...displayScores].filter((sem) => sem.title !== _DEFAULT_IGNORE_SEMESTER_TITLE).reverse();

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

  const tuitionData = useMemo(() => {
    if (tuitionSummary.length === 0) {
      return null;
    }
    return chartDataTerm
      .map((t) => {
        const entry = tuitionSummary.find((e) => e.semesterName.includes(t.term.replace("HK", "Học kỳ ")));
        return entry ? { term: t.term, tuition: entry.collected } : null;
      })
      .filter(Boolean) as { term: string; tuition: number }[];
  }, [chartDataTerm, tuitionSummary]);

  const classStats = useMemo(() => computeClassStats(calendarData), [calendarData]);

  const totalSpent = useMemo(() => {
    if (tuitionSummary.length === 0) {
      return null;
    }
    return tuitionSummary.reduce((sum, e) => sum + e.collected, 0);
  }, [tuitionSummary]);

  const upcomingEvents = useMemo(() => {
    if (scheduleMap.size === 0) {
      return null;
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const events: { date: Date; entry: CalendarEntry }[] = [];
    for (const [dateStr, entries] of scheduleMap) {
      const [day, month, year] = dateStr.split("/").map(Number);
      const date = new Date(year, month - 1, day);
      if (date >= now) {
        for (const entry of entries) {
          events.push({ date, entry });
        }
      }
    }
    events.sort((a, b) => a.date.getTime() - b.date.getTime());
    return events.slice(0, 20);
  }, [scheduleMap]);

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
          tuitionData={tuitionData ?? undefined}
        />
      </div>

      {(classStats || totalSpent != null || upcomingEvents) && (
        <div className='grid gap-6 lg:grid-cols-3'>
          {classStats && (
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <ClockIcon className='h-4 w-4 text-primary' />
                  Thống kê buổi học
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex items-baseline justify-between'>
                  <span className='text-muted-foreground text-sm'>Tổng buổi học</span>
                  <span className='font-bold text-2xl'>{classStats.totalSessions}</span>
                </div>
                <div className='flex items-baseline justify-between'>
                  <span className='text-muted-foreground text-sm'>Môn học</span>
                  <span className='font-bold text-2xl'>{classStats.totalCourses}</span>
                </div>
                <div className='flex items-baseline justify-between'>
                  <span className='text-muted-foreground text-sm'>Học kỳ có lịch</span>
                  <span className='font-bold text-2xl'>{classStats.semesterCount}</span>
                </div>
                <Button
                  className='mt-3 w-full'
                  onClick={() => {
                    window.location.hash = "calendar";
                  }}
                  size='sm'
                  variant='outline'
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  Xem lịch học
                </Button>
              </CardContent>
            </Card>
          )}

          {totalSpent != null && (
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <WalletIcon className='h-4 w-4 text-primary' />
                  Đã nộp cho trường
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex items-baseline justify-between'>
                  <span className='text-muted-foreground text-sm'>Tổng đã nộp</span>
                  <span className='font-bold text-2xl'>{formatVNDCompact(totalSpent)}</span>
                </div>
                <div className='flex items-baseline justify-between'>
                  <span className='text-muted-foreground text-sm'>Học kỳ</span>
                  <span className='font-bold text-2xl'>{tuitionSummary.length}</span>
                </div>
                <Button
                  className='mt-3 w-full'
                  onClick={() => {
                    window.location.hash = "tuition";
                  }}
                  size='sm'
                  variant='outline'
                >
                  <ArrowRightIcon className='mr-2 h-4 w-4' />
                  Xem học phí
                </Button>
              </CardContent>
            </Card>
          )}

          {upcomingEvents && upcomingEvents.length > 0 && (
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <CalendarIcon className='h-4 w-4 text-primary' />
                  Lịch sắp tới
                </CardTitle>
              </CardHeader>
              <CardContent className='max-h-80 space-y-1 overflow-y-auto'>
                {upcomingEvents.map((ev, i) => (
                  <div
                    className='flex items-start gap-2 border-muted border-b py-1.5 text-sm last:border-0'
                    key={`${ev.date.toISOString()}-${i}`}
                  >
                    <span className='shrink-0 font-medium text-muted-foreground text-xs'>
                      {ev.date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                    </span>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-medium'>{ev.entry.title}</p>
                      <p className='text-muted-foreground text-xs'>
                        {ev.entry.startTime}
                        {ev.entry.endTime ? ` - ${ev.entry.endTime}` : ""} · {ev.entry.room}
                      </p>
                    </div>
                  </div>
                ))}
                <Button
                  className='mt-3 w-full'
                  onClick={() => {
                    window.location.hash = "calendar";
                  }}
                  size='sm'
                  variant='outline'
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  Xem tất cả
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export { DashboardPage };
