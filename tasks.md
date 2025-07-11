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
*   [x] Fix: Floating icon positioning (now relative to text box and avoids obscuring text).
*   [x] Fix: Continuous mode text repetition.
*   [x] Fix: Overwrite vs. append logic for text insertion.
*   [x] Feature: Add space before dictation if text already exists.
*   [x] Improvement: Make options page accessible via extension icon click.
*   [x] Restore: Right-click context menu for dictation activation.

## Phase 6: Final Polish & Release Prep
*   [ ] Update `changelog.md` with all changes.
*   [ ] Review and refactor code for clarity and performance.
*   [ ] Test across different websites (Gmail, Google Docs, etc.).
*   [ ] Prepare for submission to Chrome Web Store.

## Phase 7: UI/UX Overhaul & Interaction Refinement

This phase focuses on a complete redesign of the user interaction model for the speech-to-text feature based on user feedback. The goal is to make the UI intuitive, predictable, and reliable.

### User Stories & Desired Behavior

**Story 1: Icon Visibility & Initial State**

*   **As a user,** when I focus on any editable text field (input, textarea, contenteditable div).
*   **I want to see** a greyed-out (inactive) Bolio microphone icon appear near the text field.
*   **So that I know** I can click it to start dictation.
*   **Acceptance Criteria:**
    *   The icon appears reliably on `focusin` or `click` for any editable element.
    *   The icon is initially grey (`inactive` state), indicating that the microphone is off.
    *   This addresses the bug where the icon doesn't appear on page load/initial focus.

**Story 2: Activating Dictation (Normal Mode)**

*   **As a user,** when I click the greyed-out microphone icon.
*   **I want** the icon to turn colored (`active` state) and for Bolio to start listening for my speech in "Normal" (single-shot) mode.
*   **So that I can** dictate a short piece of text.
*   **Acceptance Criteria:**
    *   Clicking the `inactive` icon starts speech recognition.
    *   The icon changes color to indicate it's `active`.
    *   After the first final speech result (i.e., after a pause), the recognition stops.
    *   The icon turns back to grey (`inactive`).
    *   The dictated text is inserted into the text field.

**Story 3: Activating Dictation (Continuous Mode)**

*   **As a user,** when I want to switch to continuous dictation.
*   **I want to be able** to toggle to "Continuous" mode via the floating UI.
*   **When I click** the microphone icon in this mode, it turns colored (`active`) and listens continuously.
*   **So that I can** dictate for a longer period without the microphone turning off after every pause.
*   **Acceptance Criteria:**
    *   A toggle button (`C`/`S`) is present in the floating UI.
    *   Clicking the `active` icon in "Continuous" mode starts recognition that does not stop on pauses.
    *   The icon remains colored (`active`) as long as it's listening.

**Story 4: Stopping Dictation Manually (The "Kill Switch")**

*   **As a user,** when I am in "Continuous" mode.
*   **I want to see** a cross icon (`X`) next to the active microphone icon.
*   **When I click** the cross icon, I want the speech recognition to stop *permanently* for that session and the microphone icon to turn grey (`inactive`).
*   **So that I have** explicit control to end the dictation.
*   **Acceptance Criteria:**
    *   The `X` button is only visible when the microphone is `active` in "Continuous" mode.
    *   Clicking the `X` button calls `recognition.stop()` and prevents it from automatically restarting.
    *   The microphone icon immediately turns grey (`inactive`).
    *   The `X` button disappears.

**Story 5: Deactivating the UI on Focus Loss**

*   **As a user,** when I click or move focus outside of the text field where I was dictating.
*   **I want** the Bolio UI (microphone icon and any buttons) to disappear.
*   **And I want** any active speech recognition to stop.
*   **So that** the UI doesn't clutter the page when I'm not using it.
*   **Acceptance Criteria:**
    *   On `focusout` or a `click` outside the active element and the Bolio UI, `stopRecognition()` is called.
    *   The entire floating UI is hidden.
    *   If the user re-focuses the same text field, the grey icon reappears (as per Story 1).

**Story 6: Interaction with "Replace Text" Option**

*   **As a user,** when I have the "Replace existing text" option enabled.
*   **I want** the text field to be cleared *only* when I start a new dictation session by clicking the grey icon.
*   **In continuous mode,** I expect the text to be continuously replaced with the new transcript.
*   **So that** the behavior is predictable and I don't lose my work unexpectedly.
*   **Acceptance Criteria:**
    *   **Append Mode:** Text is always appended with a leading space if needed.
    *   **Replace Mode (Normal):** The field is cleared on recognition `start`, and the new text is inserted.
    *   **Replace Mode (Continuous):** The field is cleared on recognition `start`, and the text is continuously updated with the latest transcript. The field is NOT cleared on automatic restarts of the continuous recognition.

### Phased Implementation Plan

**Phase 7.1: Stabilize Icon Visibility & State Management**
1.  **Goal:** Fix the core bug of the icon not appearing and establish a reliable state machine for the UI (`inactive`, `active`).
2.  **Tasks:**
    *   [x] Refactor `handleEditableFocus` and related event listeners (`focusin`, `click`, `mouseover`) to reliably show a **greyed-out** icon next to any focused editable field.
    *   [x] Create distinct CSS classes (`.bolio-inactive`, `.bolio-active`) that control the icon's color.
    *   [x] Modify the `startBolioDictation` and `stopRecognition` functions to toggle these classes on the icon.

**Phase 7.2: Refine "Normal" vs. "Continuous" Mode Logic**
1.  **Goal:** Implement the distinct behaviors for the two speech modes as defined in the user stories.
2.  **Tasks:**
    *   [x] **Normal Mode:** Ensure recognition stops automatically after the first final result and the icon becomes `inactive`.
    *   [x] **Continuous Mode:** Ensure recognition *only* stops when the "Kill Switch" is used, the text field loses focus, or an error occurs.
    *   [x] **Kill Switch:** Implement the `X` button logic. It must only appear in continuous mode when the mic is active. Its click handler must permanently stop the recognition loop.

**Phase 7.3: Clean Up UI on Focus Loss**
1.  **Goal:** Make the UI non-intrusive by hiding it when it's not needed.
2.  **Tasks:**
    *   [x] Refactor the `focusout` and `click` event listeners.
    *   [x] Ensure that if focus moves to an element that is *not* the editable field and *not* part of the Bolio UI, the UI is hidden and recognition is stopped.

**Phase 8: Addressing Persistent UI Visibility & Positioning Issues**

This phase specifically targets the remaining critical bugs related to the Bolio icon's visibility and positioning, particularly the `offsetWidth: 0, offsetHeight: 0` problem.

### Problem Statement
Despite previous attempts, the Bolio icon and its associated UI elements are not consistently visible or correctly positioned on the webpage. Console logs indicate that the `bolioUIGroup` often reports `offsetWidth: 0, offsetHeight: 0`, leading to incorrect positioning and rendering issues. The extension also requires a right-click to activate in some scenarios, suggesting `content.js` might not be fully initialized or its listeners are not consistently active on initial page load/focus.

### Root Causes (Hypothesized)
1.  **Timing of DOM Access:** When `content.js` runs at `document_start`, `document.body` might not be fully available, leading to `appendChild` errors. Even after fixing this, reading `offsetWidth`/`offsetHeight` immediately after appending elements might occur before the browser has had a chance to render and calculate dimensions.
2.  **CSS Application Issues:** External CSS from the host page or subtle issues in `styles.css` might be preventing the `bolio-ui-group` or `bolio-floating-icon` from acquiring their intended dimensions.
3.  **Event Listener Reliability:** The `focusin` event might not be consistently triggering or fully initializing the UI for elements that are already focused on page load.

### Plan to Resolve

**Phase 8.1: Ensure Robust UI Element Creation and Dimension Calculation**
*   **Goal:** Guarantee that UI elements are created, appended, and have correct dimensions before positioning.
*   **Tasks:**
    *   [x] **Delay Initial UI Container Creation:** Move the `createBolioUIContainer()` call to a `DOMContentLoaded` event listener in `content.js` to ensure `document.body` is available.
    *   [x] **Force Reflow and `requestAnimationFrame` for Positioning:** Ensure `updateFloatingIconPosition()` is called within `requestAnimationFrame` after elements are appended, and include a forced reflow (`bolioUIGroup.offsetWidth;`) to prompt the browser to calculate dimensions.
    *   [x] **Set Fixed Dimensions with `!important` (Debugging Step):** Temporarily add `!important` to `width` and `height` properties of `.bolio-floating-icon`, `.bolio-kill-button`, and `.bolio-mode-toggle` in `styles.css` to rule out external style conflicts. (Will be removed after debugging).
    *   [x] **Add Debugging Borders:** Add temporary borders to `.bolio-ui-group` and `.bolio-floating-icon` in `styles.css` to visually inspect their rendered dimensions.

**Phase 8.2: Refine `handleEditableFocus` and UI Lifecycle for Initial Load**
*   **Goal:** Ensure the icon appears consistently on initial focus, even for elements already focused on page load.
*   **Tasks:**
    *   [x] **Check `document.activeElement` on Script Load:** On `DOMContentLoaded`, check if `document.activeElement` is an editable element and, if so, trigger `handleEditableFocus` for it.

**Phase 8.3: Icon Asset and Styling Consistency**
*   **Goal:** Ensure the icon image is correctly loaded and displayed.
*   **Tasks:**
    *   [x] **Verify `bolio-logo.png` Path:** Confirm `content.js` and `manifest.json` correctly reference `images/bolio-logo.png`.
    *   [x] **Adjust `styles.css` for Image Display:** Ensure `.bolio-floating-icon` has appropriate `background-size`, `background-repeat`, and `background-position` for the image, and that `color`, `font-weight`, `font-size` are reset/transparent.

**Phase 8.4: Comprehensive Testing and Debugging**
*   **Goal:** Systematically identify and resolve remaining UI visibility and positioning issues.
*   **Tasks:**
    *   [ ] **User Testing and Console Log Analysis:** Re-test the extension on various websites (e.g., Gmail, Google Docs, general input fields) and provide detailed console logs, specifically looking for `UI Group dimensions` and any new errors.
    *   [ ] **Developer Tools Inspection:** Guide user to inspect the `bolio-ui-group` and `bolio-floating-icon` elements in the browser's Developer Tools (Elements tab -> Computed styles, Layout) to understand their actual rendered dimensions and positioning.
    *   [ ] **Isolate CSS Conflicts:** If dimensions are still 0, investigate potential CSS conflicts from the host page that might be overriding our styles. (This might involve temporarily disabling host page CSS or using more specific CSS selectors).
    *   [ ] **Refine Positioning Algorithm:** Based on observed behavior and dimensions, adjust the `updateFloatingIconPosition` logic further to ensure optimal placement.

## Phase 9: Documentation Generation
*   [x] Create `documentation_general.md`
*   [ ] Create `documentation_technical.md`

## Phase 10: Final Polish & Release Prep
*   [ ] Update `changelog.md` with all changes.
*   [ ] Review and refactor code for clarity and performance.
*   [ ] Test across different websites (Gmail, Google Docs, etc.).
*   [ ] Prepare for submission to Chrome Web Store.
