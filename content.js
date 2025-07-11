console.log("Bolio: content.js loaded.");

(function() {
  let currentActiveElement = null; // To keep track of the element being dictated into
  let recognition = null; // Global recognition object
  let bolioUIContainer = null; // Global reference to the UI container
  let floatingIcon = null; // Global reference to the floating icon
  let killButton = null; // Global reference to the kill button
  let modeToggleButton = null; // Global reference to the mode toggle button
  let isContinuousMode = false; // To keep track of the current dictation mode
  let lastInterimResult = ''; // To store the last interim result for removal
  let currentFinalTranscript = ''; // To accumulate final results
  let initialInputValue = ''; // To store the initial value of the input field

  // Function to show a status notification on the page.
  function showStatus(message, isError = false, targetElement = null) {
    // Remove any existing indicator
    const existingIndicator = document.getElementById("bolio-status-indicator");
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Create the indicator element
    const indicator = document.createElement("div");
    indicator.id = "bolio-status-indicator";
    indicator.textContent = message;
    indicator.className = "bolio-status-indicator"; // Base class
    if (isError) {
      indicator.classList.add("bolio-error-indicator");
    }

    document.body.appendChild(indicator);

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      indicator.style.top = `${rect.top + window.scrollY - indicator.offsetHeight - 5}px`;
      indicator.style.left = `${rect.left + window.scrollX}px`;
    } else {
      // Fallback to fixed position if no target element
      indicator.style.bottom = "20px";
      indicator.style.right = "20px";
      indicator.style.position = "fixed";
    }

    // Fade out and remove after a few seconds, unless it's an error or the "Listening..." message
    if (!isError && message !== "Listening...") {
      setTimeout(() => {
        indicator.style.opacity = "0";
        setTimeout(() => indicator.remove(), 300); // Remove from DOM after transition
      }, 2000);
    }
  }

  // Function to stop recognition and clean up
  const stopRecognition = () => {
    if (recognition) {
      recognition.onend = null; // Crucial: Prevent onend from restarting recognition
      recognition.onerror = null; // Prevent onerror from showing error after manual stop
      recognition.stop();
      console.log("Bolio: Speech recognition stopped.");
    }
    document.removeEventListener("keydown", handleEsc);
    if (currentActiveElement) {
      currentActiveElement.classList.remove('bolio-active-input');
    }
    const indicator = document.getElementById("bolio-status-indicator");
    if (indicator) {
        indicator.style.opacity = "0";
        setTimeout(() => indicator.remove(), 300);
    }
    // Do NOT call hideBolioUI here. It will be called by focusout/click listeners.
    lastInterimResult = ''; // Reset interim result
    currentFinalTranscript = ''; // Reset final transcript
    initialInputValue = ''; // Reset initial input value
  };

  // Handle the Escape key to stop listening
  const handleEsc = (event) => {
    if (event.key === "Escape") {
      stopRecognition();
    }
  };

  // Function to create the main UI container
  function createBolioUIContainer() {
    if (!bolioUIContainer) {
      bolioUIContainer = document.createElement("div");
      bolioUIContainer.id = "bolio-ui-container";
      document.body.appendChild(bolioUIContainer);
      console.log("Bolio: UI Container created.");
    }
  }

  // Function to hide all Bolio UI elements
  function hideBolioUI() {
    if (bolioUIContainer) {
      bolioUIContainer.remove();
      bolioUIContainer = null;
      floatingIcon = null;
      killButton = null;
      modeToggleButton = null;
      console.log("Bolio: UI Container and elements removed.");
    }
  }

  // Function to create and position the floating icon
  function createFloatingIcon(targetElement) {
    console.log("Bolio: createFloatingIcon called with target:", targetElement);
    if (!targetElement) {
      console.log("Bolio: createFloatingIcon: targetElement is null.");
      return; // Ensure target element exists
    }

    createBolioUIContainer(); // Ensure container exists

    if (!floatingIcon) {
      floatingIcon = document.createElement("div");
      floatingIcon.id = "bolio-floating-icon";
      floatingIcon.className = "bolio-floating-icon";
      floatingIcon.textContent = "Mic"; // Use text placeholder
      bolioUIContainer.appendChild(floatingIcon);
      floatingIcon.addEventListener('click', startBolioDictation);
      console.log("Bolio: Floating icon element created and appended.");
    }

    // Position the icon near the target element (bottom right or bottom left)
    const rect = targetElement.getBoundingClientRect();
    const iconWidth = floatingIcon.offsetWidth;
    const iconHeight = floatingIcon.offsetHeight;
    const padding = 5; // Padding from the element's edge

    let top = rect.bottom + window.scrollY + padding;
    let left = rect.left + window.scrollX + rect.width - iconWidth - padding;

    // Adjust position if it goes off-screen to the right
    if (left + iconWidth > window.innerWidth + window.scrollX) {
      left = window.innerWidth + window.scrollX - iconWidth - padding;
    }

    // Adjust position if it goes off-screen to the left
    if (left < window.scrollX) {
      left = rect.left + window.scrollX + padding;
    }

    // Adjust position if it goes off-screen to the bottom
    if (top + iconHeight > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - iconHeight - padding;
    }

    floatingIcon.style.top = `${top}px`;
    floatingIcon.style.left = `${left}px`;

    console.log(`Bolio: Floating icon positioned at top: ${top}, left: ${left}.`);
  }

  // Function to create and position the kill button
  function createKillButton() {
    if (!bolioUIContainer) return; // Ensure container exists

    if (!killButton) {
      killButton = document.createElement("div");
      killButton.id = "bolio-kill-button";
      killButton.className = "bolio-kill-button";
      killButton.textContent = "X";
      bolioUIContainer.appendChild(killButton);
      killButton.addEventListener('click', stopRecognition);
      console.log("Bolio: Kill button created.");
    }

    // Position the kill button relative to the floating icon
    if (floatingIcon) {
      const iconRect = floatingIcon.getBoundingClientRect();
      killButton.style.top = `${iconRect.top + window.scrollY - (killButton.offsetHeight / 2)}px`;
      killButton.style.left = `${iconRect.left + window.scrollX + iconRect.width - (killButton.offsetWidth / 2)}px`;
    }
  }

  // Function to create and position the mode toggle button
  function createModeToggleButton() {
    if (!bolioUIContainer) return; // Ensure container exists

    if (!modeToggleButton) {
      modeToggleButton = document.createElement("div");
      modeToggleButton.id = "bolio-mode-toggle";
      modeToggleButton.className = "bolio-mode-toggle";
      bolioUIContainer.appendChild(modeToggleButton);
      modeToggleButton.addEventListener('click', toggleContinuousMode);
      console.log("Bolio: Mode toggle button created.");
    }

    updateModeToggleButtonUI(); // Set initial text and class

    // Position the mode toggle button relative to the floating icon
    if (floatingIcon) {
      const iconRect = floatingIcon.getBoundingClientRect();
      modeToggleButton.style.top = `${iconRect.top + window.scrollY - (modeToggleButton.offsetHeight / 2)}px`;
      modeToggleButton.style.left = `${iconRect.left + window.scrollX - (modeToggleButton.offsetWidth / 2)}px`;
    }
  }

  // Function to remove the mode toggle button
  function removeModeToggleButton() {
    if (modeToggleButton) {
      modeToggleButton.removeEventListener('click', toggleContinuousMode);
      modeToggleButton.remove();
      modeToggleButton = null;
    }
  }

  // Function to update the UI of the mode toggle button
  function updateModeToggleButtonUI() {
    if (modeToggleButton) {
      modeToggleButton.textContent = isContinuousMode ? "C" : "S"; // C for Continuous, S for Simple
      if (isContinuousMode) {
        modeToggleButton.classList.add("continuous");
      } else {
        modeToggleButton.classList.remove("continuous");
      }
    }
  }

  // Function to toggle continuous mode
  function toggleContinuousMode() {
    isContinuousMode = !isContinuousMode;
    chrome.storage.sync.set({ bolioContinuous: isContinuousMode }, () => {
      updateModeToggleButtonUI();
      // If recognition is active, restart it with the new mode
      if (recognition && recognition.listening) {
        stopRecognition();
        startBolioDictation();
      }
    });
  }

  // Main function to start dictation
  window.startBolioDictation = () => {
    // Stop any existing recognition first
    stopRecognition();

    // Check if the browser supports the Web Speech API.
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      showStatus("Sorry, your browser doesn't support the Web Speech API.", true);
      return;
    }

    // Inject the stylesheet if not already present
    if (!document.getElementById('bolio-styles')) {
      const link = document.createElement("link");
      link.id = 'bolio-styles';
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = chrome.runtime.getURL("styles.css");
      document.head.appendChild(link);
    }

    // Load user options before starting recognition
    chrome.storage.sync.get(['bolioLanguage', 'bolioContinuous', 'bolioReplaceText'], (options) => {
      isContinuousMode = options.bolioContinuous || false; // Set initial mode from options

      recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = isContinuousMode;
      recognition.interimResults = true; // Always true for better interim handling
      recognition.lang = options.bolioLanguage || 'en-US'; // Default to English US

      currentFinalTranscript = ''; // Reset for new dictation session
      lastInterimResult = ''; // Reset for new dictation session

      // Store the element that initiated the dictation
      currentActiveElement = document.activeElement;
      if (currentActiveElement) {
        currentActiveElement.classList.add('bolio-active-input');
        createFloatingIcon(currentActiveElement); // Create and position the floating icon
        createModeToggleButton(); // Create the mode toggle button
        if (isContinuousMode) {
          createKillButton(); // Create kill button if continuous dictation is enabled
        }

        // Store the initial value of the input field
        if (currentActiveElement.tagName === "INPUT" || currentActiveElement.tagName === "TEXTAREA") {
            initialInputValue = currentActiveElement.value;
        } else if (currentActiveElement.isContentEditable) {
            initialInputValue = currentActiveElement.textContent;
        } else if (currentActiveElement.tagName === "GR-APP") {
            let editableChild = currentActiveElement.querySelector('input, textarea, [contenteditable="true"]');
            if (editableChild) {
                initialInputValue = editableChild.value || editableChild.textContent;
            } else {
                initialInputValue = currentActiveElement.textContent;
            }
        }

      } else {
        showStatus("No active text field found.", true);
        return;
      }

      document.addEventListener("keydown", handleEsc);

      recognition.onstart = () => {
        showStatus("Listening...", false, currentActiveElement);
        lastInterimResult = ''; // Reset on start
        currentFinalTranscript = ''; // Reset on start
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let newFinalSegment = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinalSegment += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Update currentFinalTranscript with new final segments
        currentFinalTranscript += newFinalSegment;

        // Get the current value of the active element
        let elementToModify = currentActiveElement;
        let isGrAppChild = false;
        if (currentActiveElement.tagName === "GR-APP") {
            let editableChild = currentActiveElement.querySelector('input, textarea, [contenteditable="true"]');
            if (editableChild) {
                elementToModify = editableChild;
                isGrAppChild = true;
            }
        }

        let currentContent = '';
        if (elementToModify.tagName === "INPUT" || elementToModify.tagName === "TEXTAREA") {
            currentContent = elementToModify.value;
        } else if (elementToModify.isContentEditable) {
            currentContent = elementToModify.textContent;
        } else {
            // Fallback for gr-app if no editable child or other unknown elements
            currentContent = elementToModify.textContent;
        }

        // Remove the previously inserted interim result from the current content
        // This is crucial to prevent repetition
        if (currentContent.endsWith(lastInterimResult)) {
            currentContent = currentContent.substring(0, currentContent.length - lastInterimResult.length);
        }

        // Determine the text to be inserted
        let textToSet = '';
        if (options.bolioReplaceText) {
            // If replace, start fresh with only the current dictation
            textToSet = currentFinalTranscript + interimTranscript;
        } else {
            // If append, add new final and interim to the existing content (after removing old interim)
            textToSet = currentContent + newFinalSegment + interimTranscript;
        }

        // Only insert if the original active element is still focused or is the current active element
        if (document.activeElement === currentActiveElement || (currentActiveElement && currentActiveElement.contains(document.activeElement))) {
          console.log("Bolio: Attempting to insert text into:", currentActiveElement);
          console.log("Bolio: Current active element tagName:", currentActiveElement.tagName);
          console.log("Bolio: Current active element isContentEditable:", currentActiveElement.isContentEditable);
          console.log("Bolio: Text to set:", textToSet);

          if (elementToModify.tagName === "INPUT" || elementToModify.tagName === "TEXTAREA") {
              elementToModify.value = textToSet;
              // Maintain cursor position for continuous input
              const newCursorPos = textToSet.length;
              elementToModify.setSelectionRange(newCursorPos, newCursorPos);
          } else if (elementToModify.isContentEditable) {
              elementToModify.textContent = textToSet;
              // Move cursor to the end for contenteditable
              const selection = window.getSelection();
              const range = document.createRange();
              range.selectNodeContents(elementToModify);
              range.collapse(false); // Collapse to the end
              selection.removeAllRanges();
              selection.addRange(range);
          } else {
              // Fallback for gr-app or other elements if direct value/textContent doesn't work
              elementToModify.textContent = textToSet;
          }

          // Dispatch events
          if (elementToModify.tagName === "INPUT" || elementToModify.tagName === "TEXTAREA" || elementToModify.isContentEditable || isGrAppChild) {
              elementToModify.dispatchEvent(new Event('input', { bubbles: true }));
              elementToModify.dispatchEvent(new Event('change', { bubbles: true })); // Change event for some frameworks
          }
          showStatus("Text inserted!", false, currentActiveElement);
        } else {
          // If the active element changed, don't insert text and show a warning
          showStatus("Text field lost focus. Dictation stopped.", true);
          stopRecognition();
          return; // Exit early
        }

        lastInterimResult = interimTranscript; // Store current interim result for next iteration

        // If not continuous, stop after first final result
        if (!isContinuousMode && event.results[0].isFinal) {
          stopRecognition();
        }
      };

      recognition.onend = () => {
        console.log("Bolio: Recognition onend event fired.");
        // If continuous mode is on, and not explicitly stopped by user, restart recognition
        if (isContinuousMode && currentActiveElement) {
          console.log("Bolio: Attempting to restart continuous recognition.");
          recognition.start();
        }
        else {
          console.log("Bolio: Recognition ended, not restarting.");
          // Do not call stopRecognition here, as it will be handled by focusout/click
        }
      };

      recognition.onerror = (event) => {
        let errorMessage = "An unknown error occurred.";
        if (event.error === 'no-speech') {
            errorMessage = "No speech was detected.";
        } else if (event.error === 'audio-capture') {
            errorMessage = "Microphone problem. Please check your microphone.";
        } else if (event.error === 'not-allowed') {
            errorMessage = "Microphone access was denied.";
        } else if (event.error === 'aborted') {
            // This error can occur when recognition is stopped programmatically
            // We don't need to show an error message for this.
            console.log("Bolio: Recognition aborted (likely programmatic stop).");
            return;
        }
        showStatus(errorMessage, true, currentActiveElement);
        stopRecognition();
        console.error("Bolio: Speech recognition error:", event.error);
      };

      // Start listening for speech.
      recognition.start();
      console.log("Bolio: Speech recognition started.");
    });
  };

  // Helper function to check if an element is editable
  function isEditable(element) {
    if (!element) return false;
    // Check for standard editable elements
    if (element.isContentEditable || element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      return true;
    }
    // Check for gr-app or similar custom elements that might contain editable fields
    if (element.tagName === 'GR-APP') {
      // You might need to refine this selector based on the actual structure of gr-app
      return element.querySelector('input, textarea, [contenteditable="true"]') !== null;
    }
    return false;
  }

  // Listen for focus events on editable elements to show the floating icon
  document.addEventListener('focusin', (event) => {
    console.log("Bolio: focusin event fired. Target:", event.target);
    if (isEditable(event.target)) {
      // If the active element changes, stop existing recognition and update UI for new element
      if (currentActiveElement !== event.target) {
        if (recognition && recognition.listening) {
          recognition.stop(); // Stop only the recognition, not the UI
          console.log("Bolio: Recognition stopped due to focus change.");
        }
        if (currentActiveElement) {
          currentActiveElement.classList.remove('bolio-active-input');
        }
        currentActiveElement = event.target;
        console.log("Bolio: Editable element focused:", currentActiveElement);
        currentActiveElement.classList.add('bolio-active-input');
        
        // Create/reposition UI elements for the new active element
        createBolioUIContainer();
        createFloatingIcon(currentActiveElement);
        createModeToggleButton();
        chrome.storage.sync.get(['bolioContinuous'], (options) => {
          if (options.bolioContinuous) {
            createKillButton();
          } else {
            if (killButton) killButton.remove(); // Ensure kill button is removed if not continuous
          }
        });

        // If continuous mode was active and it's the same element, restart recognition
        // This logic is now handled by the startBolioDictation function itself when called from the icon click
        // or if the user explicitly starts it.

      } else {
        console.log("Bolio: Same editable element focused. Keeping UI.");
        // If the same element is focused, and recognition was stopped, restart it
        if (recognition && !recognition.listening) {
          startBolioDictation();
        }
      }
    } else {
      // If focus moves to a non-editable element, remove the UI elements and stop recognition
      console.log("Bolio: Non-editable element focused. Hiding UI and stopping recognition.");
      hideBolioUI();
      if (recognition && recognition.listening) {
        stopRecognition();
      }
    }
  });

  // Listen for blur events to remove the floating icon if the element is no longer active
  document.addEventListener('focusout', (event) => {
    console.log("Bolio: focusout event fired. Related Target:", event.relatedTarget);
    // Use a small delay to allow for focus shifting between related elements (e.g., clicking a button near an input)
    setTimeout(() => {
      // Only hide if the newly active element is NOT editable and NOT one of our UI elements
      if (!isEditable(document.activeElement) &&
          (!bolioUIContainer || !bolioUIContainer.contains(document.activeElement))) {
        console.log("Bolio: Focus moved outside editable area and Bolio UI. Hiding UI and stopping recognition.");
        hideBolioUI();
        if (recognition && recognition.listening) {
          stopRecognition();
        }
      } else {
        console.log("Bolio: Focus still within editable area or Bolio UI. Keeping UI.");
      }
    }, 50);
  });

  // Listen for clicks anywhere on the document to handle cases where focusout might not fire (e.g., clicking outside the document)
  document.addEventListener('click', (event) => {
    console.log("Bolio: click event fired. Target:", event.target);
    // If the click is not on an editable element, and not on our UI elements, hide the UI
    if (!isEditable(event.target) &&
        (!bolioUIContainer || !bolioUIContainer.contains(event.target))) {
      console.log("Bolio: Click outside editable area and Bolio UI. Hiding UI.");
      hideBolioUI();
      if (recognition && recognition.listening) {
        stopRecognition();
      }
    } else {
      console.log("Bolio: Click within editable area or Bolio UI. Keeping UI.");
    }
  });

})();