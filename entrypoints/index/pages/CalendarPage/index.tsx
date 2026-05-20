import { CalendarPlus, Download, Trash2 } from "lucide-react";
import { useLayoutEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import lichHocLichThiMd from "@/assets/docs/lich_hoc_lich_thi.md?raw";
import { ExportCalendarDialog } from "@/components/custom/export-calendar-dialog";
import { MarkdownModal } from "@/components/custom/markdown-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirm } from "@/hooks/use-confirm";
import { useCalendarStore } from "@/store/use-calendar-store";
import type { CalendarEntry, SemesterData } from "@/types";
import { downloadICS } from "@/utils/ics-utils";
import { MonthViewCalendar } from "./components/month-view-calendar";
import { UpcomingEvents } from "./components/upcoming-events";

export function CalendarPage() {
  const { calendarData, examData, lastUpdate, scheduleMap, getData, clearData } = useCalendarStore();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const confirm = useConfirm();

  const mergedExportData = useMemo(() => {
    const merged = [...calendarData];
    for (const sem of examData) {
      const existingSem = merged.find((s) => s.semester === sem.semester);
      if (existingSem) {
        const existingSemCopy = { ...existingSem, weeks: [...existingSem.weeks] };
        for (const week of sem.weeks) {
          const existingWeek = existingSemCopy.weeks.find((w) => w.week === week.week);
          if (existingWeek) {
            existingWeek.schedule = [...existingWeek.schedule, ...week.schedule];
          } else {
            existingSemCopy.weeks.push({ ...week });
          }
        }
        merged[merged.indexOf(existingSem)] = existingSemCopy;
      } else {
        merged.push({ ...sem });
      }
    }
    return merged;
  }, [calendarData, examData]);

  useLayoutEffect(() => {
    getData();
  }, [getData]);

  const filteredScheduleMap = useMemo(() => {
    if (filterType === "ALL") {
      return scheduleMap;
    }

    const map = new Map<string, CalendarEntry[]>();
    for (const [date, entries] of scheduleMap.entries()) {
      const filtered = entries.filter((entry) => {
        if (filterType === "STUDY") {
          return entry.eventType === "STUDY" || entry.category === "COURSE" || entry.category === "LAB";
        }
        if (filterType === "EXAM") {
          return entry.eventType === "EXAM" || entry.category === "EXAM";
        }
        if (filterType === "OTHER") {
          return entry.category === "OTHER" || entry.category === "HOLIDAY";
        }
        return true;
      });
      if (filtered.length > 0) {
        map.set(date, filtered);
      }
    }
    return map;
  }, [scheduleMap, filterType]);

  const handleClearConfirm = async () => {
    const isConfirmed = await confirm({
      title: "Xác nhận xóa dữ liệu",
      description: "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu lịch học? Hành động này không thể hoàn tác.",
      confirmText: "Xóa lịch",
      variant: "destructive"
    });

    if (isConfirmed) {
      await clearData();
      toast.success("Đã xóa dữ liệu lịch học");
    }
  };

  const handleExport = (selectedSemesters: SemesterData[]) => {
    try {
      downloadICS(selectedSemesters);
      toast.success(`Đã xuất ${selectedSemesters.length} học kỳ`);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi xuất lịch.");
    }
  };

  return (
    <div className='flex h-auto flex-col space-y-4 lg:h-full'>
      <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <p className='mt-1 text-muted-foreground text-sm'>
          Cập nhật lúc:{" "}
          {lastUpdate ? (
            <span className='font-medium text-foreground'>
              {lastUpdate.toLocaleTimeString()} {lastUpdate.toLocaleDateString()}
            </span>
          ) : (
            "Chưa có dữ liệu"
          )}
        </p>

        <div className='flex w-full flex-wrap items-center gap-2 md:w-auto'>
          <Select onValueChange={setFilterType} value={filterType}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Loại lịch' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>Tất cả</SelectItem>
              <SelectItem value='STUDY'>Học tập</SelectItem>
              <SelectItem value='EXAM'>Thi cử</SelectItem>
              <SelectItem value='OTHER'>Khác</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsImportModalOpen(true)} variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            Nhập lịch
          </Button>
          <Button disabled={calendarData.length === 0} onClick={() => setIsExportModalOpen(true)} variant='outline'>
            <CalendarPlus className='mr-2 h-4 w-4' />
            Xuất lịch
          </Button>
          <Button disabled={calendarData.length === 0} onClick={handleClearConfirm} variant='destructive'>
            <Trash2 className='mr-2 h-4 w-4' />
            Xóa lịch
          </Button>
        </div>
      </div>

      <div className='flex flex-1 flex-col gap-6 overflow-y-auto lg:flex-row lg:overflow-hidden'>
        <div className='flex w-full flex-shrink-0 flex-col overflow-hidden rounded-lg border bg-card shadow-sm lg:w-[40%]'>
          <div className='border-b p-4'>
            <h2 className='font-semibold'>Lịch học sắp tới</h2>
          </div>
          <div className='flex-1 p-4'>
            <UpcomingEvents scheduleMap={filteredScheduleMap} />
          </div>
        </div>

        <div className='flex-1 overflow-hidden'>
          <MonthViewCalendar scheduleMap={filteredScheduleMap} />
        </div>
      </div>

      <MarkdownModal
        isOpen={isImportModalOpen}
        markdownContent={lichHocLichThiMd}
        onClose={() => setIsImportModalOpen(false)}
        title='Hướng dẫn nhập lịch'
      />

      <ExportCalendarDialog
        calendarData={mergedExportData}
        onExport={handleExport}
        onOpenChange={setIsExportModalOpen}
        open={isExportModalOpen}
      />
    </div>
  );
}
