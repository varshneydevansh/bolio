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
    // First, ensure content.js is injected into the tab and frame.
    // This will only inject if it hasn't been injected already in this frame.
    chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [info.frameId] },
      files: ["content.js"]
    }, () => {
      // After content.js is ensured to be loaded, execute a function within its context
      // to start the dictation. We pass the frameId so content.js knows which frame
      // the context menu was clicked in.
      chrome.scripting.executeScript({ 
        target: { tabId: tab.id, frameIds: [info.frameId] },
        function: () => {
          // This function runs in the content script's isolated world.
          // It calls a function that content.js should expose globally.
          if (typeof window.startBolioDictation === 'function') {
            window.startBolioDictation();
          } else {
            console.error("Bolio: startBolioDictation function not found in content script.");
          }
        }
      });
    });
  }
});
