export default defineBackground(async () => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
