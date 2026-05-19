import {
  ArrowRightIcon,
  AwardIcon,
  BookOpenIcon,
  GraduationCapIcon,
  LayersIcon,
  RocketIcon,
  TrendingUpIcon
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { _DEFAULT_SCORE_SUMMARY } from "@/entrypoints/popup/PointTab/default";
import type { ScoreGroupType, ScoreSummaryType } from "@/entrypoints/popup/PointTab/type";
import { useScoreStore } from "@/entrypoints/popup/PointTab/use-score-store";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/store/use-global-store";
import { computeScoreHash } from "@/utils/hash";
import { formatSemesterShort, GRADE_COLORS, getAcademicRank, getScoreSummary } from "@/utils/score";

function DashboardPage() {
  const scores = useScoreStore((s) => s.scores);
  const originalScores = useScoreStore((s) => s.originalScores);
  const savedScoresHash = useScoreStore((s) => s.savedScoresHash);
  const fixedPoint = useGlobalStore((s) => s.fixedPoint);
  const [summary, setSummary] = useState<ScoreSummaryType>(_DEFAULT_SCORE_SUMMARY);

  // Dashboard luôn hiển thị theo điểm gốc (từ trường)
  const displayScores = originalScores.length > 0 ? originalScores : scores;

  const updateSummary = useCallback((data: ScoreGroupType[]) => {
    setSummary(getScoreSummary(data));
  }, []);

  useEffect(() => {
    updateSummary(displayScores);
  }, [displayScores, updateSummary]);

  const rank = getAcademicRank(summary.gpa4);

  // Detect if user has an active improvement plan (saved scores differ from original)
  const originalHash = useMemo(() => computeScoreHash(originalScores), [originalScores]);
  const hasPlan = savedScoresHash !== "" && originalHash !== "" && savedScoresHash !== originalHash;
  const plannedSummary = useMemo(() => {
    if (!hasPlan) {
      return null;
    }
    return getScoreSummary(scores);
  }, [hasPlan, scores]);
  const plannedRank = plannedSummary ? getAcademicRank(plannedSummary.gpa4) : null;

  const semestersReversed = [...displayScores].reverse();

  const chartDataTerm = semestersReversed.map((sem, idx) => {
    const slice = semestersReversed.slice(0, idx + 1);
    const sum = getScoreSummary(slice);

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
      const ch = sub.point.character;
      gradeCount[ch] = (gradeCount[ch] || 0) + 1;
    }
  }

  const chartDataGrade = Object.keys(GRADE_COLORS)
    .filter((g) => (gradeCount[g] ?? 0) > 0)
    .map((g) => ({
      grade: g,
      count: gradeCount[g] ?? 0,
      fill: GRADE_COLORS[g]
    }));

  const chartConfigGrade = Object.keys(GRADE_COLORS).reduce(
    (acc, grade) => {
      acc[grade] = { label: grade, color: GRADE_COLORS[grade] };
      return acc;
    },
    { count: { label: "Số lượng" } } as ChartConfig
  );

  const totalCredit = summary.totalCredit;
  const targetCredit = 135;

  return (
    <div className='space-y-6'>
      {/* ── Goal Alert Banner ──────────────────────────── */}
      {hasPlan && plannedSummary && (
        <div className='relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 p-4'>
          <div className='flex items-center gap-4'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20'>
              <RocketIcon className='h-5 w-5 text-emerald-500' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='font-semibold text-foreground text-sm'>Bạn đang có mục tiêu cải thiện điểm! 🎯</p>
              <p className='mt-0.5 text-muted-foreground text-xs'>
                GPA mục tiêu:{" "}
                <span className='font-bold text-emerald-600 dark:text-emerald-400'>
                  {plannedSummary.gpa4.toFixed(fixedPoint)}
                </span>
                {plannedSummary.gpa4 > summary.gpa4
                  ? " — Cố gắng lên, bạn sắp đạt được rồi! 💪"
                  : " — Hãy tiếp tục duy trì phong độ nhé!"}
              </p>
            </div>
            <Button
              className='shrink-0 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300'
              onClick={() => {
                window.location.hash = "score-plan";
              }}
              size='sm'
              variant='outline'
            >
              Xem ngay
              <ArrowRightIcon className='ml-1 h-3.5 w-3.5' />
            </Button>
          </div>
          <div className='-right-4 -bottom-4 absolute h-20 w-20 rounded-full bg-emerald-500/5' />
          <div className='-right-1 -bottom-1 absolute h-10 w-10 rounded-full bg-emerald-500/10' />
        </div>
      )}

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='relative gap-2 overflow-hidden py-4'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='font-medium text-muted-foreground text-sm'>GPA</CardTitle>
            <GraduationCapIcon className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='font-bold text-3xl'>{summary.gpa4.toFixed(fixedPoint)}</div>
            <p className='mt-1 text-muted-foreground text-xs'>
              Hệ 10: <span className='font-semibold text-foreground'>{summary.gpa10.toFixed(fixedPoint)}</span>
            </p>
            <div className='absolute right-0 bottom-0 h-12 w-12 rounded-tl-full bg-primary/5' />
          </CardContent>
        </Card>

        <Card className='relative gap-2 overflow-hidden py-4'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='font-medium text-muted-foreground text-sm'>Tổng tín chỉ</CardTitle>
            <BookOpenIcon className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='font-bold text-3xl'>{totalCredit}</div>
            <p className='mt-1 text-muted-foreground text-xs'>{summary.totalSubject ?? 0} môn học</p>
          </CardContent>
        </Card>

        <Card className='relative gap-2 overflow-hidden py-4'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='font-medium text-muted-foreground text-sm'>ĐRL trung bình</CardTitle>
            <AwardIcon className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='font-bold text-3xl'>{summary.avgTrainingPoint.toFixed(fixedPoint)}</div>
            <p className='mt-1 text-muted-foreground text-xs'>Điểm rèn luyện</p>
          </CardContent>
        </Card>

        <Card className='relative gap-2 overflow-hidden py-4'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='font-medium text-muted-foreground text-sm'>Số học kỳ</CardTitle>
            <LayersIcon className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='font-bold text-3xl'>{summary.semesterCount}</div>
            <p className='mt-1 text-muted-foreground text-xs'>Tổng {totalCredit} TC tích lũy</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Academic Status Banner ─────────────────────── */}
      <Card className={cn("gap-2 border py-4", rank.bg)}>
        <CardContent className='flex items-center gap-4 py-4'>
          <span className='text-4xl'>{rank.emoji}</span>
          <div>
            <p className='text-muted-foreground text-sm'>Học lực hiện tại</p>
            <p className={cn("font-bold text-2xl", rank.color)}>{rank.label}</p>
          </div>
          <div className='ml-auto flex items-center gap-2 text-muted-foreground text-sm'>
            <TrendingUpIcon className='h-4 w-4' />
            GPA {summary.gpa4.toFixed(2)} / 4.0
          </div>
        </CardContent>
      </Card>

      {/* ── Charts Grid ────────────────────────────────── */}
      {displayScores.length > 0 ? (
        <div className='grid gap-6 lg:grid-cols-2'>
          {/* Chart 1: GPA by Term */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Điểm TB học kỳ (Hệ 4) & GPA tích lũy</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className='aspect-auto h-[300px] w-full'
                config={{
                  gpa4: { label: "ĐTB Hệ 4 (kỳ)", color: "oklch(0.6 0.2 260)" },
                  cumulativeGpa4: { label: "GPA tích lũy", color: "oklch(0.7 0.19 56)" }
                }}
              >
                <ComposedChart data={chartDataTerm} margin={{ left: -20, right: 10, top: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis axisLine={false} dataKey='term' tickLine={false} tickMargin={10} />
                  <YAxis axisLine={false} domain={[0, 4]} tickLine={false} tickMargin={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    dataKey='gpa4'
                    fill='var(--color-gpa4)'
                    fillOpacity={0.15}
                    stroke='var(--color-gpa4)'
                    strokeWidth={2}
                    type='monotone'
                  />
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey='cumulativeGpa4'
                    dot={{ r: 4 }}
                    stroke='var(--color-cumulativeGpa4)'
                    strokeDasharray='5 5'
                    strokeWidth={2}
                    type='monotone'
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Training Point by Term */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Điểm rèn luyện từng kỳ & ĐRL tích lũy</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className='aspect-auto h-[300px] w-full'
                config={{
                  training: { label: "ĐRL từng kỳ", color: "oklch(0.6 0.2 150)" },
                  cumulativeTraining: { label: "ĐRL tích lũy", color: "oklch(0.7 0.19 56)" }
                }}
              >
                <ComposedChart data={chartDataTerm} margin={{ left: -20, right: 10, top: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis axisLine={false} dataKey='term' tickLine={false} tickMargin={10} />
                  <YAxis axisLine={false} domain={[0, 100]} tickLine={false} tickMargin={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey='training' fill='var(--color-training)' fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey='cumulativeTraining'
                    dot={{ r: 4 }}
                    stroke='var(--color-cumulativeTraining)'
                    strokeDasharray='5 5'
                    strokeWidth={2}
                    type='monotone'
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chart 3: Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Phân bổ điểm số</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className='aspect-auto h-[380px] w-full' config={chartConfigGrade}>
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={chartDataGrade}
                    dataKey='count'
                    innerRadius={20}
                    nameKey='grade'
                    paddingAngle={2}
                    strokeWidth={3}
                  >
                    <LabelList
                      dataKey='grade'
                      fill='#fff'
                      fontSize={12}
                      fontWeight='bold'
                      position='inside'
                      stroke='none'
                    />
                  </Pie>
                  <ChartLegend className='flex-wrap gap-2 pt-6' content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chart 4: Credit Progress */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Tiến độ tín chỉ tích lũy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-end justify-between'>
                  <div>
                    <p className='font-bold text-4xl'>{totalCredit}</p>
                    <p className='text-muted-foreground text-sm'>/ {targetCredit} TC mục tiêu</p>
                  </div>
                  <p className='font-semibold text-2xl text-primary'>
                    {Math.min(100, (totalCredit / targetCredit) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className='relative h-6 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700'
                    style={{ width: `${Math.min(100, (totalCredit / targetCredit) * 100)}%` }}
                  />
                  <div
                    className='absolute top-0 h-full w-0.5 bg-foreground/30'
                    style={{ left: `${(120 / targetCredit) * 100}%` }}
                  />
                </div>

                <div className='flex justify-between text-muted-foreground text-xs'>
                  <span>0 TC</span>
                  <span className='font-medium'>120 TC (tối thiểu)</span>
                  <span>135 TC</span>
                </div>

                <div className='mt-8'>
                  <ChartContainer
                    className='aspect-auto h-[250px] w-full'
                    config={{
                      credit: { label: "TC từng kỳ", color: "oklch(0.6 0.2 200)" }
                    }}
                  >
                    <BarChart data={chartDataTerm} margin={{ left: -20, right: 10, top: 10 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis axisLine={false} dataKey='term' tickLine={false} tickMargin={10} />
                      <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey='credit' fill='var(--color-credit)' maxBarSize={40} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className='py-16 text-center'>
            <GraduationCapIcon className='mx-auto h-12 w-12 text-muted-foreground/50' />
            <p className='mt-4 font-medium text-lg text-muted-foreground'>Chưa có dữ liệu điểm</p>
            <p className='mt-1 text-muted-foreground text-sm'>
              Hãy nhập điểm từ trang Kế hoạch điểm số để xem thống kê tại đây.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { DashboardPage };
