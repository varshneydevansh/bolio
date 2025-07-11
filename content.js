console.log("Bolio: content.js loaded.");

(function() {
  let currentActiveElement = null; // To keep track of the element being dictated into
  let recognition = null; // Global recognition object
  let bolioUIContainer = null; // Global reference to the UI container
  let bolioUIGroup = null; // Global reference to the UI group container
  let floatingIcon = null; // Global reference to the floating icon
  let killButton = null; // Global reference to the kill button
  let modeToggleButton = null; // Global reference to the mode toggle button
  let isContinuousMode = false; // To keep track of the current dictation mode
  let lastInterimResult = ''; // To store the last interim result for removal
  let currentFinalTranscript = ''; // To accumulate final results
  let userInitiatedStop = false; // Flag to indicate user stopped recognition

  // Function to show a status notification on the page.

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
    userInitiatedStop = true; // Set the flag to true
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
    if (floatingIcon) {
      floatingIcon.classList.remove('active');
      floatingIcon.classList.add('inactive');
    }
    if (killButton) {
      killButton.style.display = 'none';
    }
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
      console.log("Bolio: UI Container created and appended to body.");
    }
    if (!bolioUIGroup) {
      bolioUIGroup = document.createElement("div");
      bolioUIGroup.className = "bolio-ui-group";
      bolioUIContainer.appendChild(bolioUIGroup);
      console.log("Bolio: UI Group created and appended to container.");
    }
    // Ensure it's visible when created/used
    bolioUIContainer.style.display = 'block'; 
    console.log("Bolio: bolioUIContainer display set to block.");
  }

  // Function to hide all Bolio UI elements
  function hideBolioUI() {
    if (bolioUIContainer) {
      bolioUIContainer.style.display = 'none';
      if (bolioUIGroup) {
        bolioUIGroup.remove();
        bolioUIGroup = null;
        floatingIcon = null;
        killButton = null;
        modeToggleButton = null;
      }
      console.log("Bolio: UI Container display set to none.");
    }
  }

  // Function to update the position of the floating icon and its associated buttons
  function updateFloatingIconPosition() {
    if (!bolioUIGroup || !currentActiveElement) return;

    // Force a reflow to ensure dimensions are up-to-date
    bolioUIGroup.offsetWidth; 

    const rect = currentActiveElement.getBoundingClientRect();
    const groupWidth = bolioUIGroup.offsetWidth;
    const groupHeight = bolioUIGroup.offsetHeight;
    const padding = 5; // Padding from the element's edge

    console.log(`Bolio: Target element rect: top=${rect.top}, left=${rect.left}, width=${rect.width}, height=${rect.height}`);
    console.log(`Bolio: UI Group dimensions: width=${groupWidth}, height=${groupHeight}`);

    let top = rect.top - groupHeight - padding; // Default: above the element
    let left = rect.left; // Default: align with left edge of element

    // Adjust if it goes off-screen to the top
    if (top < 0) {
      top = rect.bottom + padding; // Move below the element
    }

    // Adjust if it goes off-screen to the right
    if (left + groupWidth > window.innerWidth) {
      left = window.innerWidth - groupWidth - padding; // Align with right edge of viewport
    }

    // Adjust if it goes off-screen to the left
    if (left < 0) {
      left = padding; // Align with left edge of viewport
    }

    bolioUIGroup.style.top = `${top + window.scrollY}px`;
    bolioUIGroup.style.left = `${left + window.scrollX}px`;

    console.log(`Bolio: UI Group positioned at top: ${top}, left: ${left}.`);
    console.log(`Bolio: UI Group offsetWidth: ${bolioUIGroup.offsetWidth}, offsetHeight: ${bolioUIGroup.offsetHeight}.`);
  }

  // Function to create and position the floating icon
  function createFloatingIcon(targetElement) {
    console.log("Bolio: createFloatingIcon called with target:", targetElement);
    if (!targetElement) {
      console.log("Bolio: createFloatingIcon: targetElement is null.");
      return; // Ensure target element exists
    }

    createBolioUIContainer(); // Ensure container exists and is visible

    if (!floatingIcon) {
      floatingIcon = document.createElement("div");
      floatingIcon.id = "bolio-floating-icon";
      floatingIcon.style.backgroundImage = `url(${chrome.runtime.getURL('images/bolio-logo.png')})`;
      floatingIcon.style.backgroundSize = 'contain';
      floatingIcon.style.backgroundRepeat = 'no-repeat';
      floatingIcon.style.backgroundPosition = 'center';
      bolioUIGroup.appendChild(floatingIcon);
      floatingIcon.addEventListener('click', handleIconClick);
      console.log("Bolio: Floating icon element created and appended to container.");
    }

    // Always set to inactive on creation/re-positioning, ready for user action.
    floatingIcon.className = "bolio-floating-icon inactive";

    requestAnimationFrame(() => {
      updateFloatingIconPosition(); // Position it after rendering
    });
  }

  // Function to create and position the kill button
  function createKillButton() {
    if (!bolioUIGroup) return; // Ensure group container exists

    if (!killButton) {
      killButton = document.createElement("div");
      killButton.id = "bolio-kill-button";
      killButton.className = "bolio-kill-button";
      killButton.textContent = "X";
      bolioUIGroup.appendChild(killButton);
      killButton.addEventListener('click', stopRecognition);
      console.log("Bolio: Kill button created.");
    }
    killButton.style.display = 'none'; // Hide by default
    requestAnimationFrame(() => {
      updateFloatingIconPosition(); // Position it after rendering
    });
  }

  // Function to create and position the mode toggle button
  function createModeToggleButton() {
    if (!bolioUIGroup) return; // Ensure group container exists

    if (!modeToggleButton) {
      modeToggleButton = document.createElement("div");
      modeToggleButton.id = "bolio-mode-toggle";
      modeToggleButton.className = "bolio-mode-toggle";
      bolioUIGroup.appendChild(modeToggleButton);
      modeToggleButton.addEventListener('click', toggleContinuousMode);
      console.log("Bolio: Mode toggle button created.");
    }

    updateModeToggleButtonUI(); // Set initial text and class
    requestAnimationFrame(() => {
      updateFloatingIconPosition(); // Position it after rendering
    });
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
  function handleIconClick() {
    if (floatingIcon && floatingIcon.classList.contains('inactive')) {
        // Start recognition only if the icon is inactive
        startRecognition();
    } else {
        // If the icon is already active, clicking it again should stop recognition
        stopRecognition();
    }
  }

  window.startRecognition = function() {
    userInitiatedStop = false; // Reset the flag
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
        if (floatingIcon) {
          floatingIcon.classList.remove('inactive');
          floatingIcon.classList.add('active');
        }
        if (isContinuousMode && killButton) {
          killButton.style.display = 'flex';
        }
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
            // Add a space before new dictation if there's existing text and it's not empty
            const prefix = (currentContent.length > 0 && newFinalSegment.length > 0 && !currentContent.endsWith(' ')) ? ' ' : '';
            textToSet = currentContent + prefix + newFinalSegment + interimTranscript;
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
        if (isContinuousMode && !userInitiatedStop) {
          console.log("Bolio: Attempting to restart continuous recognition.");
          recognition.start();
        } else {
          console.log("Bolio: Recognition ended, not restarting.");
          stopRecognition(); // Ensure everything is cleaned up
        }
      };

      recognition.onerror = (event) => {
        // Ignore the 'no-speech' error in continuous mode, as the onend event will handle restarting.
        if (isContinuousMode && event.error === 'no-speech') {
          console.log("Bolio: 'no-speech' error ignored in continuous mode.");
          return;
        }

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

  // Function to handle focus on editable elements
  function handleEditableFocus(event) {
    const target = event.target;
    console.log("Bolio: handleEditableFocus event fired. Target:", target);
    if (isEditable(target) && target !== currentActiveElement) {
      // Update the active element only if it has changed
      currentActiveElement = target;
      console.log("Bolio: New editable element focused:", currentActiveElement);
      
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
      requestAnimationFrame(() => {
        updateFloatingIconPosition(); // Position it after rendering
      });
    } else if (!isEditable(target)) {
      // If focus moves to a non-editable element, hide the UI
      // This is a fallback for the focusout/click listeners
      hideBolioUI();
      if (recognition && recognition.listening) {
        stopRecognition();
      }
    }
  }

  // Listen for focus events on editable elements to show the floating icon
  document.addEventListener('focusin', handleEditableFocus);

  document.addEventListener('focusout', (event) => {
    console.log("Bolio: focusout event fired. Related Target:", event.relatedTarget);
    // Use a small delay to allow for focus shifting between related elements
    setTimeout(() => {
      const newFocus = document.activeElement;
      if (!isEditable(newFocus) && (!bolioUIContainer || !bolioUIContainer.contains(newFocus))) {
        console.log("Bolio: Focus moved outside. Hiding UI.");
        hideBolioUI();
        if (recognition && recognition.listening) {
          stopRecognition();
        }
      }
    }, 100); // Increased delay to prevent race conditions
  });

  // Listen for clicks anywhere on the document
  document.addEventListener('click', (event) => {
    console.log("Bolio: click event fired. Target:", event.target);
    // If the click is on an editable element, ensure the UI is visible
    if (isEditable(event.target)) {
      handleEditableFocus({ target: event.target });
      return; // Stop further processing
    }
    // If the click is outside an editable area and not on our UI, hide it.
    if (!bolioUIContainer || !bolioUIContainer.contains(event.target)) {
        console.log("Bolio: Click outside editable area and Bolio UI. Hiding UI.");
        hideBolioUI();
        if (recognition && recognition.listening) {
            stopRecognition();
        }
    }
  });

  // Initialize the UI container on script load
  document.addEventListener('DOMContentLoaded', () => {
    createBolioUIContainer();
    // Initially hide the container, but its children will be positioned to make it visible on focus
    bolioUIContainer.style.display = 'none';

    // Check if an editable element is already focused on page load
    if (isEditable(document.activeElement)) {
      handleEditableFocus({ target: document.activeElement });
    }
  });

  // MutationObserver to handle dynamically added editable elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && isEditable(node)) {
            console.log("Bolio: New editable element added to DOM:", node);
            // If a new editable element is added and it's currently focused, show UI
            if (document.activeElement === node) {
              handleEditableFocus({ target: node });
            }
          }
        });
      }
    });
  });

  // Start observing the document body for changes
  observer.observe(document.body, { childList: true, subtree: true });

  // Add scroll and resize listeners to update icon position
  window.addEventListener('scroll', updateFloatingIconPosition);
  window.addEventListener('resize', updateFloatingIconPosition);

})();