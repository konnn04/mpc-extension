# Bug: Cố vấn học tập — Simulation sai & target rank bất khả thi không báo

## File cần sửa

**Duy nhất 1 file**: `entrypoints/index/pages/ScorePlanPage/components/mascot-advisor.tsx`

## File tham khảo (chỉ đọc, KHÔNG sửa)

| File | Dùng để |
|------|---------|
| `utils/academic-compute.ts` | `computeSummary()` — tính GPA, bỏ qua `isIgnore` |
| `utils/score.ts` | `getScoreSummary()`, `isSameSubject()` |
| `constants/default.ts` | `_DEFAULT_ACADEMIC_RANKS`, `_DEFAULT_EXCELLENT_GPA_THRESHOLD` |
| `store/use-score-store.ts` | `scores`, `setScores()` |
| `types/point.ts` | `ScoreGroupType`, `ScoreRecordType` |

## Cách tái hiện bug

1. Mở ScorePlanPage, bấm mascot góc phải dưới → mở dialog Cố vấn học tập
2. Chọn target rank "🏆 Xuất sắc" (GPA ≥ 3.60)
3. Advisor hiện 5 môn, GPA dự kiến: 3.28 → **3.34 (Giỏi)**
4. Kỳ vọng: GPA dự kiến phải ≥ 3.60, hoặc nếu không đủ môn thì hiển thị cảnh báo rõ ràng

```
🏆 Xuất sắc
📚 5 môn đề xuất cải thiện
GPA dự kiến: 3.28 → 3.34 (Giỏi)     ← BUG
5 môn · 22 TC cần cải thiện
```

---

## Bug 1 (CHÍNH): Simulation thiếu A+ replacement semesters

**Vị trí**: `simulation` useMemo (khoảng dòng 124-150)

**Hiện trạng**:
```ts
const simulatedScores = scores.map((sem) => ({
  ...sem,
  data: sem.data.map((sub) => {
    const key = `${sub.code}-${sub.name}`;
    if (selectedKeys.has(key) && (sub.point.scale4 ?? 0) < 4.0) {
      return { ...sub, isIgnore: true };  // ← CHỈ ignore, KHÔNG thêm A+
    }
    return sub;
  })
}));
const simulatedSummary = getScoreSummary(simulatedScores, trainingSemesters);
```

**Vấn đề**: Simulation chỉ đánh dấu `isIgnore: true` lên môn cũ, nhưng không thêm semester mới chứa bản A+ như `applyQuickPlan` làm. Kết quả: GPA mô phỏng thấp hơn thực tế sau khi apply.

**Cách fix**: Simulation phải phản ánh chính xác những gì `applyQuickPlan` sẽ làm:
1. Mark old subjects as `isIgnore: true`
2. **Add new semester(s)** containing A+ replacements (giống hệt logic trong `applyQuickPlan` dòng ~190-210)

Sau đó chạy `getScoreSummary()` trên toàn bộ `[...newSemesters, ...updatedScores]`.

**Gợi ý code**:
```ts
const simulation = useMemo(() => {
  if (improvedSubjects.size === 0 || currentCredit === 0) return null;

  const selectedKeys = new Set(improvedSubjects);
  
  // Step 1: mark old subjects as ignored (giống applyQuickPlan)
  const updatedScores = scores.map((sem) => ({
    ...sem,
    data: sem.data.map((sub) => {
      const key = `${sub.code}-${sub.name}`;
      return selectedKeys.has(key) && (sub.point.scale4 ?? 0) < 4.0
        ? { ...sub, isIgnore: true }
        : sub;
    })
  }));

  // Step 2: build A+ replacement semesters (giống applyQuickPlan)
  const selected = analysis.lowSubjects.filter((s) => selectedKeys.has(`${s.code}-${s.name}`));
  const maxId = updatedScores.reduce((max, s) => Math.max(max, s.id), 0);
  const newSemesters = /* ... y hệt applyQuickPlan batches logic ... */;

  // Step 3: compute GPA on combined data
  const simulatedSummary = getScoreSummary([...newSemesters, ...updatedScores], trainingSemesters);

  // ... return như cũ
}, [...]);
```

---

## Bug 2: Không thông báo khi target rank bất khả thi

**Vị trí**: Sau khi build `suggestedSubjects` trong `analysis` useMemo (khoảng dòng 82-88)

**Hiện trạng**: Loop chạy hết toàn bộ `improvableSubjects` nhưng nếu vẫn không đạt target, không có message nào. User thấy 5 môn → tưởng chỉ có 5 môn khả dụng → không hiểu tại sao GPA dự kiến vẫn dưới target.

**Cách fix**: Sau khi `suggestedSubjects` được build xong, tính GPA tốt nhất có thể đạt nếu cải thiện TẤT CẢ `suggestedSubjects` (tức toàn bộ improvable subjects). Nếu vẫn dưới `targetGpa`, hiển thị warning:

```
⚠️ Chỉ có {n} môn khả dụng để cải thiện.
Tốt nhất đạt được: {bestGpa} ({bestRank}).
Không thể đạt {targetLabel} với dữ liệu hiện tại.
```

**Cần làm**:
1. Thêm `bestPossibleGpa` và `isTargetUnreachable` vào object return của `analysis`
2. Trong UI (sau phần danh sách môn đề xuất), thêm `<div>` cảnh báo khi `isTargetUnreachable === true`

**Công thức tính `bestPossibleGpa`**: Mô phỏng cải thiện TẤT CẢ `improvableSubjects` lên A+ (dùng logic giống Bug 1 đã fix: ignore old + add A+ semesters).

---

## Bug 3 (phụ): Reset `improvedSubjects` khi chọn rank khác

**Vị trí**: `onClick` handler của rank buttons (dòng ~340)

**Hiện trạng**: Khi bấm chọn 1 rank, `setImprovedSubjects(new Set())` → xóa hết selection. Nhưng `useEffect` (dòng ~170) sẽ auto-select lại từ `analysis.lowSubjects` → không mất gì cả.

**Không nghiêm trọng**, nhưng trong quá trình fix Bug 1 & 2, cần verify flow này vẫn hoạt động đúng: khi user chọn rank → `analysis.lowSubjects` (tức `suggestedSubjects`) thay đổi → `useEffect` trigger → auto-select tất cả môn được đề xuất.

---

## Yêu cầu chung

- **Chỉ sửa 1 file**: `mascot-advisor.tsx`
- Tuân thủ coding style của project (comment WHY not WHAT, dùng `Promise.all` cho parallel, v.v.)
- Sau khi sửa chạy: `pnpm compile` (type-check) — phải pass
- Sau khi sửa chạy: `pnpm ultracite:check` (lint) — phải pass
- Test thủ công: mở dialog, chọn "Xuất sắc", verify GPA dự kiến ≥ 3.60 (nếu đủ môn) hoặc hiện warning (nếu không đủ)
