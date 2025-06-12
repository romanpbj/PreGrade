console.log("PreGrade content script loaded");

// Scrape request listener
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data?.type === "SCRAPE_TEXT_REQUEST") {
    const assignmentText = document.body.innerText.trim();
    window.postMessage({ type: "SCRAPE_TEXT_RESPONSE", assignmentText }, "*");
  }

  if (event.data?.type === "CLOSE_PREGRADE_PANEL") {
    const panel = document.getElementById("pregrade-sidebar");
    if (panel) {
      panel.style.transform = "translateX(100%)";
      document.body.style.marginRight = "0";

      setTimeout(() => {
        panel.remove();
        injectSidebar(); // reinject PreGrade button
      }, 300);
    }
  }
});

// Chrome runtime listener (fallback scraping)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SCRAPE_TEXT") {
    const assignmentText = document.body.innerText.trim();
    sendResponse({ assignmentText });
  }
});

function injectSidebar() {
  if (document.getElementById("pregrade-float-button")) return;

  // === Floating Button ===
  const button = document.createElement("div");
  button.id = "pregrade-float-button";
  button.style.cssText = `
    position: fixed;
    top: 40%;
    right: 0;
    z-index: 9999;
    background-color: #0267ab;
    border-radius: 8px 0 0 8px;
    height: 48px;
    width: 36px;
    padding: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    overflow: hidden;
    transition: width 0.25s ease;
    white-space: nowrap;
  `;

  const icon = document.createElement("img");
  icon.src = chrome.runtime.getURL("icons/icon128.png");
  icon.style.width = "32px";
  icon.style.height = "32px";
  icon.style.flexShrink = "0";
  button.appendChild(icon);

  const label = document.createElement("span");
  label.textContent = " PreGrade";
  label.style.color = "white";
  label.style.fontSize = "14px";
  label.style.fontWeight = "bold";
  label.style.marginLeft = "8px";
  label.style.opacity = "0";
  label.style.transition = "opacity 0.15s ease 0.1s";
  button.appendChild(label);

  button.addEventListener("mouseenter", () => {
    button.style.width = "100px";
    label.style.opacity = "1";
  });

  button.addEventListener("mouseleave", () => {
    button.style.width = "36px";
    label.style.opacity = "0";
  });

  button.addEventListener("click", () => {
    button.remove(); // hide button when panel opens

    const panel = document.createElement("div");
    panel.id = "pregrade-sidebar";
    panel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      height: 100%;
      width: 435px%;
      z-index: 9998;
      background-color: #0267ab;
      box-shadow: -2px 0 10px rgba(0,0,0,0.3);
      overflow-y: auto;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    document.body.appendChild(panel);

    setTimeout(() => {
      panel.style.transform = "translateX(0)";
      document.body.style.transition = "margin-right 0.3s ease";
      document.body.style.marginRight = "420px";
    }, 10);

    const existingScript = document.querySelector('script[src*="panelLoader.js"]');
    if (existingScript) existingScript.remove();

    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("assets/panelLoader.js") + `?t=${Date.now()}`; // cache-busting
    script.type = "module";
    document.body.appendChild(script);
  });

  document.body.appendChild(button);
}

// Inject only on Canvas assignment pages
if (window.location.href.includes("/assignments/")) {
  injectSidebar();
}