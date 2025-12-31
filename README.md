# GlyphForge -- Font Glyph Exporter
![License](https://img.shields.io/github/license/MSSakib03/glyphforge)
![Version](https://img.shields.io/github/v/release/MSSakib03/glyphforge)

**GlyphForge** is a specialized tool to **extract**, **inspect**, and **export** individual glyphs from font files. Unlike standard font viewers, it renders every character as a standalone **SVG card**, allowing you to save them as high-quality images (SVG/PNG) individually or in bulk. It also provide providing **font subsetting**, **sprite sheet** generation, clipping **error detection**, and per-glyph transformation tools in a fast, browser-based interface.

🌐 **Available as:** Web Application & Standalone Desktop App.
📂 **Supported Formats:** `.ttf`, `.otf`, `.woff`.
🔒 **Privacy:** 100% Offline & Client-side.

---

## ✨ Key Features

### 💎 Core: Glyph Extraction & Bulk Export

This is the heart of GlyphForge. It breaks down a font file into its constituent vectors.

* 🃏 **Visual Glyph Cards:** Every character is rendered as a separate, interactive card using SVG paths.
* 🏗️ **Bulk Extraction:**
* 👆 **Select & Export:** Click or Shift+Click to select specific glyphs (e.g., just the vowels or numbers) and export them instantly.
* 📦 **Batch Processing:** Download the **entire font** (thousands of glyphs) as a ZIP file containing individual SVG or PNG images.
* 🔍 **Filtering:** Filter exports by Unicode blocks (e.g., *Basic Latin*, *Bengali*) or specific search terms.


* 💾 **Formats:**
* ✒️ **SVG:** Clean vector paths, perfect for editing in Illustrator/Figma.
* 🖼️ **PNG:** High-resolution raster images with optional transparent backgrounds.



### 🎨 Visual Editor & Customization

Before exporting, you can tweak the glyphs to fit your design needs:

* 📐 **Transform:** Scale, Rotate, and Position (X/Y) glyphs within their canvas.
* 🖌️ **Styling:**
* ⬛ **Fill Mode:** Standard solid color.
* ✒️ **Outline Mode:** Stroke-only view (useful for laser cutting or plotters).
* 🌈 **Color Control:** Change fill and background colors.


* 🧪 **Clipping Detection:** Automatically scans thousands of glyphs to find and flag any characters that are cut off by the bounding box ⚠️.

### ✍️ Type Tester & Comparison

* ⌨️ **Real-time Preview:** Test custom text strings with adjustable size, padding, and alignment.
* 🆚 **Side-by-Side View:** Compare multiple fonts in a list view with instant download buttons per font.
* 📏 **Overlay Mode:** Stack multiple fonts on top of each other to compare shaping, baselines, and kerning differences.

### 🛠️ Advanced Engineering Tools

* ✂️ **Font Subsetting:** Create optimized, lightweight font files (`.ttf`, `.otf`, `.woff`) containing *only* the glyphs you select.
* 👾 **Sprite Sheet Generator:**
* Convert selected glyphs into a single **Texture Atlas / Sprite Sheet**.
* 🧠 **Smart Logic:** Auto-adjusts layout (Portrait vs. Square) and dimensions to prevent browser crashes on massive fonts (65k+ glyphs).
* 📤 **Output:** PNG image + JSON metadata (coordinates) + SVG vector grid.



### 📦 Export Options

* 🧠 **Smart SVG Export:**
* 🅰️ **Text Mode:** Embeds font data (Base64) to guarantee accurate rendering for complex scripts (**Bengali, Arabic**) anywhere.
* 🖊️ **Shape Mode:** Converts text to raw vector outlines (`<path>`) using `opentype.js`.


* 🏷️ **Custom Filenames:** Define export naming patterns like `U+{hex}`, `{name}`, or `{index}`.

---

## 🧠 How It Works

1. **📂 Load:** Drag & drop a font file. GlyphForge parses it locally using **opentype.js**.
2. **👁️ Visualize:** The tool renders each glyph's vector path onto an HTML5 Canvas/SVG card.
3. **⚙️ Customize:** Apply global transformations (scale, padding) to all glyphs.
4. **⬇️ Export:** Click "Download" to generate files. The app zips them up entirely in your browser memory.

---

## 🚀 Getting Started

To access the latest features like **Type Tester**, **Subsetting**, and **Sprite Generation**, it is recommended to run the project from source.

### 💻 Option 1: Run from Source Code (Recommended)

**⚠️ Prerequisites:** You **must** have [Node.js](https://nodejs.org/) (v18 or higher) and **npm** installed on your computer to run this.

#### 👤 For General Users (Download ZIP) — *Easiest Method*

If you don't use Git, just follow these simple steps:

1. **Download:** Click **[Here to Download ZIP](https://github.com/MSSakib03/glyphforge/archive/refs/heads/main.zip)** (or click the green 'Code' button > 'Download ZIP' on this page).
2. **Extract:** Unzip the downloaded file into a folder.
3. **Open Terminal:** Go inside that folder.
* *(Tip: Click on the folder's address bar at the top, type `cmd`, and press **Enter** to open the terminal right there).*


4. **Run Commands:** Type the following commands one by one and press Enter:
```bash
npm install
npm run dev

```


5. **Launch:** You will see a link (e.g., `http://localhost:5173`). **Ctrl + Click** it or open your browser and go to that address.

#### 👨‍💻 For Developers (Using Git)

If you have Git installed, simply run:

```bash
# 1. Clone the repository
git clone https://github.com/MSSakib03/glyphforge.git

# 2. Navigate to directory
cd glyphforge

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev

```

---

### 📥 Option 2: Download Desktop App (Legacy)

> **Note:** The current desktop release is stable but **missing new features** (Type Tester, Font Subsetting, Sprite Sheet Generator, Overlay Comparison).

1. Visit the **[Releases Page](https://github.com/MSSakib03/glyphforge/releases/latest)**.
2. Download the latest `GlyphForge-vX.X.X-win-x64.zip` or `.exe` file.
3. Install/Extract and run `GlyphForge.exe`.

---

## 🛠️ Tech Stack

* ⚛️ **Frontend:** React, Vite
* 🎨 **Styling:** Tailwind CSS
* 🔤 **Font Engine:** opentype.js
* 📦 **File Handling:** JSZip, FileSaver.js
* ✨ **Icons:** lucide-react

---

## 📁 Project Structure

```text
src/
├── 📂 assets/           # Static assets and icons
├── 🧩 components/       # UI Components
│   ├── BlockSection.jsx
│   ├── GlyphCard.jsx
│   ├── PaginationControls.jsx
│   ├── Sidebar.jsx
│   ├── TypeTester.jsx
│   └── UIComponents.jsx
├── ⚙️ utils/            # Helper logic
│   └── utils.js         # Export, Sprite, and Subset logic
├── 🚀 App.jsx           # Main application logic
├── 📄 blocks.js         # Unicode block definitions
├── 🏷️ unicodeNames.js   # Unicode name mapping
└── 🏁 main.jsx          # Entry point

```

---

## 🧩 Use Cases

* 🎨 **Icon Designers:** Extract vector paths from icon fonts (like FontAwesome) to use in design tools.
* 🎮 **Game Developers:** Generate bitmap font sprite sheets & JSON metadata.
* 🌐 **Web Developers:** Create subset fonts to reduce website load times.
* ✍️ **Font Designers:** Inspect glyph metrics, check for clipping errors, and create promo images.

---

## 🤝 Contributing

Contributions are welcome! 🐛 Found a bug? 💡 Have a feature idea?
Feel free to [Open an Issue](https://github.com/MSSakib03/glyphforge/issues) or submit a Pull Request.

---

## 📜 License

Distributed under the **GNU General Public License v3.0 (GPLv3)**. See `LICENSE` for more information.