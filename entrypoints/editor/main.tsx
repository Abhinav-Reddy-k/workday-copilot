import React from "react";
import ReactDOM from "react-dom/client";
import Editor from "./Editor.tsx";

ReactDOM.createRoot(document.getElementById("editor")!).render(
  <React.StrictMode>
    <Editor />
  </React.StrictMode>
);
