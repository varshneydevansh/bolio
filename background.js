// This is the background script for the extension.

// Create the context menu item.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "bolio-start-dictation",
    title: "Bolio: Start Dictation",
    contexts: ["editable"]
  });
});

// Listen for clicks on the context menu item.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "bolio-start-dictation") {
    // Inject the content script into the active tab.
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  }
});
