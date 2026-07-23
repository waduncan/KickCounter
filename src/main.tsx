import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import packageJson from "../package.json";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <small className="app-version" aria-label={`Application version ${packageJson.version}`}>
      v{packageJson.version}
    </small>
  </StrictMode>,
);
