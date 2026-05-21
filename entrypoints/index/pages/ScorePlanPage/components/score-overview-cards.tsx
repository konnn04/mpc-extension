import { ArrowRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScoreSummaryType } from "@/types";
import { getAcademicRank, getTrainingRank } from "@/utils/academic-compute";

function ChangeIndicator({
  oldValue,
  newValue,
  oldNum,
  newNum,
  className = ""
}: {
  oldValue: string;
  newValue: string;
  oldNum?: number;
  newNum?: number;
  className?: string;
}) {
  const hasChange = oldValue !== newValue;
  const isUp = oldNum != null && newNum != null && newNum > oldNum;
  const isDown = oldNum != null && newNum != null && newNum < oldNum;
  let colorClass = "";
  if (isUp) {
    colorClass = "text-emerald-600 dark:text-emerald-400";
  } else if (isDown) {
    colorClass = "text-red-600 dark:text-red-400";
  }

  if (!hasChange) {
    return <span className={className}>{newValue}</span>;
  }

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className='text-muted-foreground'>{oldValue}</span>
      <ArrowRightIcon className='h-5 w-5 text-muted-foreground/60' />
      <span className={colorClass}>{newValue}</span>
    </span>
  );
}

export function ScoreOverviewCards({
  fixedPoint,
  investedCredits,
  isModifiedFromOriginal,
  originalSummary,
  summary,
  trainingSemesters
}: {
  fixedPoint: number;
  investedCredits: number;
  isModifiedFromOriginal: boolean;
  originalSummary: ScoreSummaryType | null;
  summary: ScoreSummaryType;
  trainingSemesters: number;
}) {
  const rank = getAcademicRank(summary.gpa4).label;
  const originalRank = originalSummary ? getAcademicRank(originalSummary.gpa4).label : null;
  const showComparison = isModifiedFromOriginal && originalSummary != null;

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <Card className='relative gap-2 overflow-hidden py-4'>
        <CardHeader className='pb-2'>
          <CardTitle className='font-medium text-muted-foreground text-sm'>GPA</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangeIndicator
            className='font-bold text-3xl'
            newNum={showComparison ? summary.gpa4 : undefined}
            newValue={summary.gpa4.toFixed(fixedPoint)}
            oldNum={showComparison ? originalSummary.gpa4 : undefined}
            oldValue={showComparison ? originalSummary.gpa4.toFixed(fixedPoint) : ""}
          />
          <p className='mt-1 text-muted-foreground text-xs'>
            Hệ 10:{" "}
            {showComparison ? (
              <ChangeIndicator
                newNum={summary.gpa10}
                newValue={summary.gpa10.toFixed(fixedPoint)}
                oldNum={originalSummary.gpa10}
                oldValue={originalSummary.gpa10.toFixed(fixedPoint)}
              />
            ) : (
              <b>{summary.gpa10.toFixed(fixedPoint)}</b>
            )}
          </p>
        </CardContent>
      </Card>
      <Card className='relative gap-2 overflow-hidden py-4'>
        <CardHeader className='pb-2'>
          <CardTitle className='font-medium text-muted-foreground text-sm'>Tổng tín chỉ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='font-bold text-3xl'>{summary.totalCredit}</div>
          {investedCredits > 0 && (
            <p className='mt-1 font-medium text-amber-500 text-xs'>+{investedCredits} TC đầu tư</p>
          )}
        </CardContent>
      </Card>
      <Card className='relative gap-2 overflow-hidden py-4'>
        <CardHeader className='pb-2'>
          <CardTitle className='font-medium text-muted-foreground text-sm'>ĐRL trung bình</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangeIndicator
            className='font-bold text-3xl'
            newNum={showComparison ? (summary.avgTrainingPoint ?? undefined) : undefined}
            newValue={summary.avgTrainingPoint?.toFixed(fixedPoint) ?? "N/A"}
            oldNum={showComparison ? (originalSummary.avgTrainingPoint ?? undefined) : undefined}
            oldValue={showComparison ? (originalSummary.avgTrainingPoint?.toFixed(fixedPoint) ?? "N/A") : ""}
          />
          <p className='mt-1 text-muted-foreground text-xs'>
            {trainingSemesters > 0 ? `Tính trong ${trainingSemesters} kì đầu` : "Tính trong tất cả kì"}
          </p>
        </CardContent>
      </Card>
      <Card className='relative gap-2 overflow-hidden py-4'>
        <CardHeader className='pb-2'>
          <CardTitle className='font-medium text-muted-foreground text-sm'>Học lực</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangeIndicator
            className='font-bold text-3xl'
            newNum={showComparison ? summary.gpa4 : undefined}
            newValue={rank}
            oldNum={showComparison ? originalSummary.gpa4 : undefined}
            oldValue={showComparison && originalRank ? originalRank : ""}
          />
          <p className='mt-1 text-muted-foreground text-xs'>DRL: {getTrainingRank(summary.avgTrainingPoint).label}</p>
        </CardContent>
      </Card>
    </div>
  );
}
