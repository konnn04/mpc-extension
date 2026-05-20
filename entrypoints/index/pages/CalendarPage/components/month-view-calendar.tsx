import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarEntry } from "@/types";
import { getSubjectHexColor } from "@/utils/calendar-format";
import { DayEventsModal } from "./day-events-modal";

type MonthViewCalendarProps = {
  scheduleMap: Map<string, CalendarEntry[]>;
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function MonthViewCalendar({ scheduleMap }: MonthViewCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  // Week starts on Monday (1)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Ensure exactly 42 days (6 weeks) are rendered to keep grid height consistent
  while (days.length < 42) {
    // biome-ignore lint/style/useAtIndex: using at(-1) requires non-null assertion which biome also complains about sometimes, but let's just use it safely
    const lastDay = days[days.length - 1];
    days.push(addDays(lastDay, 1));
  }

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsModalOpen(true);
  };

  const getEventsForDay = (day: Date) => {
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, "0");
    const d = String(day.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${d}`;
    return scheduleMap.get(dateKey) || [];
  };

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className='flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow'>
      {/* Header */}
      <div className='flex items-center justify-between border-b px-6 py-4'>
        <h2 className='font-semibold text-lg capitalize'>{format(currentDate, "MMMM, yyyy", { locale: vi })}</h2>
        <div className='flex items-center gap-2'>
          <Button onClick={() => setCurrentDate(new Date())} size='sm' variant='outline'>
            Hôm nay
          </Button>
          <div className='flex items-center gap-1'>
            <Button className='h-8 w-8' onClick={prevMonth} size='icon' variant='ghost'>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button className='h-8 w-8' onClick={nextMonth} size='icon' variant='ghost'>
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Days header */}
      <div className='grid grid-cols-7 border-b bg-muted/50'>
        {WEEKDAYS.map((day) => (
          <div className='py-2 text-center font-medium text-muted-foreground text-sm' key={day}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className='grid flex-1 grid-cols-7 grid-rows-6 lg:grid-rows-auto'>
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const events = getEventsForDay(day);

          return (
            // biome-ignore lint/a11y/useSemanticElements: It's a calendar grid cell, not just a button
            <div
              className={cn(
                "min-h-[100px] cursor-pointer border-r border-b p-2 transition-colors hover:bg-muted/50",
                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                i % 7 === 6 && "border-r-0"
              )}
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleDayClick(day);
                }
              }}
              role='button'
              tabIndex={0}
            >
              <div className='flex items-center justify-between'>
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    isToday && "bg-primary font-medium text-primary-foreground"
                  )}
                >
                  {format(day, dateFormat)}
                </span>
              </div>

              <div className='mt-2 space-y-1 overflow-hidden'>
                {events.slice(0, 3).map((event, j) => (
                  <div
                    className='truncate rounded-sm px-1.5 py-0.5 font-medium text-[10px] text-white leading-tight'
                    key={`${event.code}-${j}`}
                    style={{ backgroundColor: getSubjectHexColor(event.code || event.title) }}
                  >
                    {event.startTime} {event.title}
                  </div>
                ))}
                {events.length > 3 && (
                  <div className='truncate rounded-sm bg-muted px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground leading-tight'>
                    +{events.length - 3} sự kiện khác
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DayEventsModal
        date={selectedDate}
        events={selectedEvents}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
