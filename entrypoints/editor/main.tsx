import React from "react";
import ReactDOM from "react-dom/client";
import Editor from "./Editor.tsx";
import "@ant-design/v5-patch-for-react-19";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("editor")!).render(
  <React.StrictMode>
    <Editor />
  </React.StrictMode>
);
