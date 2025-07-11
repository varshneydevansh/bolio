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
    // Execute a function within the content script's context to start dictation.
    // content.js is now injected via manifest.json at document_start.
    chrome.scripting.executeScript({ 
      target: { tabId: tab.id, frameIds: [info.frameId] },
      function: () => {
        // This function runs in the content script's isolated world.
        // It calls a function that content.js should expose globally.
        if (typeof window.startRecognition === 'function') {
          window.startRecognition();
        } else {
          console.error("Bolio: startRecognition function not found in content script.");
        }
      }
    });
  }
});
