import { useEffect, useLayoutEffect, useState } from "react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { URL_FIELD_LABELS, URL_FIELDS } from "@/entrypoints/popup/ConfigTab/default";
import { useGlobalStore } from "@/store/use-global-store";

const ConfigTab = () => {
  const { fixedPoint, ignoreList, siteURLMapping, setFixedPoint, setIgnoreList, setSiteURLMapping, saveData, getData } =
    useGlobalStore();
  const [ignoreListText, setIgnoreListText] = useState<string>("");
  const [urlMapping, setURLMapping] = useState<_SITE_MAPPING>(siteURLMapping);

  const handleSave = async () => {
    const list = ignoreListText
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
    setIgnoreList(list);
    setSiteURLMapping(urlMapping);

    await saveData();
    toast.success("Cài đặt đã được lưu!");
  };

  const handleIgnoreListChange = (value: string) => {
    setIgnoreListText(value);
  };

  const handleURLChange = (siteKey: _SITE_CATE, field: keyof _SITE_MAPPING[_SITE_CATE], value: string) => {
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
    const getOldData = async () => {
      await getData();
    };
    getOldData();
  }, [getData]);

  useEffect(() => {
    setIgnoreListText(ignoreList.join(","));
  }, [ignoreList]);

  useEffect(() => {
    setURLMapping(siteURLMapping);
  }, [siteURLMapping]);

  return (
    <section className='space-y-4 px-4 py-2'>
      <div className='flex justify-between'>
        <Label className='font-semibold text-gray-700'>Số chữ số thập phân hiển thị:</Label>
        <Input
          className='w-30'
          max='10'
          min='1'
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") {
              return;
            }
            const num = Number(value);
            if (Number.isNaN(num)) {
              return;
            }
            const clamped = Math.min(10, Math.max(1, num));
            setFixedPoint(clamped);
          }}
          type='number'
          value={fixedPoint}
        />
      </div>

      <div className='space-y-2'>
        <Label className='font-semibold text-gray-700'>Các môn học không tính vào GPA (bắt đầu với):</Label>
        <Textarea disabled onChange={(e) => handleIgnoreListChange(e.target.value)} value={ignoreListText} />
      </div>

      <div className='space-y-2'>
        <Label className='font-semibold text-gray-700'>URL các trang:</Label>
        <Accordion className='rounded-md border' collapsible type='single'>
          {(["sv", "kcq"] as _SITE_CATE[]).map((siteKey) => (
            <AccordionItem key={siteKey} value={siteKey}>
              <AccordionTrigger className='px-3'>{_DEFAULT_SITE_URL_MAPPING[siteKey].label}</AccordionTrigger>
              <AccordionContent className='space-y-2 px-3'>
                {URL_FIELDS.map((field) => (
                  <div className='space-y-1' key={field}>
                    <Label className='text-gray-500 text-xs'>{URL_FIELD_LABELS[field]}:</Label>
                    <Input
                      onChange={(e) => handleURLChange(siteKey, field, e.target.value)}
                      value={urlMapping[siteKey][field]}
                    />
                  </div>
                ))}
                <div className='flex justify-end pt-1'>
                  <Button onClick={() => handleResetSite(siteKey)} size='sm' variant='outline'>
                    Đặt lại mặc định
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className='flex justify-end'>
        <Button onClick={handleSave}>Lưu</Button>
      </div>
    </section>
  );
};

export { ConfigTab };
