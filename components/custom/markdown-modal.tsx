import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type MarkdownModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  markdownContent: string;
};

export function MarkdownModal({ title, isOpen, onClose, markdownContent }: MarkdownModalProps) {
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className='flex max-h-[85vh] max-w-2xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className='flex-1 overflow-x-hidden px-6 py-4'>
          <div className='prose prose-sm dark:prose-invert wrap-break-word max-w-none pb-4 [&_a]:break-all [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto'>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent || "Đang cập nhật nội dung..."}</ReactMarkdown>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
