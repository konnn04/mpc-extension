import {
  _GET_BASIC_INFO,
  _GET_CLASS_CALENDAR_DATA,
  _GET_CURRENT_URL,
  _GET_EXAM_CALENDAR_DATA,
  _GET_POINT_DATA,
  _GET_TUITION_DATA,
  _GET_USER_DATA,
  _NAVIGATE_TO_URL,
  _OPEN_NEW_TAB
} from "@/constants/chrome";
import { getBasicInfo } from "@/entrypoints/popup/scrapers/basic-info-scraper";
import { getCalendars, getExamCalendars } from "@/entrypoints/popup/scrapers/calendar-scraper";
import { getUserData } from "@/entrypoints/popup/scrapers/info-scraper";
import { getPointData } from "@/entrypoints/popup/scrapers/score-scraper";
import { getTuitionData } from "@/entrypoints/popup/scrapers/tuition-scraper";

export default defineBackground(() => {
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === _GET_CURRENT_URL) {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        sendResponse(tab.url);
      });
      return true;
    }

    if (msg.type === _OPEN_NEW_TAB) {
      browser.tabs.create({ url: msg.url });
      return true;
    }

    if (msg.type === _NAVIGATE_TO_URL) {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (!tab.id) {
          return;
        }

        const currentURL = tab.url || "";
        if (currentURL === msg.url) {
          return true;
        }

        browser.tabs.update(tab.id, { url: msg.url });
      });
      return true;
    }

    if (msg.type === _GET_POINT_DATA) {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (!tab.id) {
          return;
        }

        browser.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: getPointData
          })
          .then((results) => {
            const data = results[0].result;
            sendResponse(data);
          });
      });
      return true;
    }

    if (msg.type === _GET_USER_DATA) {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (!tab.id) {
          return;
        }

        browser.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: getUserData
          })
          .then((results) => {
            const data = results[0].result;
            sendResponse(data);
          });
      });
      return true;
    }

    if (msg.type === _GET_BASIC_INFO) {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (!tab?.id) {
          sendResponse(null);
          return;
        }
        browser.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: getBasicInfo
          })
          .then((results) => {
            sendResponse(results[0].result);
          });
      });
      return true;
    }

    if (msg.type === _GET_CLASS_CALENDAR_DATA) {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (!tab.id) {
          sendResponse({ error: "Không tìm thấy tab hiện tại" });
          return;
        }

        browser.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: getCalendars
          })
          .then((results) => {
            const data = results[0].result;
            sendResponse(data);
          })
          .catch((error) => {
            console.error("Error executing getCalendars:", error);
            sendResponse({ error: error.message });
          });
      });
      return true;
    }

    if (msg.type === _GET_EXAM_CALENDAR_DATA) {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (!tab.id) {
          sendResponse({ error: "Không tìm thấy tab hiện tại" });
          return;
        }

        browser.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: getExamCalendars
          })
          .then((results) => {
            const data = results[0].result;
            sendResponse(data);
          })
          .catch((error) => {
            console.error("Error executing getExamCalendars:", error);
            sendResponse({ error: error.message });
          });
      });
      return true;
    }

    if (msg.type === _GET_TUITION_DATA) {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (!tab.id) {
          sendResponse({ error: "Không tìm thấy tab hiện tại" });
          return;
        }

        browser.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: getTuitionData
          })
          .then((results) => {
            const data = results[0].result;
            sendResponse(data);
          })
          .catch((error) => {
            console.error("Error executing getTuitionData:", error);
            sendResponse({ error: error.message });
          });
      });
      return true;
    }

    return false;
  });
});
