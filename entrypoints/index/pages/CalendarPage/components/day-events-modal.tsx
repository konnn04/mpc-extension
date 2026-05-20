import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CalendarEntry } from "@/entrypoints/popup/CalendarTab/type";
import { getSubjectColor } from "@/entrypoints/popup/CalendarTab/utils/format";

type DayEventsModalProps = {
  date: Date | null;
  events: CalendarEntry[];
  isOpen: boolean;
  onClose: () => void;
};

export function DayEventsModal({ date, events, isOpen, onClose }: DayEventsModalProps) {
  if (!date) {
    return null;
  }

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Lịch học {format(date, "EEEE, dd/MM/yyyy", { locale: vi })}</DialogTitle>
        </DialogHeader>

        {events.length === 0 ? (
          <div className='py-8 text-center text-muted-foreground'>Không có lịch trong ngày này</div>
        ) : (
          <ScrollArea className='max-h-[60vh] pr-4'>
            <div className='space-y-3'>
              {events.map((event, i) => (
                <div
                  className='flex items-start gap-3 rounded-lg border p-3'
                  // biome-ignore lint/suspicious/noArrayIndexKey: order is stable within a day
                  key={`${event.code}-${event.startPeriod}-${i}`}
                >
                  <div
                    className='mt-1 h-3 w-3 shrink-0 rounded-full'
                    style={{ backgroundColor: getSubjectColor(event.code || event.title) }}
                  />
                  <div className='flex-1 space-y-1'>
                    <div className='font-medium leading-none'>{event.title}</div>
                    <div className='text-muted-foreground text-sm'>
                      {event.startTime} - {event.endTime}
                    </div>
                    {event.description && <div className='text-muted-foreground text-xs'>{event.description}</div>}
                    <div className='mt-2 space-y-1 text-muted-foreground text-xs'>
                      {event.room && <div>Phòng: {event.room}</div>}
                      {event.group && <div>Nhóm: {event.group}</div>}
                      {event.teacher && <div>Giảng viên: {event.teacher}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
