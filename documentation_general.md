# Bolio: Your Voice-to-Text Companion

<div align="center">
  <img src="images/bolio-logo.png" alt="Bolio Icon" width="128">
  <h1>Bolio</h1>
  <p>A universal voice-to-text browser extension.</p>
</div>

## What is Bolio?

Imagine you're writing an email, filling out a form, or chatting online, and instead of typing, you could just speak your thoughts, and they magically appear as text. That's exactly what Bolio does! It's a smart little helper that lives in your web browser, turning your spoken words into written text in almost any text box you encounter on the internet.

## How Does Bolio Work for You?

Bolio is designed to be super easy to use. It quietly waits in the background until you need it.

### 1. Ready to Listen (The Grey Microphone)

When you click inside any text box on a webpage (like a search bar, an email writing area, or a comment section), Bolio notices! It will then show a small, **grey microphone icon** right near where you're typing. This grey icon is Bolio's way of saying, "Hey, I'm here and ready if you need me!"

```
+---------------------+
| Your Text Box       |
+---------------------+
                      [Mic] <--- Grey Microphone Icon
```

### 2. Start Speaking! (The Colored Microphone)

To start dictating, simply **click on that grey microphone icon**. As soon as you click it, the icon will change color (it will turn blue, or whatever color we decide for "active"!). This means Bolio is now actively listening to you.

```
+---------------------+
| Your Text Box       |
+---------------------+
                      [Mic] <--- Colored Microphone Icon (Listening!)
```

Now, just speak clearly into your microphone, and watch your words appear in the text box!

### 3. Two Ways to Dictate: Normal vs. Continuous

Bolio has two main ways it can listen to you, depending on what you're trying to do:

#### a) Normal Mode (For Short Sentences)

*   **How it works:** In "Normal" mode, Bolio listens for a short phrase or sentence. Once it detects a pause in your speech (like when you finish a sentence), it will automatically stop listening, and the microphone icon will turn back to grey.
*   **When to use it:** This is great for quick replies, filling out single fields, or dictating one sentence at a time.

```
Flow: Normal Dictation
+-------------------+     +-------------------+     +-------------------+
| Click Grey Mic    | --> | Speak (Mic Active)| --> | Pause (Mic Stops) |
| (Mic turns Active)|     |                   |     | (Mic turns Grey)  |
+-------------------+     +-------------------+     +-------------------+
```

#### b) Continuous Mode (For Longer Texts)

*   **How it works:** In "Continuous" mode, Bolio keeps listening even if you pause for a moment. It's designed for longer dictation sessions, like writing a whole paragraph or an entire email. The microphone icon will stay colored as long as you're in this mode and the text box is active.
*   **When to use it:** Use this when you have a lot to say and don't want Bolio to stop listening after every short break.

```
Flow: Continuous Dictation
+-------------------+     +-------------------+     +-------------------+
| Click Grey Mic    | --> | Speak (Mic Active)| --> | Pause (Mic Active)|
| (Mic turns Active)|     |                   |     | (Keeps Listening) |
+-------------------+     +-------------------+     +-------------------+
```

### 4. Switching Between Modes (The "C" / "S" Button)

Next to the microphone icon, you'll see a small button that says either "C" (for Continuous) or "S" (for Simple/Normal). Just click this button to switch between the two dictation modes.

```
+---------------------+
| Your Text Box       |
+---------------------+
                      [Mic] [C] <--- Click 'C' to switch to 'S' (and vice-versa)
```

### 5. Stopping Dictation (The "X" Button)

If you're in "Continuous" mode and you want Bolio to stop listening, you'll see a small **"X" button** next to the microphone icon. Clicking this "X" button will immediately stop the dictation, and the microphone icon will turn back to grey.

```
+---------------------+
| Your Text Box       |
+---------------------+
                      [Mic] [X] <--- Click 'X' to stop Continuous Dictation
```

You can also press the `Esc` key on your keyboard at any time to stop dictation, regardless of the mode.

### 6. What Happens When You Move Away?

If you click outside the text box where Bolio is active, or if you switch to another tab, Bolio is smart enough to know you're done. It will automatically hide its icons and stop listening, keeping your screen clean and your privacy secure.

## Installation (Getting Bolio into Your Browser)

Bolio is a browser extension, which means you need to add it to your web browser. Here's how:

### For Chrome, Edge, or Opera:

1.  **Download Bolio:** You'll get the Bolio files (usually in a `.zip` file). Unzip them into a folder on your computer.
2.  **Open Extensions Page:**
    *   **Chrome:** Type `chrome://extensions/` into your browser's address bar and press Enter.
    *   **Edge:** Type `edge://extensions/` into your browser's address bar and press Enter.
    *   **Opera:** Type `opera://extensions/` into your browser's address bar and press Enter.
3.  **Enable Developer Mode:** On the extensions page, look for a toggle switch labeled "Developer mode" and turn it on.
4.  **Load Bolio:** Click the "Load unpacked" button (or similar) and select the folder where you unzipped the Bolio files.

That's it! Bolio should now appear in your list of extensions and be ready to use.

## Need to Change Settings?

You can customize Bolio's behavior! Right-click on the Bolio icon in your browser's toolbar (usually near the address bar) and select "Options". Here, you can:

*   Choose the **language** you'll be speaking in.
*   Set whether you prefer "Normal" or "Continuous" mode as your **default**.
*   Decide if Bolio should **add new text** to what's already in the box, or **replace** it entirely.

## Support & Feedback

If you have any questions, run into any issues, or have ideas to make Bolio even better, please reach out! You can usually find a "Support" or "Issues" link on the place where you downloaded Bolio (like a GitHub page).

---
