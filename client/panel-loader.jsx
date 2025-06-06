import { createRoot } from "react-dom/client";
import App from "./src/App.jsx";

const mountPoint = document.getElementById("pregrade-sidebar");
if (mountPoint) {
  const root = createRoot(mountPoint);
  root.render(<App />);
}