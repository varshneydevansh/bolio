// This script handles the options page logic.

document.addEventListener('DOMContentLoaded', () => {
  const languageSelect = document.getElementById('language');
  const continuousCheckbox = document.getElementById('continuous');
  const replaceTextCheckbox = document.getElementById('replaceText');
  const saveButton = document.getElementById('saveOptions');
  const statusDiv = document.getElementById('status');

  // Load saved options
  chrome.storage.sync.get(['bolioLanguage', 'bolioContinuous', 'bolioReplaceText'], (result) => {
    if (result.bolioLanguage) {
      languageSelect.value = result.bolioLanguage;
    }
    continuousCheckbox.checked = result.bolioContinuous || false;
    replaceTextCheckbox.checked = result.bolioReplaceText || false;
  });

  // Save options
  saveButton.addEventListener('click', () => {
    chrome.storage.sync.set({
      bolioLanguage: languageSelect.value,
      bolioContinuous: continuousCheckbox.checked,
      bolioReplaceText: replaceTextCheckbox.checked
    }, () => {
      statusDiv.textContent = 'Options saved!';
      setTimeout(() => { statusDiv.textContent = ''; }, 2000);
    });
  });
});
