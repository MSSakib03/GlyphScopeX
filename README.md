# GlyphForge -- Font Glyph Exporter

![License](https://img.shields.io/github/license/MSSakib03/glyphforge)
![Version](https://img.shields.io/github/v/release/MSSakib03/glyphforge)

**GlyphForge** is a modern, open-source tool to visualize, inspect, and
export glyphs from font files.\
It is available as both a **web application** and a **standalone desktop
application**.

You can load `.ttf` and `.otf` fonts, browse glyphs by Unicode blocks,
customize rendering settings, and export selected glyphs as SVG, PNG, or
ZIP --- completely offline.

------------------------------------------------------------------------

## ✨ Features

-   Desktop & Web support
-   📂 Load font files locally (`.ttf`, `.otf`)
-   🔍 Browse glyphs by Unicode blocks
-   📄 Strict pagination for high-performance rendering
-   🖱️ Multi-glyph selection (click, shift-click)
-   🎨 Custom export settings
    -   Scale, padding, rotation\
    -   Flip (horizontal / vertical)\
    -   Color control\
    -   Canvas width & height
-   🧪 Automatic glyph clipping / overflow detection
-   📦 Export formats: SVG, PNG, ZIP (bulk export)
-   🌗 Dark mode support
-   🖱️ Drag & drop font upload
-   ⚡ Fully client-side, 100% offline

------------------------------------------------------------------------

## 🧠 How It Works

-   Fonts are parsed using **opentype.js**
-   Glyphs are grouped using predefined Unicode block ranges
-   Rendering and exporting are done via SVG paths
-   PNG export is generated from SVG using canvas
-   All processing happens locally in your browser or desktop app

No files are uploaded anywhere.

------------------------------------------------------------------------

## 🚀 Getting Started

You can use GlyphForge either as a desktop application or in development
mode via browser.

### 📥 Option 1: Download Desktop App (Recommended)

1.  Visit the Releases page:
    https://github.com/MSSakib03/glyphforge/releases/latest\
2.  Download the latest `GlyphForge-vX.X.X-win-x64.zip` or `.exe` file.
3.  Extract the ZIP if needed.
4.  Run `GlyphForge.exe`.

------------------------------------------------------------------------

### 💻 Option 2: Run in Development Mode

#### Prerequisites

-   Node.js v18 or later
-   npm

#### Installation

``` bash
git clone https://github.com/MSSakib03/glyphforge.git
cd glyphforge
npm install
npm run dev
```

Then open in browser:

    http://localhost:5173

------------------------------------------------------------------------

## 🛠️ Tech Stack

-   **React** (functional components & hooks)
-   **Vite**
-   **Tailwind CSS**
-   **opentype.js**
-   **JSZip**
-   **file-saver**
-   **lucide-react**

------------------------------------------------------------------------

## 📁 Project Structure

``` text
src/
├── App.jsx        # Main application component
├── main.jsx       # React entry point
├── blocks.js      # Unicode block definitions
├── index.css      # Global styles (Tailwind)
├── App.css        # App-level styles
```

------------------------------------------------------------------------

## 🔒 Privacy

GlyphForge runs entirely on your machine.

-   No server
-   No tracking
-   No uploads

Your font files never leave your device.

------------------------------------------------------------------------

## 🧩 Use Cases

-   Font designers
-   UI / icon designers
-   Type foundries
-   Localization & Unicode analysis
-   Developers working with icon fonts

------------------------------------------------------------------------

## 🤝 Contributing

Contributions are welcome.

If you find a bug, have a feature idea, or want to improve the UI or
performance, feel free to open an issue or submit a pull request.

------------------------------------------------------------------------

## 📜 License

GNU General Public License v3.0 (GPLv3)
