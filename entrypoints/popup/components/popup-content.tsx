import { BookOpen, CalendarClock, CheckCircle2, GraduationCap, InfoIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";

type SharedSectionProps = {
  isLoading: boolean;
  openDashboard: (tab?: string) => void;
};

function NoSiteSection({
  navTo,
  svHomepage,
  kcqHomepage
}: {
  navTo: (url: string) => void;
  svHomepage: string;
  kcqHomepage: string;
}) {
  return (
    <div className='flex flex-col items-center p-6 text-center'>
      <GraduationCap className='mb-4 h-12 w-12 text-primary' />
      <h3 className='mb-2 font-semibold text-lg'>Chưa truy cập hệ thống</h3>
      <p className='mb-6 text-muted-foreground text-sm'>
        Vui lòng truy cập trang Tiện ích sinh viên của trường để sử dụng chức năng đồng bộ dữ liệu.
      </p>
      <div className='w-full space-y-3'>
        <Button className='w-full font-medium' onClick={() => navTo(svHomepage)}>
          Sinh viên Chính quy
        </Button>
        <Button className='w-full font-medium' onClick={() => navTo(kcqHomepage)} variant='outline'>
          Sinh viên Đào tạo Từ xa
        </Button>
      </div>
    </div>
  );
}

function UserInfoSection({
  isLoading,
  openDashboard,
  handleImportInfo,
  hasInfo
}: SharedSectionProps & { handleImportInfo: () => Promise<void>; hasInfo: boolean }) {
  return (
    <div className='flex flex-col space-y-4 p-6'>
      <div className='mb-2 flex items-center gap-2'>
        <User className='h-5 w-5 text-primary' />
        <h3 className='font-semibold'>Thông tin cá nhân</h3>
      </div>
      <Button className='w-full' disabled={isLoading} onClick={handleImportInfo} variant='default'>
        {isLoading ? "Đang xử lý..." : "Nhập Thông tin cá nhân"}
      </Button>
      <Button
        className='w-full'
        disabled={!hasInfo}
        onClick={() => openDashboard("personal-info")}
        variant={hasInfo ? "outline" : "secondary"}
      >
        {hasInfo ? "Xem thông tin đã nhập" : "Chưa có thông tin"}
      </Button>
    </div>
  );
}

function ClassCalendarSection({
  isLoading,
  openDashboard,
  handleImportCalendar,
  hasCalendar
}: SharedSectionProps & { handleImportCalendar: (isExam: boolean) => Promise<void>; hasCalendar: boolean }) {
  return (
    <div className='flex flex-col space-y-4 p-6'>
      <div className='mb-2 flex items-center gap-2'>
        <BookOpen className='h-5 w-5 text-primary' />
        <h3 className='font-semibold'>Lịch học</h3>
      </div>
      <Button className='w-full' disabled={isLoading} onClick={() => handleImportCalendar(false)} variant='default'>
        {isLoading ? "Đang xử lý..." : "Nhập Lịch học"}
      </Button>
      <Button
        className='w-full'
        disabled={!hasCalendar}
        onClick={() => openDashboard("calendar")}
        variant={hasCalendar ? "outline" : "secondary"}
      >
        {hasCalendar ? "Xem lịch đã nhập" : "Chưa có lịch học"}
      </Button>
    </div>
  );
}

function ExamCalendarSection({
  isLoading,
  openDashboard,
  handleImportCalendar,
  hasExam
}: SharedSectionProps & { handleImportCalendar: (isExam: boolean) => Promise<void>; hasExam: boolean }) {
  return (
    <div className='flex flex-col space-y-4 p-6'>
      <div className='mb-2 flex items-center gap-2'>
        <CalendarClock className='h-5 w-5 text-primary' />
        <h3 className='font-semibold'>Lịch thi</h3>
      </div>
      <Button className='w-full' disabled={isLoading} onClick={() => handleImportCalendar(true)} variant='default'>
        {isLoading ? "Đang xử lý..." : "Nhập Lịch thi"}
      </Button>
      <Button
        className='w-full'
        disabled={!hasExam}
        onClick={() => openDashboard("calendar")}
        variant={hasExam ? "outline" : "secondary"}
      >
        {hasExam ? "Xem lịch đã nhập" : "Chưa có lịch thi"}
      </Button>
    </div>
  );
}

function ScoreSection({
  isLoading,
  openDashboard,
  handleImportScore,
  hasScore
}: {
  isLoading: boolean;
  openDashboard: (tab?: string) => void;
  handleImportScore: () => Promise<void>;
  hasScore: boolean;
}) {
  return (
    <div className='flex flex-col space-y-4 p-6'>
      <div className='mb-2 flex items-center gap-2'>
        <CheckCircle2 className='h-5 w-5 text-primary' />
        <h3 className='font-semibold'>Kế hoạch điểm số</h3>
      </div>
      <Button className='w-full' disabled={isLoading} onClick={handleImportScore} variant='default'>
        {isLoading ? "Đang xử lý..." : "Nhập Điểm số"}
      </Button>
      <Button
        className='w-full'
        disabled={!hasScore}
        onClick={() => openDashboard("score-plan")}
        variant={hasScore ? "outline" : "secondary"}
      >
        {hasScore ? "Xem điểm đã nhập" : "Chưa có điểm"}
      </Button>
    </div>
  );
}

type PopupContentProps = {
  siteCurr: "sv" | "kcq" | null;
  currURL: string;
  isLoading: boolean;
  hasInfo: boolean;
  hasScore: boolean;
  hasCalendar: boolean;
  hasExam: boolean;
  navTo: (url: string) => void;
  openDashboard: (tab?: string) => void;
  handleImportInfo: () => Promise<void>;
  handleImportScore: () => Promise<void>;
  handleImportCalendar: (isExam: boolean) => Promise<void>;
  svHomepage: string;
  kcqHomepage: string;
};

export function PopupContent(props: PopupContentProps) {
  const {
    siteCurr,
    currURL,
    isLoading,
    hasInfo,
    hasScore,
    hasCalendar,
    hasExam,
    navTo,
    openDashboard,
    handleImportInfo,
    handleImportScore,
    handleImportCalendar,
    svHomepage,
    kcqHomepage
  } = props;

  if (!siteCurr) {
    return <NoSiteSection kcqHomepage={kcqHomepage} navTo={navTo} svHomepage={svHomepage} />;
  }
  if (currURL.includes("mode=userinfo")) {
    return (
      <UserInfoSection
        handleImportInfo={handleImportInfo}
        hasInfo={hasInfo}
        isLoading={isLoading}
        openDashboard={openDashboard}
      />
    );
  }
  if (currURL.includes("#/tkb-hocky")) {
    return (
      <ClassCalendarSection
        handleImportCalendar={handleImportCalendar}
        hasCalendar={hasCalendar}
        isLoading={isLoading}
        openDashboard={openDashboard}
      />
    );
  }
  if (currURL.includes("#/lichthi")) {
    return (
      <ExamCalendarSection
        handleImportCalendar={handleImportCalendar}
        hasExam={hasExam}
        isLoading={isLoading}
        openDashboard={openDashboard}
      />
    );
  }
  if (currURL.includes("#/diem")) {
    return (
      <ScoreSection
        handleImportScore={handleImportScore}
        hasScore={hasScore}
        isLoading={isLoading}
        openDashboard={openDashboard}
      />
    );
  }
  return (
    <div className='flex flex-col items-center p-6 text-center'>
      <InfoIcon className='mb-4 h-10 w-10 text-muted-foreground' />
      <h3 className='mb-2 font-semibold text-lg'>Tính năng chưa khả dụng</h3>
      <p className='mb-4 text-muted-foreground text-sm'>
        Vui lòng chọn <strong>Thông tin cá nhân</strong>, <strong>Lịch học</strong>, <strong>Lịch thi</strong> hoặc{" "}
        <strong>Kế hoạch điểm số</strong> trên menu của trường để bắt đầu nhập dữ liệu.
      </p>
    </div>
  );
}
