chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request.action === "disable" ||
    request.action === "enable" ||
    request.action === "single"
  ) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: request.action });
    });
  }
});
