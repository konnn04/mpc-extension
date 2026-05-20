import { AlertCircle, Globe, Monitor, Moon, Palette, RefreshCw, Save, Settings, Sun } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { _DEFAULT_SITE_URL_MAPPING, URL_FIELD_LABELS, URL_FIELDS } from "@/constants/default";
import { useConfirm } from "@/hooks/use-confirm";
import { useGlobalStore } from "@/store/use-global-store";

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

/** Friendly preview labels for each URL field */
const _URL_FIELD_PREVIEW: Record<string, string> = {
  homepage: "tienichsv.ou.edu.vn",
  point: "#/diem",
  classCalendar: "#/tkb-tuan",
  examCalendar: "#/lichthi",
  info: "#/home?mode=userinfo"
};

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
    <div className='flex w-full items-center justify-between rounded-t-lg p-4 text-left'>
      <div className='flex items-center gap-3'>
        <div className='flex h-9 w-9 items-center justify-center rounded-md bg-primary/10'>
          <Icon className='h-4 w-4 text-primary' />
        </div>
        <div>
          <p className='font-semibold text-sm'>{title}</p>
          <p className='text-muted-foreground text-xs'>{description}</p>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage({ theme, onThemeChange }: SettingsPageProps) {
  const { fixedPoint, ignoreList, siteURLMapping, setFixedPoint, setIgnoreList, setSiteURLMapping, saveData, getData } =
    useGlobalStore();
  const confirm = useConfirm();

  const [ignoreListText, setIgnoreListText] = useState("");
  const [urlMapping, setURLMapping] = useState<_SITE_MAPPING>(siteURLMapping);

  const handleSave = async () => {
    const list = ignoreListText
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
    setIgnoreList(list);
    setSiteURLMapping(urlMapping);
    await saveData();
    toast.success("Đã lưu cài đặt!");
  };

  const handleURLChange = (siteKey: _SITE_CATE, field: string, value: string) => {
    setURLMapping((prev) => ({
      ...prev,
      [siteKey]: {
        ...prev[siteKey],
        [field]: value
      }
    }));
  };

  const handleResetSite = (siteKey: _SITE_CATE) => {
    setURLMapping((prev) => ({
      ...prev,
      [siteKey]: { ..._DEFAULT_SITE_URL_MAPPING[siteKey] }
    }));
    toast.success(`Đã đặt lại URL cho ${_DEFAULT_SITE_URL_MAPPING[siteKey].label}`);
  };

  useLayoutEffect(() => {
    const load = async () => {
      await getData();
    };
    load();
  }, [getData]);

  useEffect(() => {
    setIgnoreListText(ignoreList.join(","));
  }, [ignoreList]);

  useEffect(() => {
    setURLMapping(siteURLMapping);
  }, [siteURLMapping]);

  return (
    <div className='space-y-4 pb-12'>
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

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
        <div className='space-y-4'>
          {/* Appearance Section */}
          <Card>
            <SectionHeader description='Giao diện và ngôn ngữ hiển thị' icon={Palette} title='Giao diện' />
            <CardContent className='space-y-4 pt-0'>
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

              <div className='space-y-1.5'>
                <Label className='font-medium'>Ngôn ngữ</Label>
                <div className='flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5'>
                  <Globe className='h-3.5 w-3.5 text-muted-foreground' />
                  <span className='text-sm'>Tiếng Việt</span>
                  <Badge className='ml-auto text-[10px]' variant='secondary'>
                    Mặc định
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Section */}
          <Card>
            <SectionHeader description='Cách hiển thị số liệu và dữ liệu' icon={Monitor} title='Hiển thị' />
            <CardContent className='pt-0'>
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
            </CardContent>
          </Card>

          {/* Advanced Section */}
          <Card>
            <SectionHeader description='Cấu hình nâng cao cho tính toán GPA' icon={Settings} title='Nâng cao' />
            <CardContent className='space-y-2 pt-0'>
              <div className='space-y-1.5'>
                <Label className='font-medium'>Danh sách môn học loại khỏi GPA</Label>
                <p className='text-[10px] text-muted-foreground'>
                  Mã môn bắt đầu với các ký tự sau sẽ bị loại khỏi tính GPA (phân cách bởi dấu phẩy)
                </p>
                <Textarea
                  className='min-h-[60px] font-mono text-xs'
                  onChange={(e) => setIgnoreListText(e.target.value)}
                  placeholder='_,MEETING,PEDU,...'
                  rows={2}
                  value={ignoreListText}
                />
                <p className='text-[10px] text-muted-foreground'>
                  Mặc định: BHYT, Sinh hoạt lớp, GDTC, GDQP, Kiểm tra đầu vào, Tiếng Anh căn bản/đầu ra
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className='border-destructive/50'>
            <SectionHeader
              description='Xóa toàn bộ dữ liệu extension trên trình duyệt'
              icon={AlertCircle}
              title='Vùng nguy hiểm'
            />
            <CardContent className='pt-0'>
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
                    window.location.reload();
                  }
                }}
                variant='destructive'
              >
                Xóa toàn bộ dữ liệu
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* URL Mappings Section */}
        <div className='space-y-4'>
          <Card>
            <SectionHeader
              description='Cấu hình URL cho từng hệ thống, hỗ trợ Regex'
              icon={Globe}
              title='Cấu hình URL các trang'
            />
            <CardContent className='space-y-4 pt-0'>
              <div className='flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30'>
                <AlertCircle className='mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400' />
                <p className='text-[10px] text-amber-700 leading-tight dark:text-amber-300'>
                  Trường <b>Regex</b> hỗ trợ biểu thức chính quy (RegExp). Extension sẽ so khớp URL hiện tại với regex
                  để xác định trang. Để lại theo mặc định nếu bạn không chắc.
                </p>
              </div>

              <div className='space-y-4'>
                {(["sv", "kcq"] as _SITE_CATE[]).map((siteKey) => (
                  <div className='space-y-2 rounded-lg border p-3' key={siteKey}>
                    <div className='flex items-center justify-between pb-2'>
                      <div>
                        <span className='font-medium text-sm'>{_DEFAULT_SITE_URL_MAPPING[siteKey].label}</span>
                        <p className='font-mono text-[10px] text-muted-foreground'>{_URL_FIELD_PREVIEW.homepage}</p>
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
                      {URL_FIELDS.map((field) => {
                        const regexKey = `${field}Regex` as keyof _SITE_MAPPING[_SITE_CATE];
                        return (
                          <div className='grid grid-cols-[100px_1fr] items-start gap-2' key={field}>
                            <Label className='pt-1.5 font-medium text-xs leading-tight'>
                              {URL_FIELD_LABELS[field]}
                            </Label>
                            <div className='space-y-2'>
                              <Input
                                className='h-7 text-xs'
                                onChange={(e) => handleURLChange(siteKey, field, e.target.value)}
                                placeholder={"URL điều hướng"}
                                value={urlMapping[siteKey][field as keyof _SITE_MAPPING[_SITE_CATE]] as string}
                              />
                              <div className='relative'>
                                <Input
                                  className='h-7 pr-6 font-mono text-xs'
                                  onChange={(e) => handleURLChange(siteKey, regexKey as string, e.target.value)}
                                  placeholder={"Regex nhận diện"}
                                  value={urlMapping[siteKey][regexKey] as string}
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
