import { Check, ChevronDown, Trash2, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { _DATA_SUFFIXES, getAvatarKey, getStudentKeys } from "@/constants/storage";
import { useConfirm } from "@/hooks/use-confirm";
import { useCalendarStore } from "@/store/use-calendar-store";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import { useInfoStore } from "@/store/use-info-store";
import { useScoreStore } from "@/store/use-score-store";

const MSSV_REGEX = /^\d+$/;

async function scanStudentIds(): Promise<string[]> {
  const ids = new Set<string>();
  const raw = await browser.storage.local.get(null);
  const keys = Object.keys(raw);
  const pattern = new RegExp(`^local:(\\d+):(${_DATA_SUFFIXES.join("|")})$`);
  for (const k of keys) {
    const m = k.match(pattern);
    if (m?.[1]) {
      ids.add(m[1]);
    }
  }
  return [...ids].sort();
}

async function deleteStudentData(studentId: string): Promise<void> {
  await browser.storage.local.remove([...getStudentKeys(studentId), getAvatarKey(studentId)]);
}

export function UserMenu() {
  const { studentId, displayName, avatar, viewStudentId, setViewStudentId } = useCurrentUserStore();
  const confirm = useConfirm();

  // const [switchOpen, setSwitchOpen] = useState(false);
  const [switchInput, setSwitchInput] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isViewingOther = viewStudentId !== "" && viewStudentId !== studentId;

  // const handleSwitchSubmit = async (e: FormEvent) => {
  //   e.preventDefault();
  //   const trimmed = switchInput.trim();
  //   if (!(trimmed && MSSV_REGEX.test(trimmed))) {
  //     toast.error("MSSV không hợp lệ");
  //     return;
  //   }
  //   if (trimmed === studentId) {
  //     setViewStudentId("");
  //     toast.success("Đã quay về tài khoản hiện tại");
  //     setSwitchOpen(false);
  //     setSwitchInput("");
  //     return;
  //   }
  //   const existing = await scanStudentIds();
  //   if (!existing.includes(trimmed)) {
  //     toast.error(`Không tìm thấy dữ liệu của MSSV ${trimmed}`);
  //     return;
  //   }
  //   setViewStudentId(trimmed);
  //   toast.success(`Đang xem dữ liệu của MSSV ${trimmed}`);
  //   setSwitchOpen(false);
  //   setSwitchInput("");
  // };

  const openDelete = async () => {
    setDeleteOpen(true);
    setScanning(true);
    setChecked(new Set());
    try {
      const found = await scanStudentIds();
      setIds(found);
    } catch {
      toast.error("Không thể quét dữ liệu");
    }
    setScanning(false);
  };

  const handleDeleteConfirm = async () => {
    if (checked.size === 0) {
      toast.error("Vui lòng chọn ít nhất một MSSV để xóa");
      return;
    }
    const isConfirmed = await confirm({
      title: "Xác nhận xóa dữ liệu",
      description: `Bạn có chắc muốn xóa dữ liệu của ${checked.size} MSSV đã chọn? Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa",
      variant: "destructive"
    });
    if (!isConfirmed) {
      return;
    }

    setDeleting(true);
    try {
      await Promise.all([...checked].map(deleteStudentData));
      if (checked.has(studentId)) {
        useInfoStore.getState().setUserData(useInfoStore.getState().userData);
        useInfoStore.getState().setCourseData(useInfoStore.getState().courseData);
        useScoreStore.getState().setScores([]);
        useScoreStore.getState().setOriginalScores([]);
        useCalendarStore.getState().setStudyCalendarData([]);
        useCalendarStore.getState().setExamCalendarData([]);
      }
      toast.success(`Đã xóa dữ liệu của ${checked.size} MSSV`);
      const remaining = await scanStudentIds();
      setIds(remaining);
      setChecked(new Set());
    } catch {
      toast.error("Lỗi khi xóa dữ liệu");
    }
    setDeleting(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className='h-8 gap-2 px-2' variant='ghost'>
            {avatar ? (
              <img alt='' className='h-6 w-6 rounded-full object-cover' height={24} src={avatar} width={24} />
            ) : (
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10'>
                <UserIcon className='h-3.5 w-3.5 text-primary' />
              </div>
            )}
            <div className='hidden flex-col items-start text-left sm:flex'>
              <span className='max-w-30 truncate font-medium text-xs leading-tight'>
                {displayName || "Chưa xác định"}
              </span>
              <span className='text-[10px] text-muted-foreground leading-tight'>{studentId || "Chưa có MSSV"}</span>
            </div>
            <ChevronDown className='h-3 w-3 text-muted-foreground' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-52'>
          <DropdownMenuLabel className='font-normal'>
            <p className='font-medium text-sm'>{displayName || "Chưa xác định"}</p>
            <p className='text-muted-foreground text-xs'>{studentId || "Chưa có MSSV"}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isViewingOther && (
            <>
              <DropdownMenuItem
                onClick={() => {
                  setViewStudentId("");
                  toast.success("Đã quay về tài khoản hiện tại");
                }}
              >
                <Check className='mr-2 h-4 w-4' />
                Quay về tài khoản hiện tại
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {/* <DropdownMenuItem onClick={() => setSwitchOpen(true)}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Đổi tài khoản
          </DropdownMenuItem> */}
          <DropdownMenuSeparator />
          <DropdownMenuItem className='text-destructive' onClick={openDelete}>
            <Trash2 className='mr-2 h-4 w-4' />
            Xóa dữ liệu
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* <Dialog onOpenChange={setSwitchOpen} open={switchOpen}>
        <DialogContent className='sm:max-w-sm'>
          <form onSubmit={handleSwitchSubmit}>
            <DialogHeader>
              <DialogTitle>Đổi tài khoản</DialogTitle>
              <DialogDescription>
                Nhập MSSV để xem dữ liệu của tài khoản đó. Không thay đổi tài khoản hiện tại.
              </DialogDescription>
            </DialogHeader>
            <div className='mt-4 space-y-2'>
              <Label htmlFor='switch-mssv'>Mã số sinh viên</Label>
              <Input
                autoFocus
                id='switch-mssv'
                onChange={(e) => setSwitchInput(e.target.value)}
                placeholder='Nhập MSSV...'
                value={switchInput}
              />
            </div>
            <DialogFooter className='mt-4'>
              <Button disabled={!switchInput.trim()} type='submit'>
                Xem dữ liệu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog> */}

      <Dialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Xóa dữ liệu MSSV</DialogTitle>
            <DialogDescription>Chọn MSSV cần xóa. Dữ liệu bao gồm điểm số, thông tin, lịch học/thi.</DialogDescription>
          </DialogHeader>
          <div className='mt-4 max-h-60 space-y-1 overflow-y-auto'>
            {(() => {
              if (scanning) {
                return <p className='py-4 text-center text-muted-foreground text-sm'>Đang quét dữ liệu...</p>;
              }

              if (ids.length === 0) {
                return <p className='py-4 text-center text-muted-foreground text-sm'>Chưa có dữ liệu nào.</p>;
              }

              return ids.map((id) => (
                <label
                  className='flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted'
                  key={id}
                >
                  <input
                    checked={checked.has(id)}
                    className='h-4 w-4 accent-destructive'
                    onChange={() => {
                      setChecked((prev) => {
                        const next = new Set(prev);
                        if (next.has(id)) {
                          next.delete(id);
                        } else {
                          next.add(id);
                        }
                        return next;
                      });
                    }}
                    type='checkbox'
                  />
                  <span className='font-mono text-sm'>{id}</span>
                </label>
              ));
            })()}
          </div>
          <DialogFooter className='mt-4'>
            <Button
              disabled={checked.size === 0 || scanning || deleting}
              onClick={handleDeleteConfirm}
              variant='destructive'
            >
              {deleting ? "Đang xóa..." : `Xóa (${checked.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
