(function() {
    // --- State Management ---
    let currentActiveElement = null;
    let recognition = null;
    let bolioUIContainer = null;
    let bolioUIGroup = null;
    let floatingIcon = null;
    let killButton = null;
    let modeToggleButton = null;
    let feedbackText = null; // Add this to the state variables at the top
    let lastInterimResult = '';

    // --- Control Flags ---
    let userInitiatedStop = false;
    let isContinuousMode = false;
    let replaceTextMode = false;

    // --- Helper Functions ---

    function findEditableNode(element) {
        if (!element) return null;
        const tagName = element.tagName.toUpperCase();
        if (element.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA') {
            return element;
        }
        const query = 'input, textarea, [contenteditable="true"]';
        if (element.shadowRoot) {
            const child = element.shadowRoot.querySelector(query);
            if (child) return child;
        }
        return element.querySelector(query);
    }

    function isInsideBolioUI(element) {
        return bolioUIContainer && bolioUIContainer.contains(element);
    }

    function updateModeToggleButtonUI(button = modeToggleButton) {
        if (button) {
            chrome.storage.sync.get('bolioContinuous', ({ bolioContinuous }) => {
                isContinuousMode = bolioContinuous || false;
                button.textContent = isContinuousMode ? "C" : "S";
                isContinuousMode ? button.classList.add("continuous") : button.classList.remove("continuous");
            });
        }
    }

    // --- UI Lifecycle Management ---

    function createAndShowUI(target) {
        if (!bolioUIContainer) {
            bolioUIContainer = document.createElement('div');
            bolioUIContainer.id = 'bolio-ui-container';
            bolioUIContainer.style.zIndex = '2147483647';
            document.body.appendChild(bolioUIContainer);
        }
        if (!bolioUIGroup) {
            bolioUIGroup = document.createElement('div');
            bolioUIGroup.className = 'bolio-ui-group';

            floatingIcon = createFloatingIcon();
            modeToggleButton = createModeToggleButton();
            killButton = createKillButton();
            feedbackText = document.createElement('div');
            feedbackText.className = 'bolio-feedback-text';
            feedbackText.style.display = 'none'; // Initially hidden

            bolioUIGroup.appendChild(floatingIcon);
            bolioUIGroup.appendChild(modeToggleButton);
            bolioUIGroup.appendChild(killButton);
            bolioUIGroup.appendChild(feedbackText);
            
            bolioUIContainer.appendChild(bolioUIGroup);
        }
        bolioUIContainer.style.display = 'block';
        updateFloatingIconPosition();
    }

    function hideBolioUI() {
        if (bolioUIGroup) {
            bolioUIGroup.remove();
        }
        bolioUIGroup = null;
        floatingIcon = null;
        modeToggleButton = null;
        killButton = null;
        if (bolioUIContainer) {
            bolioUIContainer.style.display = 'none';
        }
    }

    // --- UI Element Factories ---

    function createFloatingIcon() {
        const icon = document.createElement("div");
        icon.className = "bolio-floating-icon inactive";
        icon.addEventListener('click', handleIconClick);
        icon.style.width = '40px';
        icon.style.height = '40px';
        icon.style.backgroundImage = `url(${chrome.runtime.getURL('images/bolio-logo.png')})`;
        icon.style.cursor = 'pointer';
        return icon;
    }

    function createModeToggleButton() {
        const button = document.createElement("div");
        button.className = "bolio-mode-toggle";
        button.addEventListener('click', toggleContinuousMode);
        button.style.width = '24px';
        button.style.height = '24px';
        button.style.cursor = 'pointer';
        updateModeToggleButtonUI(button); // Call the helper to set initial state
        return button;
    }

    function createKillButton() {
        const button = document.createElement("div");
        button.className = "bolio-kill-button";
        button.textContent = "X";
        button.addEventListener('click', stopRecognition);
        button.style.width = '24px';
        button.style.height = '24px';
        button.style.display = 'none';
        button.style.cursor = 'pointer';
        return button;
    }

    // --- Positioning ---

    function updateFloatingIconPosition() {
    if (!bolioUIGroup || !currentActiveElement) return;

    requestAnimationFrame(() => {
        bolioUIGroup.offsetWidth; // Force reflow to get correct dimensions
        const groupWidth = bolioUIGroup.offsetWidth;
        const groupHeight = bolioUIGroup.offsetHeight;

        if (groupWidth === 0) return; // Failsafe

        const rect = currentActiveElement.getBoundingClientRect();
        const padding = 8;
        let top, left;

        // Determine available space in all directions
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceRight = window.innerWidth - rect.right;
        
        // Priority: Above > Below > Right > Left
        if (spaceAbove > groupHeight + padding) {
            // Place Above
            top = rect.top - groupHeight - padding;
            left = rect.left;
        } else if (spaceBelow > groupHeight + padding) {
            // Place Below
            top = rect.bottom + padding;
            left = rect.left;
        } else if (spaceRight > groupWidth + padding) {
            // Place Right
            top = rect.top;
            left = rect.right + padding;
        } else {
            // Place Left
            top = rect.top;
            left = rect.left - groupWidth - padding;
        }

        // Final boundary checks to keep it on screen
        if (left < padding) left = padding;
        if ((left + groupWidth) > (window.innerWidth - padding)) left = window.innerWidth - groupWidth - padding;
        if (top < padding) top = padding;
        if ((top + groupHeight) > (window.innerHeight - padding)) top = window.innerHeight - groupHeight - padding;
        
        bolioUIGroup.style.top = `${top + window.scrollY}px`;
        bolioUIGroup.style.left = `${left + window.scrollX}px`;
    });
}

    // --- Event Handling and Core Logic ---

    function handleIconClick(event) {
        // This PREVENTS the click from shifting focus away from the text input.
        event.preventDefault(); 
        if (floatingIcon.classList.contains('inactive')) {
            startRecognition();
        } else {
            stopRecognition();
        }
    }

    function toggleContinuousMode(event) {
        event.preventDefault();
        chrome.storage.sync.get('bolioContinuous', ({ bolioContinuous }) => {
            chrome.storage.sync.set({ bolioContinuous: !bolioContinuous }, () => {
                updateModeToggleButtonUI();
            });
        });
    }

    window.startRecognition = function(isRestart = false) { // Add a parameter
        userInitiatedStop = false;
        
        chrome.storage.sync.get(['bolioLanguage', 'bolioContinuous', 'bolioReplaceText'], (options) => {
            isContinuousMode = options.bolioContinuous || false;
            replaceTextMode = options.bolioReplaceText || false;
            updateModeToggleButtonUI();

            // Only clear text if it's the *initial* start, not an automatic restart
            if (replaceTextMode && !isRestart) {
                if (currentActiveElement.isContentEditable) {
                    currentActiveElement.textContent = '';
                } else {
                    currentActiveElement.value = '';
                }
            }

            if (!recognition) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SpeechRecognition) return;
                recognition = new SpeechRecognition();
                recognition.interimResults = true;
                recognition.onresult = handleRecognitionResult;
                recognition.onend = handleRecognitionEnd;
                recognition.onerror = (e) => { if (e.error !== 'no-speech') console.error("Bolio error:", e.error); };
            }
            
            recognition.lang = options.bolioLanguage || 'en-US';
            recognition.continuous = isContinuousMode;
            recognition.start();

            if (floatingIcon) floatingIcon.classList.replace('inactive', 'active');
            if (killButton) killButton.style.display = 'flex'; // Always show X when active
            if (feedbackText) {
                feedbackText.textContent = "Listening...";
                feedbackText.style.display = 'block';
            }
        });
    };

    function stopRecognition() {
        userInitiatedStop = true;
        if (recognition) recognition.stop();
    }

    function handleRecognitionResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        if (currentActiveElement) {
            const initialValue = currentActiveElement.value ?? currentActiveElement.textContent;
            let textToInsert = (finalTranscript || interimTranscript).trim();

            // If not in replace mode, handle appending with a space.
            if (!replaceTextMode) {
                const prefix = (initialValue.length > 0 && !initialValue.endsWith(' ')) ? ' ' : '';
                textToInsert = prefix + textToInsert;
            }

            // Set the value
            if (currentActiveElement.isContentEditable) {
                currentActiveElement.textContent = replaceTextMode ? textToInsert : initialValue + textToInsert;
            } else {
                currentActiveElement.value = replaceTextMode ? textToInsert : initialValue + textToInsert;
            }

            lastInterimResult = interimTranscript;
            currentActiveElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    function handleRecognitionEnd() {
    // Check if the stop was user-initiated OR if we are in simple mode.
    const shouldStopPermanently = userInitiatedStop || !isContinuousMode;

    if (shouldStopPermanently) {
        setTimeout(() => {
            // Deactivate the UI completely.
            if (floatingIcon && floatingIcon.classList.contains('active')) {
                if (floatingIcon) floatingIcon.classList.replace('active', 'inactive');
                if (killButton) killButton.style.display = 'none';
                if (feedbackText) feedbackText.style.display = 'none';
                recognition = null; 
                userInitiatedStop = false; // Reset flag for the next session
            }
        }, 750); // Use a 750ms timeout for a responsive feel
    } else {
        // This is continuous mode and the stop was not from the user (e.g., network blip).
        // Simply restart the recognition. The UI remains active.
        startRecognition(true); // Pass true to indicate it's a restart
    }
}
    
    // --- Event Listeners ---

    document.addEventListener('focusin', (event) => {
        // Prioritize event.target, as it's the most reliable source of the focus event.
        const target = findEditableNode(event.target);
        if (target) {
            currentActiveElement = target;
            createAndShowUI();
        }
    }, true);

    document.addEventListener('focusout', (event) => {
        // Use event.relatedTarget to see where focus is going. This is the key to fixing the race condition.
        // If relatedTarget is null, it means focus is leaving the window.
        // If relatedTarget is not part of our UI, then we should hide.
        if (!isInsideBolioUI(event.relatedTarget)) {
            hideBolioUI();
            if (recognition) {
                stopRecognition();
            }
        }
    }, true);

    window.addEventListener('scroll', updateFloatingIconPosition, true);
    window.addEventListener('resize', updateFloatingIconPosition);

    // --- Initial Setup ---

    // A single, reliable place to handle page load.
    document.addEventListener('DOMContentLoaded', () => {
        // Check if an editable element is already focused on page load
        const target = findEditableNode(document.activeElement);
        if (target) {
            currentActiveElement = target;
            createAndShowUI();
        }
    });

    document.addEventListener('keydown', (e) => {
        // If Escape is pressed and the UI is active, always stop.
        if (e.key === 'Escape' && floatingIcon && floatingIcon.classList.contains('active')) {
            e.preventDefault();
            stopRecognition();
        } else if (e.key === 'Enter' && currentActiveElement && bolioUIGroup && bolioUIGroup.style.display !== 'none') {
            // Only trigger if the UI is visible for the active element
            e.preventDefault();
            if (floatingIcon.classList.contains('active')) {
                stopRecognition();
            } else {
                startRecognition();
            }
        }
    });
})();