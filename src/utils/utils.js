import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import opentype from 'opentype.js';

// --- Utility ---
export function cn(...inputs) { return twMerge(clsx(inputs)); }

export const formatRange = (start, end) => {
  if (start === null || end === null) return 'Ligatures / Others';
  const toHex = (n) => `U+${n.toString(16).toUpperCase().padStart(4, '0')}`;
  return `${toHex(start)} – ${toHex(end)}`;
};

export const svgToPng = (svgString, width, height, scaleFactor = 1) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width * scaleFactor; 
        canvas.height = height * scaleFactor;
        const ctx = canvas.getContext('2d');
        ctx.scale(scaleFactor, scaleFactor); 
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
};

// --- SPRITE SHEET GENERATOR ---
export const generateSpriteSheet = async (glyphs, settings, font) => {
    const CELL_SIZE = 64; 
    const COLS = Math.ceil(Math.sqrt(glyphs.length));
    const ROWS = Math.ceil(glyphs.length / COLS);
    const width = COLS * CELL_SIZE;
    const height = ROWS * CELL_SIZE;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const metaData = {};
    if (settings.backgroundColor !== 'transparent') {
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, width, height);
    }

    glyphs.forEach((g, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;

        const glyphPath = g.glyph.getPath(0, 0, 48); 
        const bbox = glyphPath.getBoundingBox();
        const gW = bbox.x2 - bbox.x1;
        const gH = bbox.y2 - bbox.y1;
        const gX = x + (CELL_SIZE - gW) / 2 - bbox.x1;
        const gY = y + (CELL_SIZE - gH) / 2 - bbox.y1; 

        const path = g.glyph.getPath(gX, gY + 36, 48); 
        path.fill = settings.color;
        path.draw(ctx);

        metaData[g.unicode ? `u${g.unicode.toString(16)}` : g.name] = {
            x, y, w: CELL_SIZE, h: CELL_SIZE, index: g.index
        };
    });

    return new Promise(resolve => {
        canvas.toBlob(blob => { resolve({ blob, metaData }); }, 'image/png');
    });
};

// --- FONT SUBSETTER ---
export const createSubset = (originalFont, selectedIndices, allVisibleGlyphs = []) => {
    const glyphsToKeep = [];
    
    // Always include .notdef (index 0)
    glyphsToKeep.push(originalFont.glyphs.get(0));

    let sourceIndices = new Set();
    
    if (selectedIndices.size > 0) {
        sourceIndices = selectedIndices;
    } else {
        allVisibleGlyphs.forEach(g => sourceIndices.add(g.index));
    }

    sourceIndices.forEach(idx => {
        if (idx !== 0) glyphsToKeep.push(originalFont.glyphs.get(idx));
    });

    const newFont = new opentype.Font({
        familyName: originalFont.names.fontFamily.en + " Subset",
        styleName: originalFont.names.fontSubfamily.en,
        unitsPerEm: originalFont.unitsPerEm,
        ascender: originalFont.ascender,
        descender: originalFont.descender,
        glyphs: glyphsToKeep
    });
    
    return newFont;
};

// --- CSS GENERATOR ---
export const generateCSS = (font, fileName) => {
    if (!font || !font.names) return '';
    
    const fontFamily = font.names.fontFamily?.en || 'CustomFont';
    const subFamily = font.names.fontSubfamily?.en || 'Regular';
    
    // Create a safe class name (lowercase, hyphens only)
    const className = (fontFamily + '-' + subFamily)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    let fontWeight = 'normal';
    let fontStyle = 'normal';

    if (subFamily.toLowerCase().includes('bold')) fontWeight = 'bold';
    if (subFamily.toLowerCase().includes('italic')) fontStyle = 'italic';
    if (subFamily.toLowerCase().includes('light')) fontWeight = '300';
    if (subFamily.toLowerCase().includes('medium')) fontWeight = '500';
    
    return `/* 1. Register the font */
@font-face {
  font-family: '${fontFamily}';
  src: url('${fileName}.woff2') format('woff2'),
       url('${fileName}.woff') format('woff'),
       url('${fileName}.ttf') format('truetype');
  font-weight: ${fontWeight};
  font-style: ${fontStyle};
  font-display: swap;
}

/* 2. Utility class to use the font */
.font-${className} {
  font-family: '${fontFamily}', sans-serif;
}`;
};


// --- CONSTANTS ---
export const PRESETS = {
  custom: { label: 'Custom Dimensions', w: 100, h: 100 },
  android: { label: 'Android (24x24)', w: 24, h: 24 },
  favicon: { label: 'Favicon (32x32)', w: 32, h: 32 },
  ios: { label: 'iOS (60x60)', w: 60, h: 60 },
  large: { label: 'Large (512x512)', w: 512, h: 512 },
};

export const DEFAULT_SETTINGS = {
  scale: 0.85, padding: 10, translateX: 0, translateY: 0, rotate: 0, flipH: false, flipV: false,
  positioning: 'metrics', canvasWidth: 100, canvasHeight: 100, color: '#000000',
  strokeWidth: 1, 
  backgroundColor: 'transparent',
  renderMode: 'fill',
  comparisonColor: '#FF0000', 
  comparisonOpacity: 0.4      
};

export const LARGE_BLOCK_THRESHOLD = 1500; 
export const LARGE_BLOCK_PAGE_SIZE = 1000;
export const ERROR_VIEW_PAGE_SIZE = 1000;