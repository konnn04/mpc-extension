import { Check, Copy, Eye, EyeOff, GraduationCap, Mail, MapPin, Phone, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { _COURSE_LABEL_MAPPING, _USER_LABEL_MAPPING } from "@/entrypoints/popup/InfoTab/default";
import { useInfoStore } from "@/entrypoints/popup/InfoTab/use-info-store";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!text) {
      return;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button className='ml-2 h-6 w-6' onClick={handleCopy} size='icon' title='Copy' variant='ghost'>
      {copied ? <Check className='h-3 w-3 text-green-500' /> : <Copy className='h-3 w-3' />}
    </Button>
  );
}

function HiddenField({ value, label }: { value: string; label: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className='flex items-center'>
      <span className='mr-2 font-medium text-sm'>{visible ? value : "••••••••"}</span>
      <Button
        className='h-6 w-6'
        onClick={() => setVisible(!visible)}
        size='icon'
        title={visible ? `Ẩn ${label}` : `Hiện ${label}`}
        variant='ghost'
      >
        {visible ? <EyeOff className='h-3 w-3' /> : <Eye className='h-3 w-3' />}
      </Button>
      <CopyButton text={value} />
    </div>
  );
}

export function PersonalInfoPage() {
  const { userData, courseData, getData } = useInfoStore();

  useEffect(() => {
    getData();
  }, [getData]);

  if (!userData?.userId) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='text-muted-foreground text-sm'>Vui lòng mở popup Extension ở trang OUMac để đồng bộ dữ liệu.</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-6 md:flex-row'>
        <Card className='w-full md:w-1/3'>
          <CardHeader className='flex flex-col items-center pb-2 text-center'>
            <div className='mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-muted'>
              {userData.avatar ? (
                <img alt='Avatar' className='h-full w-full object-cover' height={96} src={userData.avatar} width={96} />
              ) : (
                <User className='h-12 w-12 text-muted-foreground' />
              )}
            </div>
            <CardTitle className='text-xl'>{userData.fullName}</CardTitle>
            <p className='text-muted-foreground text-sm'>{userData.userId}</p>
            <Badge className='mt-2' variant='secondary'>
              {userData.presenceStatus || "Đang học"}
            </Badge>
          </CardHeader>
          <CardContent className='space-y-4 pt-4'>
            <div className='flex items-center gap-3 text-sm'>
              <Mail className='h-4 w-4 text-muted-foreground' />
              <div className='flex items-center'>
                <span>{userData.email}</span>
                <CopyButton text={userData.email} />
              </div>
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <Phone className='h-4 w-4 text-muted-foreground' />
              <HiddenField label={_USER_LABEL_MAPPING.phone} value={userData.phone} />
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <MapPin className='h-4 w-4 text-muted-foreground' />
              <span className='line-clamp-2' title={userData.residentialAddress}>
                {userData.residentialAddress}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className='w-full space-y-6 md:w-2/3'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <User className='h-5 w-5 text-primary' /> Thông tin chung
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2'>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.dateOfBirth}</p>
                <p className='font-medium text-sm'>{userData.dateOfBirth}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.gender}</p>
                <p className='font-medium text-sm'>{userData.gender}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.identityNumber}</p>
                <HiddenField label={_USER_LABEL_MAPPING.identityNumber} value={userData.identityNumber} />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.placeOfBirth}</p>
                <p className='font-medium text-sm'>{userData.placeOfBirth}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.ethnicity}</p>
                <p className='font-medium text-sm'>{userData.ethnicity}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.religion}</p>
                <p className='font-medium text-sm'>{userData.religion}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_USER_LABEL_MAPPING.nationality}</p>
                <p className='font-medium text-sm'>{userData.nationality}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <GraduationCap className='h-5 w-5 text-primary' /> Khóa học
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2'>
              <div>
                <p className='text-muted-foreground text-xs'>{_COURSE_LABEL_MAPPING.major}</p>
                <p className='font-medium text-sm'>{courseData.major}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_COURSE_LABEL_MAPPING.faculty}</p>
                <p className='font-medium text-sm'>{courseData.faculty}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_COURSE_LABEL_MAPPING.classCode}</p>
                <p className='font-medium text-sm'>{courseData.classCode}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>{_COURSE_LABEL_MAPPING.academicYear}</p>
                <p className='font-medium text-sm'>{courseData.academicYear}</p>
              </div>
              <div className='sm:col-span-2'>
                <p className='text-muted-foreground text-xs'>{_COURSE_LABEL_MAPPING.degreeProgram}</p>
                <p className='font-medium text-sm'>{courseData.degreeProgram}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Thành tích & Khen thưởng</CardTitle>
        </CardHeader>
        <CardContent>
          {userData.awards && userData.awards.length > 0 ? (
            <div className='overflow-hidden rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên quyết định</TableHead>
                    <TableHead>Hình thức</TableHead>
                    <TableHead className='text-center'>Ngày khen thưởng</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userData.awards.map((award, index) => (
                    <TableRow key={`${award.decisionName}-${index}`}>
                      <TableCell className='font-medium'>{award.decisionName}</TableCell>
                      <TableCell>{award.formOfReward}</TableCell>
                      <TableCell className='text-center'>{award.decisionDate}</TableCell>
                      <TableCell>{award.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className='rounded-md border border-dashed py-6 text-center text-muted-foreground text-sm'>
              Chưa có dữ liệu khen thưởng.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
