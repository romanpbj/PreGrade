import React from "react";
import { createRoot } from "react-dom/client";
import App from "./src/App.jsx";

// Clear existing content inside the panel before mounting
const mountPoint = document.getElementById("pregrade-sidebar");
if (mountPoint) {
  mountPoint.innerHTML = ""; // 💡 ensures clean mount
  const root = createRoot(mountPoint);
  root.render(<App />);
}