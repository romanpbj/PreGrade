import { getAuth, GoogleAuthProvider, signInWithCredential } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDv-NguzVR_cQhZ4CCkvpFZhv5vpCl1CUw",
  authDomain: "pregrade-86e6c.firebaseapp.com",
  projectId: "pregrade-86e6c",
  storageBucket: "pregrade-86e6c.appspot.com",
  messagingSenderId: "192741889077",
  appId: "1:192741889077:web:f832e6fccb90baf4894d7c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GOOGLE_LOGIN") {
    const clientId = "192741889077-rhi505ic8nai5ink07s801ne80l26lgk.apps.googleusercontent.com";
    const redirectUri = chrome.identity.getRedirectURL();
    const scope = "profile email";
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (redirectUrl) => {
      if (chrome.runtime.lastError || !redirectUrl) {
        sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Redirect failed" });
        return;
      }

      const urlFragment = new URL(redirectUrl).hash.substring(1);
      const accessToken = new URLSearchParams(urlFragment).get('access_token');

      if (!accessToken) {
        sendResponse({ success: false, error: "No access token found" });
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(null, accessToken);
        const result = await signInWithCredential(auth, credential);
        sendResponse({ success: true, user: result.user });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });

    // Required because we're responding asynchronously
    return true;
  }
});