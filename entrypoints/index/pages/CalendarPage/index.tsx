import { CalendarPlus, Download, Info, Trash2 } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ExportCalendarDialog } from "@/entrypoints/popup/CalendarTab/export-calendar-dialog";
import type { SemesterData } from "@/entrypoints/popup/CalendarTab/type";
import { useCalendarStore } from "@/entrypoints/popup/CalendarTab/use-calendar-store";
import { downloadICS } from "@/entrypoints/popup/CalendarTab/utils/ics-utils";
import { useConfirm } from "@/hooks/use-confirm";
import { MonthViewCalendar } from "./components/month-view-calendar";
import { UpcomingEvents } from "./components/upcoming-events";

export function CalendarPage() {
  const { calendarData, lastUpdate, scheduleMap, getData, clearData } = useCalendarStore();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const confirm = useConfirm();

  useLayoutEffect(() => {
    getData();
  }, [getData]);

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
            <UpcomingEvents scheduleMap={scheduleMap} />
          </div>
        </div>

        <div className='flex-1 overflow-hidden'>
          <MonthViewCalendar scheduleMap={scheduleMap} />
        </div>
      </div>

      <Dialog onOpenChange={setIsImportModalOpen} open={isImportModalOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Info className='h-5 w-5 text-blue-500' />
              Hướng dẫn nhập lịch
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className='space-y-4 pt-4 text-base text-foreground'>
            <p>Hiện tại tính năng đồng bộ lịch tự động chưa được hỗ trợ trên trang Dashboard.</p>
            <p>Để cập nhật lịch học mới nhất, vui lòng:</p>
            <ol className='ml-4 list-decimal space-y-2'>
              <li>Truy cập trang web đào tạo của trường.</li>
              <li>
                Mở <span className='font-semibold text-foreground'>popup tiện ích MPC</span> trên thanh công cụ trình
                duyệt.
              </li>
              <li>
                Chuyển sang tab <span className='font-semibold text-foreground'>Lịch</span>.
              </li>
              <li>
                Nhấn nút <span className='font-semibold text-foreground'>"Cập nhật lịch"</span>.
              </li>
            </ol>
            <p>Sau khi đồng bộ thành công, quay lại trang này và làm mới (F5) để xem lịch mới nhất.</p>
          </DialogDescription>
          <DialogFooter>
            <Button onClick={() => setIsImportModalOpen(false)}>Đã hiểu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExportCalendarDialog
        calendarData={calendarData}
        onExport={handleExport}
        onOpenChange={setIsExportModalOpen}
        open={isExportModalOpen}
      />
    </div>
  );
}
