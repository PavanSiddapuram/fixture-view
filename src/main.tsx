import { createRoot } from "react-dom/client";
import "./three-bvh-setup";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
