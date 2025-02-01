export default defineBackground(async () => {
  console.log("Hello background!", { id: browser.runtime.id });
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});
