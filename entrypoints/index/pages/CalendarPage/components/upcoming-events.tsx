import { format, isAfter, isSameDay, parseISO, startOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CalendarEntry } from "@/entrypoints/popup/CalendarTab/type";
import { getSubjectColor } from "@/entrypoints/popup/CalendarTab/utils/format";
import { DayEventsModal } from "./day-events-modal";

type UpcomingEventsProps = {
  scheduleMap: Map<string, CalendarEntry[]>;
};

type FlattenedEvent = CalendarEntry & { dateStr: string; dateObj: Date };

export function UpcomingEvents({ scheduleMap }: UpcomingEventsProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEventClick = (dateObj: Date) => {
    setSelectedDate(dateObj);
    setIsModalOpen(true);
  };

  const selectedDayEvents = selectedDate
    ? (() => {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const d = String(selectedDate.getDate()).padStart(2, "0");
        return scheduleMap.get(`${y}-${m}-${d}`) || [];
      })()
    : [];
  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    const allEvents: FlattenedEvent[] = [];

    for (const [dateKey, entries] of scheduleMap.entries()) {
      const dateObj = parseISO(dateKey);
      if (isAfter(dateObj, today) || isSameDay(dateObj, today)) {
        for (const entry of entries) {
          allEvents.push({ ...entry, dateStr: dateKey, dateObj });
        }
      }
    }

    allEvents.sort((a, b) => {
      const dateDiff = a.dateObj.getTime() - b.dateObj.getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return (a.startTime || "").localeCompare(b.startTime || "");
    });

    return allEvents.slice(0, 50);
  }, [scheduleMap]);

  if (upcomingEvents.length === 0) {
    return (
      <div className='flex h-40 items-center justify-center rounded-lg border border-dashed text-muted-foreground'>
        Không có lịch học nào sắp tới
      </div>
    );
  }

  return (
    <>
      <ScrollArea className='h-[400px] pr-4 lg:h-[calc(100vh-12rem)]'>
        <div className='space-y-4'>
          {upcomingEvents.map((event, i) => {
            const showDateHeader = i === 0 || event.dateStr !== upcomingEvents[i - 1].dateStr;

            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: order is stable
              <div key={`${event.dateStr}-${event.code}-${event.startPeriod}-${i}`}>
                {showDateHeader && (
                  <div className='sticky top-0 z-10 mt-4 mb-2 bg-background/95 py-2 font-semibold backdrop-blur'>
                    {format(event.dateObj, "EEEE, dd/MM/yyyy", { locale: vi })}
                  </div>
                )}
                {/* biome-ignore lint/a11y/useSemanticElements: complex layout row, not a simple button */}
                <div
                  className='flex cursor-pointer items-stretch gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50'
                  onClick={() => handleEventClick(event.dateObj)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleEventClick(event.dateObj);
                    }
                  }}
                  role='button'
                  tabIndex={0}
                >
                  <div className='flex w-16 shrink-0 flex-col justify-center text-right text-xs'>
                    <span className='font-medium text-foreground'>{event.startTime}</span>
                    <span className='text-muted-foreground'>{event.endTime}</span>
                  </div>

                  <div
                    className='w-1 shrink-0 rounded-full'
                    style={{ backgroundColor: getSubjectColor(event.code || event.title) }}
                  />

                  <div className='flex-1 space-y-1'>
                    <div className='font-medium text-sm leading-none'>{event.title}</div>
                    {event.description && <div className='text-muted-foreground text-xs'>{event.description}</div>}
                    <div className='mt-2 flex flex-wrap gap-2 text-muted-foreground text-xs'>
                      {event.room && (
                        <span className='inline-flex items-center gap-1 rounded border px-1.5 py-0.5'>
                          Phòng: {event.room}
                        </span>
                      )}
                      {event.group && (
                        <span className='inline-flex items-center gap-1 rounded border px-1.5 py-0.5'>
                          Nhóm: {event.group}
                        </span>
                      )}
                      {event.teacher && (
                        <span className='inline-flex items-center gap-1 rounded border px-1.5 py-0.5'>
                          GV: {event.teacher}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <DayEventsModal
        date={selectedDate}
        events={selectedDayEvents}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
