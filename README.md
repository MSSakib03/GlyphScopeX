# GlyphForge – Font Glyph Exporter

**GlyphForge** is a modern, open-source, browser-based tool to visualize, inspect, and export glyphs from font files.

It allows you to load `.ttf` and `.otf` fonts, browse glyphs by Unicode blocks, customize rendering settings, and export selected glyphs as SVG or PNG — all directly in the browser.

---

## ✨ Features

- 📂 Load font files (`.ttf`, `.otf`) locally
- 🔍 Browse glyphs by Unicode blocks
- 📄 Strict pagination for high-performance rendering
- 🖱️ Multi-glyph selection (click, shift-click)
- 🎨 Custom export settings:
  - Scale, padding, rotation
  - Flip (horizontal / vertical)
  - Color control
  - Canvas width & height
- 🧪 Automatic glyph clipping / overflow detection
- 📦 Export formats:
  - SVG
  - PNG
  - ZIP (bulk export)
- 🌗 Dark mode support
- 🖱️ Drag & drop font upload
- ⚡ Fully client-side (no backend required)

---

## 🧠 How It Works

- Fonts are parsed using **opentype.js**
- Glyphs are grouped using predefined Unicode block ranges
- Rendering and exporting are done via SVG paths
- PNG export is generated from SVG using canvas
- All processing happens locally in your browser

No files are uploaded anywhere.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm

### Installation

```bash
git clone https://github.com/MSSakib03/glyphforge.git
cd glyphforge
npm install
```

### Run in Development Mode

```bash
npm run dev
```

Then open your browser and visit:

```
http://localhost:5173
```

---

## 🛠️ Tech Stack

- **React** (functional components & hooks)
- **Vite**
- **Tailwind CSS**
- **opentype.js**
- **JSZip**
- **file-saver**
- **lucide-react**

---

## 📁 Project Structure

```text
src/
├── App.jsx        # Main application component
├── main.jsx       # React entry point
├── blocks.js      # Unicode block definitions
├── index.css      # Global styles (Tailwind)
├── App.css        # App-level styles
```

---

## 🔒 Privacy

GlyphForge runs entirely in your browser.

- No server
- No tracking
- No uploads

Your font files never leave your machine.

---

## 🧩 Use Cases

- Font designers
- UI / icon designers
- Type foundries
- Localization & Unicode analysis
- Developers working with icon fonts

---

## 📜 License

This project is open-source.

You may use, modify, and distribute it according to the license specified in this repository.

---

## 🤝 Contributing

Contributions are welcome.

If you find a bug, have a feature idea, or want to improve the UI or performance, feel free to open an issue or submit a pull request.

---

## 🏷️ Project Name

**GlyphForge – Font Glyph Exporter**

A clean, extensible foundation for advanced font tooling.
