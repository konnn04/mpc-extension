import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** scale4 → grade label for the slider track. A+ and A both map to 4.0; show A+. */
const SCALE4_STOPS = [
  { value: 0, label: "F" },
  { value: 1, label: "D" },
  { value: 1.5, label: "D+" },
  { value: 2, label: "C" },
  { value: 2.5, label: "C+" },
  { value: 3, label: "B" },
  { value: 3.5, label: "B+" },
  { value: 4, label: "A+" }
] as const;

const STEP = 0.5;
const MIN = 0;
const MAX = 4;

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

  // ── slider track geometry ──
  const rangePercent = ((filterRange[1] - filterRange[0]) / (MAX - MIN)) * 100;
  const minPercent = ((filterRange[0] - MIN) / (MAX - MIN)) * 100;

  const currentMinLabel = SCALE4_STOPS.find((s) => s.value === filterRange[0])?.label ?? "";
  const currentMaxLabel = SCALE4_STOPS.find((s) => s.value === filterRange[1])?.label ?? "";

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Lọc theo thang điểm 4</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* ── current range badge ── */}
          <div className='flex items-center justify-center gap-3'>
            <span className='rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-sm'>
              {currentMinLabel} ({filterRange[0].toFixed(1)})
            </span>
            <span className='text-muted-foreground'>→</span>
            <span className='rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-sm'>
              {currentMaxLabel} ({filterRange[1].toFixed(1)})
            </span>
          </div>

          {/* ── dual range slider ── */}
          <div className='relative mx-auto w-full max-w-md'>
            {/* track background */}
            <div className='relative h-2 rounded-full bg-muted'>
              {/* active range */}
              <div
                className='absolute h-full rounded-full bg-primary'
                style={{
                  left: `${minPercent}%`,
                  width: `${rangePercent}%`
                }}
              />
            </div>

            {/* overlapping range inputs */}
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

            {/* grade labels below track */}
            <div className='relative mt-3 flex justify-between'>
              {SCALE4_STOPS.map((stop) => (
                <span
                  className='text-center font-medium text-muted-foreground text-xs leading-tight'
                  key={stop.value}
                  style={{ width: `${100 / SCALE4_STOPS.length}%`, marginLeft: stop.value === 0 ? 0 : undefined }}
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
