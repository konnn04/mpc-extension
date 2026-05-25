import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const GRADE_STOPS = [
  { value: 0, label: "F", range: "Dưới 4.0" },
  { value: 1, label: "D", range: "4.0–4.9" },
  { value: 2, label: "D+", range: "5.0–5.4" },
  { value: 3, label: "C", range: "5.5–6.4" },
  { value: 4, label: "C+", range: "6.5–6.9" },
  { value: 5, label: "B", range: "7.0–7.9" },
  { value: 6, label: "B+", range: "8.0–8.4" },
  { value: 7, label: "A", range: "8.5–8.9" },
  { value: 8, label: "A+", range: "9.0–10.0" }
] as const;

const STEP = 1;
const MIN = 0;
const MAX = GRADE_STOPS.length - 1;

type FilterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterRange: [number, number];
  onFilterChange: (range: [number, number]) => void;
};

export function FilterModal({ open, onOpenChange, filterRange, onFilterChange }: FilterModalProps) {
  const minValRef = useRef<HTMLInputElement>(null);
  const maxValRef = useRef<HTMLInputElement>(null);

  const clampMin = useCallback(
    (v: number) => {
      const clamped = Math.min(v, filterRange[1] - STEP);
      return Math.max(MIN, clamped);
    },
    [filterRange]
  );

  const clampMax = useCallback(
    (v: number) => {
      const clamped = Math.max(v, filterRange[0] + STEP);
      return Math.min(MAX, clamped);
    },
    [filterRange]
  );

  const handleMinChange = (raw: number) => {
    const val = clampMin(raw);
    onFilterChange([val, filterRange[1]]);
  };

  const handleMaxChange = (raw: number) => {
    const val = clampMax(raw);
    onFilterChange([filterRange[0], val]);
  };

  const rangePercent = ((filterRange[1] - filterRange[0]) / (MAX - MIN)) * 100;
  const minPercent = ((filterRange[0] - MIN) / (MAX - MIN)) * 100;

  const currentMinLabel = GRADE_STOPS[filterRange[0]]?.label ?? "";
  const currentMaxLabel = GRADE_STOPS[filterRange[1]]?.label ?? "";
  const currentMinRange = GRADE_STOPS[filterRange[0]]?.range ?? "";
  const currentMaxRange = GRADE_STOPS[filterRange[1]]?.range ?? "";

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Lọc theo xếp loại</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          <div className='flex items-center justify-center gap-3'>
            <div className='text-center'>
              <span className='rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-sm'>
                {currentMinLabel}
              </span>
              <p className='mt-1 text-[10px] text-muted-foreground'>{currentMinRange}</p>
            </div>
            <span className='text-muted-foreground'>→</span>
            <div className='text-center'>
              <span className='rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-sm'>
                {currentMaxLabel}
              </span>
              <p className='mt-1 text-[10px] text-muted-foreground'>{currentMaxRange}</p>
            </div>
          </div>

          <div className='relative mx-auto w-full max-w-md'>
            <div className='relative h-2 rounded-full bg-muted'>
              <div
                className='absolute h-full rounded-full bg-primary'
                style={{
                  left: `${minPercent}%`,
                  width: `${rangePercent}%`
                }}
              />
            </div>

            <div className='relative h-0'>
              <input
                aria-label='Điểm thấp nhất'
                className='range-thumb pointer-events-none absolute top-0 left-0 h-2 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:shadow-sm [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-110'
                max={MAX}
                min={MIN}
                onChange={(e) => handleMinChange(Number(e.target.value))}
                ref={minValRef}
                step={STEP}
                type='range'
                value={filterRange[0]}
              />
              <input
                aria-label='Điểm cao nhất'
                className='range-thumb pointer-events-none absolute top-0 left-0 h-2 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:shadow-sm [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-110'
                max={MAX}
                min={MIN}
                onChange={(e) => handleMaxChange(Number(e.target.value))}
                ref={maxValRef}
                step={STEP}
                type='range'
                value={filterRange[1]}
              />
            </div>

            <div className='relative mt-3 flex justify-between'>
              {GRADE_STOPS.map((stop) => (
                <span
                  className='text-center font-medium text-[10px] text-muted-foreground leading-tight'
                  key={stop.value}
                  style={{ width: `${100 / GRADE_STOPS.length}%`, marginLeft: stop.value === 0 ? 0 : undefined }}
                >
                  {stop.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className='flex w-full justify-between sm:justify-between'>
          <Button onClick={() => onFilterChange([MIN, MAX])} size='sm' variant='ghost'>
            Bỏ lọc
          </Button>
          <Button onClick={() => onOpenChange(false)} size='sm' variant='secondary'>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
