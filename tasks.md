# Project Tasks

## Phase 1: Core Functionality (MVP)

*   [x] Create `manifest.json`
*   [x] Create `background.js`
*   [x] Create `images/icon-16.png`
*   [x] Create `images/icon-48.png`
*   [x] Create `images/icon-128.png`
*   [x] Implement context menu creation in `background.js`
*   [x] Implement script injection in `background.js`
*   [x] Implement speech recognition in `content.js`
*   [x] Implement text insertion in `content.js`

## Phase 2: Enhanced User Experience & Feedback

*   [x] Create `styles.css`
*   [x] Implement visual listening indicator
*   [x] Implement manual stop command (e.g., `Esc` key)
*   [x] Implement on-page status notifications ("Listening...", "Error...")

## Phase 3: Configuration & Advanced Features

*   [x] Create `options.html`
*   [x] Create `options.js`
*   [x] Implement options page to select transcription language
*   [x] Implement continuous dictation mode
*   [x] Implement choice to append or replace text
*   [x] Fix continuous speech repeated insertion bug
*   [x] Implement text box highlighting
*   [x] Position UI hint near active text box
*   [x] Ensure "Text inserted!" message is accurate

## Phase 4: Floating UI & Advanced Control
*   [x] Design and implement floating icon near active text field.
*   [x] Implement activation of dictation via floating icon click.
*   [x] Add "kill button" for continuous speech to floating UI.
*   [x] Explore options for switching continuous/simple speech via floating UI.
*   [x] Refine `background.js` and `content.js` to support new activation model.

## Phase 5: UI/UX Improvements & Bug Fixes
*   [ ] Fix: Floating icon not visible/reliable on initial text field focus.
*   [ ] Refine: Microphone management (stop on deselect) and continuous mode behavior.
*   [x] Fix: Continuous mode text repetition.
*   [x] Fix: Overwrite vs. append logic for text insertion.
*   [ ] Improve: `gr-app` and generic editable element handling.
*   [x] Improvement: Make options page accessible via extension icon click.
*   [x] Restore: Right-click context menu for dictation activation.
