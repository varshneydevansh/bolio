// This is the content script for the extension.

// Check if the browser supports the Web Speech API.
if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
  alert("Sorry, your browser does not support the Web Speech API. Please try a different browser.");
} else {
  // Create a new SpeechRecognition object.
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  // Set the recognition properties.
  recognition.continuous = false;
  recognition.interimResults = false;

  // Start listening for speech.
  recognition.start();

  // Create a visual indicator to show that Bolio is listening.
  const listeningIndicator = document.createElement("div");
  listeningIndicator.textContent = "Listening...";
  listeningIndicator.style.position = "fixed";
  listeningIndicator.style.bottom = "20px";
  listeningIndicator.style.right = "20px";
  listeningIndicator.style.padding = "10px";
  listeningIndicator.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  listeningIndicator.style.color = "white";
  listeningIndicator.style.borderRadius = "5px";
  document.body.appendChild(listeningIndicator);

  // Handle the result event.
  recognition.onresult = (event) => {
    // Get the transcribed text.
    const transcript = event.results[0][0].transcript;

    // Insert the text into the active element.
    const activeElement = document.activeElement;
    if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
      activeElement.value += transcript;
    }

    // Stop listening.
    recognition.stop();
  };

  // Handle the end event.
  recognition.onend = () => {
    // Remove the visual indicator.
    document.body.removeChild(listeningIndicator);
  };

  // Handle errors.
  recognition.onerror = (event) => {
    // Log the error to the console.
    console.error("Speech recognition error:", event.error);

    // Remove the visual indicator.
    document.body.removeChild(listeningIndicator);
  };
}
