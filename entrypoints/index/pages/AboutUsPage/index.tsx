import { Bug, FacebookIcon, GithubIcon, ShieldCheck } from "lucide-react";
import { ButtonNavSite } from "@/components/custom/button-nav-site";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { _FACEBOOK_URL, _GITHUB_URL, _REPORT_BUG_URL } from "@/constants";

export function AboutUsPage() {
  return (
    <div className='container mx-auto max-w-4xl p-4 lg:p-8'>
      <div className='mb-8 flex flex-col items-start gap-2'>
        <h1 className='font-bold text-3xl tracking-tight'>Về chúng tôi</h1>
        <p className='text-lg text-muted-foreground'>
          Thông tin về dự án MPC Extension và CLB Lập trình thiết bị di động (MPC).
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-xl'>Dự án MPC Extension</CardTitle>
            <CardDescription>Trợ thủ đắc lực cho sinh viên OU</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 text-sm'>
            <p>
              MPC Extension là một tiện ích mở rộng trên trình duyệt được phát triển nhằm mục đích hỗ trợ sinh viên
              Trường Đại học Mở TP.HCM (OU) trong việc theo dõi lịch học, tính toán điểm số và quản lý thông tin học tập
              một cách hiệu quả và trực quan nhất.
            </p>
            <p>Dự án được mã nguồn mở và liên tục cập nhật dựa trên đóng góp từ cộng đồng sinh viên.</p>
            <div className='flex gap-3 pt-4'>
              <ButtonNavSite className='flex-1' isBlank rel='noopener' url={_GITHUB_URL} variant='outline'>
                <GithubIcon className='mr-2 h-4 w-4' />
                Mã nguồn Github
              </ButtonNavSite>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-xl'>Câu lạc bộ MPC</CardTitle>
            <CardDescription>Mobile Programming Club</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 text-sm'>
            <p>
              CLB Lập trình trên thiết bị di động (MPC) là nơi quy tụ những sinh viên đam mê lập trình và phát triển
              phần mềm tại OU. Chúng tôi thường xuyên tổ chức các buổi training, workshop và các dự án thực tế để sinh
              viên có môi trường rèn luyện.
            </p>
            <p>Extension này là một trong những sản phẩm phi lợi nhuận được thực hiện bởi các thành viên trong CLB.</p>
            <div className='flex gap-3 pt-4'>
              <ButtonNavSite className='flex-1' isBlank rel='noopener' url={_FACEBOOK_URL} variant='outline'>
                <FacebookIcon className='mr-2 h-4 w-4 text-blue-600' />
                Fanpage CLB
              </ButtonNavSite>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-6 border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-900/10'>
        <CardHeader>
          <CardTitle className='text-lg'>Góp ý & Báo lỗi</CardTitle>
          <CardDescription>Giúp chúng tôi hoàn thiện sản phẩm hơn</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='mb-4 text-sm'>
            Nếu bạn phát hiện lỗi (bug) trong quá trình sử dụng hoặc có ý tưởng muốn đóng góp thêm tính năng cho MPC
            Extension, vui lòng để lại thông tin cho chúng tôi.
          </p>
          <ButtonNavSite className='bg-blue-600 text-white hover:bg-blue-700' url={_REPORT_BUG_URL}>
            <Bug className='mr-2 h-4 w-4' />
            Báo cáo lỗi / Góp ý
          </ButtonNavSite>
        </CardContent>
      </Card>

      <Card className='mt-6 border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <ShieldCheck className='h-5 w-5 text-green-600 dark:text-green-400' />
            Cam kết bảo mật & Quyền riêng tư
          </CardTitle>
          <CardDescription>Dữ liệu của bạn thuộc về bạn</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <p>
            MPC Extension <strong>không gọi bất kỳ API bên ngoài nào</strong> và{" "}
            <strong>không gửi dữ liệu lên máy chủ</strong> của chúng tôi hay bất kỳ bên thứ ba nào.
          </p>
          <ul className='list-inside list-disc space-y-1 text-muted-foreground'>
            <li>
              Toàn bộ dữ liệu (thông tin cá nhân, điểm số, lịch học, lịch thi) chỉ được <strong>lưu cục bộ</strong> trên
              trình duyệt của bạn thông qua Chrome Storage.
            </li>
            <li>Extension chỉ đọc dữ liệu trực tiếp từ trang web của trường khi bạn chủ động nhấn nút "Nhập".</li>
            <li>Không có tài khoản, không cần đăng nhập, không theo dõi hành vi.</li>
          </ul>
          <p className='text-muted-foreground'>
            Bạn có thể xóa toàn bộ dữ liệu bất kỳ lúc nào trong phần <strong>Cài đặt</strong> của Dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
