export function getBasicInfo(): { displayName: string; studentId: string; avatar: string } | null {
  try {
    const userText = document.querySelector<HTMLDivElement>(".user-text");
    if (!userText) {
      return null;
    }

    const span = userText.querySelector("span");
    const displayName = span?.textContent?.trim();
    if (!displayName) {
      return null;
    }

    const fullText = userText.textContent || "";
    const afterName = fullText.replace(span?.textContent || "", "").trim();
    const studentId = afterName.split(/\s+/).pop() || "";
    if (!(studentId && /^\d+$/.test(studentId))) {
      return null;
    }

    const avatarImg = document.querySelector<HTMLImageElement>("img.avatar");
    const avatar = avatarImg?.src || "";

    return { displayName, studentId, avatar };
  } catch {
    return null;
  }
}
