import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SettingsPage() {
  return (
    <Card>
      <CardContent className='flex flex-col items-center justify-center py-20'>
        <Settings className='h-16 w-16 text-muted-foreground/40' />
        <h2 className='mt-4 font-semibold text-xl'>Cài đặt</h2>
        <p className='mt-2 text-muted-foreground text-sm'>Tính năng đang được phát triển. Hãy quay lại sau nhé!</p>
      </CardContent>
    </Card>
  );
}
