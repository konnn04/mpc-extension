import { AwardType, CourseType, UserType } from "@/entrypoints/popup/InfoTab/type";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: table parsing is complex
const getUserData = () => {
  const appUserElement = document.querySelector("app-thongtin-user") as HTMLElement;

  const userInfoElement = appUserElement.querySelector(
    "app-thongtin-user > div:first-child > div.card-body"
  ) as HTMLElement;
  const courseInfoElement = appUserElement.querySelector(
    "app-thongtin-user > div:nth-child(2) > div > div > div.card-body"
  ) as HTMLElement;

  const userInfoValues: NodeListOf<HTMLElement> = userInfoElement.querySelectorAll(
    "div > .col > div .info-item > span:last-child"
  );

  const courseInfoValues: NodeListOf<HTMLElement> = courseInfoElement.querySelectorAll(
    ".row > div > div > div:last-child"
  );

  const avatarImg = document.querySelector("app-thongtin-user img, app-tinbaiviet-main img") as HTMLImageElement;
  const avatar = avatarImg?.src || "";

  const awards: AwardType[] = [];
  const cardHeaders = document.querySelectorAll(".card-header");
  for (const header of cardHeaders) {
    if ((header as HTMLElement).innerText.includes("Khen thưởng đạt được")) {
      const card = header.closest(".card");
      if (card) {
        const rows = card.querySelectorAll("tbody tr");
        for (const row of rows) {
          const cols = row.querySelectorAll("td");
          if (cols.length >= 4) {
            awards.push({
              decisionName: cols[0]?.innerText?.trim() || "",
              formOfReward: cols[1]?.innerText?.trim() || "",
              decisionDate: cols[2]?.innerText?.trim() || "",
              note: cols[3]?.innerText?.trim() || ""
            });
          }
        }
      }
      break;
    }
  }

  const userData: UserType = {
    userId: userInfoValues[0]?.innerText || "",
    fullName: userInfoValues[1]?.innerText || "",
    dateOfBirth: userInfoValues[2]?.innerText || "",
    gender: userInfoValues[3]?.innerText || "",
    presenceStatus: userInfoValues[4]?.innerText || "",
    phone: userInfoValues[5]?.innerText || "",
    identityNumber: userInfoValues[6]?.innerText || "",
    ethnicity: userInfoValues[7]?.innerText || "",
    religion: userInfoValues[8]?.innerText || "",
    placeOfBirth: userInfoValues[9]?.innerText || "",
    nationality: userInfoValues[10]?.innerText || "",
    email: userInfoValues[11]?.innerText || "",
    residentialAddress: userInfoValues[13]?.innerText || "",
    avatar,
    awards,
    updatedAt: new Date().toISOString()
  };

  const courseData: CourseType = {
    classCode: courseInfoValues[0]?.innerText || "",
    major: courseInfoValues[1]?.innerText || "",
    faculty: courseInfoValues[2]?.innerText || "",
    degreeProgram: courseInfoValues[3]?.innerText || "",
    academicYear: courseInfoValues[4]?.innerText || "",
    updatedAt: new Date().toISOString()
  };

  return { userData, courseData };
};

export { getUserData };
