# Changelog

## 0.4.1 (2025-07-11)

*   **Critical Bug Fixes & UI/UX Refinements:**
    *   **Resolved `TypeError: Cannot read properties of null (reading 'appendChild')`:** Fixed by delaying initial UI container creation until `DOMContentLoaded` event, ensuring `document.body` is available.
    *   **Improved Icon Visibility on Initial Focus:** Content script (`content.js`) now injected at `document_start` via `manifest.json` to ensure early loading and event listener activation. `background.js` updated to remove redundant script injection.
    *   **Enhanced UI Element Positioning Reliability:** Implemented `requestAnimationFrame` for UI positioning calculations to ensure elements are rendered before dimensions are read. Added forced reflow (`bolioUIGroup.offsetWidth;`) for more accurate dimension retrieval.
    *   **Debugging Aids:** Added temporary `!important` to CSS dimensions and visual borders to UI elements (`bolio-ui-group`, `bolio-floating-icon`) for easier debugging of layout issues.
    *   **Icon Asset Path Correction:** Corrected references to `bolio-logo.png` in `content.js` and `manifest.json`.
    *   **Continuous Mode Stability:** Ignored `no-speech` errors in continuous mode to prevent premature stopping of dictation.

## 0.4.0 (2025-07-11)

*   **UI/UX Overhaul:** Completely redesigned the user interaction model for the speech-to-text feature.
*   **Reliable Icon Visibility:** The microphone icon now reliably appears on focus for any editable field.
*   **Clear UI States:** The icon now has clear `active` (colored) and `inactive` (grey) states to indicate whether the microphone is listening.
*   **Click-to-Activate:** Dictation now only starts when the user explicitly clicks the microphone icon.
*   **Improved Mode Logic:** "Normal" and "Continuous" speech modes now have distinct and predictable behaviors.
*   **Reliable "Kill Switch":** The `X` button in continuous mode now reliably stops speech recognition.
*   **Intelligent UI Hiding:** The UI now automatically hides when the user clicks or focuses outside the text field, preventing clutter.
*   **Removed `mouseover` dependency:** UI appearance is now managed by `focus` and `click` events for a more stable experience.

## 0.3.3 (2025-07-11)

*   Fixed floating icon positioning to be relative to the text box and avoid obscuring text.
*   Implemented feature to add a space before dictation if text already exists.

## 0.3.2 (2025-07-11)

*   Implemented floating UI (icon, kill button, mode toggle).
*   Improved floating icon positioning and visibility.
*   Made options page accessible via extension icon click.
*   Restored right-click context menu for dictation activation.
*   Fixed continuous mode text repetition.
*   Fixed overwrite vs. append logic for text insertion.
*   Refined microphone management (stopping on deselect).

## 0.3.1 (2025-07-10)

*   Fixed `content.js` re-declaration error by wrapping in IIFE.
*   Improved text insertion logic for various input types (including dispatching input/change events).
*   Addressed re-activation issues after losing focus.
*   Implemented text box highlighting during dictation.
*   Improved UI hint positioning near the active text box.


## 0.3.0 (2025-07-10)

*   Implemented options page for user configuration.
*   Added language selection for dictation.
*   Added continuous dictation mode option.
*   Added choice to append or replace text.

## 0.2.0 (2025-07-10)

*   Enhanced user experience and feedback.
*   Added styled on-page status notifications.
*   Added manual stop command (Esc key).
*   Improved error handling and reporting.

## 0.1.0 (2025-07-10)

*   Initial release.
*   Implemented core functionality (MVP).
*   Added context menu item to start dictation.
*   Added speech recognition and text insertion.
