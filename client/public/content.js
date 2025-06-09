console.log("PreGrade content script loaded");

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type === "SCRAPE_TEXT_REQUEST") {
    const assignmentText = document.body.innerText.trim();
    window.postMessage({ type: "SCRAPE_TEXT_RESPONSE", assignmentText }, "*");
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SCRAPE_TEXT") {
    const assignmentText = document.body.innerText.trim();
    sendResponse({ assignmentText });
  }
});

function injectSidebar() {
  if (document.getElementById("pregrade-float-button")) return;

  // === Create Floating Button ===
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

  // === Click opens panel and removes button ===
  button.addEventListener("click", () => {
    button.remove()

    // Create panel
    const panel = document.createElement("div");
    panel.id = "pregrade-sidebar";
    panel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      height: 100%;
      width: 430px;
      z-index: 9998;
      background-color: #0267ab;
      box-shadow: -2px 0 10px rgba(0,0,0,0.3);
      overflow-y: auto;
      overflow-x: hidden;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    document.body.appendChild(panel);

    setTimeout(() => {
      panel.style.transform = "translateX(0)";
      document.body.style.transition = "margin-right 0.3s ease";
      document.body.style.marginRight = "420px";
    }, 10);

    // Inject panelLoader.js once
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("assets/panelLoader.js");
    script.type = "module";
    document.body.appendChild(script);

    // Create close ❌ button
    const closeBtn = document.createElement("div");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      font-size: 18px;
      color: white;
      background-color: rgba(0,0,0,0.2);
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      z-index: 9999;
    `;
    closeBtn.title = "Close PreGrade";
    panel.appendChild(closeBtn);

    closeBtn.addEventListener("click", () => {
      panel.style.transform = "translateX(100%)";
      document.body.style.marginRight = "0";

      setTimeout(() => {
        panel.remove();
        // Re-inject the toggle button
        injectSidebar();
      }, 300);
    });
  });

  document.body.appendChild(button);
}

if (window.location.href.includes("/assignments/")) {
  injectSidebar();
}