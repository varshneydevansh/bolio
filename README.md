<div align="center">
  <img src="images/bolio-logo.png" alt="Bolio Icon" width="128">
  <h1>Bolio</h1>
  <p>A universal voice-to-text browser extension.</p>
</div>

## Overview

Bolio is a powerful and intuitive browser extension that brings voice-to-text capabilities to any editable text field on the web. Say goodbye to typing and effortlessly dictate your thoughts, emails, messages, and more.

## Features

### Core Voice-to-Text Functionality
- **Universal Compatibility**: Works with input fields, text areas, and content-editable elements across various websites.
- **Two Dictation Modes**:
  - **Normal Mode**: Ideal for short bursts of dictation, automatically stopping after a pause.
  - **Continuous Mode**: Keeps the microphone active for extended dictation sessions, perfect for longer texts.
- **Append or Replace Text**: Choose whether new dictation appends to existing text or replaces it.

### Intuitive User Interface (UI)
- **Contextual Microphone Icon**: A subtle, greyed-out microphone icon appears near any active editable text field, indicating Bolio is ready.
- **Visual Feedback**: The icon changes color (becomes active) when dictation starts, providing clear visual cues.
- **Kill Switch**: In continuous mode, a prominent 'X' button allows for immediate and permanent stopping of dictation.
- **Mode Toggle**: Easily switch between Normal and Continuous dictation modes directly from the floating UI.
- **Smart Positioning**: The UI elements intelligently position themselves near the text field, adapting to screen edges and avoiding obstruction.

### Enhanced User Experience
- **Reliable Activation**: The microphone icon appears consistently on initial focus or click of an editable field.
- **Seamless Integration**: Designed to blend naturally with your browsing experience.
- **Error Handling**: Provides clear notifications for microphone issues or speech recognition errors.

## Installation

### Chrome/Edge/Opera
1. Download the extension files (or clone the repository).
2. Go to your browser's extension page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Opera: `opera://extensions/`
3. Enable "Developer mode".
4. Click "Load unpacked" and select the extension directory.

## Usage

### Starting Dictation
1. Navigate to any webpage with an editable text field (e.g., a search bar, email composer, comment section).
2. Click or focus on the text field. A grey Bolio microphone icon should appear nearby.
3. Click the grey microphone icon to start dictation. It will turn colored, indicating it's listening.

### Switching Modes
- Click the 'C' (Continuous) or 'S' (Simple/Normal) button next to the microphone icon to toggle between dictation modes.

### Stopping Dictation
- In Normal mode, dictation automatically stops after a pause.
- In Continuous mode, click the 'X' button next to the microphone icon to stop dictation.
- Alternatively, press the `Esc` key to stop dictation in either mode.

### Options
- Right-click the Bolio extension icon in your browser toolbar and select "Options" to configure language, default dictation mode, and text replacement behavior.

## How It Works

Bolio operates as a content script injected into webpages. It leverages the Web Speech API for speech recognition and dynamically inserts transcribed text into active editable elements.

### Key Architectural Aspects
- **Early Content Script Injection**: `content.js` is injected at `document_start` to ensure its event listeners are active as early as possible, allowing for immediate UI response on focus.
- **Dynamic UI Creation**: UI elements (microphone icon, mode toggle, kill button) are created and appended to the DOM only when an editable field is focused, minimizing resource usage.
- **Robust Positioning Logic**: Utilizes `requestAnimationFrame` to ensure UI elements are fully rendered before calculating their positions, preventing layout issues and ensuring accurate placement relative to the active text field.
- **Event-Driven Interaction**: Relies on `focusin`, `focusout`, and `click` events to manage the visibility and state of the UI, providing a responsive and intuitive user experience.
- **Global Exposure for Background Script**: The `startRecognition` function is exposed globally to allow the background script to initiate dictation via the context menu.

## Technical Details

### Files Structure
- **manifest.json**: Defines the extension's properties, permissions, and content script injection.
- **background.js**: Handles context menu creation and communicates with the content script to initiate dictation.
- **content.js**: The main script injected into webpages, responsible for UI creation, speech recognition, and text insertion.
- **options.html & options.js**: Provide a user interface for configuring extension settings.
- **styles.css**: Styles for all dynamically created UI elements.
- **images/**: Contains the extension icons (`bolio-16.png`, `bolio-48.png`, `bolio-128.png`) and the main `bolio-logo.png` for the floating UI.

### Permissions
- **contextMenus**: To add a "Start Dictation" option to the right-click menu.
- **activeTab**: To interact with the currently active tab.
- **scripting**: To inject and execute scripts in web pages.
- **storage**: To save user preferences (language, continuous mode, replace text).

## Support & Feedback

If you encounter any issues or have suggestions for improvements, please open an issue on the GitHub repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and improvements.
