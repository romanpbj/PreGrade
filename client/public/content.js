console.log("Content script loaded");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SCRAPE_TEXT") {
    const assignmentText = document.body.innerText.trim();
    sendResponse({ assignmentText });
    return true;
  }
});