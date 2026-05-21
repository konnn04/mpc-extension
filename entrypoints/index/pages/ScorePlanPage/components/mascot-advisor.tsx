import { AlertCircle, BookOpen, GraduationCap, Shield, ShieldAlert, ShieldCheck, Star, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  _DEFAULT_ACADEMIC_RANKS,
  _DEFAULT_EXCELLENT_GPA_THRESHOLD,
  _DEFAULT_MIN_TRAINING_POINT_SCHOLARSHIP,
  _DEFAULT_MIN_TRAINING_POINT_WARNING
} from "@/constants/default";
import { cn } from "@/lib/utils";
import { useScoreStore } from "@/store/use-score-store";
import { useUserSettingsStore } from "@/store/use-user-settings-store";
import { getAcademicRank, getTrainingRank } from "@/utils/academic-compute";
import { getScoreSummary } from "@/utils/score";

export function MascotAdvisor() {
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const scores = useScoreStore((s) => s.scores);
  const { settings: userSettings } = useUserSettingsStore();
  const totalProgramCredits = userSettings.totalProgramCredits;
  const trainingSemesters = userSettings.trainingSemesters;

  const summary = useMemo(() => getScoreSummary(scores, trainingSemesters), [scores, trainingSemesters]);
  const currentGpa = summary.gpa4;
  const currentCredit = summary.totalCredit;

  const analysis = useMemo(() => {
    const remainingCredits = Math.max(0, totalProgramCredits - currentCredit);
    const maxPossibleGpa =
      remainingCredits > 0 ? (currentGpa * currentCredit + 4.0 * remainingCredits) / totalProgramCredits : currentGpa;

    const lowSubjects = scores
      .flatMap((s) => s.data)
      .filter((sub) => !sub.isIgnore && sub.point.scale10 !== null && sub.point.scale10 < 7.0 && sub.point.scale10 > 0)
      .sort((a, b) => (a.point.scale10 ?? 0) - (b.point.scale10 ?? 0))
      .slice(0, 4);

    const currentTrainingPoint = summary.avgTrainingPoint;
    const trainingRank = getTrainingRank(currentTrainingPoint);
    const currentRank = getAcademicRank(currentGpa);

    return {
      remainingCredits,
      maxPossibleGpa,
      lowSubjects,
      currentTrainingPoint,
      trainingRank,
      currentRank
    };
  }, [scores, currentGpa, currentCredit, summary.avgTrainingPoint, totalProgramCredits]);

  return (
    <>
      <button
        aria-label='Mở góc cố vấn học tập'
        className='fixed right-4 bottom-4 z-50 cursor-pointer border-none bg-transparent p-0 transition-all duration-300'
        onClick={() => setOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        type='button'
      >
        <div
          className={cn(
            "relative h-36 w-36 transform transition-all duration-300",
            isHovered
              ? "-translate-x-2 -translate-y-4 scale-110 opacity-100 drop-shadow-2xl"
              : "translate-x-10 translate-y-10 scale-90 opacity-50 drop-shadow-md hover:scale-100"
          )}
        >
          <img
            alt='Advisor Mascot'
            className={cn(
              "h-full w-full object-contain transition-transform duration-300",
              !isHovered && "animate-[pulse_3s_ease-in-out_infinite]"
            )}
            height={144}
            src={isHovered ? "/imgs/2.png" : "/imgs/1.png"}
            width={144}
          />
        </div>
      </button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className='min-w-2xl overflow-hidden border-emerald-500/30 bg-background/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-md'>
          <div className='border-b bg-muted/30 p-5'>
            <DialogHeader>
              <div className='flex items-center gap-4'>
                <div className='h-14 w-14 shrink-0 rounded-full border border-emerald-500/20 bg-white/50 p-1 shadow-sm dark:bg-black/50'>
                  <img alt='Mascot' className='h-full w-full object-contain' height={56} src='/imgs/1.png' width={56} />
                </div>
                <div>
                  <DialogTitle className='font-bold text-emerald-700 text-xl dark:text-emerald-400'>
                    Góc Cố Vấn Học Tập
                  </DialogTitle>
                  <DialogDescription className='mt-1 text-sm'>
                    Cùng xem xét lộ trình tốt nghiệp của bạn nhé!
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className='scrollbar-thin max-h-[70vh] space-y-6 overflow-y-auto px-5 py-4'>
            <div className='flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4'>
              <div>
                <p className='mb-1 flex items-center gap-1.5 font-medium text-emerald-800/70 text-sm dark:text-emerald-200/70'>
                  <GraduationCap className='h-4 w-4' /> Dự kiến tốt nghiệp loại
                </p>
                <div className='flex items-baseline gap-2'>
                  <p className='font-black text-2xl text-emerald-600 dark:text-emerald-400'>
                    {analysis.currentRank.label}
                  </p>
                  <p className='font-medium text-muted-foreground text-sm'>(GPA: {currentGpa.toFixed(2)})</p>
                </div>
              </div>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl shadow-inner dark:bg-emerald-900/40'>
                {analysis.currentRank.emoji}
              </div>
            </div>

            <div>
              <h3 className='mb-3 flex items-center gap-2 font-bold text-base text-foreground/80'>
                <BookOpen className='h-4 w-4 text-emerald-500' /> Tín chỉ & Điểm số
              </h3>
              {currentGpa >= _DEFAULT_EXCELLENT_GPA_THRESHOLD ? (
                <div className='rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center'>
                  <Star className='mx-auto mb-2 h-12 w-12 text-amber-500 drop-shadow-md' />
                  <h3 className='font-bold text-amber-600 text-lg dark:text-amber-400'>Xuất sắc quá!</h3>
                  <p className='mt-1 text-amber-900/70 text-sm dark:text-amber-200/70'>
                    GPA của bạn đã đạt mức {currentGpa.toFixed(2)}. Bạn đang làm rất tốt, cứ duy trì phong độ này nhé!
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='rounded-xl border bg-muted/20 p-4 transition-colors hover:bg-muted/40'>
                      <p className='mb-1 font-medium text-muted-foreground text-xs'>Tín chỉ còn lại</p>
                      <p className='font-bold font-mono text-2xl'>
                        {analysis.remainingCredits}{" "}
                        <span className='font-normal text-muted-foreground text-sm'>/ {totalProgramCredits}</span>
                      </p>
                    </div>
                    <div className='rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 transition-colors hover:bg-blue-500/10'>
                      <p className='mb-1 font-medium text-blue-600/70 text-xs dark:text-blue-400/70'>
                        GPA Tối đa có thể đạt
                      </p>
                      <p className='font-bold font-mono text-2xl text-blue-600 dark:text-blue-400'>
                        {analysis.maxPossibleGpa.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4'>
                    <Target className='mt-0.5 h-5 w-5 shrink-0 text-blue-500' />
                    <div className='text-blue-900 text-sm dark:text-blue-100'>
                      <p>
                        Nếu đạt điểm tuyệt đối (A+) cho {analysis.remainingCredits} tín chỉ còn lại, GPA tối đa của bạn
                        sẽ là <strong className='font-mono'>{analysis.maxPossibleGpa.toFixed(2)}</strong>.
                      </p>
                      {_DEFAULT_ACADEMIC_RANKS.map((item) => {
                        if (currentGpa < item.minGpa4 && analysis.maxPossibleGpa >= item.minGpa4) {
                          return (
                            <p
                              className='mt-2 flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400'
                              key={item.rank.label}
                            >
                              ✨ Khả thi để đạt bằng {item.rank.label}!
                            </p>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>

                  {analysis.lowSubjects.length > 0 && (
                    <div className='mt-5 space-y-3'>
                      <h4 className='flex items-center gap-2 font-bold text-foreground/80 text-sm'>
                        <AlertCircle className='h-4 w-4 text-amber-500' />
                        Gợi ý môn cải thiện
                      </h4>
                      <div className='grid gap-2'>
                        {analysis.lowSubjects.map((sub) => (
                          <div
                            className='flex items-center justify-between rounded-lg border bg-background/50 p-2.5 text-sm shadow-sm transition-colors hover:bg-muted/50'
                            key={`${sub.code}-${sub.name}`}
                          >
                            <div className='flex min-w-0 items-center gap-2.5'>
                              <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted'>
                                <BookOpen className='h-3 w-3 text-muted-foreground' />
                              </div>
                              <span className='truncate font-medium' title={sub.name}>
                                {sub.name}
                              </span>
                            </div>
                            <div className='flex shrink-0 items-center gap-3'>
                              <span className='whitespace-nowrap text-muted-foreground text-xs'>{sub.credit} TC</span>
                              <span
                                className={cn(
                                  "min-w-8 rounded-md px-2 py-0.5 text-center font-bold font-mono",
                                  (sub.point.scale10 ?? 0) < 5
                                    ? "bg-red-500/10 text-red-600"
                                    : "bg-amber-500/10 text-amber-600"
                                )}
                              >
                                {sub.point.character}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className='border-t pt-5'>
              <h3 className='mb-4 flex items-center gap-2 font-bold text-base text-foreground/80'>
                <Shield className='h-4 w-4 text-primary' /> Điểm rèn luyện (ĐRL)
              </h3>

              {(() => {
                if (analysis.currentTrainingPoint < _DEFAULT_MIN_TRAINING_POINT_WARNING) {
                  return (
                    <div className='flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 shadow-sm'>
                      <ShieldAlert className='mt-0.5 h-6 w-6 shrink-0 text-red-500' />
                      <div className='text-red-900 text-sm dark:text-red-200'>
                        <p className='mb-1.5 flex items-center gap-1.5 font-bold text-red-700 dark:text-red-400'>
                          ĐRL đang ở mức {analysis.trainingRank.label} ({analysis.currentTrainingPoint.toFixed(2)})
                        </p>
                        <p className='leading-relaxed opacity-90'>
                          Cảnh báo: Nếu bị xếp loại Yếu/Kém (dưới {_DEFAULT_MIN_TRAINING_POINT_WARNING}) trong 2 học kỳ
                          liên tiếp, bạn sẽ bị buộc ngừng học 1 học kỳ. Hãy cải thiện bằng cách tích cực tham gia các
                          hoạt động ngoại khóa ngay nhé!
                        </p>
                      </div>
                    </div>
                  );
                }
                if (analysis.currentTrainingPoint < _DEFAULT_MIN_TRAINING_POINT_SCHOLARSHIP) {
                  return (
                    <div className='flex items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 shadow-sm'>
                      <AlertCircle className='mt-0.5 h-6 w-6 shrink-0 text-orange-500' />
                      <div className='text-orange-900 text-sm dark:text-orange-200'>
                        <p className='mb-1.5 flex items-center gap-1.5 font-bold text-orange-700 dark:text-orange-400'>
                          ĐRL đang ở mức {analysis.trainingRank.label} ({analysis.currentTrainingPoint.toFixed(2)})
                        </p>
                        <p className='leading-relaxed opacity-90'>
                          Lưu ý: Mức này chưa đủ điều kiện xét học bổng (yêu cầu từ Khá -{" "}
                          {_DEFAULT_MIN_TRAINING_POINT_SCHOLARSHIP}+). Đồng thời nếu bạn đủ điểm tốt nghiệp Giỏi/Xuất
                          sắc mà ĐRL quá thấp, có nguy cơ bị hạ bậc bằng.
                        </p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className='flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-sm'>
                    <ShieldCheck className='mt-0.5 h-6 w-6 shrink-0 text-emerald-500' />
                    <div className='text-emerald-900 text-sm dark:text-emerald-200'>
                      <p className='mb-1.5 flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400'>
                        Tuyệt vời: ĐRL đạt mức {analysis.trainingRank.label} ({analysis.currentTrainingPoint.toFixed(2)}
                        )
                      </p>
                      <p className='leading-relaxed opacity-90'>
                        Bạn đã đủ điều kiện về ĐRL để xét học bổng (Khá trở lên) và an toàn không lo bị hạ bậc bằng tốt
                        nghiệp. Hãy tiếp tục phát huy nhé!
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
