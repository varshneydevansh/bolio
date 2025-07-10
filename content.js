// This is the content script for the extension.

// Function to show a status notification on the page.
function showStatus(message, isError = false) {
  // Remove any existing indicator
  const existingIndicator = document.getElementById("bolio-status-indicator");
  if (existingIndicator) {
    existingIndicator.remove();
  }

  // Create the indicator element
  const indicator = document.createElement("div");
  indicator.id = "bolio-status-indicator";
  indicator.textContent = message;
  indicator.className = "bolio-listening-indicator"; // Base class
  if (isError) {
    indicator.classList.add("bolio-error-indicator");
  }
  document.body.appendChild(indicator);

  // Fade out and remove after a few seconds, unless it's an error or the "Listening..." message
  if (!isError && message !== "Listening...") {
    setTimeout(() => {
      indicator.style.opacity = "0";
      setTimeout(() => indicator.remove(), 300); // Remove from DOM after transition
    }, 2000);
  }
}


// Check if the browser supports the Web Speech API.
if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
  showStatus("Sorry, your browser doesn't support the Web Speech API.", true);
} else {
  // Inject the stylesheet
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = chrome.runtime.getURL("styles.css");
  document.head.appendChild(link);

  // Load user options before starting recognition
  chrome.storage.sync.get(['bolioLanguage', 'bolioContinuous', 'bolioReplaceText'], (options) => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = options.bolioContinuous || false;
    recognition.interimResults = false;
    recognition.lang = options.bolioLanguage || 'en-US'; // Default to English US

    // Function to stop recognition and clean up
    const stopRecognition = () => {
      recognition.stop();
      document.removeEventListener("keydown", handleEsc);
      const indicator = document.getElementById("bolio-status-indicator");
      if (indicator) {
          // Fade out the "Listening..." message before removing
          indicator.style.opacity = "0";
          setTimeout(() => indicator.remove(), 300);
      }
    };

    // Handle the Escape key to stop listening
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        stopRecognition();
      }
    };

    document.addEventListener("keydown", handleEsc);

    recognition.onstart = () => {
      showStatus("Listening...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const activeElement = document.activeElement;

      if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable) {
          if (options.bolioReplaceText) {
              // Replace text
              if(activeElement.value !== undefined) {
                  activeElement.value = transcript;
              } else if (activeElement.isContentEditable) {
                  const selection = window.getSelection();
                  const range = selection.getRangeAt(0);
                  range.deleteContents();
                  range.insertNode(document.createTextNode(transcript));
              }
          } else {
              // Append text to the current value
              if(activeElement.value !== undefined) {
                  activeElement.value += transcript;
              } else if (activeElement.isContentEditable) {
                  // For contentEditable elements, insert at the cursor
                  const selection = window.getSelection();
                  const range = selection.getRangeAt(0);
                  range.deleteContents();
                  range.insertNode(document.createTextNode(transcript));
              }
          }
      }
      showStatus("Text inserted!");
    };

    recognition.onend = () => {
      stopRecognition();
    };

    recognition.onerror = (event) => {
      let errorMessage = "An unknown error occurred.";
      if (event.error === 'no-speech') {
          errorMessage = "No speech was detected.";
      } else if (event.error === 'audio-capture') {
          errorMessage = "Microphone problem. Please check your microphone.";
      } else if (event.error === 'not-allowed') {
          errorMessage = "Microphone access was denied.";
      }
      showStatus(errorMessage, true);
      stopRecognition();
    };

    // Start listening for speech.
    recognition.start();
  });
}

