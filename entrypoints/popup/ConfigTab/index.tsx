import { useEffect, useLayoutEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGlobalStore } from "@/store/use-global-store";

const ConfigTab = () => {
  const { fixedPoint, ignoreList, setFixedPoint, setIgnoreList, saveData, getData } = useGlobalStore();
  const [ignoreListText, setIgnoreListText] = useState<string>("");

  const handleSave = async () => {
    const list = ignoreListText
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
    setIgnoreList(list);

    await saveData();
    toast.success("Cài đặt đã được lưu!");
  };

  const handleIgnoreListChange = (value: string) => {
    setIgnoreListText(value);
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

  return (
    <section className='space-y-4 px-4 py-2'>
      <div className='flex justify-between'>
        <Label className='font-semibold text-gray-700'>Số chữ số thập phân hiển thị:</Label>
        <Input
          className='w-30'
          max='10'
          min='1'
          onChange={(e) => setFixedPoint(Number(e.target.value))}
          type='number'
          value={fixedPoint}
        />
      </div>

      <div className='space-y-2'>
        <Label className='font-semibold text-gray-700'>Các môn học không tính vào GPA (bắt đầu với):</Label>
        <Textarea disabled onChange={(e) => handleIgnoreListChange(e.target.value)} value={ignoreListText} />
      </div>

      <div className='flex justify-end'>
        <Button onClick={handleSave}>Lưu</Button>
      </div>
    </section>
  );
};

export { ConfigTab };
