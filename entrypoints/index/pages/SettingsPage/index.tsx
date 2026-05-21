import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Globe,
  HardDrive,
  Monitor,
  Moon,
  RefreshCw,
  Save,
  Settings,
  Sun,
  UserCog
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { useConfirm } from "@/hooks/use-confirm";
import { useGlobalStore } from "@/store/use-global-store";
import { useUserSettingsStore } from "@/store/use-user-settings-store";

type ThemeMode = "light" | "dark" | "system";
type SettingsPageProps = {
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
};

const _THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
  { value: "light", label: "Sáng", icon: Sun },
  { value: "dark", label: "Tối", icon: Moon },
  { value: "system", label: "Hệ thống", icon: Monitor }
];

function SectionHeader({
  icon: Icon,
  title,
  description
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className='flex items-center gap-3 rounded-t-lg p-4'>
      <div className='flex h-9 w-9 items-center justify-center rounded-md bg-primary/10'>
        <Icon className='h-4 w-4 text-primary' />
      </div>
      <div>
        <p className='font-semibold text-sm'>{title}</p>
        <p className='text-muted-foreground text-xs'>{description}</p>
      </div>
    </div>
  );
}

/** Format bytes to human readable */
function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 KB";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function SettingsPage({ theme, onThemeChange }: SettingsPageProps) {
  const {
    fixedPoint,
    ignoreList,
    siteURLMapping,
    retakeRatioLimit,
    maxCreditsPerSemester,
    minCreditsPerSemester,
    maxCreditsWarning,
    maxCreditsSummer,
    drlWarningThreshold,
    setFixedPoint,
    setIgnoreList,
    setSiteURLMapping,
    setRetakeRatioLimit,
    setMaxCreditsPerSemester,
    setMinCreditsPerSemester,
    setMaxCreditsWarning,
    setMaxCreditsSummer,
    setDrlWarningThreshold,
    saveData,
    getData
  } = useGlobalStore();
  const {
    settings: userSettings,
    setSettings: setUserSettings,
    getData: getUserSettings,
    saveData: saveUserSettings
  } = useUserSettingsStore();
  const confirm = useConfirm();

  const [ignoreListText, setIgnoreListText] = useState("");
  const [urlMapping, setURLMapping] = useState<_SITE_MAPPING>(siteURLMapping);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── User settings local state ──
  const [trainingSemesters, setTrainingSemesters] = useState(userSettings.trainingSemesters);
  const [totalProgramCredits, setTotalProgramCredits] = useState(userSettings.totalProgramCredits);

  // ── School params local state ──
  const [localRetakeRatio, setLocalRetakeRatio] = useState(retakeRatioLimit);
  const [localMaxCreditsPerSem, setLocalMaxCreditsPerSem] = useState(maxCreditsPerSemester);
  const [localMinCreditsPerSem, setLocalMinCreditsPerSem] = useState(minCreditsPerSemester);
  const [localMaxCreditsWarn, setLocalMaxCreditsWarn] = useState(maxCreditsWarning);
  const [localMaxCreditsSum, setLocalMaxCreditsSum] = useState(maxCreditsSummer);
  const [localDrlThreshold, setLocalDrlThreshold] = useState(drlWarningThreshold);

  // ── Storage usage ──
  const [storageUsage, setStorageUsage] = useState<{ localBytes: number; syncBytes: number }>({
    localBytes: 0,
    syncBytes: 0
  });

  const refreshStorageUsage = useCallback(async () => {
    const [localData, syncData] = await Promise.all([browser.storage.local.get(null), browser.storage.sync.get(null)]);
    setStorageUsage({
      localBytes: new Blob([JSON.stringify(localData)]).size,
      syncBytes: new Blob([JSON.stringify(syncData)]).size
    });
  }, []);

  useLayoutEffect(() => {
    const load = async () => {
      await Promise.all([getData(), getUserSettings(), refreshStorageUsage()]);
    };
    load();
  }, [getData, getUserSettings, refreshStorageUsage]);

  useEffect(() => {
    setIgnoreListText(ignoreList.join(","));
  }, [ignoreList]);

  useEffect(() => {
    setURLMapping(siteURLMapping);
  }, [siteURLMapping]);

  useEffect(() => {
    setTrainingSemesters(userSettings.trainingSemesters);
    setTotalProgramCredits(userSettings.totalProgramCredits);
  }, [userSettings]);

  const handleSave = async () => {
    const list = ignoreListText
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
    setIgnoreList(list);
    setSiteURLMapping(urlMapping);
    await saveData();

    // Save school-wide params
    setRetakeRatioLimit(localRetakeRatio);
    setMaxCreditsPerSemester(localMaxCreditsPerSem);
    setMinCreditsPerSemester(localMinCreditsPerSem);
    setMaxCreditsWarning(localMaxCreditsWarn);
    setMaxCreditsSummer(localMaxCreditsSum);
    setDrlWarningThreshold(localDrlThreshold);

    // Save user settings
    setUserSettings({ trainingSemesters, totalProgramCredits });
    await saveUserSettings();

    toast.success("Đã lưu cài đặt!");
  };

  const handleURLChange = (siteKey: _SITE_CATE, path: string[], value: string) => {
    setURLMapping((prev) => {
      const updated = structuredClone(prev);
      let obj: Record<string, unknown> = updated[siteKey] as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]] as Record<string, unknown>;
      }
      obj[path.at(-1)] = value;
      return updated;
    });
  };

  const handleResetSite = (siteKey: _SITE_CATE) => {
    setURLMapping((prev) => ({
      ...prev,
      [siteKey]: structuredClone(_DEFAULT_SITE_URL_MAPPING[siteKey])
    }));
    toast.success(`Đã đặt lại URL cho ${_DEFAULT_SITE_URL_MAPPING[siteKey].label}`);
  };

  return (
    <div className='mx-auto max-w-2xl space-y-6 pb-12'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
            <Settings className='h-5 w-5 text-primary' />
          </div>
          <div>
            <h1 className='font-bold text-xl'>Cài đặt</h1>
            <p className='text-muted-foreground text-sm'>Tùy chỉnh Extension theo ý muốn của bạn</p>
          </div>
        </div>
        <Button className='gap-2' onClick={handleSave}>
          <Save className='h-4 w-4' />
          Lưu thay đổi
        </Button>
      </div>

      {/*───────────────── Cài đặt cá nhân ─────────────────*/}
      <Card>
        <SectionHeader
          description='Cài đặt theo MSSV, ảnh hưởng đến tính toán học lực và dự đoán điểm'
          icon={UserCog}
          title='Cài đặt cá nhân'
        />
        <CardContent className='space-y-4 pt-0'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <Label className='font-medium'>Tổng tín chỉ CTĐT</Label>
              <p className='text-[10px] text-muted-foreground'>
                Tổng tín chỉ toàn khóa ngành bạn. Không đúng?{" "}
                <a
                  className='font-medium text-amber-600'
                  href='https://www.oucommunity.dev/tuyen-sinh/gioi-thieu-nganh/'
                  rel='noopener noreferrer'
                  target='_blank'
                >
                  Tra cứu ở đây
                </a>
              </p>
              <Input
                className='h-8 text-sm'
                onChange={(e) => setTotalProgramCredits(Number(e.target.value) || 0)}
                type='number'
                value={totalProgramCredits}
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='font-medium'>Số học kỳ tính DRL trung bình</Label>
              <p className='text-[10px] text-muted-foreground'>Số học kỳ đầu dùng để tính trung bình điểm rèn luyện</p>
              <Input
                className='h-8 text-sm'
                onChange={(e) => setTrainingSemesters(Number(e.target.value) || 10)}
                type='number'
                value={trainingSemesters}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/*───────────────── Cài đặt chung ─────────────────*/}
      <Card>
        <SectionHeader
          description='Áp dụng cho tất cả tài khoản, đồng bộ qua các thiết bị'
          icon={Settings}
          title='Cài đặt chung'
        />
        <CardContent className='space-y-6 pt-0'>
          {/* Theme */}
          <div className='space-y-2'>
            <Label className='font-medium'>Chế độ màu sắc</Label>
            <div className='grid grid-cols-3 gap-2'>
              {_THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all hover:border-primary/50 ${
                    theme === value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"
                  }`}
                  key={value}
                  onClick={() => onThemeChange(value)}
                  type='button'
                >
                  <Icon className={`h-4 w-4 ${theme === value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-medium text-xs ${theme === value ? "text-primary" : "text-foreground"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Fixed point */}
          <div className='flex items-center justify-between gap-4'>
            <div>
              <Label className='font-medium'>Số chữ số thập phân</Label>
              <p className='mt-0.5 text-[10px] text-muted-foreground'>Áp dụng cho GPA và điểm số</p>
            </div>
            <Input
              className='h-8 w-20 text-center text-sm'
              max='10'
              min='1'
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  return;
                }
                const num = Number(val);
                if (!Number.isNaN(num)) {
                  setFixedPoint(Math.min(10, Math.max(1, num)));
                }
              }}
              type='number'
              value={fixedPoint}
            />
          </div>

          {/* Ignore list */}
          <div className='space-y-1.5'>
            <Label className='font-medium'>Danh sách môn học loại khỏi GPA</Label>
            <p className='text-[10px] text-muted-foreground'>
              Mã môn bắt đầu với các ký tự sau sẽ bị loại khỏi tính GPA (phân cách bởi dấu phẩy)
            </p>
            <Textarea
              className='min-h-15 font-mono text-xs'
              onChange={(e) => setIgnoreListText(e.target.value)}
              placeholder='_,MEETING,PEDU,...'
              rows={2}
              value={ignoreListText}
            />
          </div>

          {/* School-wide params */}
          <div className='rounded-lg border p-3'>
            <div className='mb-2 flex items-center gap-2'>
              <HardDrive className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium text-sm'>Tham số trường</span>
            </div>
            <div className='grid grid-cols-2 gap-x-4 gap-y-3 text-xs'>
              <div className='space-y-1'>
                <Label className='text-muted-foreground'>Tỉ lệ học lại tối đa (%)</Label>
                <Input
                  className='h-7 text-xs'
                  min='0'
                  onChange={(e) => setLocalRetakeRatio(Number(e.target.value) / 100 || 0)}
                  step='1'
                  type='number'
                  value={(localRetakeRatio * 100).toFixed(0)}
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-muted-foreground'>TC tối đa/kỳ chính</Label>
                <Input
                  className='h-7 text-xs'
                  min='1'
                  onChange={(e) => setLocalMaxCreditsPerSem(Number(e.target.value) || 25)}
                  type='number'
                  value={localMaxCreditsPerSem}
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-muted-foreground'>TC tối thiểu/kỳ chính</Label>
                <Input
                  className='h-7 text-xs'
                  min='0'
                  onChange={(e) => setLocalMinCreditsPerSem(Number(e.target.value) || 14)}
                  type='number'
                  value={localMinCreditsPerSem}
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-muted-foreground'>TC tối đa (cảnh báo)</Label>
                <Input
                  className='h-7 text-xs'
                  min='1'
                  onChange={(e) => setLocalMaxCreditsWarn(Number(e.target.value) || 14)}
                  type='number'
                  value={localMaxCreditsWarn}
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-muted-foreground'>TC tối đa/kỳ hè</Label>
                <Input
                  className='h-7 text-xs'
                  min='1'
                  onChange={(e) => setLocalMaxCreditsSum(Number(e.target.value) || 12)}
                  type='number'
                  value={localMaxCreditsSum}
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-muted-foreground'>Ngưỡng ĐRL cảnh báo</Label>
                <Input
                  className='h-7 text-xs'
                  min='0'
                  onChange={(e) => setLocalDrlThreshold(Number(e.target.value) || 50)}
                  type='number'
                  value={localDrlThreshold}
                />
              </div>
            </div>
          </div>

          {/* URL advanced toggle */}
          <div className='rounded-lg border'>
            <button
              className='flex w-full items-center gap-3 p-3 text-left'
              onClick={() => setShowAdvanced(!showAdvanced)}
              type='button'
            >
              <Globe className='h-4 w-4 text-muted-foreground' />
              <span className='flex-1 font-medium text-sm'>Cấu hình URL nâng cao</span>
              {showAdvanced ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
            </button>

            {showAdvanced && (
              <div className='space-y-4 border-t px-3 py-3'>
                <div className='flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30'>
                  <AlertCircle className='mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400' />
                  <p className='text-[10px] text-amber-700 leading-tight dark:text-amber-300'>
                    Trường <b>Regex</b> hỗ trợ biểu thức chính quy (RegExp). Extension sẽ so khớp URL hiện tại với regex
                    để xác định trang. Để lại theo mặc định nếu bạn không chắc.
                  </p>
                </div>

                {(["sv", "kcq"] as _SITE_CATE[]).map((siteKey) => (
                  <div className='space-y-2 rounded-lg border p-3' key={siteKey}>
                    <div className='flex items-center justify-between pb-2'>
                      <div>
                        <span className='font-medium text-sm'>{_DEFAULT_SITE_URL_MAPPING[siteKey].label}</span>
                        <p className='font-mono text-[10px] text-muted-foreground'>
                          {_DEFAULT_SITE_URL_MAPPING[siteKey].homepage.url}
                        </p>
                      </div>
                      <Button
                        className='h-6 gap-1 text-[10px]'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetSite(siteKey);
                        }}
                        size='sm'
                        type='button'
                        variant='secondary'
                      >
                        <RefreshCw className='h-3 w-3' />
                        Đặt lại
                      </Button>
                    </div>

                    <div className='space-y-3'>
                      <div className='grid grid-cols-[100px_1fr] items-start gap-2'>
                        <Label className='pt-1.5 font-medium text-xs leading-tight'>Trang chủ</Label>
                        <div className='relative'>
                          <Input
                            className='h-7 pr-6 font-mono text-xs'
                            onChange={(e) => handleURLChange(siteKey, ["homepage", "regex"], e.target.value)}
                            placeholder={"Regex nhận diện"}
                            value={urlMapping[siteKey].homepage.regex}
                          />
                          <div className='-translate-y-1/2 absolute top-1/2 right-1.5'>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className='flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground'>
                                  ?
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className='max-w-xs text-xs'>Pattern regex để nhận diện URL hiện tại.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                      {Object.entries(urlMapping[siteKey].pages).map(([pageKey, page]) => (
                        <div className='grid grid-cols-[100px_1fr] items-start gap-2' key={pageKey}>
                          <Label className='pt-1.5 font-medium text-xs leading-tight'>{page.label}</Label>
                          <div className='relative'>
                            <Input
                              className='h-7 pr-6 font-mono text-xs'
                              onChange={(e) => handleURLChange(siteKey, ["pages", pageKey, "regex"], e.target.value)}
                              placeholder={"Regex nhận diện"}
                              value={page.regex}
                            />
                            <div className='-translate-y-1/2 absolute top-1/2 right-1.5'>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className='flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground'>
                                    ?
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className='max-w-xs text-xs'>Pattern regex để nhận diện URL hiện tại.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Storage usage bar */}
          <div className='space-y-2 rounded-lg border p-3'>
            <div className='flex items-center gap-2'>
              <HardDrive className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium text-sm'>Dung lượng lưu trữ</span>
              <Button className='ml-auto h-6 gap-1 text-[10px]' onClick={refreshStorageUsage} size='sm' variant='ghost'>
                <RefreshCw className='h-3 w-3' />
                Làm mới
              </Button>
            </div>
            <div className='space-y-1.5'>
              <div>
                <div className='mb-0.5 flex justify-between text-xs'>
                  <span className='text-muted-foreground'>Local</span>
                  <span className='font-mono'>{formatBytes(storageUsage.localBytes)} / 10 MB</span>
                </div>
                <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-primary transition-all'
                    style={{ width: `${Math.min((storageUsage.localBytes / (10 * 1024 * 1024)) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className='mb-0.5 flex justify-between text-xs'>
                  <span className='text-muted-foreground'>Sync</span>
                  <span className='font-mono'>{formatBytes(storageUsage.syncBytes)} / 100 KB</span>
                </div>
                <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-emerald-500 transition-all'
                    style={{ width: `${Math.min((storageUsage.syncBytes / (100 * 1024)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delete all */}
          <div className='rounded-lg border border-destructive/50 p-3'>
            <p className='mb-2 font-medium text-destructive text-sm'>Vùng nguy hiểm</p>
            <p className='mb-3 text-[10px] text-muted-foreground'>Xóa toàn bộ dữ liệu extension trên trình duyệt</p>
            <Button
              className='w-full'
              onClick={async () => {
                const isConfirmed = await confirm({
                  title: "Cảnh báo nguy hiểm",
                  description:
                    "Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu (thông tin, điểm số, lịch học/thi)? Thao tác này không thể hoàn tác!",
                  confirmText: "Xóa toàn bộ",
                  cancelText: "Hủy",
                  variant: "destructive"
                });
                if (isConfirmed) {
                  await browser.storage.local.clear();
                  await browser.storage.sync.clear();
                  window.location.reload();
                }
              }}
              variant='destructive'
            >
              Xóa toàn bộ dữ liệu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
