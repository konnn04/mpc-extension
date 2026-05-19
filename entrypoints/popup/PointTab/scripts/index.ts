import { PointCharacterType, ScoreGroupType } from "../type";

const getPointData = () => {
  const tableRows = document.querySelectorAll("table#excel-table > tbody > tr");

  const data: ScoreGroupType[] = [];

  Array.from(tableRows).forEach((row, index) => {
    const columns = row.querySelectorAll("td");

    const isHead = !row.classList.contains("bg-white");

    if (isHead) {
      data.push({
        id: index,
        title: columns[0].innerText,
        data: [],
        totalCredit: 0,
        trainingPoint: null,
        avgPoint: {
          scale10: 0,
          scale4: 0
        }
      });
    }

    if (!isHead) {
      const isOverviewRow = row.classList.contains("table-primary");

      if (isOverviewRow) {
        const overviewE = row.querySelector(".row table:first-child tr:nth-child(3) td:last-child") as HTMLElement;
        const trainingPoint = Number.parseInt(overviewE.innerText, 10);

        const lastGroup = data.at(-1);
        if (lastGroup) {
          lastGroup.trainingPoint = trainingPoint;
        }
      } else {
        const character = columns[11].innerText as PointCharacterType;

        data.at(-1)?.data.push({
          code: columns[1].innerText,
          name: columns[3].innerText,
          credit: Number.parseFloat(columns[4].innerText) || 0,
          point: {
            scale10: Number.parseFloat(columns[9].innerText),
            scale4: Number.parseFloat(columns[10].innerText),
            character
          }
        });
      }
    }
  });

  return data;
};

export { getPointData };
