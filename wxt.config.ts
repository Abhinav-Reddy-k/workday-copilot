import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Workday Copilot",
    description:
      "An AI-powered assistant that automatically fills out job applications on Workday sites.",
    version: "1.0.0",
    permissions: ["storage", "activeTab", "downloads"],
    action: {
      default_title: "WXT",
    },
  },
});
