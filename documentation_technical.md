# Bolio - Technical Documentation (v0.6.0)

This document provides a deep dive into the technical architecture, code structure, and core logic of the Bolio browser extension, reflecting the major refactoring for robustness and reliability.

## 1. Core Architecture

Bolio's architecture uses a standard, efficient Chrome Extension model, separating concerns between a content script, a background script, and an options page.

```ascii
+----------------------------------+      +---------------------------------+
|         Browser Window           |      |        Extension Process        |
|  +----------------------------+  |      |                                 |
|  |         Web Page           |  |      |  +---------------------------+  |
|  | (e.g., gmail.com)          |  |      |  |      background.js        |  |
|  |                            |  |      |  | (Service Worker)          |  |
|  |  +---------------------+   |  |      |  | - Creates Context Menu    |  |
|  |  |     content.js      |   |  |      |  | - Handles Menu Clicks     |  |
|  |  | - Injects/Manages UI|   |  |      |  | - Calls startRecognition()|  |
|  |  | - Handles SpeechAPI |<----*---------+---------------------------+  |
|  |  | - Manages All Logic |   |  |      |              ^                |
|  |  +---------------------+   |  |      |              |                |
|  +----------------------------+  |      | +--------------v-------------+  |
|                                  |      | |        options.js          |  |
|                                  |      | | - Manages User Settings    |  |
|                                  |      | | - Interacts with           |  |
|                                  |      | |   chrome.storage.sync      |  |
|                                  |      | +----------------------------+  |
+----------------------------------+      +---------------------------------+
```

*   **`manifest.json`**: Defines permissions, injects `content.js` at `document_start`, and registers the background worker and options page.
*   **`background.js`**: A minimal service worker. Its sole purpose is to create the right-click context menu and, when clicked, execute the globally exposed `window.startRecognition()` function in the content script.
*   **`content.js`**: The brain of the extension. It runs on every page and handles all DOM interaction, UI management, and speech recognition logic.

## 2. `content.js` - The Core Logic Engine

This script is wrapped in an IIFE to prevent namespace collisions. It operates as a state machine, reacting to user focus and clicks.

### 2.1. UI Lifecycle: A Robust State Machine

The icon's appearance and disappearance are no longer based on fragile timers. They are now handled by a robust, event-driven state machine.

**Key Event Handlers:**

*   `document.addEventListener('focusin', ..., true)`: A capturing listener that triggers whenever *any* element on the page gains focus.
*   `document.addEventListener('focusout', ..., true)`: A capturing listener that triggers whenever focus leaves an element.
*   `document.addEventListener('keydown', ...)`: A listener for the `Escape` key shortcut.

**The Lifecycle Flow:**

```ascii
                                      +--------------------------------+
                                      | User focuses an editable field |
                                      +---------------+----------------+
                                                      |
                                                      v
+-----------------------+             +--------------------------------+
|      focusin Event    |------------>| findEditableNode(event.target) |
+-----------------------+             +----------------+---------------+
                                                       | (returns true)
                                                       v
                                      +--------------------------------+
                                      |       createAndShowUI()        |
                                      | - Create/show icon, buttons    |
                                      | - Call updateFloatingIconPosition()|
                                      +--------------------------------+
                                                       |
                                                       | (User clicks away from field)
                                                       |
+-----------------------+             +--------------------------------+
|     focusout Event    |------------>| isInsideBolioUI(event.relatedTarget)? |
+-----------------------+             +----------------+---------------+
                                                       | (returns false)
                                                       v
                                      +--------------------------------+
                                      |          hideBolioUI()         |
                                      | - Hide UI, stop recognition    |
                                      +--------------------------------+
```

*   **`focusout` Logic**: The `setTimeout` race condition has been eliminated. The handler now inspects `event.relatedTarget`. If the focus is moving to an element that is *not* part of the Bolio UI, it hides the UI. This is instantaneous and reliable.

### 2.2. Quadrant-Based UI Positioning

The `updateFloatingIconPosition` function is now truly "smart." It calculates available space and places the UI in the optimal quadrant to avoid going off-screen or obscuring the text field.

**The Logic:**

1.  Force a browser reflow (`bolioUIGroup.offsetWidth;`) to get accurate UI dimensions.
2.  Get the text field's `getBoundingClientRect()`.
3.  Calculate available space above, below, and to the right of the field.
4.  Follow a priority system: **Above > Below > Right > Left**.
5.  Perform final boundary checks to ensure the UI never renders outside the viewport.

```ascii
      +--------------------------------------------------+
      |                   VIEWPORT                       |
      |                                                  |
      |   (1. Enough space ABOVE?)                       |
      |   +------------------+                           |
      |   | [Bolio UI Group] |                           |
      |   +------------------+                           |
      |   +------------------------------------------+   |
      |   |              TEXT FIELD                  |   |
      |   +------------------------------------------+   |
      |   | [Bolio UI Group] |                           |
      |   +------------------+                           |
      |   (2. Else, enough space BELOW?)                 |
      |                                                  |
      |   (3. Else, place RIGHT) (4. Else, place LEFT)   |
      +--------------------------------------------------+
```

### 2.3. Speech Recognition: The Core Loop (Corrected)

The `handleRecognitionEnd` function contains the most critical logic for the extension's two modes.

**The Decisive Logic Flow:**

```ascii
+--------------------------+
|   recognition.onend      |
|   (Speech service stops) |
+------------+-------------+
             |
             v
+------------------------------------------------+
| const shouldStopPermanently =                  |
|     userInitiatedStop || !isContinuousMode;    |
+--------------------------+---------------------+ 
                           |
         +-----------------+------------------+
         | (true)                             | (false)
         v                                    v
+--------------------------+      +-------------------------------------+
| STOP PERMANENTLY         |      | CONTINUE LOOPING                    |
| - Hide UI                |      | - This is Continuous Mode           |
| - Set icon to inactive   |      | - The stop was a network blip       |
| - Hide 'X' button        |      |   or temporary pause.               |
| - Hide "Listening..."    |      | - UI remains active.                |
| - recognition = null;    |      | - Call recognition.start() again.   |
+--------------------------+      +-------------------------------------+
```

This simple boolean (`shouldStopPermanently`) cleanly separates the behavior:
*   **Simple Mode:** `!isContinuousMode` is `true`, so it always stops permanently after one result.
*   **Continuous Mode:** `!isContinuousMode` is `false`, so it only stops if the user explicitly clicks 'X' or focuses out (`userInitiatedStop` becomes `true`).

### 2.4. Key Technical Decisions & Rationale

*   **`event.relatedTarget`**: Using this property in the `focusout` event is the correct, modern way to handle focus transitions without race conditions. It provides an immediate reference to where focus is going.
*   **Forced Reflow (`element.offsetWidth`)**: This is a pragmatic solution to a common browser rendering problem. It forces the browser's rendering engine to perform pending layout calculations, ensuring that subsequent dimension reads are accurate.
*   **Single `keydown` Listener**: A single listener on the `document` is more performant than adding/removing listeners. It checks if the UI is active before acting, ensuring it doesn't interfere with the host page's shortcuts.
*   **CSS for State**: All visual states (active/inactive icon, badge visibility, "Listening..." text) are controlled by adding or removing CSS classes and inline styles. This separates logic from presentation.

### 2.5. UI Polish and Accessibility

*   **Badge UI**: The mode toggle is styled as a badge using `position: absolute` relative to the UI group, with a higher `z-index` to ensure it sits on top of the main icon.
*   **Escape Key**: The `keydown` listener checks `e.key === 'Escape'` and whether the UI is currently active before preventing default browser actions and stopping the recognition. This provides a crucial accessibility and power-user feature.