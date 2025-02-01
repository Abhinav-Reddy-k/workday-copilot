import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Workday Co-pilot",
    permissions: ["storage", "activeTab"],
    action: {
      default_title: "WXT",
    },
  },
});
