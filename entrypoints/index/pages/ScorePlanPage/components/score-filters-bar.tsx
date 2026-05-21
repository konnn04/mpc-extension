import { FilterIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type GroupMode = "semester" | "all";

export function ScoreFiltersBar({
  filterRange,
  groupMode,
  onAddSemester,
  onFilterOpen,
  onGroupModeChange,
  onSearchTextChange,
  searchText
}: {
  filterRange: [number, number];
  groupMode: GroupMode;
  onAddSemester: () => void;
  onFilterOpen: () => void;
  onGroupModeChange: (mode: GroupMode) => void;
  onSearchTextChange: (value: string) => void;
  searchText: string;
}) {
  const isFilterActive = filterRange[0] !== 0 || filterRange[1] !== 4;

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <div className='relative min-w-50 flex-1'>
        <SearchIcon className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
        <Input
          className='pl-9'
          onChange={(e) => onSearchTextChange(e.target.value)}
          placeholder='Tìm kiếm môn học...'
          value={searchText}
        />
      </div>
      <select
        className='h-9 rounded-md border bg-background px-3 text-sm'
        onChange={(e) => onGroupModeChange(e.target.value as GroupMode)}
        value={groupMode}
      >
        <option value='semester'>Nhóm theo học kỳ</option>
        <option value='all'>Tất cả</option>
      </select>
      <Button onClick={onFilterOpen} size='sm' variant='outline'>
        <FilterIcon className='mr-2 h-4 w-4' />
        Lọc
        {isFilterActive && (
          <span className='ml-1 rounded-full bg-primary px-1.5 text-primary-foreground text-xs'>
            {filterRange[0].toFixed(1)}–{filterRange[1].toFixed(1)}
          </span>
        )}
      </Button>

      <Button onClick={onAddSemester} size='sm' variant='outline'>
        <PlusIcon className='mr-2 h-4 w-4' />
        Thêm kỳ mới
      </Button>
    </div>
  );
}
