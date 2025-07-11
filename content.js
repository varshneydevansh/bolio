(function() {
  let currentActiveElement = null; // To keep track of the element being dictated into
  let recognition = null; // Global recognition object
  let floatingIcon = null; // Global reference to the floating icon

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
  };

  // Handle the Escape key to stop listening
  const handleEsc = (event) => {
    if (event.key === "Escape") {
      stopRecognition();
    }
  };

  // Function to create and position the floating icon
  function createFloatingIcon(targetElement) {
    removeFloatingIcon(); // Ensure only one icon exists

    floatingIcon = document.createElement("div");
    floatingIcon.id = "bolio-floating-icon";
    floatingIcon.className = "bolio-floating-icon";
    floatingIcon.innerHTML = `<img src="${chrome.runtime.getURL("images/icon-48.png")}" alt="Bolio Icon">`;
    document.body.appendChild(floatingIcon);

    // Position the icon near the target element
    const rect = targetElement.getBoundingClientRect();
    floatingIcon.style.top = `${rect.top + window.scrollY - floatingIcon.offsetHeight - 5}px`;
    floatingIcon.style.left = `${rect.left + window.scrollX + rect.width - floatingIcon.offsetWidth}px`;

    floatingIcon.addEventListener('click', startBolioDictation);
  }

  // Function to remove the floating icon
  function removeFloatingIcon() {
    if (floatingIcon) {
      floatingIcon.removeEventListener('click', startBolioDictation);
      floatingIcon.remove();
      floatingIcon = null;
    }
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
      recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = options.bolioContinuous || false;
      recognition.interimResults = options.bolioContinuous || false; // Set interimResults based on continuous mode
      recognition.lang = options.bolioLanguage || 'en-US'; // Default to English US

      let finalTranscript = ''; // To accumulate final results in continuous mode
      let interimTranscript = ''; // To hold interim results

      // Store the element that initiated the dictation
      currentActiveElement = document.activeElement;
      if (currentActiveElement) {
        currentActiveElement.classList.add('bolio-active-input');
        createFloatingIcon(currentActiveElement); // Create and position the floating icon
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
              } else {
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
        if (!options.bolioContinuous && event.results[0].isFinal) {
          stopRecognition();
        }
      };

      recognition.onend = () => {
        // If continuous mode is on, and not explicitly stopped by user, restart recognition
        if (options.bolioContinuous && currentActiveElement) {
          recognition.start();
        } else {
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

  // Listen for focus events on editable elements to show the floating icon
  document.addEventListener('focusin', (event) => {
    if (event.target.isContentEditable || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      currentActiveElement = event.target;
      createFloatingIcon(currentActiveElement);
    } else {
      removeFloatingIcon();
    }
  });

  // Listen for blur events to remove the floating icon if the element is no longer active
  document.addEventListener('focusout', (event) => {
    // A small delay to allow for focus shifting between elements within the same "logical" input area
    setTimeout(() => {
      if (!document.activeElement || (currentActiveElement && !currentActiveElement.contains(document.activeElement) && document.activeElement !== currentActiveElement)) {
        removeFloatingIcon();
      }
    }, 50);
  });

  // Also listen for clicks outside editable elements to remove the icon
  document.addEventListener('click', (event) => {
    if (floatingIcon && !floatingIcon.contains(event.target) &&
        !(event.target.isContentEditable || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) {
      removeFloatingIcon();
    }
  });

})();