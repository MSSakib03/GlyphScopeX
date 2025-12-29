import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
export function cn(...inputs) { return twMerge(clsx(inputs)); }

export const formatRange = (start, end) => {
  if (start === null || end === null) return 'Ligatures / Others';
  const toHex = (n) => `U+${n.toString(16).toUpperCase().padStart(4, '0')}`;
  return `${toHex(start)} – ${toHex(end)}`;
};

// --- Helper: Convert SVG String to PNG Blob ---
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
    
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    
    img.src = url;
  });
};

// --- Constants ---
export const PRESETS = {
  custom: { label: 'Custom Dimensions', w: 100, h: 100 },
  android: { label: 'Android (24x24)', w: 24, h: 24 },
  favicon: { label: 'Favicon (32x32)', w: 32, h: 32 },
  ios: { label: 'iOS (60x60)', w: 60, h: 60 },
  large: { label: 'Large (512x512)', w: 512, h: 512 },
};

export const DEFAULT_SETTINGS = {
  scale: 0.85, padding: 10, translateX: 0, translateY: 12, rotate: 0, flipH: false, flipV: false,
  positioning: 'baseline', canvasWidth: 100, canvasHeight: 100, color: '#000000',
  strokeWidth: 1, 
  backgroundColor: 'transparent',
  renderMode: 'fill'
};

export const LARGE_BLOCK_THRESHOLD = 1500; 
export const LARGE_BLOCK_PAGE_SIZE = 1000;
export const ERROR_VIEW_PAGE_SIZE = 1000;