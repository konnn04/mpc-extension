import { Download, InfoIcon, Landmark } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { _DEFAULT_IGNORE_SUBJECT_DATA } from "@/constants/default";
import { useTuitionStore } from "@/store/use-tuition-store";
import type { SemesterTuitionDetail } from "@/types";
import { computeTuitionStats } from "@/utils/tuition-compute";
import { handleExportTuitionData } from "@/utils/tuition-export";
import { flattenDetails } from "./components/allitemstable";
import { CreditCostChart } from "./components/creditcostchart";
import { DetailSection } from "./components/detailsection";
import { TuitionStatCards } from "./components/statcards";
import { TuitionBarChart } from "./components/tuitionbarchart";

const isIgnoredForCredit = (code: string) =>
  code.startsWith("_") || _DEFAULT_IGNORE_SUBJECT_DATA.some((p) => code.includes(p));

type SortKey = "courseCode" | "courseName" | "credits" | "amount" | "semesterName";
type SortDir = "asc" | "desc";

function buildCreditCostData(
  summary: { semesterName: string }[],
  details: Record<string, SemesterTuitionDetail>
): { name: string; avg: number; min: number; max: number }[] {
  const result: { name: string; avg: number; min: number; max: number }[] = [];
  for (const entry of summary) {
    const detail = details[entry.semesterName];
    if (!detail) {
      continue;
    }
    const rates: number[] = [];
    for (const group of detail.receiptGroups) {
      if (group.receiptType === "B") {
        continue;
      }
      for (const item of group.items) {
        if (isIgnoredForCredit(item.courseCode) || !(item.credits > 0 && item.amount > 0)) {
          continue;
        }
        rates.push(item.amount / item.credits);
      }
    }
    if (rates.length > 0) {
      result.push({
        name: entry.semesterName.replace("Học kỳ ", "HK").replace(" - Năm học ", " "),
        avg: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length),
        min: Math.round(Math.min(...rates)),
        max: Math.round(Math.max(...rates))
      });
    }
  }
  return result;
}

export function TuitionPage() {
  const summary = useTuitionStore((s) => s.summary);
  const details = useTuitionStore((s) => s.details);
  const lastUpdate = useTuitionStore((s) => s.lastUpdate);

  const [viewMode, setViewMode] = useState<"grouped" | "all">("grouped");
  const [categoryFilter, setCategoryFilter] = useState<string>("tất cả");
  const [showNonCredit, setShowNonCredit] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("courseCode");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const stats = useMemo(() => computeTuitionStats(summary, details), [summary, details]);
  const hasData = summary.length > 0;

  const allItems = useMemo(() => flattenDetails(details, categoryFilter), [details, categoryFilter]);
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return allItems;
    }
    const q = searchQuery.toLowerCase();
    return allItems.filter((i) => i.courseCode.toLowerCase().includes(q) || i.courseName.toLowerCase().includes(q));
  }, [allItems, searchQuery]);

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? (Number(va) || 0) - (Number(vb) || 0) : (Number(vb) || 0) - (Number(va) || 0);
    });
    return sorted;
  }, [filteredItems, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const barData = useMemo(() => {
    return summary.map((entry) => ({
      name: entry.semesterName.replace("Học kỳ ", "HK").replace(" - Năm học ", " "),
      daThu: entry.collected,
      conNo: entry.debt
    }));
  }, [summary]);

  const creditCostLineData = useMemo(() => buildCreditCostData(summary, details), [summary, details]);

  if (!hasData) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4'>
        <div className='flex h-20 w-20 items-center justify-center rounded-full bg-muted'>
          <Landmark className='h-10 w-10 text-muted-foreground' />
        </div>
        <div className='text-center'>
          <h2 className='font-semibold text-lg'>Chưa có dữ liệu học phí</h2>
          <p className='mt-1 max-w-md text-muted-foreground text-sm'>
            Mở popup extension khi đang ở trang học phí trên cổng tiện ích sinh viên để nhập dữ liệu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <div className='flex items-center justify-between'>
          <h1 className='flex items-center gap-2 font-bold text-2xl tracking-tight'>
            Học phí
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className='h-4 w-4 cursor-help text-muted-foreground' />
              </TooltipTrigger>
              <TooltipContent side='right'>
                <p className='max-w-64 text-xs'>
                  Dữ liệu được thu thập tự động từ cổng tiện ích sinh viên. Các số liệu chỉ mang tính tương đối, có thể
                  không chính xác tuyệt đối do cách phân loại và tính toán của extension.
                </p>
              </TooltipContent>
            </Tooltip>
          </h1>
          <Button onClick={() => handleExportTuitionData(summary, details)} size='sm' variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            Xuất Excel
          </Button>
        </div>
        {lastUpdate && (
          <p className='mt-1 text-muted-foreground text-sm'>
            Cập nhật lần cuối:{" "}
            {lastUpdate.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        )}
      </div>

      <TuitionStatCards stats={stats} />

      <div className='grid gap-6 lg:grid-cols-2'>
        <TuitionBarChart barData={barData} hasDebt={stats.totalDebt > 0} />
        <CreditCostChart data={creditCostLineData} />
      </div>

      <DetailSection
        categoryFilter={categoryFilter}
        details={details}
        handleSort={handleSort}
        searchQuery={searchQuery}
        setCategoryFilter={setCategoryFilter}
        setSearchQuery={setSearchQuery}
        setShowNonCredit={setShowNonCredit}
        setViewMode={setViewMode}
        showNonCredit={showNonCredit}
        sortDir={sortDir}
        sortedItems={sortedItems}
        sortKey={sortKey}
        summary={summary}
        viewMode={viewMode}
      />
    </div>
  );
}
