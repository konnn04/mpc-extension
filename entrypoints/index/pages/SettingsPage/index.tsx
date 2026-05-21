import { HardDrive, Monitor, Moon, RefreshCw, Save, Settings, Sun, UserCog } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { useConfirm } from "@/hooks/use-confirm";
import { useGlobalStore } from "@/store/use-global-store";
import { useUserSettingsStore } from "@/store/use-user-settings-store";
import { PersonalSettings } from "./components/personal-settings";
import { SchoolParams } from "./components/school-params";
import { UrlConfig } from "./components/url-config";

type ThemeMode = "light" | "dark" | "system";
type SettingsPageProps = { theme: ThemeMode; onThemeChange: (mode: ThemeMode) => void };

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
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

  const [trainingSemesters, setTrainingSemesters] = useState(userSettings.trainingSemesters);
  const [totalProgramCredits, setTotalProgramCredits] = useState(userSettings.totalProgramCredits);

  const [localRetakeRatio, setLocalRetakeRatio] = useState(retakeRatioLimit);
  const [localMaxCreditsPerSem, setLocalMaxCreditsPerSem] = useState(maxCreditsPerSemester);
  const [localMinCreditsPerSem, setLocalMinCreditsPerSem] = useState(minCreditsPerSemester);
  const [localMaxCreditsWarn, setLocalMaxCreditsWarn] = useState(maxCreditsWarning);
  const [localMaxCreditsSum, setLocalMaxCreditsSum] = useState(maxCreditsSummer);
  const [localDrlThreshold, setLocalDrlThreshold] = useState(drlWarningThreshold);

  const [storageUsage, setStorageUsage] = useState({ localBytes: 0, syncBytes: 0 });

  const refreshStorageUsage = useCallback(async () => {
    const [localData, syncData] = await Promise.all([browser.storage.local.get(null), browser.storage.sync.get(null)]);
    setStorageUsage({
      localBytes: new Blob([JSON.stringify(localData)]).size,
      syncBytes: new Blob([JSON.stringify(syncData)]).size
    });
  }, []);

  useLayoutEffect(() => {
    Promise.all([getData(), getUserSettings(), refreshStorageUsage()]);
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
      .map((s) => s.trim())
      .filter(Boolean);
    setIgnoreList(list);
    setSiteURLMapping(urlMapping);
    setRetakeRatioLimit(localRetakeRatio);
    setMaxCreditsPerSemester(localMaxCreditsPerSem);
    setMinCreditsPerSemester(localMinCreditsPerSem);
    setMaxCreditsWarning(localMaxCreditsWarn);
    setMaxCreditsSummer(localMaxCreditsSum);
    setDrlWarningThreshold(localDrlThreshold);
    setUserSettings({ trainingSemesters, totalProgramCredits });
    await Promise.all([saveData(), saveUserSettings()]);
    toast.success("Đã lưu cài đặt!");
  };

  const handleURLChange = (siteKey: _SITE_CATE, path: string[], value: string) => {
    setURLMapping((prev) => {
      const updated = structuredClone(prev);
      let obj: Record<string, unknown> = updated[siteKey] as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]] as Record<string, unknown>;
      }
      const lastKey = path.at(-1);
      obj[lastKey] = value;
      return updated;
    });
  };

  const handleResetSite = (siteKey: _SITE_CATE) => {
    setURLMapping((prev) => ({ ...prev, [siteKey]: structuredClone(_DEFAULT_SITE_URL_MAPPING[siteKey]) }));
    toast.success(`Đã đặt lại URL cho ${_DEFAULT_SITE_URL_MAPPING[siteKey].label}`);
  };

  return (
    <div className='mx-auto max-w-2xl space-y-6 pb-12'>
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

      <Card>
        <SectionHeader
          description='Cài đặt theo MSSV, ảnh hưởng đến tính toán học lực và dự đoán điểm'
          icon={UserCog}
          title='Cài đặt cá nhân'
        />
        <CardContent className='pt-0'>
          <PersonalSettings
            setTotalProgramCredits={setTotalProgramCredits}
            setTrainingSemesters={setTrainingSemesters}
            totalProgramCredits={totalProgramCredits}
            trainingSemesters={trainingSemesters}
          />
        </CardContent>
      </Card>

      <Card>
        <SectionHeader
          description='Áp dụng cho tất cả tài khoản, đồng bộ qua các thiết bị'
          icon={Settings}
          title='Cài đặt chung'
        />
        <CardContent className='space-y-6 pt-0'>
          <div className='space-y-2'>
            <Label className='font-medium'>Chế độ màu sắc</Label>
            <div className='grid grid-cols-3 gap-2'>
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all hover:border-primary/50 ${theme === value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}`}
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
                const v = e.target.value;
                if (v === "") {
                  return;
                }
                const n = Number(v);
                if (!Number.isNaN(n)) {
                  setFixedPoint(Math.min(10, Math.max(1, n)));
                }
              }}
              type='number'
              value={fixedPoint}
            />
          </div>

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

          <SchoolParams
            localDrlThreshold={localDrlThreshold}
            localMaxCreditsPerSem={localMaxCreditsPerSem}
            localMaxCreditsSum={localMaxCreditsSum}
            localMaxCreditsWarn={localMaxCreditsWarn}
            localMinCreditsPerSem={localMinCreditsPerSem}
            localRetakeRatio={localRetakeRatio}
            setLocalDrlThreshold={setLocalDrlThreshold}
            setLocalMaxCreditsPerSem={setLocalMaxCreditsPerSem}
            setLocalMaxCreditsSum={setLocalMaxCreditsSum}
            setLocalMaxCreditsWarn={setLocalMaxCreditsWarn}
            setLocalMinCreditsPerSem={setLocalMinCreditsPerSem}
            setLocalRetakeRatio={setLocalRetakeRatio}
          />

          <UrlConfig handleResetSite={handleResetSite} handleURLChange={handleURLChange} urlMapping={urlMapping} />

          <div className='space-y-2 rounded-lg border p-3'>
            <div className='flex items-center gap-2'>
              <HardDrive className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium text-sm'>Dung lượng lưu trữ</span>
              <Button className='ml-auto h-6 gap-1 text-[10px]' onClick={refreshStorageUsage} size='sm' variant='ghost'>
                <RefreshCw className='h-3 w-3' />
                Làm mới
              </Button>
            </div>
            <StorageBar
              bytes={storageUsage.localBytes}
              color='bg-primary'
              label='Local'
              maxBytes={10 * 1024 * 1024}
              maxLabel='10 MB'
            />
            <StorageBar
              bytes={storageUsage.syncBytes}
              color='bg-emerald-500'
              label='Sync'
              maxBytes={100 * 1024}
              maxLabel='100 KB'
            />
          </div>

          <div className='rounded-lg border border-destructive/50 p-3'>
            <p className='mb-2 font-medium text-destructive text-sm'>Vùng nguy hiểm</p>
            <p className='mb-3 text-[10px] text-muted-foreground'>Xóa toàn bộ dữ liệu extension trên trình duyệt</p>
            <Button
              className='w-full'
              onClick={async () => {
                const ok = await confirm({
                  title: "Cảnh báo nguy hiểm",
                  description:
                    "Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu (thông tin, điểm số, lịch học/thi)? Thao tác này không thể hoàn tác!",
                  confirmText: "Xóa toàn bộ",
                  cancelText: "Hủy",
                  variant: "destructive"
                });
                if (ok) {
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

function StorageBar({
  label,
  maxLabel,
  bytes,
  maxBytes,
  color
}: {
  label: string;
  maxLabel: string;
  bytes: number;
  maxBytes: number;
  color: string;
}) {
  return (
    <div>
      <div className='mb-0.5 flex justify-between text-xs'>
        <span className='text-muted-foreground'>{label}</span>
        <span className='font-mono'>
          {formatBytes(bytes)} / {maxLabel}
        </span>
      </div>
      <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min((bytes / maxBytes) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
