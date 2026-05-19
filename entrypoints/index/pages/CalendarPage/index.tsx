import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function CalendarPage() {
  return (
    <Card>
      <CardContent className='flex flex-col items-center justify-center py-20'>
        <CalendarDays className='h-16 w-16 text-muted-foreground/40' />
        <h2 className='mt-4 font-semibold text-xl'>Lịch học tập</h2>
        <p className='mt-2 text-muted-foreground text-sm'>Tính năng đang được phát triển. Hãy quay lại sau nhé!</p>
      </CardContent>
    </Card>
  );
}
