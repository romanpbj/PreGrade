console.log("✅ PreGrade content script loaded");

// Listen for messages from the page (React panel)
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type === "SCRAPE_TEXT_REQUEST") {
    const assignmentText = document.body.innerText.trim();
    window.postMessage({ type: "SCRAPE_TEXT_RESPONSE", assignmentText }, "*");
  }
});

// You can still keep chrome.runtime listeners too, if needed
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SCRAPE_TEXT") {
    const assignmentText = document.body.innerText.trim();
    sendResponse({ assignmentText });
  }
});

function injectSidebar() {
  if (document.getElementById("pregrade-float-button")) return;

  // Floating Button
  const button = document.createElement("div");
  button.id = "pregrade-float-button";
  button.style.cssText = `
    position: fixed;
    top: 40%;
    right: 0;
    z-index: 9999;
    background-color: #ff5722;
    border-radius: 8px 0 0 8px;
    padding: 12px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  `;

  const icon = document.createElement("img");
  icon.src = chrome.runtime.getURL("icons/icon128.png");
  icon.style.width = "24px";
  icon.style.height = "24px";
  button.appendChild(icon);

  document.body.appendChild(button);

  // Click → inject sidebar
  button.addEventListener("click", () => {
    const existing = document.getElementById("pregrade-sidebar");
    if (existing) {
      existing.remove();
      document.body.style.marginRight = "0";
      return;
    }

    const panel = document.createElement("div");
    panel.id = "pregrade-sidebar";
    panel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      height: 100%;
      width: 420px;
      z-index: 9999;
      background-color:  #0267ab;
      box-shadow: -2px 0 10px rgba(0,0,0,0.3);
      overflow-y: auto;
    `;
    document.body.appendChild(panel);

    document.body.style.transition = "margin-right 0.3s ease";
    document.body.style.marginRight = "420px";

    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("assets/panelLoader.js");
    script.type = "module";
    document.body.appendChild(script);
  });
}

if (window.location.href.includes("/assignments/")) {
  injectSidebar();
}