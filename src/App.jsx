import React, { useState, useEffect, useMemo, useCallback, useRef, useTransition } from 'react';
import { 
  Upload, Moon, Sun, Download, ChevronLeft, X, Type, Trash2, AlertTriangle, Undo2, Redo2,
  RotateCcw, Loader2, Search, CheckSquare, FileImage, FileCode, FileType, FileJson, Copy,
  Filter, Settings2 
} from 'lucide-react';
import opentype from 'opentype.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import Sidebar from './components/Sidebar';
import GlyphCard from './components/GlyphCard';
import BlockSection from './components/BlockSection';
import PaginationControls from './components/PaginationControls';
import TypeTester from './components/TypeTester';
import { Button, AppLogo, ConfirmationModal } from './components/UIComponents';

import { 
  cn, svgToPng, DEFAULT_SETTINGS, formatRange, 
  LARGE_BLOCK_THRESHOLD, LARGE_BLOCK_PAGE_SIZE, ERROR_VIEW_PAGE_SIZE,
  createSubset, generateCSS 
} from './utils/utils';

const ExportOptionsModal = ({ isOpen, title, onClose, onConfirm, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    {children}
                </div>
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    {onConfirm && <Button variant="primary" onClick={onConfirm}>Export</Button>}
                </div>
            </div>
        </div>
    );
};

export default function GlyphScopeX() {
  const [fontList, setFontList] = useState([]); 
  const [activeFontIndex, setActiveFontIndex] = useState(0);
  const [compareFontIndex, setCompareFontIndex] = useState(null); 
  const [filterMode, setFilterMode] = useState('unicode'); 
  const [isModeLoading, setIsModeLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const unicodeBlocksRef = useRef([]);
  const unicodeNamesRef = useRef({});
  const [isDataReady, setIsDataReady] = useState(false); 

  const [subsetModal, setSubsetModal] = useState({ isOpen: false, formats: { ttf: true, otf: false, woff: false } });
  const [spriteModal, setSpriteModal] = useState({ isOpen: false, formats: { png: true, svg: true, json: true }, transparent: false });
  const [cssModalOpen, setCssModalOpen] = useState(false);

  const [focusedGlyphIndex, setFocusedGlyphIndex] = useState(null);
  const searchInputRef = useRef(null);

  const [searchConfig, setSearchConfig] = useState({
      unicode: true,
      character: true,
      name: false
  });
  const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);
  const searchMenuRef = useRef(null);

  useEffect(() => {
      const handleClickOutside = (event) => {
          if (searchMenuRef.current && !searchMenuRef.current.contains(event.target)) {
              setIsSearchMenuOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        const loadData = async () => {
            try {
                const [blocksModule, namesModule] = await Promise.all([
                    import('./blocks'),
                    import('./unicodeNames')
                ]);
                unicodeBlocksRef.current = blocksModule.UNICODE_BLOCKS;
                unicodeNamesRef.current = namesModule.UNICODE_NAMES;
                setIsDataReady(true);
            } catch (error) {
                console.error("Failed to load unicode data:", error);
                setIsDataReady(true); 
            }
        };
        loadData();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const font = useMemo(() => fontList[activeFontIndex]?.fontObj || null, [fontList, activeFontIndex]);
  
  const glyphs = useMemo(() => {
    const allGlyphs = fontList[activeFontIndex]?.glyphs || [];
    if (filterMode === 'unicode') {
       return allGlyphs.filter(g => g.unicode !== undefined);
    }
    return allGlyphs;
  }, [fontList, activeFontIndex, filterMode]);

  const comparisonMap = useMemo(() => {
    if (compareFontIndex === null || !fontList || !fontList[compareFontIndex]) return null;
    const compGlyphs = fontList[compareFontIndex].glyphs;
    const map = new Map();
    compGlyphs.forEach(g => {
        if (g.unicode !== undefined) map.set(g.unicode, g);
        if (g.name) map.set(g.name, g);
    });
    return map;
  }, [fontList, compareFontIndex]);

  const [blocks, setBlocks] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [viewMode, setViewMode] = useState('all'); 
  const [activeBlock, setActiveBlock] = useState(null);
  const [collapsedBlocks, setCollapsedBlocks] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [errorIndices, setErrorIndices] = useState(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0); 
  const scanCancelRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportFormat, setExportFormat] = useState('svg'); 
  const [pngScale, setPngScale] = useState(1); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [preset, setPreset] = useState('custom');
  const [filenamePattern, setFilenamePattern] = useState('U+{hex}');
  const [ligaturePattern, setLigaturePattern] = useState('{name}'); 
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [globalSettings, setGlobalSettings] = useState(DEFAULT_SETTINGS);
  const [overrides, setOverrides] = useState({});
  const [floatingPos, setFloatingPos] = useState(null);
  const [isFloatingDragging, setIsFloatingDragging] = useState(false);
  const [floatingOffset, setFloatingOffset] = useState({ x: 0, y: 0 });
  const [showGuidelines, setShowGuidelines] = useState(false);

  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDangerous: false });
  const closeConfirm = () => setConfirmState(prev => ({ ...prev, isOpen: false }));

  const overridesRef = useRef(overrides);
  useEffect(() => { overridesRef.current = overrides; }, [overrides]);
  useEffect(() => { if (darkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }, [darkMode]);
  useEffect(() => { if (history.length === 0) { setHistory([{ globalSettings, overrides }]); setHistoryIndex(0); } }, []);
  
  const saveToHistory = useCallback((newGlobal, newOverrides) => {
      const newState = { globalSettings: newGlobal || globalSettings, overrides: newOverrides || overrides };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newState);
      if (newHistory.length > 10) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, globalSettings, overrides]);

  const handleUndo = useCallback(() => { if (historyIndex > 0) { const prev = history[historyIndex - 1]; setGlobalSettings(prev.globalSettings); setOverrides(prev.overrides); setHistoryIndex(historyIndex - 1); } }, [history, historyIndex]);
  const handleRedo = useCallback(() => { if (historyIndex < history.length - 1) { const next = history[historyIndex + 1]; setGlobalSettings(next.globalSettings); setOverrides(next.overrides); setHistoryIndex(historyIndex + 1); } }, [history, historyIndex]);
  const handleReset = () => { setConfirmState({ isOpen: true, title: "Reset", message: "Reset all settings?", isDangerous: true, onConfirm: () => { setGlobalSettings(DEFAULT_SETTINGS); setOverrides({}); saveToHistory(DEFAULT_SETTINGS, {}); closeConfirm(); } }); };

  const filteredGlyphs = useMemo(() => {
    let result = glyphs;
    const term = searchTerm.trim();
    
    if (term) {
      const lowerTerm = term.toLowerCase();
      const normalizedTerm = term.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

      result = result.filter(g => {
        let matches = false;

        if (searchConfig.unicode) {
             const hex = g.hex.toLowerCase();
             if (lowerTerm.startsWith('u+') && hex.includes(lowerTerm)) matches = true;
             else if (/^[0-9a-f]{4,}$/.test(lowerTerm) && hex.includes(lowerTerm)) matches = true;
             else if (hex.includes(lowerTerm)) matches = true; 
        }

        if (!matches && searchConfig.character && g.unicode) {
            try {
                const char = String.fromCodePoint(g.unicode);
                if (char.toLowerCase() === lowerTerm) {
                    matches = true;
                } 
                else {
                    const normalizedChar = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    if (normalizedTerm.length === 1 && normalizedChar === normalizedTerm) {
                        matches = true;
                    }
                }
            } catch (e) { }
        }

        if (!matches && searchConfig.name) {
            const matchesName = g.name?.toLowerCase().includes(lowerTerm);
            const matchesUniName = g.unicodeName?.toLowerCase().includes(lowerTerm);
            if (matchesName || matchesUniName) matches = true;
        }

        return matches;
      });
    }
    return result;
  }, [glyphs, searchTerm, searchConfig]);

  const handleSearchChange = (e) => { const val = e.target.value; startTransition(() => { setSearchTerm(val); }); };

  const detectBlocks = (currentGlyphs, mode) => {
    const UNICODE_BLOCKS_DATA = unicodeBlocksRef.current;
    if(!UNICODE_BLOCKS_DATA || UNICODE_BLOCKS_DATA.length === 0) return;

    const blockCounts = UNICODE_BLOCKS_DATA.map(b => ({ ...b, count: 0, glyphs: [] }));
    const unmappedBlock = { name: "Other / Ligatures", start: null, end: null, count: 0, glyphs: [] };
    currentGlyphs.forEach((g) => {
      let matched = false;
      if (g.unicode !== undefined) {
        const block = blockCounts.find(b => g.unicode >= b.start && g.unicode <= b.end);
        if (block) { block.count++; block.glyphs.push(g); matched = true; }
      }
      if (!matched) { unmappedBlock.count++; unmappedBlock.glyphs.push(g); }
    });
    let finalBlocks = blockCounts.filter(b => b.count > 0);
    if (unmappedBlock.count > 0 && mode === 'all') finalBlocks.push(unmappedBlock);
    setBlocks(finalBlocks);
  };

  useEffect(() => { 
      if (isDataReady) {
        if (filteredGlyphs.length > 0 || searchTerm) { detectBlocks(filteredGlyphs, filterMode); setCurrentPage(1); } 
        else if (glyphs.length > 0) { detectBlocks(glyphs, filterMode); } 
        else { setBlocks([]); }
      }
  }, [filterMode, filteredGlyphs, glyphs, isDataReady]);

  const handleModeSwitch = (mode) => { if (mode === filterMode) return; setIsModeLoading(true); setTimeout(() => { setFilterMode(mode); setIsModeLoading(false); }, 50); };

  const paginatedBlocks = useMemo(() => {
    if (blocks.length === 0) return [];
    const pages = [];
    let currentPageContent = [];
    let currentCount = 0;
    for (const block of blocks) {
        let glyphsInBlock = block.glyphs;
        let offset = 0;
        while (offset < glyphsInBlock.length) {
            const spaceLeft = LARGE_BLOCK_PAGE_SIZE - currentCount;
            if (spaceLeft <= 0) { pages.push(currentPageContent); currentPageContent = []; currentCount = 0; continue; }
            const countToTake = Math.min(spaceLeft, glyphsInBlock.length - offset);
            const slice = glyphsInBlock.slice(offset, offset + countToTake);
            currentPageContent.push({ ...block, name: block.name + (glyphsInBlock.length > countToTake ? (offset === 0 ? " (Start)" : " (Cont.)") : ""), glyphs: slice, count: slice.length, isPartial: true, originalStart: block.start, originalEnd: block.end });
            currentCount += slice.length;
            offset += countToTake;
        }
    }
    if (currentPageContent.length > 0) pages.push(currentPageContent);
    return pages;
  }, [blocks]);

  const checkClip = useCallback((g, explicitOverrides = null) => {
      if (filterMode === 'unicode' && !g.unicode) return false;
      const currentOverrides = explicitOverrides || overridesRef.current;
      const s = currentOverrides[g.index] || globalSettings;
      
      if (!g.glyph.path || g.glyph.path.commands.length === 0) return false;
      
      const padFactor = 1 - (s.padding / 100);
      const baseSize = Math.min(s.canvasWidth, s.canvasHeight) * padFactor;
      const scaledFontSize = baseSize * s.scale;
      const fontScale = scaledFontSize / g.fontMetrics.unitsPerEm;
      
      const raw = g.glyph.getBoundingBox();
      const pixelW = (raw.x2 - raw.x1) * fontScale;
      const xPos = (s.canvasWidth / 2) + s.translateX - (pixelW / 2) - (raw.x1 * fontScale);
      
      let yPos;
      if (s.positioning === 'center') {
         const pixelH = (raw.y2 - raw.y1) * fontScale; 
         yPos = (s.canvasHeight / 2) + s.translateY + (pixelH / 2) + (raw.y1 * fontScale);
      } else if (s.positioning === 'metrics' && g.fontMetrics) {
         const totalH = g.fontMetrics.ascender - g.fontMetrics.descender; 
         const blY = (s.canvasHeight - (s.canvasHeight * padFactor)) / 2 + ((s.canvasHeight * padFactor) * (g.fontMetrics.ascender / totalH)); 
         yPos = blY + s.translateY; 
      } else {
         yPos = (s.canvasHeight * 0.65) + s.translateY;
      }

      const T = 1.5; 
      const visualLeft = xPos + (raw.x1 * fontScale);
      const visualRight = xPos + (raw.x2 * fontScale);
      const visualTop = yPos - (raw.y2 * fontScale); 
      const visualBottom = yPos - (raw.y1 * fontScale);
      const actualTop = Math.min(visualTop, visualBottom);
      const actualBottom = Math.max(visualTop, visualBottom);

      const isClipping = visualLeft < -T || actualTop < -T || visualRight > (s.canvasWidth + T) || actualBottom > (s.canvasHeight + T);
      return isClipping;
  }, [filterMode, globalSettings]);

  const performScan = useCallback(async (targets = null, explicitOverrides = null) => {
    if (targets && Array.isArray(targets)) { setErrorIndices(prev => { const n = new Set(prev); targets.forEach(g => { if(checkClip(g, explicitOverrides)) n.add(g.index); else n.delete(g.index); }); return n; }); return; }
    scanCancelRef.current = false; setIsScanning(true); setScanProgress(0);
    const BATCH = 2000; const total = glyphs.length; const nErr = new Set(); let i = 0;
    const proc = () => {
        if(scanCancelRef.current) { setIsScanning(false); return; }
        const end = Math.min(i + BATCH, total);
        for(let j=i; j<end; j++) { if(checkClip(glyphs[j], explicitOverrides)) nErr.add(glyphs[j].index); }
        i = end; setScanProgress(Math.round((i/total)*100));
        if(i < total) setTimeout(proc, 0); else { setErrorIndices(nErr); setIsScanning(false); }
    };
    setTimeout(proc, 0);
  }, [glyphs, checkClip]);

  useEffect(() => { if (!font || glyphs.length === 0) return; const t = setTimeout(() => { performScan(null); }, 500); scanCancelRef.current = true; return () => { clearTimeout(t); scanCancelRef.current = true; }; }, [globalSettings, font, glyphs, filterMode, performScan]);

  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const files = e.dataTransfer.files; if (files && files.length > 0) processFiles(files); };

  const processFiles = (fileList) => {
    if (!isDataReady) { alert("System is still loading. Please wait."); return; }
    if (!fileList || fileList.length === 0) return;
    setIsModeLoading(true);
    const files = Array.from(fileList);
    const newFonts = [];
    let fileIndex = 0;
    const processNextFile = () => {
        if (fileIndex >= files.length) {
            if (newFonts.length > 0) {
                setFontList(prev => [...prev, ...newFonts]); 
                if (fontList.length === 0) setActiveFontIndex(0); 
                else setActiveFontIndex(prev => prev);
                setErrorIndices(new Set());
                setOverrides({}); setSearchTerm(""); setViewMode('all');
                saveToHistory(DEFAULT_SETTINGS, {});
            }
            setIsModeLoading(false);
            return;
        }
        const file = files[fileIndex];
        const extension = file.name.split('.').pop().toLowerCase();
        if (extension !== 'ttf' && extension !== 'otf' && extension !== 'woff') {
            fileIndex++; setTimeout(processNextFile, 0); return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsedFont = opentype.parse(event.target.result);
                const glyphList = [];
                const os2 = parsedFont.tables.os2;
                const fontMetrics = { ascender: parsedFont.ascender, descender: parsedFont.descender, unitsPerEm: parsedFont.unitsPerEm, capHeight: os2?.sCapHeight ? os2.sCapHeight : undefined, xHeight: os2?.sxHeight ? os2.sxHeight : undefined }; 
                const UNICODE_NAMES_DATA = unicodeNamesRef.current; 
                const totalGlyphs = parsedFont.glyphs.length;
                const GLYPH_BATCH_SIZE = 500;
                let gIndex = 0;
                const processGlyphBatch = () => {
                    const end = Math.min(gIndex + GLYPH_BATCH_SIZE, totalGlyphs);
                    for (let i = gIndex; i < end; i++) {
                        const glyph = parsedFont.glyphs.get(i);
                        const hexStr = glyph.unicode ? glyph.unicode.toString(16).toUpperCase().padStart(4, '0') : null;
                        const unicodeName = (hexStr && UNICODE_NAMES_DATA[hexStr]) ? UNICODE_NAMES_DATA[hexStr] : (glyph.name || 'Private Use');
                        glyphList.push({ id: i, index: i, glyph: glyph, unicode: glyph.unicode, name: glyph.name, unicodeName: unicodeName, hex: hexStr ? `U+${hexStr}` : 'No Unicode', fontMetrics: fontMetrics });
                    }
                    gIndex = end;
                    if (gIndex < totalGlyphs) { setTimeout(processGlyphBatch, 0); } 
                    else { newFonts.push({ name: file.name.replace(/\.(ttf|otf|woff)$/i, ''), fileName: file.name, fontObj: parsedFont, glyphs: glyphList, originalCount: glyphList.length }); fileIndex++; setTimeout(processNextFile, 0); }
                };
                processGlyphBatch();
            } catch (err) { console.error("Failed to parse", file.name, err); alert(`Failed to load ${file.name}. WOFF2 requires external decompression.`); fileIndex++; setTimeout(processNextFile, 0); }
        };
        reader.readAsArrayBuffer(file);
    };
    setTimeout(processNextFile, 100);
  };
  
  const handleFileUpload = (e) => processFiles(e.target.files);
  const switchFont = (index) => { setActiveFontIndex(index); setCompareFontIndex(null); setSelectedIndices(new Set()); setOverrides({}); setLastSelectedIndex(null); saveToHistory(globalSettings, {}); };
  const removeFont = (e, index) => { e.stopPropagation(); const newList = fontList.filter((_, i) => i !== index); setFontList(newList); if (activeFontIndex >= newList.length) { setActiveFontIndex(Math.max(0, newList.length - 1)); } if (compareFontIndex === index) setCompareFontIndex(null); else if (compareFontIndex > index) setCompareFontIndex(compareFontIndex - 1); };
  const handleTypeTester = () => { setViewMode('tester'); setActiveBlock(null); };
  const handleSidebarBlockClick = (block) => { if (!block) return; setActiveBlock(block); setViewMode('block'); setCurrentPage(1); };

  const handleSubsetClick = () => {
      const currentFont = fontList[activeFontIndex];
      const hasSelection = selectedIndices.size > 0;
      const isModified = currentFont.glyphs.length < currentFont.originalCount;
      if (!hasSelection && !isModified) { alert("Please select or remove glyphs or unicode blocks to subset first."); return; }
      setSubsetModal({ ...subsetModal, isOpen: true });
  };
  const executeSubsetExport = () => {
      setSubsetModal({ ...subsetModal, isOpen: false }); setIsProcessing(true);
      const currentFontData = fontList[activeFontIndex];
      const targets = selectedIndices.size > 0 ? currentFontData.glyphs.filter(g => selectedIndices.has(g.index)) : currentFontData.glyphs; 
      const targetIndices = new Set(targets.map(g => g.index));
      setTimeout(() => {
          try { 
              const newFont = createSubset(font, targetIndices); const baseName = font.names.fontFamily?.en || 'SubsetFont';
              if (subsetModal.formats.ttf) newFont.download(); 
              const buffer = newFont.toArrayBuffer(); const blob = new Blob([buffer], { type: 'font/ttf' });
              if (subsetModal.formats.otf) saveAs(blob, `${baseName}.otf`);
              if (subsetModal.formats.woff) saveAs(blob, `${baseName}.woff`); 
          } catch (e) { console.error(e); alert("Failed to create subset."); }
          setIsProcessing(false);
      }, 100);
  };
  const handleSpriteClick = () => { setSpriteModal({ ...spriteModal, isOpen: true }); };
  const executeSpriteExport = async () => {
      setSpriteModal({ ...spriteModal, isOpen: false }); setIsProcessing(true);
      const targets = selectedIndices.size > 0 ? glyphs.filter(g => selectedIndices.has(g.index)) : glyphs; 
      try {
          const MAX_DIM = 16000; let CELL_SIZE = 90; let FONT_SIZE = 50; const COUNT = targets.length; let COLS;
          if (COUNT < 1000) { COLS = Math.ceil(Math.sqrt(COUNT * 0.6)); } else if (COUNT <= 1500) { COLS = Math.ceil(Math.sqrt(COUNT * 0.75)); } else { COLS = Math.ceil(Math.sqrt(COUNT)); }
          COLS = Math.max(1, COLS); let ROWS = Math.ceil(COUNT / COLS); let IMG_WIDTH = COLS * CELL_SIZE; let IMG_HEIGHT = ROWS * CELL_SIZE;
          if (IMG_WIDTH > MAX_DIM || IMG_HEIGHT > MAX_DIM) {
              const maxSide = Math.max(IMG_WIDTH, IMG_HEIGHT); const scaleRatio = MAX_DIM / maxSide; CELL_SIZE = Math.floor(CELL_SIZE * scaleRatio); FONT_SIZE = Math.floor(FONT_SIZE * scaleRatio);
              if (CELL_SIZE < 20) CELL_SIZE = 20; if (FONT_SIZE < 12) FONT_SIZE = 12; IMG_WIDTH = COLS * CELL_SIZE; IMG_HEIGHT = ROWS * CELL_SIZE;
              if (IMG_HEIGHT > MAX_DIM) { COLS = Math.ceil((COUNT * CELL_SIZE) / MAX_DIM) + 5; ROWS = Math.ceil(COUNT / COLS); IMG_WIDTH = COLS * CELL_SIZE; IMG_HEIGHT = ROWS * CELL_SIZE; }
          }
          const baseName = font.names.fontFamily?.en || 'Sprite'; const metaData = {};
          if (spriteModal.formats.png) {
              const canvas = document.createElement('canvas'); canvas.width = IMG_WIDTH; canvas.height = IMG_HEIGHT; const ctx = canvas.getContext('2d');
              if (!spriteModal.transparent) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, IMG_WIDTH, IMG_HEIGHT); }
              targets.forEach((g, i) => { const col = i % COLS; const row = Math.floor(i / COLS); const x = col * CELL_SIZE; const y = row * CELL_SIZE; const path = g.glyph.getPath(0, 0, FONT_SIZE); const bbox = path.getBoundingBox(); const w = bbox.x2 - bbox.x1; const h = bbox.y2 - bbox.y1; const cx = x + (CELL_SIZE - w) / 2 - bbox.x1; const cy = y + (CELL_SIZE - h) / 2 - bbox.y1; const renderPath = g.glyph.getPath(cx, cy, FONT_SIZE); renderPath.fill = '#000000'; renderPath.draw(ctx); metaData[g.unicode || g.name] = { x, y, w: CELL_SIZE, h: CELL_SIZE, index: i }; });
              canvas.toBlob(blob => { if(blob) saveAs(blob, `${baseName}_sprite.png`); else alert("Image too large. Try selecting fewer glyphs."); }, 'image/png');
          }
          if (spriteModal.formats.json) { if(Object.keys(metaData).length === 0) { targets.forEach((g, i) => { const col = i % COLS; const row = Math.floor(i / COLS); metaData[g.unicode || g.name] = { x: col * CELL_SIZE, y: row * CELL_SIZE, w: CELL_SIZE, h: CELL_SIZE, index: i }; }); } saveAs(new Blob([JSON.stringify(metaData, null, 2)], {type: 'application/json'}), `${baseName}_sprite.json`); }
          if (spriteModal.formats.svg) { let svgContent = `<svg width="${IMG_WIDTH}" height="${IMG_HEIGHT}" viewBox="0 0 ${IMG_WIDTH} ${IMG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">`; if (!spriteModal.transparent) { svgContent += `<rect width="100%" height="100%" fill="white"/>`; } targets.forEach((g, i) => { const col = i % COLS; const row = Math.floor(i / COLS); const x = col * CELL_SIZE; const y = row * CELL_SIZE; const tempPath = g.glyph.getPath(0, 0, FONT_SIZE); const bbox = tempPath.getBoundingBox(); const w = bbox.x2 - bbox.x1; const h = bbox.y2 - bbox.y1; const cx = x + (CELL_SIZE - w) / 2 - bbox.x1; const cy = y + (CELL_SIZE - h) / 2 - bbox.y1; const pathData = g.glyph.getPath(cx, cy, FONT_SIZE).toPathData(2); svgContent += `<path d="${pathData}" fill="black" />`; }); svgContent += `</svg>`; saveAs(new Blob([svgContent], {type: "image/svg+xml;charset=utf-8"}), `${baseName}_sprite.svg`); }
      } catch (e) { console.error(e); alert("Error: Font too large or browser memory limit reached."); } setIsProcessing(false);
  };

  const executeDeleteGlyphs = (indices) => { scanCancelRef.current = true; const curF = fontList[activeFontIndex]; const nG = curF.glyphs.filter(g => !indices.has(g.index)); const nL = [...fontList]; nL[activeFontIndex] = { ...curF, glyphs: nG }; setFontList(nL); setSelectedIndices(new Set()); setErrorIndices(p => { const n = new Set(p); indices.forEach(i => n.delete(i)); return n; }); if(activeBlock) { const ex = nG.some(g => activeBlock.glyphs.includes(g)); if(!ex) setViewMode('all'); } };
  const requestDeleteGlyphs = (inds) => { setConfirmState({ isOpen: true, title: "Remove Glyphs", message: `Remove ${inds.size} glyphs?`, isDangerous: true, onConfirm: () => { executeDeleteGlyphs(inds); closeConfirm(); } }); };
  const requestDeleteBlock = (blk) => { setConfirmState({ isOpen: true, title: "Delete Block", message: `Delete block "${blk.name}"?`, isDangerous: true, onConfirm: () => { const inds = new Set(blk.glyphs.map(g => g.index)); executeDeleteGlyphs(inds); if(activeBlock===blk) setViewMode('all'); closeConfirm(); } }); };
  const updateSetting = (key, val) => { if (selectedIndices.size > 0) { const nO = { ...overrides }; const sG = []; selectedIndices.forEach(i => { nO[i] = { ...(nO[i] || globalSettings), [key]: val }; const g = glyphs.find(x => x.index === i); if(g) sG.push(g); }); setOverrides(nO); performScan(sG, nO); } else { setGlobalSettings(p => ({ ...p, [key]: val })); } };
  const commitSettingChange = () => saveToHistory(globalSettings, overrides);
  const handleUpdateGlyphPos = useCallback((idx, tx, ty) => { setOverrides(p => { const n = { ...p, [idx]: { ...(p[idx] || globalSettings), translateX: tx, translateY: ty } }; const g = glyphs.find(x => x.index === idx); if(g) performScan([g], n); return n; }); }, [globalSettings, glyphs, performScan]);
  const handleDragEnd = useCallback(() => saveToHistory(globalSettings, overrides), [globalSettings, overrides, saveToHistory]);
  const getSettingsForGlyph = (idx) => overrides[idx] || globalSettings;
  const toggleSelection = useCallback((idx, multi) => { setSelectedIndices(p => { const n = new Set(p); if(n.has(idx)) n.delete(idx); else { if(!multi) n.clear(); n.add(idx); } return n; }); setLastSelectedIndex(idx); }, []);
  const deselectAllGlyphs = useCallback(() => { setSelectedIndices(new Set()); setLastSelectedIndex(null); }, []);
  const performAutoFit = () => { let t = []; if(selectedIndices.size > 0) t = glyphs.filter(g => selectedIndices.has(g.index)); else t = getVisibleGlyphsSafe(); if(t.length === 0) return; const nO = { ...overrides }; t.forEach(g => { if(!g.glyph.path || g.glyph.path.commands.length === 0) return; const b = g.glyph.getBoundingBox(); const w = b.x2 - b.x1; const h = b.y2 - b.y1; if(w===0||h===0) return; const scale = (g.fontMetrics.unitsPerEm / Math.max(w,h)); const s = nO[g.index] || globalSettings; nO[g.index] = { ...s, scale, translateX: 0, translateY: 0, positioning: 'center' }; }); setOverrides(nO); performScan(t, nO); saveToHistory(globalSettings, nO); };
  
  const generateSVGString = (glyph, settings) => {
    const padFactor = 1 - (settings.padding / 100); const baseSize = Math.min(settings.canvasWidth, settings.canvasHeight) * padFactor; const scaledFontSize = baseSize * settings.scale; const measurePath = glyph.glyph.getPath(0, 0, scaledFontSize); const bbox = measurePath.getBoundingBox(); const gWidth = bbox.x2 - bbox.x1; const xPos = (settings.canvasWidth / 2) + settings.translateX - (gWidth / 2) - bbox.x1; let yPos; if (settings.positioning === 'center') { yPos = (settings.canvasHeight / 2) + settings.translateY + (bbox.y2 - bbox.y1) / 2 - bbox.y2; } else if (settings.positioning === 'metrics' && glyph.fontMetrics) { const totalH = glyph.fontMetrics.ascender - glyph.fontMetrics.descender; const blY = (settings.canvasHeight - (settings.canvasHeight * padFactor)) / 2 + ((settings.canvasHeight * padFactor) * (glyph.fontMetrics.ascender / totalH)); yPos = blY + settings.translateY; } else { yPos = (settings.canvasHeight * 0.65) + settings.translateY; } const d = glyph.glyph.getPath(xPos, yPos, scaledFontSize).toPathData(2); const cx = settings.canvasWidth / 2; const cy = settings.canvasHeight / 2; const strokeWidth = Math.abs(settings.strokeWidth - 1) * 2; const isTransparentBg = settings.backgroundColor === 'transparent'; const finalStrokeWidth = (settings.strokeWidth < 1 && isTransparentBg) ? 0 : strokeWidth; let fill, strokeColor, strokeW; let bgRect = settings.backgroundColor !== 'transparent' ? `<rect width="100%" height="100%" fill="${settings.backgroundColor}"/>` : ''; if (settings.renderMode === 'outline') { fill = 'none'; strokeColor = settings.color; strokeW = settings.strokeWidth <= 1 ? 1 : finalStrokeWidth; } else if (settings.renderMode === 'negative') { fill = settings.backgroundColor === 'transparent' ? '#ffffff' : settings.backgroundColor; strokeColor = fill; strokeW = finalStrokeWidth; bgRect = `<rect width="100%" height="100%" fill="${settings.color}"/>`; } else { fill = settings.color; strokeColor = settings.strokeWidth < 1 ? settings.backgroundColor : settings.color; strokeW = finalStrokeWidth; }
    return `<svg width="${settings.canvasWidth}" height="${settings.canvasHeight}" viewBox="0 0 ${settings.canvasWidth} ${settings.canvasHeight}" xmlns="http://www.w3.org/2000/svg">${bgRect}<g transform="rotate(${settings.rotate}, ${cx}, ${cy}) scale(${settings.flipH?-1:1}, ${settings.flipV?-1:1})"><path d="${d}" fill="${fill}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round" paint-order="stroke" /></g></svg>`;
  };

  const handleDownload = async (scope, targetBlock = null) => {
    setIsProcessing(true);
    try {
      const zip = new JSZip(); let targets = []; if (scope === 'selection') targets = glyphs.filter(g => selectedIndices.has(g.index)); else if (scope === 'block' && targetBlock) targets = targetBlock.glyphs; else if (scope === 'errors') targets = glyphs.filter(g => errorIndices.has(g.index)); else if (scope === 'view') targets = getVisibleGlyphsSafe(); else targets = filteredGlyphs; if (scope === 'all') targets = glyphs; const currentFont = fontList[activeFontIndex]; const fontName = currentFont ? currentFont.name.replace(/\s+/g, '_') : 'font'; let modeLabel = filterMode; if (scope === 'selection') modeLabel = 'selected'; const folderName = `${fontName}_${modeLabel}_glyphs`; const folder = zip.folder(folderName);
      for (const g of targets) { const settings = getSettingsForGlyph(g.index); const svgString = generateSVGString(g, settings); let patternToUse = filenamePattern; if (!g.unicode && filterMode === 'all') patternToUse = ligaturePattern; let fileNameBase = patternToUse.replace('{fontName}', fontName).replace('{name}', g.unicodeName || g.name || `glyph_${g.index}`).replace('{hex}', g.unicode ? g.unicode.toString(16).toUpperCase().padStart(4, '0') : 'NONE').replace('{index}', g.index); fileNameBase = fileNameBase.replace(/[\/\\?%*:|"<>]/g, '-'); if (exportFormat === 'svg' || exportFormat === 'both') folder.file(`${fileNameBase}.svg`, svgString); if (exportFormat === 'png' || exportFormat === 'both') { try { const pngBlob = await svgToPng(svgString, settings.canvasWidth, settings.canvasHeight, pngScale); folder.file(`${fileNameBase}.png`, pngBlob); } catch (e) { console.error(`Failed to convert`, e); } } }
      const content = await zip.generateAsync({ type: 'blob' }); saveAs(content, `${folderName}.zip`);
    } catch (error) { alert("An error occurred during export."); console.error(error); } finally { setIsProcessing(false); }
  };

  const handleFloatingPointerDown = (e) => { if (e.target.closest('button')) return; e.preventDefault(); e.stopPropagation(); const element = e.currentTarget; element.setPointerCapture(e.pointerId); const rect = element.getBoundingClientRect(); const parentRect = element.offsetParent.getBoundingClientRect(); setFloatingPos({ x: rect.left - parentRect.left, y: rect.top - parentRect.top }); setFloatingOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top }); setIsFloatingDragging(true); };
  const handleFloatingPointerMove = (e) => { if (!isFloatingDragging) return; e.preventDefault(); const parentRect = e.currentTarget.offsetParent.getBoundingClientRect(); setFloatingPos({ x: e.clientX - parentRect.left - floatingOffset.x, y: e.clientY - parentRect.top - floatingOffset.y }); };
  const handleFloatingPointerUp = (e) => { setIsFloatingDragging(false); e.currentTarget.releasePointerCapture(e.pointerId); };
  const calculateTotalPages = () => { if (viewMode === 'all') return paginatedBlocks.length; if (viewMode === 'block' && activeBlock && activeBlock.glyphs.length > LARGE_BLOCK_THRESHOLD) return Math.ceil(activeBlock.glyphs.length / LARGE_BLOCK_PAGE_SIZE); if (viewMode === 'errors' && errorIndices.size > ERROR_VIEW_PAGE_SIZE) return Math.ceil(errorIndices.size / ERROR_VIEW_PAGE_SIZE); return 0; };

  const getVisibleGlyphsSafe = useCallback(() => {
    if (!font) return [];
    if (viewMode === 'errors') { const errorGlyphs = glyphs.filter(g => errorIndices.has(g.index)); if (errorGlyphs.length > ERROR_VIEW_PAGE_SIZE) { const start = (currentPage - 1) * ERROR_VIEW_PAGE_SIZE; const end = start + ERROR_VIEW_PAGE_SIZE; return errorGlyphs.slice(start, end); } return errorGlyphs; }
    if (viewMode === 'block') { if (!activeBlock || !activeBlock.glyphs) return []; const totalGlyphs = activeBlock.glyphs.length; if (totalGlyphs > LARGE_BLOCK_THRESHOLD) { const start = (currentPage - 1) * LARGE_BLOCK_PAGE_SIZE; const end = start + LARGE_BLOCK_PAGE_SIZE; return activeBlock.glyphs.slice(start, end); } return activeBlock.glyphs; }
    if (paginatedBlocks.length > 0) { const currentBlocks = paginatedBlocks[currentPage - 1]; if (currentBlocks) return currentBlocks.flatMap(b => b.glyphs); }
    return [];
  }, [font, viewMode, activeBlock, paginatedBlocks, currentPage, glyphs, errorIndices]);

  const handleCSSClick = () => setCssModalOpen(true);
  const generatedCSS = useMemo(() => {
      if(!font) return '';
      return generateCSS(font, font.names.fontFamily?.en?.replace(/\s+/g, '') || 'font');
  }, [font]);
  const executeCSSDownload = () => { const blob = new Blob([generatedCSS], {type: "text/css;charset=utf-8"}); saveAs(blob, `${font.names.fontFamily?.en || 'font'}.css`); };

  const handleAutoCanvasResize = (mode) => {
      if (!font) return;
      const targets = selectedIndices.size > 0 ? glyphs.filter(g => selectedIndices.has(g.index)) : glyphs; 
      if (targets.length === 0) return;

      let newWidth = 100;
      let newHeight = 100;

      if (mode === 'max') {
          let maxW = 0; let maxH = 0;
          targets.forEach(g => {
              const b = g.glyph.getBoundingBox();
              const w = b.x2 - b.x1; const h = b.y2 - b.y1;
              if(w > maxW) maxW = w; if(h > maxH) maxH = h;
          });
          const ratioW = maxW / font.unitsPerEm;
          const ratioH = maxH / font.unitsPerEm;
          newWidth = Math.max(100, Math.ceil(ratioW * 100));
          newHeight = Math.max(100, Math.ceil(ratioH * 100));
      } 
      else if (mode === 'metrics') {
          const totalHeightUnits = font.ascender - font.descender;
          const ratio = totalHeightUnits / font.unitsPerEm;
          newHeight = Math.max(100, Math.ceil(ratio * 100));
      }

      setPreset('custom');
      
      if (selectedIndices.size > 0) {
          const newOverrides = { ...overrides };
          targets.forEach(g => {
              newOverrides[g.index] = { 
                  ...(newOverrides[g.index] || globalSettings), 
                  canvasWidth: newWidth, 
                  canvasHeight: newHeight 
              };
          });
          setOverrides(newOverrides);
          saveToHistory(globalSettings, newOverrides);
      } else {
          setGlobalSettings(prev => ({ ...prev, canvasWidth: newWidth, canvasHeight: newHeight }));
          saveToHistory({ ...globalSettings, canvasWidth: newWidth, canvasHeight: newHeight }, overrides);
      }
  };

  useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') { if (e.key === 'Escape') e.target.blur(); return; }
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); return; }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); handleRedo(); return; }
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); searchInputRef.current?.focus(); return; }

        const visibleGlyphs = getVisibleGlyphsSafe();
        if (visibleGlyphs.length === 0) return;

        let currentIndex = -1;
        if (focusedGlyphIndex !== null) { currentIndex = visibleGlyphs.findIndex(g => g.index === focusedGlyphIndex); } 
        else if (lastSelectedIndex !== null) { currentIndex = visibleGlyphs.findIndex(g => g.index === lastSelectedIndex); }

        const navigateAndSelect = (newIndex) => {
            if (newIndex >= 0 && newIndex < visibleGlyphs.length) {
                const targetGlyph = visibleGlyphs[newIndex];
                setFocusedGlyphIndex(targetGlyph.index);
                if (!e.shiftKey && !e.ctrlKey) {
                    setSelectedIndices(new Set([targetGlyph.index]));
                    setLastSelectedIndex(targetGlyph.index);
                }
            }
        };

        if (e.key === 'ArrowRight') { e.preventDefault(); const nextIdx = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, visibleGlyphs.length - 1); navigateAndSelect(nextIdx); } 
        else if (e.key === 'ArrowLeft') { e.preventDefault(); const prevIdx = currentIndex === -1 ? 0 : Math.max(currentIndex - 1, 0); navigateAndSelect(prevIdx); } 
        else if (e.shiftKey && e.key === 'ArrowDown') { e.preventDefault(); const nextIdx = currentIndex === -1 ? 0 : Math.min(currentIndex + 8, visibleGlyphs.length - 1); setFocusedGlyphIndex(visibleGlyphs[nextIdx].index); } 
        else if (e.shiftKey && e.key === 'ArrowUp') { e.preventDefault(); const prevIdx = currentIndex === -1 ? 0 : Math.max(currentIndex - 8, 0); setFocusedGlyphIndex(visibleGlyphs[prevIdx].index); } 
        else if (e.key === ' ') { e.preventDefault(); if (focusedGlyphIndex !== null) { toggleSelection(focusedGlyphIndex, true); } } 
        else if (e.key === 'Delete') { if (selectedIndices.size > 0) { requestDeleteGlyphs(selectedIndices); } else if (focusedGlyphIndex !== null) { requestDeleteGlyphs(new Set([focusedGlyphIndex])); } } 
        else if (e.key === 'Escape') { deselectAllGlyphs(); setFocusedGlyphIndex(null); }
      };
      window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, getVisibleGlyphsSafe, focusedGlyphIndex, lastSelectedIndex, toggleSelection, selectedIndices]);

  if (!isDataReady) {
    return ( <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans"><Loader2 className="animate-spin text-violet-600 mb-4" size={48} /><h2 className="text-xl font-bold">Initializing GlyphScopeX...</h2></div> );
  }
  
  const currentSettings = selectedIndices.size > 0 ? (overrides[Array.from(selectedIndices)[0]] || globalSettings) : globalSettings;

  return (
    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={cn("h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans relative", darkMode ? "dark" : "")}>
      
      <ConfirmationModal isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={closeConfirm} isDangerous={confirmState.isDangerous} />
      {/* CSS MODAL */}
      <ExportOptionsModal isOpen={cssModalOpen} title="Get CSS Snippet" onClose={() => setCssModalOpen(false)}>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-xs overflow-x-auto relative group">
             <button onClick={() => { navigator.clipboard.writeText(generatedCSS); }} className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-700 rounded shadow hover:text-violet-600 transition-colors" title="Copy"><Copy size={14}/></button>
             <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{generatedCSS}</pre>
        </div>
        <div className="text-xs text-gray-500 mt-2">This snippet assumes you have the font files (.woff2, .woff, .ttf) in the same directory.</div>
        <div className="mt-4 flex justify-end"><Button onClick={executeCSSDownload} size="sm"><Download size={14}/> Download .css File</Button></div>
      </ExportOptionsModal>
      {/* Subset & Sprite Modals - Pass appropriate props */}
      <ExportOptionsModal isOpen={subsetModal.isOpen} title="Export Subset Font" onClose={() => setSubsetModal(p => ({...p, isOpen: false}))} onConfirm={executeSubsetExport}>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Generating subset with <span className="font-bold">{selectedIndices.size > 0 ? selectedIndices.size : fontList[activeFontIndex]?.glyphs?.length}</span> glyphs.</p>
        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Formats</label>
        <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"><input type="checkbox" checked={subsetModal.formats.ttf} onChange={(e) => setSubsetModal(p => ({...p, formats: {...p.formats, ttf: e.target.checked}}))} className="w-4 h-4 text-violet-600 rounded"/><span className="flex-1 font-medium">TrueType (.ttf)</span></label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"><input type="checkbox" checked={subsetModal.formats.otf} onChange={(e) => setSubsetModal(p => ({...p, formats: {...p.formats, otf: e.target.checked}}))} className="w-4 h-4 text-violet-600 rounded"/><span className="flex-1 font-medium">OpenType (.otf)</span></label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"><input type="checkbox" checked={subsetModal.formats.woff} onChange={(e) => setSubsetModal(p => ({...p, formats: {...p.formats, woff: e.target.checked}}))} className="w-4 h-4 text-violet-600 rounded"/><span className="flex-1 font-medium">Web Font (.woff)</span></label>
        </div>
      </ExportOptionsModal>
      <ExportOptionsModal isOpen={spriteModal.isOpen} title="Export Sprite Sheet" onClose={() => setSpriteModal(p => ({...p, isOpen: false}))} onConfirm={executeSpriteExport}>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Generating sprite from <span className="font-bold">{selectedIndices.size > 0 ? selectedIndices.size : "ALL"}</span> glyphs.</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
            <label className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 cursor-pointer"><input type="checkbox" checked={spriteModal.formats.png} onChange={(e) => setSpriteModal(p => ({...p, formats: {...p.formats, png: e.target.checked}}))} className="w-4 h-4 text-violet-600 rounded"/><FileImage size={16}/> PNG</label>
            <label className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 cursor-pointer"><input type="checkbox" checked={spriteModal.formats.svg} onChange={(e) => setSpriteModal(p => ({...p, formats: {...p.formats, svg: e.target.checked}}))} className="w-4 h-4 text-violet-600 rounded"/><FileType size={16}/> SVG</label>
            <label className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 cursor-pointer"><input type="checkbox" checked={spriteModal.formats.json} onChange={(e) => setSpriteModal(p => ({...p, formats: {...p.formats, json: e.target.checked}}))} className="w-4 h-4 text-violet-600 rounded"/><FileJson size={16}/> JSON</label>
        </div>
        {spriteModal.formats.png && (<div className="pt-2 border-t border-gray-100 dark:border-gray-700"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={spriteModal.transparent} onChange={(e) => setSpriteModal(p => ({...p, transparent: e.target.checked}))} className="w-4 h-4 text-violet-600 rounded"/><span className="text-sm">Transparent Background (PNG)</span></label></div>)}
      </ExportOptionsModal>

      {isModeLoading && (<div className="absolute inset-0 z-[60] bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center"><div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl flex items-center gap-3"><Loader2 className="animate-spin text-violet-600" size={24}/><span className="font-semibold text-gray-700 dark:text-gray-200">Rendering Fonts...</span></div></div>)}
      {isDragging && (<div className="absolute inset-0 z-50 bg-violet-600/90 flex flex-col items-center justify-center text-white backdrop-blur-sm animate-in fade-in duration-200 pointer-events-none"><Upload size={64} className="mb-4 animate-bounce" /><h2 className="text-3xl font-bold">Drop Fonts Here</h2><p className="text-violet-200 mt-2">You can drop multiple .ttf/.otf/.woff files</p></div>)}

      <Sidebar 
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} fontList={fontList} activeFontIndex={activeFontIndex} switchFont={switchFont} removeFont={removeFont} handleFileUpload={handleFileUpload}
        font={font} exportFormat={exportFormat} setExportFormat={setExportFormat} pngScale={pngScale} setPngScale={setPngScale} preset={preset} setPreset={setPreset}
        currentSettings={currentSettings} updateSetting={updateSetting} commitSettingChange={commitSettingChange} performAutoFit={performAutoFit}
        filenamePattern={filenamePattern} setFilenamePattern={setFilenamePattern} ligaturePattern={ligaturePattern} setLigaturePattern={setLigaturePattern} filterMode={filterMode} handleModeSwitch={handleModeSwitch}
        blocks={blocks} activeBlock={activeBlock} setActiveBlock={handleSidebarBlockClick} paginatedBlocks={paginatedBlocks} currentPage={currentPage} setCurrentPage={setCurrentPage} setViewMode={setViewMode} 
        errorIndices={errorIndices} handleDownload={handleDownload} deleteBlock={requestDeleteBlock} selectedIndices={selectedIndices} setSelectedIndices={setSelectedIndices}
        compareFontIndex={compareFontIndex} setCompareFontIndex={setCompareFontIndex}
        showGuidelines={showGuidelines} setShowGuidelines={setShowGuidelines}
        handleTypeTester={handleTypeTester} handleSubsetExport={handleSubsetClick} handleSpriteExport={handleSpriteClick} handleCSSExport={handleCSSClick} 
        handleAutoCanvasResize={handleAutoCanvasResize} // Pass the new handler
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300">
         <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 z-30 gap-4">
          <div className="flex items-center gap-4 flex-1">
             {!isSidebarOpen && <AppLogo />}
             <div className="relative max-w-md w-full flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input ref={searchInputRef} type="text" placeholder="Search glyphs... (Ctrl+F)" value={searchTerm} onChange={handleSearchChange} className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
                <div className="relative" ref={searchMenuRef}>
                    <button onClick={() => setIsSearchMenuOpen(!isSearchMenuOpen)} className={cn("p-2 rounded-lg border transition-all", isSearchMenuOpen ? "bg-violet-100 text-violet-700 border-violet-200" : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400")} title="Search Filters"><Filter size={18}/></button>
                    {isSearchMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Settings2 size={12}/> Search By</h4>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                    <input type="checkbox" checked={searchConfig.unicode} onChange={(e) => setSearchConfig(p => ({...p, unicode: e.target.checked}))} className="rounded text-violet-600 focus:ring-violet-500"/>
                                    <span className="text-gray-700 dark:text-gray-300">Unicode / Hex</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                    <input type="checkbox" checked={searchConfig.character} onChange={(e) => setSearchConfig(p => ({...p, character: e.target.checked}))} className="rounded text-violet-600 focus:ring-violet-500"/>
                                    <span className="text-gray-700 dark:text-gray-300">Smart Character</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                    <input type="checkbox" checked={searchConfig.name} onChange={(e) => setSearchConfig(p => ({...p, name: e.target.checked}))} className="rounded text-violet-600 focus:ring-violet-500"/>
                                    <span className="text-gray-700 dark:text-gray-300">Glyph Name</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
             </div>
             {viewMode !== 'all' && viewMode !== 'tester' && (<Button variant="secondary" size="sm" onClick={() => { setViewMode('all'); setActiveBlock(null); }}><ChevronLeft size={14} /> Back to All</Button>)}
             {viewMode === 'tester' && (<Button variant="secondary" size="sm" onClick={() => { setViewMode('all'); }}><ChevronLeft size={14} /> Back to Glyphs</Button>)}
             {errorIndices.size > 0 && (<button onClick={() => { setCurrentPage(1); setViewMode(viewMode === 'errors' ? 'all' : 'errors'); }} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors", viewMode === 'errors' ? "bg-red-600 text-white border-red-600" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100")}><AlertTriangle size={14} /> {errorIndices.size} Clipping</button>)}
          </div>
           <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 border-r pr-4 mr-1 border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)"><Undo2 size={18}/></Button>
                <Button variant="ghost" size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)"><Redo2 size={18}/></Button>
                <Button variant="ghost" size="icon" onClick={handleReset} title="Reset All Settings"><RotateCcw size={18}/></Button>
             </div>
             <Button variant="ghost" onClick={() => setDarkMode(!darkMode)} size="icon">{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</Button>
             {font && viewMode !== 'tester' && (<div className="flex items-center gap-2 border-l pl-4 border-gray-200 dark:border-gray-700"><Button variant="secondary" size="sm" onClick={() => handleDownload('view')} disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Download View'}</Button><Button variant="primary" size="sm" onClick={() => handleDownload('all')} disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Download All'}</Button></div>)}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black/20 p-8 relative custom-scrollbar scroll-smooth">
           {!font ? (<div className="h-full flex flex-col items-center justify-center text-center opacity-40"><Type size={64} className="text-gray-300 mb-4"/><h2 className="text-xl font-bold text-gray-400">Drag & Drop Fonts</h2><p className="text-sm text-gray-400 mt-2">You can drop multiple files (e.g. Regular & Bold)</p></div>) : (
             <>
               {viewMode === 'tester' && <TypeTester fontList={fontList} darkMode={darkMode} />}

               {(viewMode === 'block' || viewMode === 'errors') && (
                 <div>
                     <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">{viewMode === 'errors' ? <span className="text-red-500 flex items-center gap-2"><AlertTriangle/> Clipping Errors</span> : <span>{activeBlock?.name}</span>}</h2>
                           {viewMode === 'errors' && (<div className="flex items-center gap-2 ml-4 border-l pl-4 border-gray-300 dark:border-gray-700"><Button variant="ghost" size="xs" onClick={() => { const visible = getVisibleGlyphsSafe(); const newSet = new Set(selectedIndices); visible.forEach(g => newSet.add(g.index)); setSelectedIndices(newSet); }} title="Select Page"><CheckSquare size={14}/> Select Page</Button><Button variant="ghost" size="xs" onClick={() => { const newSet = new Set(selectedIndices); errorIndices.forEach(idx => newSet.add(idx)); setSelectedIndices(newSet); }} title="Select All Errors"><CheckSquare size={14}/> Select All ({errorIndices.size})</Button></div>)}
                        </div>
                        {viewMode === 'errors' && errorIndices.size > ERROR_VIEW_PAGE_SIZE && (<span className="text-sm text-gray-500 font-mono"><span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">Page {currentPage} of {Math.ceil(errorIndices.size/ERROR_VIEW_PAGE_SIZE)}</span></span>)}
                        {viewMode === 'block' && activeBlock && (
                            <span className="text-sm text-gray-500 font-mono">{formatRange(activeBlock.originalStart || activeBlock.start, activeBlock.originalEnd || activeBlock.end)}</span>
                        )}
                     </div>
                     <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(120px,1fr))] pb-32">
                        {getVisibleGlyphsSafe().map(g => (
                            <GlyphCard 
                                key={g.index} 
                                g={g} 
                                comparisonG={comparisonMap ? comparisonMap.get(g.unicode || g.name) : null} 
                                settings={getSettingsForGlyph(g.index)} 
                                isSelected={selectedIndices.has(g.index)} 
                                isError={errorIndices.has(g.index)} 
                                toggleSelection={toggleSelection} 
                                onUpdatePosition={handleUpdateGlyphPos} 
                                onDragEnd={handleDragEnd} 
                                showGuidelines={showGuidelines} 
                                isFocused={focusedGlyphIndex === g.index} 
                            />
                        ))}
                     </div>
                 </div>
               )}
               {viewMode === 'all' && (
                 <div className="pb-32 min-h-full">
                     {paginatedBlocks[currentPage - 1]?.map((block, idx) => (
                        <BlockSection 
                            key={`${currentPage}-${idx}`} 
                            block={block} 
                            collapsedBlocks={collapsedBlocks} setCollapsedBlocks={setCollapsedBlocks} errorIndices={errorIndices} selectedIndices={selectedIndices} setSelectedIndices={setSelectedIndices} deleteBlock={requestDeleteBlock} handleDownload={handleDownload} setViewMode={setViewMode} setActiveBlock={handleSidebarBlockClick} getSettingsForGlyph={getSettingsForGlyph} toggleSelection={toggleSelection} handleUpdateGlyphPos={handleUpdateGlyphPos} handleDragEnd={handleDragEnd} setCurrentPage={setCurrentPage} comparisonMap={comparisonMap} showGuidelines={showGuidelines} 
                            focusedGlyphIndex={focusedGlyphIndex} 
                        />
                     ))}
                     {paginatedBlocks.length === 0 && <div className="text-gray-500 text-center mt-20">No glyphs found matching your search.</div>}
                 </div>
               )}
             </>
           )}
        </div>
        
        {font && viewMode !== 'tester' && (<PaginationControls currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={calculateTotalPages()} />)}
        {isScanning && (<div className="fixed bottom-20 right-8 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-gray-700 animate-in slide-in-from-bottom-5"><Loader2 className="animate-spin text-violet-400" size={20} /><div><div className="text-xs font-bold">Scanning for Errors...</div><div className="text-[10px] text-gray-400">Checking entire font ({scanProgress}%)</div></div></div>)}

        {selectedIndices.size > 0 && viewMode !== 'tester' && (
          <div onPointerDown={handleFloatingPointerDown} onPointerMove={handleFloatingPointerMove} onPointerUp={handleFloatingPointerUp} style={floatingPos ? { left: floatingPos.x, top: floatingPos.y, transform: 'none' } : {}} className={cn("absolute z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-top-4 border border-gray-700 cursor-move touch-none select-none", !floatingPos && "top-10 left-1/2 -translate-x-1/2")}>
             <div className="font-semibold text-sm flex items-center gap-2"><span className="bg-violet-500 text-xs px-2 py-0.5 rounded-full">{selectedIndices.size}</span><span>Selected</span></div>
             <div className="h-4 w-px bg-gray-700"></div>
             <button onClick={() => handleDownload('selection')} className="flex items-center gap-2 text-sm hover:text-green-400 transition-colors" disabled={isProcessing} title="Download Selected"><Download size={16} /> <span className="hidden sm:inline">{isProcessing ? '...' : 'Download'}</span></button>
             <button onClick={() => requestDeleteGlyphs(selectedIndices)} className="flex items-center gap-2 text-sm hover:text-red-400 transition-colors" title="Remove Selected from List"><Trash2 size={16} /> <span className="hidden sm:inline">Remove</span></button>
             <button onClick={deselectAllGlyphs} className="flex items-center gap-2 text-sm hover:text-orange-400 transition-colors border-l pl-4 border-gray-700" title="Deselect all (Esc)"><X size={16} /><span className="hidden sm:inline">Deselect All</span></button>
          </div>
        )}
      </main>
    </div>
  );
}