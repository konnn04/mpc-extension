import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Globe,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  Save,
  Settings,
  Sun
} from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { URL_FIELD_LABELS, URL_FIELDS } from "@/entrypoints/popup/ConfigTab/default";
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

type SectionKey = "appearance" | "display" | "urls" | "advanced";

function SectionHeader({
  icon: Icon,
  title,
  description,
  isOpen,
  onToggle
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className='flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors hover:bg-muted/50'
      onClick={onToggle}
      type='button'
    >
      <div className='flex items-center gap-3'>
        <div className='flex h-9 w-9 items-center justify-center rounded-md bg-primary/10'>
          <Icon className='h-4 w-4 text-primary' />
        </div>
        <div>
          <p className='font-semibold text-sm'>{title}</p>
          <p className='text-muted-foreground text-xs'>{description}</p>
        </div>
      </div>
      {isOpen ? (
        <ChevronDown className='h-4 w-4 text-muted-foreground' />
      ) : (
        <ChevronRight className='h-4 w-4 text-muted-foreground' />
      )}
    </button>
  );
}

export function SettingsPage({ theme, onThemeChange }: SettingsPageProps) {
  const { fixedPoint, ignoreList, siteURLMapping, setFixedPoint, setIgnoreList, setSiteURLMapping, saveData, getData } =
    useGlobalStore();

  const [ignoreListText, setIgnoreListText] = useState("");
  const [urlMapping, setURLMapping] = useState<_SITE_MAPPING>(siteURLMapping);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    appearance: true,
    display: true,
    urls: false,
    advanced: false
  });
  const [expandedSite, setExpandedSite] = useState<_SITE_CATE | null>(null);

  const toggleSection = (key: SectionKey) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

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
    <div className='space-y-4'>
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

      {/* Appearance Section */}
      <Card>
        <SectionHeader
          description='Giao diện và ngôn ngữ hiển thị'
          icon={Palette}
          isOpen={openSections.appearance}
          onToggle={() => toggleSection("appearance")}
          title='Giao diện'
        />
        {openSections.appearance && (
          <>
            <Separator />
            <CardContent className='space-y-6 pt-6'>
              {/* Theme */}
              <div className='space-y-3'>
                <Label className='font-medium'>Chế độ màu sắc</Label>
                <div className='grid grid-cols-3 gap-3'>
                  {_THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:border-primary/50 ${
                        theme === value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"
                      }`}
                      key={value}
                      onClick={() => onThemeChange(value)}
                      type='button'
                    >
                      <Icon className={`h-5 w-5 ${theme === value ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`font-medium text-sm ${theme === value ? "text-primary" : "text-foreground"}`}>
                        {label}
                      </span>
                      {theme === value && (
                        <Badge className='text-xs' variant='default'>
                          Đang dùng
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language (read-only for now) */}
              <div className='space-y-2'>
                <Label className='font-medium'>Ngôn ngữ</Label>
                <div className='flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2'>
                  <Globe className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm'>Tiếng Việt</span>
                  <Badge className='ml-auto text-xs' variant='secondary'>
                    Mặc định
                  </Badge>
                </div>
                <p className='text-muted-foreground text-xs'>Hỗ trợ đa ngôn ngữ đang được phát triển.</p>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Display Section */}
      <Card>
        <SectionHeader
          description='Cách hiển thị số liệu và dữ liệu'
          icon={Monitor}
          isOpen={openSections.display}
          onToggle={() => toggleSection("display")}
          title='Hiển thị'
        />
        {openSections.display && (
          <>
            <Separator />
            <CardContent className='space-y-4 pt-6'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <Label className='font-medium'>Số chữ số thập phân</Label>
                  <p className='mt-0.5 text-muted-foreground text-xs'>Áp dụng cho GPA và điểm số</p>
                </div>
                <Input
                  className='w-24 text-center'
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
          </>
        )}
      </Card>

      {/* URL Mappings Section */}
      <Card>
        <SectionHeader
          description='Cấu hình URL cho từng hệ thống, hỗ trợ Regex'
          icon={Globe}
          isOpen={openSections.urls}
          onToggle={() => toggleSection("urls")}
          title='Cấu hình URL các trang'
        />
        {openSections.urls && (
          <>
            <Separator />
            <CardContent className='space-y-4 pt-6'>
              <div className='flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30'>
                <AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400' />
                <p className='text-amber-700 text-xs dark:text-amber-300'>
                  Trường <b>Regex</b> hỗ trợ biểu thức chính quy (RegExp). Extension sẽ so khớp URL hiện tại với regex
                  để xác định trang. Để lại theo mặc định nếu bạn không chắc.
                </p>
              </div>

              {(["sv", "kcq"] as _SITE_CATE[]).map((siteKey) => (
                <div className='rounded-lg border' key={siteKey}>
                  <button
                    className='flex w-full items-center justify-between p-4 text-left'
                    onClick={() => setExpandedSite(expandedSite === siteKey ? null : siteKey)}
                    type='button'
                  >
                    <div>
                      <span className='font-medium text-sm'>{_DEFAULT_SITE_URL_MAPPING[siteKey].label}</span>
                      <p className='mt-0.5 font-mono text-muted-foreground text-xs'>{_URL_FIELD_PREVIEW.homepage}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button
                        className='h-7 gap-1 text-xs'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetSite(siteKey);
                        }}
                        size='sm'
                        type='button'
                        variant='ghost'
                      >
                        <RefreshCw className='h-3 w-3' />
                        Đặt lại
                      </Button>
                      {expandedSite === siteKey ? (
                        <ChevronDown className='h-4 w-4 text-muted-foreground' />
                      ) : (
                        <ChevronRight className='h-4 w-4 text-muted-foreground' />
                      )}
                    </div>
                  </button>

                  {expandedSite === siteKey && (
                    <div className='border-t px-4 pt-4 pb-4'>
                      <div className='space-y-4'>
                        {URL_FIELDS.map((field) => {
                          const regexKey = `${field}Regex` as keyof _SITE_MAPPING[_SITE_CATE];
                          return (
                            <div className='space-y-2 rounded-md border p-3' key={field}>
                              <Label className='font-medium text-xs'>{URL_FIELD_LABELS[field]}</Label>
                              {/* Nav URL */}
                              <div className='space-y-1'>
                                <Label className='text-muted-foreground text-xs'>URL điều hướng</Label>
                                <Input
                                  onChange={(e) => handleURLChange(siteKey, field, e.target.value)}
                                  placeholder={"https://..."}
                                  value={urlMapping[siteKey][field as keyof _SITE_MAPPING[_SITE_CATE]] as string}
                                />
                              </div>
                              {/* Regex pattern */}
                              <div className='space-y-1'>
                                <div className='flex items-center gap-1'>
                                  <Label className='text-muted-foreground text-xs'>Regex nhận diện</Label>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className='cursor-help rounded bg-muted px-1 text-muted-foreground text-xs'>
                                        ?
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className='max-w-xs text-xs'>
                                        Pattern regex để nhận diện URL hiện tại. Hỗ trợ các biến thể như /public/#,
                                        /dkmh/#. Nếu regex lỗi sẽ fallback về so sánh URL thường.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <Input
                                  className='font-mono text-xs'
                                  onChange={(e) => handleURLChange(siteKey, regexKey as string, e.target.value)}
                                  placeholder={`^https://...${_URL_FIELD_PREVIEW[field] ?? ""}.*$`}
                                  value={urlMapping[siteKey][regexKey] as string}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </>
        )}
      </Card>

      {/* Advanced Section */}
      <Card>
        <SectionHeader
          description='Cấu hình nâng cao cho tính toán GPA'
          icon={Settings}
          isOpen={openSections.advanced}
          onToggle={() => toggleSection("advanced")}
          title='Nâng cao'
        />
        {openSections.advanced && (
          <>
            <Separator />
            <CardContent className='space-y-4 pt-6'>
              <div className='space-y-2'>
                <Label className='font-medium'>Danh sách môn học loại khỏi GPA</Label>
                <p className='text-muted-foreground text-xs'>
                  Mã môn bắt đầu với các ký tự sau sẽ bị loại khỏi tính GPA (phân cách bởi dấu phẩy)
                </p>
                <Textarea
                  className='font-mono text-xs'
                  onChange={(e) => setIgnoreListText(e.target.value)}
                  placeholder='_,MEETING,PEDU,...'
                  rows={3}
                  value={ignoreListText}
                />
                <p className='text-muted-foreground text-xs'>
                  Mặc định: BHYT, Sinh hoạt lớp, GDTC, GDQP, Kiểm tra đầu vào, Tiếng Anh căn bản/đầu ra
                </p>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Save Footer */}
      <div className='flex justify-end gap-2 pb-4'>
        <Button
          onClick={() => {
            setURLMapping(siteURLMapping);
            setIgnoreListText(ignoreList.join(","));
            toast.info("Đã hoàn tác thay đổi chưa lưu");
          }}
          variant='outline'
        >
          Hoàn tác
        </Button>
        <Button className='gap-2' onClick={handleSave}>
          <Save className='h-4 w-4' />
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}
