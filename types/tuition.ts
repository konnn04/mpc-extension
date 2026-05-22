export type TuitionSummaryEntry = {
  semesterName: string;
  grossAmount: number;
  discount: number;
  receivable: number;
  collected: number;
  debt: number;
};

export type TuitionReceiptItem = {
  courseCode: string;
  courseName: string;
  group: string;
  credits: number;
  amount: number;
};

export type TuitionReceiptGroup = {
  receiptLabel: string;
  receiptNumber: string;
  receiptType: "A" | "B";
  createdAt: string;
  contractDate?: string;
  linkedPaymentNumber?: string;
  items: TuitionReceiptItem[];
  subtotal: number;
};

export type PairedReceiptGroup = TuitionReceiptGroup & {
  linkedReceiptNumber?: string;
  linkedReceiptDate?: string;
};

export type SemesterTuitionDetail = {
  semesterName: string;
  receiptGroups: TuitionReceiptGroup[];
  bankAccount?: string;
};

export type TuitionStorageType = {
  summary: TuitionSummaryEntry[];
  details: Record<string, SemesterTuitionDetail>;
  updatedAt: string;
};

export type TuitionStatsType = {
  totalSpent: number;
  totalDebt: number;
  semesterCount: number;
  avgPerSemester: number;
  avgPerCredit: number;
  minPerCredit: number;
  maxPerCredit: number;
  totalCredits: number;
  mostExpensiveSemester: { name: string; amount: number };
  cheapestSemester: { name: string; amount: number };
};
