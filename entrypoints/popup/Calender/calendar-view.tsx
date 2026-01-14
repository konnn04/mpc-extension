import { vi } from "date-fns/locale";
import { createContext, useContext, useEffect, useState } from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { CalendarDetail } from "./calendar-detail";
import type { CalendarEntry, SemesterData } from "./type";
import { buildScheduleMap, getScheduleForDate } from "./utils/format";

type CalendarViewProps = {
  data: SemesterData[];
};

const ScheduleContext = createContext<Map<string, CalendarEntry[]>>(new Map());

// biome-ignore lint/suspicious/noExplicitAny: Props from library, avoiding strict type for now
const CustomDayButton = (props: any) => {
  const { day } = props;
  const scheduleMap = useContext(ScheduleContext);
  const daySchedule = getScheduleForDate(day.date, scheduleMap);
  const hasEvents = daySchedule.length > 0;

  return (
    <CalendarDayButton {...props}>
      {props.children}
      {hasEvents && (
        <div className='flex items-center justify-center gap-[2px]'>
          {Array.from({ length: Math.min(daySchedule.length, 3) }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Indicators only, order doesn't matter
            <div className='h-1 w-1 rounded-full bg-orange-500' key={i} />
          ))}
        </div>
      )}
    </CalendarDayButton>
  );
};

const calendarComponents = {
  DayButton: CustomDayButton
};

export function CalendarView({ data }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [scheduleMap, setScheduleMap] = useState<Map<string, CalendarEntry[]>>(new Map());

  useEffect(() => {
    if (data && data.length > 0) {
      const map = buildScheduleMap(data);
      setScheduleMap(map);
    }
  }, [data]);

  const schedule = selectedDate ? getScheduleForDate(selectedDate, scheduleMap) : [];

  return (
    <ScheduleContext.Provider value={scheduleMap}>
      <div className='flex items-start justify-center gap-4 overflow-auto'>
        <div className='flex flex-col items-center justify-start'>
          <Calendar
            className='rounded-md border'
            components={calendarComponents}
            locale={vi}
            mode='single'
            onSelect={setSelectedDate}
            selected={selectedDate}
          />
        </div>
        <div className='min-w-0 flex-1'>
          <CalendarDetail schedule={schedule} selectedDate={selectedDate} />
        </div>
      </div>
    </ScheduleContext.Provider>
  );
}
