console.log("Bolio: content.js loaded.");

(function() {
  let currentActiveElement = null; // To keep track of the element being dictated into
  let recognition = null; // Global recognition object
  let floatingIcon = null; // Global reference to the floating icon
  let killButton = null; // Global reference to the kill button
  let modeToggleButton = null; // Global reference to the mode toggle button
  let isContinuousMode = false; // To keep track of the current dictation mode

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
      recognition.stop();
    }
    document.removeEventListener("keydown", handleEsc);
    if (currentActiveElement) {
      currentActiveElement.classList.remove('bolio-active-input');
      currentActiveElement = null;
    }
    const indicator = document.getElementById("bolio-status-indicator");
    if (indicator) {
        indicator.style.opacity = "0";
        setTimeout(() => indicator.remove(), 300);
    }
    removeFloatingIcon(); // Remove the floating icon when dictation stops
    removeKillButton(); // Remove the kill button when dictation stops
    removeModeToggleButton(); // Remove the mode toggle button when dictation stops
  };

  // Handle the Escape key to stop listening
  const handleEsc = (event) => {
    if (event.key === "Escape") {
      stopRecognition();
    }
  };

  // Function to create and position the floating icon
  function createFloatingIcon(targetElement) {
    console.log("Bolio: createFloatingIcon called.");
    if (!targetElement) {
      console.log("Bolio: createFloatingIcon: targetElement is null.");
      return; // Ensure target element exists
    }

    removeFloatingIcon(); // Ensure only one icon exists

    floatingIcon = document.createElement("div");
    floatingIcon.id = "bolio-floating-icon";
    floatingIcon.className = "bolio-floating-icon";
    // Use text placeholder instead of image for now
    floatingIcon.textContent = "Mic"; 
    document.body.appendChild(floatingIcon);

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

    console.log("Bolio: Floating icon created and positioned.");

    floatingIcon.addEventListener('click', startBolioDictation);
  }

  // Function to remove the floating icon
  function removeFloatingIcon() {
    console.log("Bolio: removeFloatingIcon called.");
    if (floatingIcon) {
      floatingIcon.removeEventListener('click', startBolioDictation);
      floatingIcon.remove();
      floatingIcon = null;
      console.log("Bolio: Floating icon removed.");
    }
  }

  // Function to create and position the kill button
  function createKillButton() {
    removeKillButton(); // Ensure only one kill button exists

    killButton = document.createElement("div");
    killButton.id = "bolio-kill-button";
    killButton.className = "bolio-kill-button";
    killButton.textContent = "X";
    document.body.appendChild(killButton);

    // Position the kill button relative to the floating icon
    if (floatingIcon) {
      const iconRect = floatingIcon.getBoundingClientRect();
      killButton.style.top = `${iconRect.top + window.scrollY - (killButton.offsetHeight / 2)}px`;
      killButton.style.left = `${iconRect.left + window.scrollX + iconRect.width - (killButton.offsetWidth / 2)}px`;
    }

    killButton.addEventListener('click', stopRecognition);
  }

  // Function to remove the kill button
  function removeKillButton() {
    if (killButton) {
      killButton.removeEventListener('click', stopRecognition);
      killButton.remove();
      killButton = null;
    }
  }

  // Function to create and position the mode toggle button
  function createModeToggleButton() {
    removeModeToggleButton(); // Ensure only one toggle button exists

    modeToggleButton = document.createElement("div");
    modeToggleButton.id = "bolio-mode-toggle";
    modeToggleButton.className = "bolio-mode-toggle";
    document.body.appendChild(modeToggleButton);

    updateModeToggleButtonUI(); // Set initial text and class

    // Position the mode toggle button relative to the floating icon
    if (floatingIcon) {
      const iconRect = floatingIcon.getBoundingClientRect();
      modeToggleButton.style.top = `${iconRect.top + window.scrollY - (modeToggleButton.offsetHeight / 2)}px`;
      modeToggleButton.style.left = `${iconRect.left + window.scrollX - (modeToggleButton.offsetWidth / 2)}px`;
    }

    modeToggleButton.addEventListener('click', toggleContinuousMode);
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
      recognition.interimResults = isContinuousMode; // Set interimResults based on continuous mode
      recognition.lang = options.bolioLanguage || 'en-US'; // Default to English US

      let finalTranscript = ''; // To accumulate final results in continuous mode
      let interimTranscript = ''; // To hold interim results

      // Store the element that initiated the dictation
      currentActiveElement = document.activeElement;
      if (currentActiveElement) {
        currentActiveElement.classList.add('bolio-active-input');
        createFloatingIcon(currentActiveElement); // Create and position the floating icon
        createModeToggleButton(); // Create the mode toggle button
        if (isContinuousMode) {
          createKillButton(); // Create kill button if continuous dictation is enabled
        }
      } else {
        showStatus("No active text field found.", true);
        return;
      }

      document.addEventListener("keydown", handleEsc);

      recognition.onstart = () => {
        showStatus("Listening...", false, currentActiveElement);
      };

      recognition.onresult = (event) => {
        interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const transcriptToInsert = finalTranscript + interimTranscript;

        // Only insert if the original active element is still focused or is the current active element
        // This allows for text insertion even if the user clicks away, as long as the original element is still in focus.
        if (document.activeElement === currentActiveElement || (currentActiveElement && currentActiveElement.contains(document.activeElement))) {
          console.log("Bolio: Attempting to insert text into:", currentActiveElement);
          console.log("Bolio: Current active element tagName:", currentActiveElement.tagName);
          console.log("Bolio: Current active element isContentEditable:", currentActiveElement.isContentEditable);
          console.log("Bolio: Transcript to insert:", transcriptToInsert);

          if (currentActiveElement.tagName === "INPUT" || currentActiveElement.tagName === "TEXTAREA") {
              if (options.bolioReplaceText) {
                  currentActiveElement.value = transcriptToInsert;
              } else {
                  currentActiveElement.value = finalTranscript; // Only insert final transcript for appending
              }
              // Dispatch input event to notify frameworks like Angular/React
              currentActiveElement.dispatchEvent(new Event('input', { bubbles: true }));
              currentActiveElement.dispatchEvent(new Event('change', { bubbles: true }));
          } else if (currentActiveElement.isContentEditable) {
              // For contentEditable, we need to manage the selection more carefully
              // This part needs to be refined for continuous interim results
              if (options.bolioReplaceText) {
                  currentActiveElement.textContent = transcriptToInsert;
              }
              else {
                  // For contentEditable and appending, we need to insert at cursor
                  // This is a simplified approach and might need more robust handling
                  // for complex contentEditable scenarios with interim results.
                  const selection = window.getSelection();
                  const range = selection.getRangeAt(0);
                  range.deleteContents();
                  range.insertNode(document.createTextNode(finalTranscript));
                  // Move cursor to the end of the inserted text
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
              }
              // Dispatch input event for contenteditable elements
              currentActiveElement.dispatchEvent(new Event('input', { bubbles: true }));
          }
          showStatus("Text inserted!", false, currentActiveElement);
        } else {
          // If the active element changed, don't insert text and show a warning
          showStatus("Text field lost focus. Dictation stopped.", true);
          stopRecognition();
          return; // Exit early
        }

        // If not continuous, stop after first final result
        if (!isContinuousMode && event.results[0].isFinal) {
          stopRecognition();
        }
      };

      recognition.onend = () => {
        // If continuous mode is on, and not explicitly stopped by user, restart recognition
        if (isContinuousMode && currentActiveElement) {
          recognition.start();
        }
        else {
          stopRecognition();
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
            return;
        }
        showStatus(errorMessage, true, currentActiveElement);
        stopRecognition();
      };

      // Start listening for speech.
      recognition.start();
    });
  };

  // Helper function to check if an element is editable
  function isEditable(element) {
    return element && (element.isContentEditable || element.tagName === 'INPUT' || element.tagName === 'TEXTAREA');
  }

  // Listen for focus events on editable elements to show the floating icon
  document.addEventListener('focusin', (event) => {
    console.log("Bolio: focusin event fired. Target:", event.target);
    if (isEditable(event.target)) {
      currentActiveElement = event.target;
      console.log("Bolio: Editable element focused:", currentActiveElement);
      createFloatingIcon(currentActiveElement);
      createModeToggleButton(); // Create the mode toggle button on focus
    } else {
      // If focus moves to a non-editable element, remove the UI elements
      console.log("Bolio: Non-editable element focused. Removing UI.");
      removeFloatingIcon();
      removeKillButton();
      removeModeToggleButton();
    }
  });

  // Listen for blur events to remove the floating icon if the element is no longer active
  document.addEventListener('focusout', (event) => {
    console.log("Bolio: focusout event fired. Related Target:", event.relatedTarget);
    // Use a small delay to allow for focus shifting between related elements (e.g., clicking a button near an input)
    setTimeout(() => {
      // Only remove if the newly active element is NOT editable and NOT one of our UI elements
      if (!isEditable(document.activeElement) &&
          (!floatingIcon || !floatingIcon.contains(document.activeElement)) &&
          (!killButton || !killButton.contains(document.activeElement)) &&
          (!modeToggleButton || !modeToggleButton.contains(document.activeElement))) {
        console.log("Bolio: Focus moved outside editable area and Bolio UI. Removing UI.");
        removeFloatingIcon();
        removeKillButton();
        removeModeToggleButton();
      } else {
        console.log("Bolio: Focus still within editable area or Bolio UI. Keeping UI.");
      }
    }, 50);
  });

  // Listen for clicks anywhere on the document to handle cases where focusout might not fire (e.g., clicking outside the document)
  document.addEventListener('click', (event) => {
    console.log("Bolio: click event fired. Target:", event.target);
    // If the click is not on an editable element, and not on our UI elements, remove the UI
    if (!isEditable(event.target) &&
        (!floatingIcon || !floatingIcon.contains(event.target)) &&
        (!killButton || !killButton.contains(event.target)) &&
        (!modeToggleButton || !modeToggleButton.contains(event.target))) {
      console.log("Bolio: Click outside editable area and Bolio UI. Removing UI.");
      removeFloatingIcon();
      removeKillButton();
      removeModeToggleButton();
    } else {
      console.log("Bolio: Click within editable area or Bolio UI. Keeping UI.");
    }
  });

})();