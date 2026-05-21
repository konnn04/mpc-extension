import type { SemesterTuitionDetail, TuitionStatsType, TuitionSummaryEntry } from "@/types";

/** Items with course codes starting with "_" are non-credit (BHYT, adjustments, refunds). */
const isNonCreditItem = (code: string) => code.startsWith("_");

type CreditStats = { totalCredits: number; avgPerCredit: number; minPerCredit: number; maxPerCredit: number };

function collectRates(groups: SemesterTuitionDetail["receiptGroups"]): { credits: number; rates: number[] } {
  let credits = 0;
  const rates: number[] = [];
  for (const group of groups) {
    if (group.receiptType === "B") {
      continue;
    }
    for (const item of group.items) {
      if (isNonCreditItem(item.courseCode) || item.credits <= 0) {
        continue;
      }
      credits += item.credits;
      if (item.amount > 0) {
        rates.push(item.amount / item.credits);
      }
    }
  }
  return { credits, rates };
}

function computeCreditStats(details: Record<string, SemesterTuitionDetail>): CreditStats {
  let totalCredits = 0;
  const allRates: number[] = [];

  for (const detail of Object.values(details)) {
    const { credits, rates } = collectRates(detail.receiptGroups);
    totalCredits += credits;
    for (const r of rates) {
      allRates.push(r);
    }
  }
  return {
    totalCredits,
    avgPerCredit: allRates.length > 0 ? Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length) : 0,
    minPerCredit: allRates.length > 0 ? Math.round(Math.min(...allRates)) : 0,
    maxPerCredit: allRates.length > 0 ? Math.round(Math.max(...allRates)) : 0
  };
}

/** Compute aggregate statistics from tuition summary data and details. */
export function computeTuitionStats(
  summary: TuitionSummaryEntry[],
  details: Record<string, SemesterTuitionDetail>
): TuitionStatsType {
  const totalSpent = summary.reduce((acc, e) => acc + e.collected, 0);
  const totalDebt = summary.reduce((acc, e) => acc + e.debt, 0);
  const { totalCredits, avgPerCredit, minPerCredit, maxPerCredit } = computeCreditStats(details);
  const semesterCount = summary.length;
  const avgPerSemester = semesterCount > 0 ? Math.round(totalSpent / semesterCount) : 0;

  let mostExpensive = { name: "", amount: 0 };
  let cheapest = { name: "", amount: Number.POSITIVE_INFINITY };

  for (const entry of summary) {
    if (entry.collected > mostExpensive.amount) {
      mostExpensive = { name: entry.semesterName, amount: entry.collected };
    }
    if (entry.collected < cheapest.amount && entry.collected > 0) {
      cheapest = { name: entry.semesterName, amount: entry.collected };
    }
  }
  if (cheapest.amount === Number.POSITIVE_INFINITY) {
    cheapest = { name: "", amount: 0 };
  }

  return {
    totalSpent,
    totalDebt,
    semesterCount,
    avgPerSemester,
    avgPerCredit,
    minPerCredit,
    maxPerCredit,
    totalCredits,
    mostExpensiveSemester: mostExpensive,
    cheapestSemester: cheapest
  };
}

/** Format amount to VND with thousand separators. */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

/** Compact VND format: 1.2tr, 500k */
export function formatVNDCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const mils = amount / 1_000_000;
    return `${mils % 1 === 0 ? mils : mils.toFixed(1)}tr`;
  }
  if (amount >= 1000) {
    return `${Math.round(amount / 1000)}k`;
  }
  return `${amount}`;
}
