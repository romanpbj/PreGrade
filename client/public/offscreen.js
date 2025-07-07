const HOSTED_URL = "https://YOUR_HOSTED_DOMAIN/signInWithPopup.html"; // Replace YOUR_HOSTED_DOMAIN

const iframe = document.createElement("iframe");
iframe.src = HOSTED_URL;
document.documentElement.appendChild(iframe);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "firebase-auth") {
    function handleIframeMessage(event) {
      try {
        const data = JSON.parse(event.data);
        sendResponse(data);
        iframe.remove();
      } catch (error) {
        console.error("Failed to parse iframe message:", error);
      }
    }

    globalThis.addEventListener("message", handleIframeMessage, false);
    iframe.contentWindow.postMessage({ initAuth: true }, new URL(HOSTED_URL).origin);
    return true;
  }
});