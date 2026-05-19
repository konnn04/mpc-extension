import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const ALL_GRADES = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F"];

type FilterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterGrades: string[];
  onFilterChange: (grades: string[]) => void;
};

export function FilterModal({ open, onOpenChange, filterGrades, onFilterChange }: FilterModalProps) {
  const toggleGrade = (grade: string) => {
    if (filterGrades.includes(grade)) {
      onFilterChange(filterGrades.filter((g) => g !== grade));
    } else {
      onFilterChange([...filterGrades, grade]);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Lọc theo xếp loại điểm</DialogTitle>
        </DialogHeader>
        <div className='flex flex-wrap gap-4 py-4'>
          {ALL_GRADES.map((grade) => (
            <div className='flex items-center gap-2' key={grade}>
              <Checkbox
                checked={filterGrades.includes(grade)}
                id={`grade-${grade}`}
                onCheckedChange={() => toggleGrade(grade)}
              />
              <Label className='cursor-pointer font-medium' htmlFor={`grade-${grade}`}>
                {grade}
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter className='flex w-full justify-between sm:justify-between'>
          <Button onClick={() => onFilterChange([])} size='sm' variant='ghost'>
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
