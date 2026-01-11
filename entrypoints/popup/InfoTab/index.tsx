import { CircleAlertIcon, CircleCheckIcon, ImportIcon } from "lucide-react";
import { Activity, useEffect, useLayoutEffect } from "react";
import { toast } from "sonner";
import { ButtonNavSite } from "@/components/custom/button-nav-site";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { _GET_USER_DATA } from "@/constants/chrome";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { _COURSE_LABEL_MAPPING, _USER_LABEL_MAPPING } from "@/entrypoints/popup/InfoTab/default";
import { CourseType, UserType } from "@/entrypoints/popup/InfoTab/type";
import { handleExportData } from "@/entrypoints/popup/InfoTab/utils";
import { useGlobalStore } from "@/store/use-global-store";
import { navigateToURL } from "@/utils";
import { DataTable } from "./data-table";
import { useInfoStore } from "./use-info-store";

const InfoTab = () => {
  const siteCurr = useGlobalStore((s) => s.siteCurr);
  const siteCurrURL = useGlobalStore((s) => s.siteCurrURL);
  const { userData, courseData, setUserData, setCourseData, getData, saveData } = useInfoStore();

  const handleNavigate = async (url: string) => {
    await navigateToURL(url);
  };

  const handleImportData = async () => {
    if (siteCurrURL !== _DEFAULT_SITE_URL_MAPPING[siteCurr].info) {
      toast.error("Vui lòng truy cập trang thông tin người dùng để nhập dữ liệu!");
      return;
    }

    const data: { userData: UserType; courseData: CourseType } = await browser.runtime.sendMessage({
      type: _GET_USER_DATA
    });

    if (!(data?.userData || data?.courseData)) {
      toast.error("Không thể lấy dữ liệu người dùng. Vui lòng thử lại!");
      return;
    }

    setUserData(data.userData);
    setCourseData(data.courseData);
    await saveData();
    toast.success("Nhập dữ liệu người dùng thành công!");
  };

  useLayoutEffect(() => {
    const loadData = async () => {
      await getData();
    };
    loadData();
  }, [getData]);

  useEffect(() => {
    console.info("[index.tsx:56] ", siteCurrURL);
  }, [siteCurrURL]);

  return (
    <section>
      <Alert className='m-0 border-none p-0'>
        <AlertDescription>
          <div className='mx-auto flex items-center justify-center text-center'>
            Dữ liệu cần được lấy từ:{" "}
            <ButtonNavSite url={_DEFAULT_SITE_URL_MAPPING[siteCurr].info} variant='link'>
              {_DEFAULT_SITE_URL_MAPPING[siteCurr].info}
            </ButtonNavSite>
            {siteCurrURL === _DEFAULT_SITE_URL_MAPPING[siteCurr].info ? (
              <CircleCheckIcon className='ml-2 h-5 w-5 text-green-500' />
            ) : (
              <CircleAlertIcon className='ml-2 h-5 w-5 text-red-500' />
            )}
          </div>
        </AlertDescription>
      </Alert>
      <Activity mode={userData.userId ? "hidden" : "visible"}>
        <Empty className='h-full bg-linear-to-b from-30% from-muted/50 to-background'>
          <EmptyHeader>
            <EmptyMedia>
              <ImportIcon className='h-12 w-12 text-muted-foreground' />
            </EmptyMedia>
            <EmptyTitle>Chưa có dữ liệu người dùng!</EmptyTitle>
            <EmptyDescription>
              Vui lòng truy cập trang thông tin người dùng trên Tiện ích để nhập dữ liệu người dùng.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className='flex gap-2'>
              <ButtonNavSite size='sm' url={_DEFAULT_SITE_URL_MAPPING[siteCurr].info}>
                Đến trang thông tin
              </ButtonNavSite>
              <Button onClick={handleImportData} size='sm'>
                Nhập dữ liệu
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </Activity>
      <Activity mode={userData.userId ? "visible" : "hidden"}>
        <div className='py-2'>
          <div className='flex justify-center gap-1'>
            <Button onClick={handleImportData} size='sm'>
              Nhập dữ liệu mới
            </Button>
            <Button
              onClick={() => handleExportData(userData, courseData, _USER_LABEL_MAPPING, _COURSE_LABEL_MAPPING)}
              size='sm'
            >
              Xuất dữ liệu
            </Button>
          </div>
        </div>

        <DataTable courseData={courseData} userData={userData} />
      </Activity>
    </section>
  );
};

export { InfoTab };
