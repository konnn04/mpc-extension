import { format } from "date-fns";
import {
  ArrowRightIcon,
  ClipboardCopyIcon,
  DownloadIcon,
  FileOutputIcon,
  FilterIcon,
  ImportIcon,
  MonitorIcon,
  PlusIcon,
  SearchIcon
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { browser } from "wxt/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { _GET_POINT_DATA } from "@/constants/chrome";
import { _DEFAULT_SCORE_SUMMARY } from "@/entrypoints/popup/PointTab/default";
import { FormSemesterDialog } from "@/entrypoints/popup/PointTab/form-semester-dialog";
import type { ScoreGroupType, ScoreRecordType, ScoreSummaryType } from "@/entrypoints/popup/PointTab/type";
import { useScoreStore } from "@/entrypoints/popup/PointTab/use-score-store";
import { useGlobalStore } from "@/store/use-global-store";
import { computeScoreHash } from "@/utils/hash";
import {
  getAcademicRank,
  getNextSemesterName,
  getScoreSummary,
  handleExportData,
  updateIgnoreSubject,
  updateScoreAvg
} from "@/utils/score";
import { FilterModal } from "./filter-modal";
import { ScoreDataTable } from "./score-data-table";

type GroupMode = "semester" | "all";

import { MascotAdvisor } from "./mascot-advisor";

function ScorePlanPage() {
  const fixedPoint = useGlobalStore((s) => s.fixedPoint);
  const ignoreList = useGlobalStore((s) => s.ignoreList);
  const siteURLMapping = useGlobalStore((s) => s.siteURLMapping);
  const siteCurr = useGlobalStore((s) => s.siteCurr);
  const { setScores, scores, originalScores, setOriginalScores, lastUpdate, setLastUpdate, saveData, savedScoresHash } =
    useScoreStore();
  const [summary, setSummary] = useState<ScoreSummaryType>(_DEFAULT_SCORE_SUMMARY);
  const [searchText, setSearchText] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("semester");
  const [filterGrades, setFilterGrades] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [semesterDialog, setSemesterDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    semesterIdx?: number;
  }>({ open: false, mode: "add" });

  const [originalSummary, setOriginalSummary] = useState<ScoreSummaryType | null>(null);

  useEffect(() => {
    if (originalScores.length > 0) {
      setOriginalSummary(getScoreSummary(originalScores));
    } else {
      setOriginalSummary(null);
    }
  }, [originalScores]);

  const currentHash = useMemo(() => computeScoreHash(scores), [scores]);
  const hasUnsavedChanges = savedScoresHash !== "" && currentHash !== savedScoresHash;

  const originalHash = useMemo(() => computeScoreHash(originalScores), [originalScores]);
  const isModifiedFromOriginal = savedScoresHash !== "" && originalHash !== "" && savedScoresHash !== originalHash;

  const investedCredits = useMemo(() => {
    if (!originalScores || originalScores.length === 0) {
      return 0;
    }

    const currentSubs = scores.flatMap((s) => s.data);
    const initSubs = originalScores.flatMap((s) => s.data);

    let invested = 0;
    for (const c of currentSubs) {
      const existed = initSubs.find(
        (i) => i.code === c.code && i.name === c.name && i.credit === c.credit && i.point.scale10 === c.point.scale10
      );
      if (!existed) {
        invested += c.credit;
      }
    }
    return invested;
  }, [scores, originalScores]);

  const handleAutoAddSemester = () => {
    let nextTitle: string | null = null;
    if (scores.length > 0) {
      nextTitle = getNextSemesterName(scores[0].title);
    }

    if (!nextTitle) {
      setSemesterDialog({ open: true, mode: "add" });
      return;
    }

    const newData = [...scores];
    newData.unshift({
      title: nextTitle,
      data: [],
      id: Date.now(),
      totalCredit: 0,
      trainingPoint: null,
      avgPoint: { scale10: null, scale4: null }
    });
    saveCurrentData(newData);
    toast.success("Thêm học kỳ thành công!");
  };

  const updateIgnoreAndAvg = useCallback(
    (data: ScoreGroupType[]) => {
      const updated = updateIgnoreSubject(data, ignoreList);
      return updateScoreAvg(updated);
    },
    [ignoreList]
  );

  const saveCurrentData = (data: ScoreGroupType[]) => {
    const updatedData = updateIgnoreAndAvg(data);
    setSummary(getScoreSummary(updatedData));
    setScores(updatedData);
    setLastUpdate(new Date());
  };

  const handleCancelChanges = async () => {
    // Reload from storage to restore the last saved state
    await useScoreStore.getState().getData();
    toast.info("Đã hủy các thay đổi chưa lưu");
  };

  const handleSaveChanges = async () => {
    await saveData();
    // Re-sync from storage to ensure hash consistency (JSON round-trip strips undefined fields)
    await useScoreStore.getState().getData();
    toast.success("Đã lưu kế hoạch điểm!");
  };

  const handleRestoreOriginal = async () => {
    if (originalScores.length > 0) {
      const restored = structuredClone(originalScores);
      setScores(restored);
      setSummary(getScoreSummary(restored));
      await saveData();
      await useScoreStore.getState().getData();
      toast.success("Đã khôi phục dữ liệu gốc");
    }
  };

  useEffect(() => {
    setSummary(getScoreSummary(scores));
  }, [scores]);

  const handleImportAuto = async () => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url?.startsWith(siteURLMapping[siteCurr].point.split("#")[0])) {
        toast.info(
          "Hãy mở trang điểm trên tiện ích sinh viên, sau đó sử dụng popup extension để nhập dữ liệu tự động."
        );
        window.open(siteURLMapping[siteCurr].point, "_blank");
        return;
      }
      const data: ScoreGroupType[] = await browser.runtime.sendMessage({ type: _GET_POINT_DATA });
      const processedData = updateIgnoreAndAvg(data);
      setOriginalScores(structuredClone(processedData));
      setScores(processedData);
      setSummary(getScoreSummary(processedData));
      await saveData();
      toast.success("Nhập dữ liệu thành công!");
    } catch {
      toast.info("Vui lòng sử dụng popup extension trên trang tiện ích sinh viên để nhập dữ liệu tự động.");
    }
  };

  const handleCopyData = () => {
    const json = JSON.stringify({ summary, lastUpdate: lastUpdate?.toISOString(), scores }, null, 2);
    navigator.clipboard
      .writeText(json)
      .then(() => toast.success("Đã sao chép dữ liệu JSON!"))
      .catch(() => toast.error("Không thể sao chép!"));
  };

  const handleDeleteSubject = (semesterIdx: number, subjectIdx: number) => {
    const newData = [...scores];
    newData[semesterIdx].data.splice(subjectIdx, 1);
    saveCurrentData(newData);
  };

  const handleEditSubject = (
    semesterIdx: number,
    subjectIdx: number,
    subject: Omit<ScoreRecordType, "isIgnore" | "isHead">
  ) => {
    const newData = [...scores];
    newData[semesterIdx].data[subjectIdx] = subject;
    saveCurrentData(newData);
    toast.success("Cập nhật môn học thành công!");
  };

  const handleAddSubject = (semesterIdx: number, subject: Omit<ScoreRecordType, "isIgnore" | "isHead">) => {
    const newData = [...scores];
    newData[semesterIdx].data.unshift(subject);
    saveCurrentData(newData);
    toast.success("Thêm môn học thành công!");
  };

  const handleDeleteSemester = (semesterIdx: number) => {
    const newData = [...scores];
    newData.splice(semesterIdx, 1);
    saveCurrentData(newData);
    toast.success("Xóa học kỳ thành công!");
  };

  const handleSemesterSubmit = (name: string, trainingPoint: number | null) => {
    const newData = [...scores];
    if (semesterDialog.mode === "add") {
      newData.unshift({
        title: name,
        data: [],
        id: Date.now(),
        totalCredit: 0,
        trainingPoint,
        avgPoint: { scale10: null, scale4: null }
      });
      toast.success("Thêm học kỳ thành công!");
    } else if (semesterDialog.semesterIdx !== undefined) {
      newData[semesterDialog.semesterIdx].title = name;
      newData[semesterDialog.semesterIdx].trainingPoint = trainingPoint;
      toast.success("Cập nhật học kỳ thành công!");
    }
    saveCurrentData(newData);
    setSemesterDialog({ open: false, mode: "add" });
  };

  const rank = getAcademicRank(summary.gpa4).label;

  return (
    <div className='space-y-6 pb-24'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='relative gap-2 overflow-hidden py-4'>
          <CardHeader className='pb-2'>
            <CardTitle className='font-medium text-muted-foreground text-sm'>GPA</CardTitle>
          </CardHeader>
          <CardContent>
            {isModifiedFromOriginal && originalSummary ? (
              <>
                <div className='flex items-center gap-2 font-bold text-3xl'>
                  <span className='text-muted-foreground'>{originalSummary.gpa4.toFixed(fixedPoint)}</span>
                  <ArrowRightIcon className='h-5 w-5 text-muted-foreground/60' />
                  <span className='text-emerald-600 dark:text-emerald-400'>{summary.gpa4.toFixed(fixedPoint)}</span>
                </div>
                <p className='mt-1 text-muted-foreground text-xs'>
                  Hệ 10: {originalSummary.gpa10.toFixed(fixedPoint)} →{" "}
                  <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
                    {summary.gpa10.toFixed(fixedPoint)}
                  </span>
                </p>
              </>
            ) : (
              <>
                <div className='font-bold text-3xl'>{summary.gpa4.toFixed(fixedPoint)}</div>
                <p className='mt-1 text-muted-foreground text-xs'>
                  Hệ 10: <b>{summary.gpa10.toFixed(fixedPoint)}</b>
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className='relative gap-2 overflow-hidden py-4'>
          <CardHeader className='pb-2'>
            <CardTitle className='font-medium text-muted-foreground text-sm'>Tổng tín chỉ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-bold text-3xl'>{summary.totalCredit}</div>
          </CardContent>
        </Card>
        <Card className='relative gap-2 overflow-hidden py-4'>
          <CardHeader className='pb-2'>
            <CardTitle className='font-medium text-muted-foreground text-sm'>ĐRL trung bình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-bold text-3xl'>{summary.avgTrainingPoint.toFixed(fixedPoint)}</div>
          </CardContent>
        </Card>
        <Card className='relative gap-2 overflow-hidden py-4'>
          <CardHeader className='pb-2'>
            <CardTitle className='font-medium text-muted-foreground text-sm'>Học lực</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-bold text-3xl'>{rank}</div>
          </CardContent>
        </Card>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        {lastUpdate && (
          <span className='mr-auto text-muted-foreground text-xs'>
            Cập nhật: {format(lastUpdate, "dd/MM/yyyy HH:mm")}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size='sm'>
              <ImportIcon className='mr-2 h-4 w-4' />
              Nhập điểm
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleImportAuto}>
              <MonitorIcon className='mr-2 h-4 w-4 text-blue-500' />
              Nhập tự động
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.info("Tính năng nhập thủ công đang phát triển.")}>
              <DownloadIcon className='mr-2 h-4 w-4 text-green-500' />
              Nhập thủ công
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size='sm' variant='outline'>
              <FileOutputIcon className='mr-2 h-4 w-4' />
              Xuất dữ liệu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => handleExportData(scores)}>
              <FileOutputIcon className='mr-2 h-4 w-4 text-green-500' />
              Xuất điểm (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleCopyData}>
              <ClipboardCopyIcon className='mr-2 h-4 w-4 text-blue-500' />
              Sao chép dữ liệu
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative min-w-50 flex-1'>
          <SearchIcon className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
          <Input
            className='pl-9'
            onChange={(e) => setSearchText(e.target.value)}
            placeholder='Tìm kiếm môn học...'
            value={searchText}
          />
        </div>
        <select
          className='h-9 rounded-md border bg-background px-3 text-sm'
          onChange={(e) => setGroupMode(e.target.value as GroupMode)}
          value={groupMode}
        >
          <option value='semester'>Nhóm theo học kỳ</option>
          <option value='all'>Tất cả</option>
        </select>
        <Button onClick={() => setFilterOpen(true)} size='sm' variant='outline'>
          <FilterIcon className='mr-2 h-4 w-4' />
          Lọc
          {filterGrades.length > 0 && (
            <span className='ml-1 rounded-full bg-primary px-1.5 text-primary-foreground text-xs'>
              {filterGrades.length}
            </span>
          )}
        </Button>

        <Button onClick={handleAutoAddSemester} size='sm' variant='outline'>
          <PlusIcon className='mr-2 h-4 w-4' />
          Thêm kỳ mới
        </Button>
      </div>

      <ScoreDataTable
        data={scores}
        filterGrades={filterGrades}
        fixedPoint={fixedPoint}
        groupMode={groupMode}
        handleAddSubject={handleAddSubject}
        handleDeleteSemester={handleDeleteSemester}
        handleDeleteSubject={handleDeleteSubject}
        handleEditSemester={(idx) => setSemesterDialog({ open: true, mode: "edit", semesterIdx: idx })}
        handleEditSubject={handleEditSubject}
        initialData={originalScores}
        searchText={searchText}
      />

      <FormSemesterDialog
        initialTrainingPoint={
          semesterDialog.mode === "edit" && semesterDialog.semesterIdx !== undefined
            ? (scores[semesterDialog.semesterIdx]?.trainingPoint ?? null)
            : null
        }
        initialValue={
          semesterDialog.mode === "edit" && semesterDialog.semesterIdx !== undefined
            ? scores[semesterDialog.semesterIdx]?.title || ""
            : "Học kỳ mới"
        }
        mode={semesterDialog.mode}
        onOpenChange={(open) => setSemesterDialog({ ...semesterDialog, open })}
        onSubmit={handleSemesterSubmit}
        open={semesterDialog.open}
      />

      <FilterModal
        filterGrades={filterGrades}
        onFilterChange={setFilterGrades}
        onOpenChange={setFilterOpen}
        open={filterOpen}
      />

      {originalSummary && (isModifiedFromOriginal || hasUnsavedChanges) && (
        <div className='sticky bottom-0 z-50'>
          <div className='mx-auto flex max-w-5xl items-center justify-between rounded-2xl border bg-background/90 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] backdrop-blur-md'>
            <div className='flex gap-6'>
              <div>
                <p className='font-medium text-muted-foreground text-sm'>GPA dự kiến</p>
                <div className='flex items-center gap-2 font-bold text-xl'>
                  <span className='text-muted-foreground line-through'>{originalSummary.gpa4.toFixed(fixedPoint)}</span>
                  <ArrowRightIcon className='h-5 w-5 text-muted-foreground' />
                  <span className='text-primary'>{summary.gpa4.toFixed(fixedPoint)}</span>
                </div>
              </div>
              <div className='border-l pl-6'>
                <p className='font-medium text-muted-foreground text-sm'>Tín chỉ đầu tư</p>
                <p className='font-bold text-amber-500 text-xl'>+{investedCredits} TC</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {hasUnsavedChanges ? (
                <>
                  <Button onClick={handleCancelChanges} size='sm' variant='outline'>
                    Hủy sửa đổi
                  </Button>
                  <Button onClick={handleSaveChanges} size='sm'>
                    Lưu kế hoạch
                  </Button>
                </>
              ) : (
                <Button
                  className='text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30'
                  onClick={handleRestoreOriginal}
                  size='sm'
                  variant='outline'
                >
                  Khôi phục bản gốc
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      <MascotAdvisor />
    </div>
  );
}

export { ScorePlanPage };
