import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import {
  _DEFAULT_ACADEMIC_RANKS,
  _DEFAULT_GRADE_COLORS,
  _DEFAULT_TRAINING_RANKS,
  _EXPORT_COL_WIDTHS,
  _EXPORT_FILE_PREFIX,
  _EXPORT_SHEET_NAME,
  _MAX_SEMESTER_TERMS,
  _SEMESTER_SHORT_REGEX,
  _SEMESTER_TITLE_REGEX
} from "@/constants/default";
import { ScoreGroupType, ScoreRecordType } from "@/entrypoints/popup/PointTab/type";

const checkImproveSubject = (d: ScoreGroupType, map: Record<string, ScoreRecordType[]>) => {
  for (const item of d.data) {
    if (!map[item.code]) {
      map[item.code] = [];
    }
    map[item.code].push(item);
  }

  for (const items of Object.values(map)) {
    if (items.length <= 1) {
      continue;
    }

    let maxItem = items[0];

    for (const item of items) {
      const score = item.point?.scale10 ?? Number.NEGATIVE_INFINITY;
      const maxScore = maxItem.point?.scale10 ?? Number.NEGATIVE_INFINITY;
      if (score > maxScore) {
        maxItem = item;
      }
    }

    for (const item of items) {
      if (item !== maxItem) {
        item.isIgnore = true;
        item.isImproved = true;
      }
    }
  }
};

const updateIgnoreSubject = (data: ScoreGroupType[], ignoreList: string[]) => {
  const codeMap: Record<string, ScoreRecordType[]> = {};

  const newData = data.map((d) => {
    d.data = d.data.map((item) => {
      const isIgnore = ignoreList.some((i) => item.code.includes(i));
      item.isIgnore = isIgnore;
      return item;
    });

    // TODO: improve algorithm
    checkImproveSubject(d, codeMap);
    return d;
  });

  for (const d of newData) {
    d.data.sort((a, b) => {
      if (a.isIgnore) {
        return 1;
      }
      if (b.isIgnore) {
        return -1;
      }
      return 0;
    });
  }

  return newData;
};

const updateScoreAvg = (data: ScoreGroupType[]) => {
  const newData = data.map((d) => {
    const totalCredit = d.data.reduce((acc, curr) => {
      const isIgnoreCredit = curr.isIgnore || !curr.point.character || curr.point.character === "F";
      if (isIgnoreCredit) {
        return acc;
      }
      return acc + curr.credit;
    }, 0);

    const avg = d.data.reduce(
      (acc, curr) => {
        const point = curr.point;
        const credit = curr.credit;

        const isValidPoint =
          typeof credit === "number" &&
          typeof point.scale10 === "number" &&
          typeof point.scale4 === "number" &&
          !Number.isNaN(point.scale10) &&
          !Number.isNaN(point.scale4);

        if (!isValidPoint || curr.isIgnore) {
          return acc;
        }

        return {
          point: {
            scale10: acc.point.scale10 + point.scale10 * credit,
            scale4: acc.point.scale4 + point.scale4 * credit
          },
          credit: acc.credit + credit
        };
      },
      {
        point: {
          scale10: 0,
          scale4: 0
        },
        credit: 0
      }
    );

    d.totalCredit = totalCredit;
    d.avgPoint = {
      scale10: Number.parseFloat(String(avg.point.scale10 / avg.credit)) || null,
      scale4: Number.parseFloat(String(avg.point.scale4 / avg.credit)) || null
    };

    return d;
  });

  return newData;
};

const getScoreSummary = (data: ScoreGroupType[]) => {
  const totalCredit = data.reduce((acc, curr) => acc + curr.totalCredit, 0);

  let sumScale10 = 0;
  let sumScale4 = 0;
  let sumCredit = 0;

  for (const item of data) {
    for (const curr of item.data) {
      const { credit, point } = curr;

      if (
        curr.isIgnore ||
        typeof credit !== "number" ||
        typeof point.scale10 !== "number" ||
        typeof point.scale4 !== "number" ||
        Number.isNaN(credit) ||
        Number.isNaN(point.scale10) ||
        Number.isNaN(point.scale4)
      ) {
        continue;
      }

      sumScale10 += point.scale10 * credit;
      sumScale4 += point.scale4 * credit;
      sumCredit += credit;
    }
  }

  const { totalTrainingPoint, trainingPointCount } = data.reduce(
    (acc, curr) => {
      if (curr.trainingPoint !== null && curr.trainingPoint !== undefined) {
        return {
          totalTrainingPoint: acc.totalTrainingPoint + curr.trainingPoint,
          trainingPointCount: acc.trainingPointCount + 1
        };
      }
      return acc;
    },
    { totalTrainingPoint: 0, trainingPointCount: 0 }
  );

  return {
    semesterCount: data.length,
    totalCredit,
    totalSubject: data.reduce((acc, curr) => acc + curr.data.length, 0),
    gpa10: sumCredit > 0 ? +(sumScale10 / sumCredit) : 0,
    gpa4: sumCredit > 0 ? +(sumScale4 / sumCredit) : 0,
    avgTrainingPoint: trainingPointCount > 0 ? +(totalTrainingPoint / trainingPointCount) : 0
  };
};

const handleExportData = (data: ScoreGroupType[]) => {
  const worksheetData: (string | number)[][] = [];

  // Header
  worksheetData.push([
    "STT",
    "Học kỳ",
    "Mã môn học",
    "Tên môn học",
    "Số tín chỉ",
    "Điểm hệ 10",
    "Điểm hệ 4",
    "Xếp loại",
    "Ghi chú (Không tính GPA)"
  ]);

  let stt = 1;

  for (const semester of data) {
    for (const subject of semester.data) {
      worksheetData.push([
        stt,
        semester.title,
        subject.code,
        subject.name,
        subject.credit,
        subject.point.scale10 ?? "N/A",
        subject.point.scale4 ?? "N/A",
        subject.point.character ?? "N/A",
        subject.isIgnore ? "Không tính" : ""
      ]);
      stt += 1;
    }
  }

  const workbook = XLSXUtils.book_new();
  const worksheet = XLSXUtils.aoa_to_sheet(worksheetData);

  worksheet["!cols"] = _EXPORT_COL_WIDTHS.map((w) => ({ width: w }));

  XLSXUtils.book_append_sheet(workbook, worksheet, _EXPORT_SHEET_NAME);
  XLSXWriteFile(workbook, `${_EXPORT_FILE_PREFIX}_${new Date().toISOString()}.xlsx`);
};

const formatSemesterShort = (title: string): string => {
  const match = title.match(_SEMESTER_SHORT_REGEX);
  if (match) {
    return `HK${match[1]} ${match[2]}-${match[3]}`;
  }
  return title;
};

const GRADE_COLORS = _DEFAULT_GRADE_COLORS;

function getAcademicRank(gpa4: number) {
  const found = _DEFAULT_ACADEMIC_RANKS.find((r) => gpa4 >= r.minGpa4);
  return found?.rank ?? _DEFAULT_ACADEMIC_RANKS.at(-1)?.rank ?? "Kém";
}

function getNextSemesterName(currentName: string): string | null {
  const match = currentName.match(_SEMESTER_TITLE_REGEX);
  if (!match) {
    return null;
  }

  let term = Number.parseInt(match[1], 10);
  let yearStart = Number.parseInt(match[2], 10);
  let yearEnd = Number.parseInt(match[3], 10);

  if (term === _MAX_SEMESTER_TERMS) {
    term = 1;
    yearStart += 1;
    yearEnd += 1;
  } else {
    term += 1;
  }
  return `Học kỳ ${term} - Năm học ${yearStart} - ${yearEnd}`;
}

function getTrainingRank(point: number) {
  const found = _DEFAULT_TRAINING_RANKS.find((r) => point >= r.minPoint);
  return found ?? _DEFAULT_TRAINING_RANKS.at(-1) ?? _DEFAULT_TRAINING_RANKS[0];
}

export {
  updateIgnoreSubject,
  updateScoreAvg,
  getScoreSummary,
  handleExportData,
  formatSemesterShort,
  GRADE_COLORS,
  getAcademicRank,
  getNextSemesterName,
  getTrainingRank
};
