// content.js - Final, Corrected Version

(function() {
    // --- State Management ---
    let currentActiveElement = null;
    let recognition = null;
    let bolioUIContainer = null;
    let bolioUIGroup = null;
    let floatingIcon = null;
    let killButton = null;
    let modeToggleButton = null;

    // --- Control Flags ---
    let userInitiatedStop = false;
    let isContinuousMode = false;
    let replaceTextMode = false;
    let isFirstResultOfSession = true; // CRITICAL: Fixes continuous overwrite bug

    // --- Helper Functions ---

    /**
     * FIX: Robustly finds the true editable element, traversing Shadow DOM if necessary.
     * This solves the issue of attaching to parent containers like <gr-app>.
     */
    function findEditableNode(element) {
        if (!element) return null;
        const tagName = element.tagName.toUpperCase();
        if (element.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA') {
            return element;
        }
        const query = 'input, textarea, [contenteditable="true"]';
        let editable = element.querySelector(query);
        if (!editable && element.shadowRoot) {
            editable = element.shadowRoot.querySelector(query);
        }
        return editable;
    }
    
    /**
     * Helper to check if the user is interacting with Bolio's own UI.
     */
    function isInsideBolioUI(element) {
        return bolioUIContainer && bolioUIContainer.contains(element);
    }

    // --- UI Management ---

    // Function to create the main UI container
  function createBolioUIContainer() {
    if (!bolioUIContainer) {
      bolioUIContainer = document.createElement("div");
      bolioUIContainer.id = "bolio-ui-container";
      bolioUIContainer.style.position = 'fixed'; // Ensure it's fixed to the viewport
      bolioUIContainer.style.top = '0';
      bolioUIContainer.style.left = '0';
      bolioUIContainer.style.width = '100%';
      bolioUIContainer.style.height = '100%';
      bolioUIContainer.style.pointerEvents = 'none'; // Allow clicks to pass through
      bolioUIContainer.style.zIndex = '2147483647'; // Highest possible z-index
      document.body.appendChild(bolioUIContainer);
    }
    if (!bolioUIGroup) {
      bolioUIGroup = document.createElement("div");
      bolioUIGroup.className = "bolio-ui-group";
      bolioUIContainer.appendChild(bolioUIGroup);
    }
    // Ensure it's visible when created/used
    bolioUIContainer.style.display = 'block'; 
  }

    /**
     * Destroyer: Completely removes the UI group and nullifies variables.
     */
    function hideBolioUI() {
        if (bolioUIGroup) {
            bolioUIGroup.remove();
        }
        // This is the key: nullifying allows recreation on next focus.
        bolioUIGroup = null;
        floatingIcon = null;
        modeToggleButton = null;
        killButton = null;
        
        if (bolioUIContainer) {
            bolioUIContainer.style.display = 'none';
        }
    }

    // --- UI Element Factories ---

    /**
     * Factory: Creates and returns a fresh floating icon element.
     */
    function createFloatingIcon() {
        const icon = document.createElement("div");
        icon.id = "bolio-floating-icon";
        icon.className = "bolio-floating-icon inactive"; // Always start inactive
        icon.addEventListener('click', handleIconClick);
        
        // Apply critical styles directly in JS to avoid CSS race conditions
        icon.style.width = '40px';
        icon.style.height = '40px';
        icon.style.backgroundImage = `url(${chrome.runtime.getURL('images/bolio-logo.png')})`;
        icon.style.cursor = 'pointer';
        icon.style.display = 'flex'; // Ensure it's a flex container
        icon.style.flexShrink = '0'; // Prevent it from shrinking
        icon.style.justifyContent = 'center';
        icon.style.alignItems = 'center';
        icon.style.borderRadius = '50%';
        icon.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        icon.style.transition = 'background-color 0.2s ease-in-out, transform 0.1s ease';
        icon.style.border = '2px solid #fff';
        icon.style.backgroundSize = '70%';
        icon.style.backgroundRepeat = 'no-repeat';
        icon.style.backgroundPosition = 'center';

        return icon;
    }

    /**
     * Factory: Creates and returns a fresh mode toggle button.
     */
    function createModeToggleButton() {
        const button = document.createElement("div");
        button.className = "bolio-mode-toggle";
        button.addEventListener('click', toggleContinuousMode);
        
        button.style.width = '24px';
        button.style.height = '24px';
        button.style.cursor = 'pointer';
        button.style.borderRadius = '50%';
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        button.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        button.style.color = 'white';
        button.style.fontWeight = 'bold';
        button.style.fontFamily = 'sans-serif';
        button.style.lineHeight = '1';
        button.style.textAlign = 'center';
        button.style.transition = 'background-color 0.2s ease-in-out';
        button.style.marginLeft = '5px';
        
        return button;
    }

    // Function to update the UI of the mode toggle button
    function updateModeToggleButtonUI() {
        if (modeToggleButton) {
            chrome.storage.sync.get('bolioContinuous', ({ bolioContinuous }) => {
                const isContinuous = bolioContinuous || false;
                modeToggleButton.textContent = isContinuous ? "C" : "S";
                isContinuous ? modeToggleButton.classList.add("continuous") : modeToggleButton.classList.remove("continuous");
            });
        }
    }

    /**
     * Factory: Creates and returns a fresh kill button.
     */
    function createKillButton() {
        const button = document.createElement("div");
        button.className = "bolio-kill-button";
        button.textContent = "X";
        button.addEventListener('click', stopRecognition);

        button.style.width = '24px';
        button.style.height = '24px';
        button.style.display = 'none'; // Initially hidden
        button.style.cursor = 'pointer';
        button.style.borderRadius = '50%';
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        button.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        button.style.color = 'white';
        button.style.fontWeight = 'bold';
        button.style.fontFamily = 'sans-serif';
        button.style.lineHeight = '1';
        button.style.textAlign = 'center';
        button.style.transition = 'background-color 0.2s ease-in-out';
        button.style.marginLeft = '5px';
        
        return button;
    }

    // --- Core UI Positioning ---

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

        bolioUIGroup.style.position = 'absolute'; // Ensure positioning context
        bolioUIGroup.style.top = `${top + window.scrollY}px`;
        bolioUIGroup.style.left = `${left + window.scrollX}px`;

        console.log(`Bolio: UI Group positioned at top: ${top}, left: ${left}.`);
        console.log(`Bolio: UI Group offsetWidth: ${bolioUIGroup.offsetWidth}, offsetHeight: ${bolioUIGroup.offsetHeight}.`);
    }

    // --- Speech Recognition Logic ---

    function handleIconClick(event) {
        event.preventDefault(); // Prevent default action (e.g., losing focus)
        event.stopPropagation(); // Stop event from bubbling up

        if (floatingIcon.classList.contains('inactive')) {
            startRecognition();
        } else {
            stopRecognition();
        }
    }

    function toggleContinuousMode() {
        isContinuousMode = !isContinuousMode;
        chrome.storage.sync.set({ bolioContinuous: isContinuousMode });
        updateModeToggleButtonUI();
        // If recognition is active, restart it with the new mode
        if (recognition && recognition.listening) {
            stopRecognition();
            startRecognition(); // Use startRecognition, not startBolioDictation
        }
    }

    window.startRecognition = function() {
        userInitiatedStop = false;
        isFirstResultOfSession = true; // Reset for new session

        // Check if the browser supports the Web Speech API.
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("Bolio: Speech Recognition API not supported.");
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
            isContinuousMode = options.bolioContinuous || false;
            replaceTextMode = options.bolioReplaceText || false;
            updateModeToggleButtonUI();

            if (!recognition) {
                recognition = new SpeechRecognition();
                recognition.interimResults = true;

                recognition.onresult = handleRecognitionResult;
                recognition.onend = handleRecognitionEnd;
                recognition.onerror = (e) => { 
                    if (e.error !== 'no-speech') {
                        console.error("Bolio error:", e.error);
                        // showStatus(`Speech recognition error: ${e.error}`, true, currentActiveElement);
                    }
                };
            }
            
            recognition.lang = options.bolioLanguage || 'en-US';
            recognition.continuous = isContinuousMode;
            recognition.start();

            floatingIcon.classList.remove('inactive');
            floatingIcon.classList.add('active');
            if (isContinuousMode && killButton) killButton.style.display = 'flex';
        });
    };

    function stopRecognition() {
        userInitiatedStop = true;
        if (recognition) recognition.stop();
        // UI state handled by handleRecognitionEnd or focusout
    }

    function handleRecognitionResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        if (currentActiveElement) {
            let elementToModify = currentActiveElement;
            // Handle potential Shadow DOM or complex elements
            if (currentActiveElement.shadowRoot) {
                const editableChild = findEditableNode(currentActiveElement);
                if (editableChild) elementToModify = editableChild;
            }

            let currentContent = elementToModify.value || elementToModify.textContent || '';
            
            // Remove the previously inserted interim result from the current content
            if (currentContent.endsWith(lastInterimResult)) {
                currentContent = currentContent.substring(0, currentContent.length - lastInterimResult.length);
            }

            let textToSet = '';
            if (replaceTextMode) {
                if (isFirstResultOfSession) {
                    textToSet = finalTranscript + interimTranscript;
                } else {
                    // For subsequent results in continuous overwrite, append to previous final text
                    // This is a simplification; a more robust solution might track the full session transcript.
                    textToSet = currentContent + finalTranscript + interimTranscript;
                }
            } else {
                const prefix = (currentContent.length > 0 && finalTranscript.length > 0 && !currentContent.endsWith(' ')) ? ' ' : '';
                textToSet = currentContent + prefix + finalTranscript + interimTranscript;
            }

            isFirstResultOfSession = false;

            if (elementToModify.tagName === "INPUT" || elementToModify.tagName === "TEXTAREA") {
                elementToModify.value = textToSet;
                elementToModify.setSelectionRange(textToSet.length, textToSet.length);
            } else if (elementToModify.isContentEditable) {
                elementToModify.textContent = textToSet;
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(elementToModify);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            
            elementToModify.dispatchEvent(new Event('input', { bubbles: true }));
            elementToModify.dispatchEvent(new Event('change', { bubbles: true }));

            lastInterimResult = interimTranscript;
        }
    }

    function handleRecognitionEnd() {
        if (isContinuousMode && !userInitiatedStop) {
            recognition.start(); // Automatic restart
        } else {
            if (floatingIcon) {
                floatingIcon.classList.remove('active');
                floatingIcon.classList.add('inactive');
            }
            if (killButton) {
                killButton.style.display = 'none';
            }
        }
    }
    
    // --- Event Handling (New Robust Model) ---

    document.addEventListener('focusin', (event) => {
        // Use composedPath to find the true target, even through Shadow DOM
        const path = event.composedPath();
        const target = path.find(el => findEditableNode(el)); // Use the robust function here

        if (target) {
            if (recognition && currentActiveElement !== target) stopRecognition();
            currentActiveElement = target;
            createAndShowUI(target); // This creates/shows the inactive UI
        }
    }, true); // Use capture phase to catch the event early

    document.addEventListener('focusout', (event) => {
        // Use a delay to prevent the UI from hiding when clicking its own buttons.
        setTimeout(() => {
            // If the newly focused element is not part of Bolio's UI, then hide it.
            if (!isInsideBolioUI(document.activeElement) && !findEditableNode(document.activeElement)) {
                hideBolioUI();
                if (recognition) stopRecognition();
            }
        }, 150);
    });

    // --- Script Initialization ---

    function initialize() {
        // Check if an editable element is already focused on page load
        // This needs to be done after DOMContentLoaded to ensure document.body exists
        document.addEventListener('DOMContentLoaded', () => {
            if (findEditableNode(document.activeElement)) {
                createAndShowUI(document.activeElement);
            }
        });

        // Add scroll and resize listeners to update icon position
        window.addEventListener('scroll', updateFloatingIconPosition, true);
        window.addEventListener('resize', updateFloatingIconPosition);
    }
    
    initialize();

})();