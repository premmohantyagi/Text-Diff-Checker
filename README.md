# Text Diff Checker

Compare two blocks of text and see line-by-line differences with word-level highlighting.

## Features

- **Side-by-Side Diff** — View original and modified text in synchronized, scrollable panels
- **Word-Level Highlighting** — See exactly which words changed within modified lines
- **Color-Coded Output** — Red for removed lines, green for added, striped background for empty padding
- **Dark / Light Theme** — Toggle between themes with automatic persistence via localStorage
- **Swap & Clear** — Quickly swap inputs or clear everything with one click
- **Copy Diff** — Copy the diff output in unified format (`- ` / `+ ` / `  ` prefixes)
- **Keyboard Shortcut** — Press `Ctrl+Enter` to instantly compare
- **Responsive Design** — Textareas stack on mobile, side-by-side on desktop

## Tech Stack

- HTML5, CSS3, JavaScript (vanilla)
- [Tailwind CSS](https://tailwindcss.com/) (via CDN)
- [Inter](https://fonts.google.com/specimen/Inter) font (Google Fonts)
- Custom Myers' diff algorithm implementation (no external dependencies)

## Project Structure

```
Text-Diff-Checker/
├── index.html   # Main page layout and markup
├── style.css    # Custom diff styling (line colors, word highlights, striped backgrounds)
├── diff.js      # Myers' diff algorithm — diffLines() and diffWords()
├── script.js    # UI logic, scroll sync, theme toggle, keyboard shortcuts
└── README.md
```

## Installation

Clone or download this repository into your web server's root directory:

```bash
git clone https://github.com/premmohantyagi/Text-Diff-Checker.git
```

Open `http://localhost/Text-Diff-Checker/` in your browser.

## License

MIT
