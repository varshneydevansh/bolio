# Changelog

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
