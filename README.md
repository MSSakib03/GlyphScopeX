# GlyphScopeX — Explore & Extract Glyphs!

**GlyphScopeX** is a specialized tool to **extract**, **inspect**, and **export** individual glyphs from font files. It renders every character as a standalone **SVG card**, allowing you to save them as high-quality images (SVG/PNG) individually or in bulk. It is a complete toolkit for designers and developers, offering **font subsetting**, **sprite sheet** generation, **webfont CSS** creation, and precise inspection tools in a fast, browser-based interface.

🌐 **Available as:** Web Application & Standalone Desktop App.
📂 **Supported Formats:** `.ttf`, `.otf`, `.woff`.
🔒 **Privacy:** 100% Offline & Client-side processing.

---

## 🚀 Getting Started

### 🌐 1. Web Application (Recommended)

The fastest way to use GlyphScopeX. No installation required. This version is always up-to-date with the latest features.

👉 **[Launch GlyphScopeX Web](https://glyphscopex.vercel.app/)**

### 🖥️ 2. Desktop Application (Offline)

If you prefer working offline, you can download the standalone Windows application (**v1.2.0**).

* **[Download Latest Release](https://github.com/MSSakib03/GlyphScopeX/releases/latest)**
* **Available Formats:**
* `Setup.exe` (Installer)
* `Portable.exe` (Run without installing)
* `Unpacked.zip` (For advanced users)



### 👨‍💻 3. Run from Source (For Developers)

If you wish to modify the code or contribute:

```bash
git clone https://github.com/MSSakib03/GlyphScopeX.git
cd GlyphScopeX
npm install
npm run dev

```

---

## ✨ Key Features

### 💎 Core: Extraction & Smart Navigation

The heart of GlyphScopeX breaks down a font file into its constituent vectors.

* **Visual Glyph Cards:** Every character is rendered as a separate, interactive card using SVG paths.
* **Bulk Extraction:** Download the **entire font** or specific selections as a ZIP file containing individual SVG or PNG images.
* 🔍 **Smart Search:** Advanced search functionality supports **single characters** (e.g., typing 'A'), **hex codes** (U+0041), or **glyph names** with customizable filters.
* ⌨️ **Keyboard Navigation:** Navigate, select, and manage glyphs quickly using Arrow keys (`Left`/`Right` to move, `Space` to select).

### 🎨 Visual Editor & Automation

Customize glyphs before export to fit your design needs.

* **Transform:** Scale, Rotate, and Position (X/Y) glyphs within their canvas.
* 🖼️ **Auto Canvas Resize:** Automatically adjust glyph canvas dimensions based on **maximum glyph size** or **font metrics** (Ascender/Descender) to ensure nothing gets cut off.
* **Styling:** Toggle between Solid Fill, Outline (Stroke), and Negative modes.
* **Clipping Detection:** Automatically scans and flags characters that are cut off by the bounding box.

### ⚖️ Analysis, Comparison & Testing

Tools for font designers and typographers.

* ⚖️ **Glyph & Font Comparison:** Overlay and compare glyphs from two different fonts to analyze shape and baseline differences precisely.
* ✍️ **Type Tester & Export:** Test fonts with custom text interactively and export the preview directly as SVG or PNG images.

### 🛠️ Developer & Game Tools

Advanced features for Web and Game Development workflows.

* ✨ **CSS Generator:** Generate web-ready `@font-face` CSS snippets with utility classes for your subsets instantly.
* ✂️ **Font Subsetting:** Create optimized, lightweight font files (`.ttf`, `.otf`, `.woff`) containing *only* the glyphs you select.
* 🖼️ **Advanced Sprite Sheet Export:** Export selected glyphs as a unified **Sprite Sheet** (Texture Atlas) in SVG or PNG formats, along with a **JSON** metadata file for easy mapping in game engines.

---

## 🛠️ Tech Stack

* ⚛️ **Frontend:** React 19, Vite
* 🎨 **Styling:** Tailwind CSS
* 🔤 **Font Engine:** opentype.js
* 📦 **File Handling:** JSZip, FileSaver.js
* ✨ **Icons:** lucide-react
* 🖥️ **Desktop Build:** Electron

---

## 📁 Project Structure

```text
src/
├── 📂 assets/           # Static assets
├── 🧩 components/       # UI Components
│   ├── BlockSection.jsx
│   ├── GlyphCard.jsx
│   ├── PaginationControls.jsx
│   ├── Sidebar.jsx
│   ├── TypeTester.jsx
│   └── UIComponents.jsx
├── ⚙️ utils/            # Logic (Export, Sprite, Subset, CSS Gen)
├── 🚀 App.jsx           # Main application logic
├── 📄 blocks.js         # Unicode block definitions
├── 🏷️ unicodeNames.js   # Unicode name mapping
└── 🏁 main.jsx          # Entry point

```

---

## 🤝 Contributing

Contributions are welcome!
🐛 Found a bug? 💡 Have a feature idea?
Feel free to [Open an Issue](https://github.com/MSSakib03/GlyphScopeX/issues) or submit a Pull Request.

---

## 📜 License

Distributed under the **GNU General Public License v3.0 (GPLv3)**. See `LICENSE` for more information.

---

*Created with ❤️ by **MS Sakib***