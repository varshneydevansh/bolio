# Bolio - Project Roadmap & Tasks

## 1. Project Goal

To transform Bolio into a robust, intuitive, and reliable voice-to-text browser extension that provides a seamless user experience, fixing all existing bugs and logical inconsistencies, with the ultimate goal of publishing it for wider use.

## 2. Core UI/UX Principles (The "Golden Path")

This describes the target user experience we are building.

### A. Icon Appearance & Activation
1.  **Immediate & Automatic:** The moment a user focuses on *any* editable text area, a **grey (inactive)** Bolio microphone icon must instantly appear near it. The right-click context menu will remain a secondary fallback option.
2.  **Intelligent Positioning:** The icon's position must be smart. It should not obscure the text field.
    *   Default position: Above the text field.
    *   Edge Case: If the text field is near the top of the viewport, the icon should appear *below* it.
    *   The positioning logic must be robust and work consistently across different websites.
3.  **Click to Activate:** Dictation *only* starts when the user clicks the grey icon. Upon clicking, the icon must:
    *   Change to its **full-color (active)** state.
    *   Display a prominent **'X' button** next to it, which allows the user to manually stop dictation at any time.

### B. Deactivation
1.  **Manual Stop:** Clicking the 'X' button will immediately stop dictation and return the icon to its grey, inactive state.
2.  **Focus Loss:** If the user clicks away or moves focus from the text field, dictation must stop *immediately*, and the entire Bolio UI (icon and buttons) must disappear.

## 3. Feature Breakdown & Logic

### A. Simple Mode ("S")
*   **Visual Cue:** The mode toggle button shows "S".
*   **Behavior:** Listens for a single phrase or sentence and stops automatically after a pause.
*   **Append Logic (Default):**
    *   If the text box is empty, insert the dictated text.
    *   If the text box has content, add a single leading space and then append the new text.
*   **Replace Logic (Option Enabled):**
    *   When dictation starts, *immediately* clear all existing content from the text box.
    *   Insert the new dictated text.

### B. Continuous Mode ("C")
*   **Visual Cue:** The mode toggle button shows "C". The main icon could have a small 'C' badge for clarity.
*   **Behavior:** Listens continuously, even during pauses, until explicitly stopped.
*   **Append Logic (Default):**
    *   Same as Simple Mode, but it will continue to append new phrases after each pause without needing to be re-activated.
*   **Replace Logic (Option Enabled):**
    *   When dictation starts for the *first time*, clear all existing content.
    *   Continuously update the text box with the latest transcript from the beginning. It should not clear the text on subsequent pauses, only on the initial activation.

## 4. Technical Implementation Plan

This is the step-by-step plan to implement the vision above.

### **Phase 1: Stabilize the Foundation (UI Lifecycle)**
*   **Goal:** Eliminate all race conditions and make the icon's appearance/disappearance 100% reliable.
*   **Tasks:**
    *   [ ] **Refactor `focusin` Handler:** Simplify the `findEditableNode` function. Prioritize `event.target` and ensure it reliably finds the correct editable element without being overly complex.
    *   [ ] **Fix `focusout` Handler:** Completely remove the `setTimeout` logic. Use the `event.relatedTarget` property to determine if focus is moving to another part of the page or within the Bolio UI itself. This will eliminate the race condition.
    *   [ ] **Consolidate Initial Focus Logic:** Create a single, clean function that runs on `DOMContentLoaded` to check `document.activeElement` and show the UI if necessary. This removes redundant code.

### **Phase 2: Implement Robust Positioning & Visuals**
*   **Goal:** Make the icon appear in the right place every time and reflect the current state accurately.
*   **Tasks:**
    *   [ ] **Guarantee UI Dimensions:** Before calculating position, ensure the UI elements have been rendered by the browser and have non-zero dimensions. This might involve a forced reflow or a more advanced check than the current `requestAnimationFrame`.
    *   [ ] **Implement Smart Positioning Algorithm:** Update `updateFloatingIconPosition` to include viewport edge detection. If `rect.top` is too small, position the icon below the element (`rect.bottom`).
    *   [ ] **Implement UI State Visuals:**
        *   Control the grey/color state via `inactive`/`active` CSS classes on the icon.
        *   Control the visibility of the 'X' button based on the `active` state.
        *   Implement the 'C'/'S' text and styling on the mode toggle button.

### **Phase 3: Refine Core Speech & Text Insertion Logic**
*   **Goal:** Ensure the dictation logic for all modes and options works exactly as described.
*   **Tasks:**
    *   [ ] **Implement "Add Space" Logic:** In the `handleRecognitionResult` function, before appending text, check if the existing `value` is not empty and does not end with a space.
    *   [ ] **Implement Replace Logic:** In `startRecognition`, check for `replaceTextMode`. If true, clear the `currentActiveElement`'s value at that moment.
    *   [ ] **Solidify Continuous Mode Loop:** Review the `onend` handler to ensure the continuous loop is robust and only broken by `userInitiatedStop` (clicking 'X' or focusing out).

### **Phase 4: Final Polish & Release Prep**
*   **Goal:** Prepare the extension for publishing.
*   **Tasks:**
    *   [ ] Review and refactor all code for clarity and performance.
    *   [ ] Test extensively across a wide range of websites (Gmail, Google Docs, social media, forums).
    *   [ ] Update `changelog.md` and `README.md` to reflect all the new improvements.
    *   [ ] Prepare for submission to web stores.

---
### **Current Focus: Phase 1 - Stabilize the Foundation (UI Lifecycle)**

**Next Step:** Fix the `focusout` race condition and simplify the `focusin` logic in `content.js`.