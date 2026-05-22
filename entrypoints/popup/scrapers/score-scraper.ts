import type { PointCharacterType, ScoreGroupType } from "@/types";

const getPointData = () => {
  function parseOverviewRow(r: Element, group: ScoreGroupType): void {
    const titleField = (r.querySelector("td:first-child") as HTMLElement)?.innerText.trim();
    const valueField = (r.querySelector("td:last-child") as HTMLElement)?.innerText.trim();
    if (!(titleField && valueField)) {
      return;
    }

    if (titleField.includes("Điểm rèn luyện học kỳ")) {
      group.trainingPoint = Number.parseInt(valueField, 10) || null;
    } else if (titleField.includes("Điểm trung bình học kỳ hệ 4")) {
      group.avgPoint.scale4 = Number.parseFloat(valueField) || 0;
    } else if (titleField.includes("Điểm trung bình học kỳ hệ 10")) {
      group.avgPoint.scale10 = Number.parseFloat(valueField) || 0;
    } else if (titleField.includes("Số tín chỉ đạt học kỳ")) {
      group.totalCredit = Number.parseInt(valueField, 10) || 0;
    }
  }

  function parseDataRow(columns: NodeListOf<HTMLElement>, data: ScoreGroupType[]): void {
    const character = columns[11].innerText as PointCharacterType;
    const scale10Raw = columns[9].innerText.trim();
    const scale4Raw = columns[10].innerText.trim();
    data.at(-1)?.data.push({
      code: columns[1].innerText,
      name: columns[3].innerText,
      credit: Number.parseFloat(columns[4].innerText) || 0,
      point: {
        scale10: scale10Raw ? Number.parseFloat(scale10Raw) : 0,
        scale4: scale4Raw ? Number.parseFloat(scale4Raw) : 0,
        character
      }
    });
  }

  const tableRows = document.querySelectorAll("table#excel-table > tbody > tr");
  const data: ScoreGroupType[] = [];

  for (const [index, row] of Array.from(tableRows).entries()) {
    const columns = row.querySelectorAll("td") as NodeListOf<HTMLElement>;
    const isHead = !row.classList.contains("bg-white");

    if (isHead) {
      data.push({
        id: index,
        title: columns[0].innerText,
        data: [],
        totalCredit: 0,
        trainingPoint: null,
        avgPoint: { scale10: 0, scale4: 0 }
      });
      continue;
    }

    if (row.classList.contains("table-primary")) {
      const lastGroup = data.at(-1);
      if (lastGroup) {
        const overviewRows = row.querySelectorAll(".row table:first-child tr");
        for (const r of overviewRows) {
          parseOverviewRow(r, lastGroup);
        }
      }
    } else {
      parseDataRow(columns, data);
    }
  }

  return data;
};

export { getPointData };
