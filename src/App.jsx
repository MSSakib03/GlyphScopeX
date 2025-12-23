import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Upload, Moon, Sun, Download, ChevronLeft, X, 
  Type, Trash2, AlertTriangle, Undo2, Redo2, RotateCcw, 
  Loader2, Search
} from 'lucide-react';
import opentype from 'opentype.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Import newly created components
import Sidebar from './components/Sidebar';
import GlyphCard from './components/GlyphCard';
import BlockSection from './components/BlockSection';
import PaginationControls from './components/PaginationControls';
import { Button, AppLogo } from './components/UIComponents';

// Import Utils
import { cn, svgToPng, PRESETS, DEFAULT_SETTINGS, formatRange } from './utils/utils';

// Import Data
import { UNICODE_BLOCKS } from './blocks';
import { UNICODE_NAMES } from './unicodeNames'; 

export default function GlyphForge() {
  const [fontList, setFontList] = useState([]); 
  const [activeFontIndex, setActiveFontIndex] = useState(0);
  
  // -- Filter Mode State --
  const [filterMode, setFilterMode] = useState('unicode'); 
  const [isModeLoading, setIsModeLoading] = useState(false);

  // -- Derived Data --
  const font = useMemo(() => fontList[activeFontIndex]?.fontObj || null, [fontList, activeFontIndex]);
  
  const glyphs = useMemo(() => {
    const allGlyphs = fontList[activeFontIndex]?.glyphs || [];
    if (filterMode === 'unicode') {
       return allGlyphs.filter(g => g.unicode !== undefined);
    }
    return allGlyphs;
  }, [fontList, activeFontIndex, filterMode]);

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
  const GLYPHS_PER_PAGE_TARGET = 600; 
  
  const [exportFormat, setExportFormat] = useState('svg'); 
  const [pngScale, setPngScale] = useState(1); 
  const [isProcessing, setIsProcessing] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [preset, setPreset] = useState('custom');
  
  // FILENAME PATTERNS
  const [filenamePattern, setFilenamePattern] = useState('U+{hex}'); // For Unicode
  const [ligaturePattern, setLigaturePattern] = useState('{name}');  // For Non-Unicode (Ligatures)

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [globalSettings, setGlobalSettings] = useState(DEFAULT_SETTINGS);
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    if (history.length === 0) {
        const initialState = { globalSettings, overrides };
        setHistory([initialState]);
        setHistoryIndex(0);
    }
  }, []);

  const saveToHistory = useCallback((newGlobal, newOverrides) => {
      const newState = { 
          globalSettings: newGlobal || globalSettings, 
          overrides: newOverrides || overrides 
      };
      
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newState);
      
      if (newHistory.length > 10) newHistory.shift();
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, globalSettings, overrides]);

  const handleUndo = useCallback(() => {
      if (historyIndex > 0) {
          const prevIndex = historyIndex - 1;
          const prevState = history[prevIndex];
          setGlobalSettings(prevState.globalSettings);
          setOverrides(prevState.overrides);
          setHistoryIndex(prevIndex);
      }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
      if (historyIndex < history.length - 1) {
          const nextIndex = historyIndex + 1;
          const nextState = history[nextIndex];
          setGlobalSettings(nextState.globalSettings);
          setOverrides(nextState.overrides);
          setHistoryIndex(nextIndex);
      }
  }, [history, historyIndex]);

  useEffect(() => {
      const handleKeyDown = (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              handleUndo();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              e.preventDefault();
              handleRedo();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleReset = () => {
      if(window.confirm("Reset all settings to default?")) {
          setGlobalSettings(DEFAULT_SETTINGS);
          setOverrides({});
          saveToHistory(DEFAULT_SETTINGS, {});
      }
  };

  const filteredGlyphs = useMemo(() => {
    let result = glyphs;
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(g => {
        const matchesName = g.name?.toLowerCase().includes(lowerTerm);
        const matchesUniName = g.unicodeName?.toLowerCase().includes(lowerTerm);
        const matchesHex = g.hex.toLowerCase().includes(lowerTerm); 
        const matchesRawHex = g.unicode?.toString(16).includes(lowerTerm);
        const matchesChar = g.unicode ? String.fromCharCode(g.unicode).includes(lowerTerm) : false;
        return matchesName || matchesUniName || matchesHex || matchesRawHex || matchesChar;
      });
    }
    return result;
  }, [glyphs, searchTerm]);

  useEffect(() => {
    if (filteredGlyphs.length > 0 || searchTerm) {
      detectBlocks(filteredGlyphs, filterMode);
      setCurrentPage(1); 
    } else if (glyphs.length > 0) {
      detectBlocks(glyphs, filterMode);
    } else {
      setBlocks([]);
    }
  }, [filterMode, filteredGlyphs, glyphs]);

  const handleModeSwitch = (mode) => {
     if (mode === filterMode) return;
     setIsModeLoading(true); 
     setTimeout(() => {
         setFilterMode(mode);
         setIsModeLoading(false);
     }, 50);
  };

  const paginatedBlocks = useMemo(() => {
    if (blocks.length === 0) return [];
    const pages = [];
    let currentPageContent = [];
    let currentCount = 0;

    for (const block of blocks) {
        let glyphsInBlock = block.glyphs;
        let offset = 0;

        while (offset < glyphsInBlock.length) {
            const spaceLeft = GLYPHS_PER_PAGE_TARGET - currentCount;
            if (spaceLeft <= 0) {
                pages.push(currentPageContent);
                currentPageContent = [];
                currentCount = 0;
                continue; 
            }
            const countToTake = Math.min(spaceLeft, glyphsInBlock.length - offset);
            const slice = glyphsInBlock.slice(offset, offset + countToTake);

            currentPageContent.push({
                ...block,
                name: block.name + (glyphsInBlock.length > countToTake ? (offset === 0 ? " (Start)" : " (Cont.)") : ""),
                glyphs: slice,
                count: slice.length,
                isPartial: true,
                originalStart: block.start,
                originalEnd: block.end
            });

            currentCount += slice.length;
            offset += countToTake;
        }
    }
    if (currentPageContent.length > 0) pages.push(currentPageContent);
    return pages;
  }, [blocks]);

  useEffect(() => {
    if (!font || glyphs.length === 0) return;
    const timer = setTimeout(() => { startGlobalScan(); }, 1000); 
    scanCancelRef.current = true; 

    const startGlobalScan = async () => {
       scanCancelRef.current = false; 
       setIsScanning(true);
       setScanProgress(0);
       const BATCH_SIZE = 1000; 
       const total = glyphs.length;
       const newErrors = new Set();
       
       const checkClip = (g) => {
          if (filterMode === 'unicode' && !g.unicode) return false;

          const s = overrides[g.index] || globalSettings;
          if (!g.glyph.path || g.glyph.path.commands.length === 0) return false;
          
          const padFactor = 1 - (s.padding / 100);
          const baseSize = Math.min(s.canvasWidth, s.canvasHeight) * padFactor;
          const scaledFontSize = baseSize * s.scale;
          
          const measurePath = g.glyph.getPath(0, 0, scaledFontSize);
          const mBbox = measurePath.getBoundingBox();
          const gWidth = mBbox.x2 - mBbox.x1;
          const xPos = (s.canvasWidth / 2) + s.translateX - (gWidth / 2) - mBbox.x1;
          
          let yPos;
          if (s.positioning === 'center') {
            const gHeight = mBbox.y2 - mBbox.y1;
            yPos = (s.canvasHeight / 2) + s.translateY + (gHeight / 2) - mBbox.y2;
          } else if (s.positioning === 'metrics' && g.fontMetrics) {
            const totalHeight = g.fontMetrics.ascender - g.fontMetrics.descender;
            const baselineRatio = g.fontMetrics.ascender / totalHeight;
            const availableHeight = s.canvasHeight * padFactor;
            const baselineY = (s.canvasHeight - availableHeight) / 2 + (availableHeight * baselineRatio);
            yPos = baselineY + s.translateY;
          } else {
            const baselineY = s.canvasHeight * 0.65;
            yPos = baselineY + s.translateY;
          }

          const finalPath = g.glyph.getPath(xPos, yPos, scaledFontSize);
          const bbox = finalPath.getBoundingBox();
          const TOLERANCE = 0.1;
          return bbox.x1 < -TOLERANCE || bbox.y1 < -TOLERANCE || bbox.x2 > (s.canvasWidth + TOLERANCE) || bbox.y2 > (s.canvasHeight + TOLERANCE);
       };

       for (let i = 0; i < total; i += BATCH_SIZE) {
          if (scanCancelRef.current) { setIsScanning(false); return; }
          const end = Math.min(i + BATCH_SIZE, total);
          for (let j = i; j < end; j++) {
             if (checkClip(glyphs[j])) newErrors.add(glyphs[j].index);
          }
          setScanProgress(Math.round((end / total) * 100));
          await new Promise(resolve => setTimeout(resolve, 0));
       }
       setErrorIndices(newErrors);
       setIsScanning(false);
    };
    return () => { clearTimeout(timer); scanCancelRef.current = true; };
  }, [globalSettings, overrides, font, glyphs, filterMode]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); 
    e.dataTransfer.dropEffect = 'copy'; 
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) processFiles(files);
  }, []);

  const processFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const newFonts = [];
    let filesProcessed = 0;

    Array.from(fileList).forEach(file => {
        const extension = file.name.split('.').pop().toLowerCase();
        if (extension !== 'ttf' && extension !== 'otf' && extension !== 'woff') {
            filesProcessed++;
            if (filesProcessed === fileList.length && newFonts.length === 0) alert("Please upload .ttf, .otf, or .woff files");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsedFont = opentype.parse(event.target.result);
                const glyphList = [];
                const fontMetrics = {
                    ascender: parsedFont.ascender,
                    descender: parsedFont.descender,
                    unitsPerEm: parsedFont.unitsPerEm
                };

                for (let i = 0; i < parsedFont.glyphs.length; i++) {
                    const glyph = parsedFont.glyphs.get(i);
                    const hexStr = glyph.unicode ? glyph.unicode.toString(16).toUpperCase().padStart(4, '0') : null;
                    
                    const unicodeName = (hexStr && UNICODE_NAMES[hexStr]) ? UNICODE_NAMES[hexStr] : (glyph.name || 'Private Use');

                    glyphList.push({ 
                        id: i,
                        index: i, 
                        glyph: glyph, 
                        unicode: glyph.unicode, 
                        name: glyph.name, 
                        unicodeName: unicodeName, 
                        hex: hexStr ? `U+${hexStr}` : 'No Unicode',
                        fontMetrics: fontMetrics 
                    });
                }

                newFonts.push({
                    name: file.name.replace(/\.(ttf|otf|woff)$/i, ''), 
                    fileName: file.name,
                    fontObj: parsedFont,
                    glyphs: glyphList
                });

            } catch (err) {
                console.error("Failed to parse", file.name, err);
                alert(`Failed to load ${file.name}. WOFF2 requires external decompression.`);
            } finally {
                filesProcessed++;
                if (filesProcessed === fileList.length) {
                    if (newFonts.length > 0) {
                        setFontList(prev => [...prev, ...newFonts]); 
                        if (fontList.length === 0) setActiveFontIndex(0); 
                        else setActiveFontIndex(prev => prev);
                        
                        setErrorIndices(new Set());
                        setOverrides({}); 
                        setSearchTerm(""); 
                        setViewMode('all');
                        saveToHistory(DEFAULT_SETTINGS, {});
                    }
                }
            }
        };
        reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = (e) => processFiles(e.target.files);

  const switchFont = (index) => {
      setActiveFontIndex(index);
      setSelectedIndices(new Set());
      setOverrides({});
      setLastSelectedIndex(null);
      saveToHistory(globalSettings, {});
  };

  const removeFont = (e, index) => {
      e.stopPropagation();
      const newList = fontList.filter((_, i) => i !== index);
      setFontList(newList);
      if (activeFontIndex >= newList.length) {
          setActiveFontIndex(Math.max(0, newList.length - 1));
      }
  };

  const getVisibleGlyphs = useCallback(() => {
    if (!font) return [];
    if (viewMode === 'errors') return glyphs.filter(g => errorIndices.has(g.index));
    if (viewMode === 'block' && activeBlock) return activeBlock.glyphs;
    if (paginatedBlocks.length > 0) {
        const currentBlocks = paginatedBlocks[currentPage - 1];
        if (currentBlocks) return currentBlocks.flatMap(b => b.glyphs);
    }
    return [];
  }, [font, viewMode, activeBlock, paginatedBlocks, currentPage, glyphs, errorIndices]);

  const detectBlocks = (currentGlyphs, mode) => {
    const blockCounts = UNICODE_BLOCKS.map(b => ({ ...b, count: 0, glyphs: [] }));
    const unmappedBlock = { name: "Other / Ligatures", start: null, end: null, count: 0, glyphs: [] };

    currentGlyphs.forEach((g) => {
      let matched = false;
      if (g.unicode !== undefined) {
        const block = blockCounts.find(b => g.unicode >= b.start && g.unicode <= b.end);
        if (block) {
          block.count++;
          block.glyphs.push(g);
          matched = true;
        }
      }
      if (!matched) {
         unmappedBlock.count++;
         unmappedBlock.glyphs.push(g);
      }
    });

    let finalBlocks = blockCounts.filter(b => b.count > 0);
    if (unmappedBlock.count > 0 && mode === 'all') finalBlocks.push(unmappedBlock);
    setBlocks(finalBlocks);
  };

  const handleDeleteGlyphs = (indicesToDelete) => {
    if (!window.confirm(`Are you sure you want to remove ${indicesToDelete.size} glyphs?`)) return;
    const currentFontData = fontList[activeFontIndex];
    const newGlyphs = currentFontData.glyphs.filter(g => !indicesToDelete.has(g.index));
    const newList = [...fontList];
    newList[activeFontIndex] = { ...currentFontData, glyphs: newGlyphs };
    setFontList(newList);
    setSelectedIndices(new Set());
    if (activeBlock) {
       const blockStillExists = newGlyphs.some(g => activeBlock.glyphs.includes(g)); 
       if (!blockStillExists) setViewMode('all');
    }
  };

  const deleteBlock = (block) => {
    if (!window.confirm(`Delete entire block "${block.name}"?`)) return;
    const indicesToRemove = new Set(block.glyphs.map(g => g.index));
    const currentFontData = fontList[activeFontIndex];
    const newGlyphs = currentFontData.glyphs.filter(g => !indicesToRemove.has(g.index));
    const newList = [...fontList];
    newList[activeFontIndex] = { ...currentFontData, glyphs: newGlyphs };
    setFontList(newList);
    if (activeBlock === block) setViewMode('all');
  };

  const updateSetting = (key, value) => {
    if (selectedIndices.size > 0) {
      const newOverrides = { ...overrides };
      selectedIndices.forEach(idx => {
        newOverrides[idx] = { ...(newOverrides[idx] || globalSettings), [key]: value };
      });
      setOverrides(newOverrides);
    } else {
      setGlobalSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  const commitSettingChange = () => {
      saveToHistory(globalSettings, overrides);
  };

  const handleUpdateGlyphPos = useCallback((index, tx, ty) => {
     setOverrides(prev => ({
        ...prev,
        [index]: { ...(prev[index] || globalSettings), translateX: tx, translateY: ty }
     }));
  }, [globalSettings]);

  const handleDragEnd = useCallback(() => {
      saveToHistory(globalSettings, overrides);
  }, [globalSettings, overrides, saveToHistory]);

  const getSettingsForGlyph = (index) => overrides[index] || globalSettings;

  const toggleSelection = useCallback((index, multiSelect) => {
    setSelectedIndices(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) newSet.delete(index);
        else {
            if (!multiSelect) newSet.clear();
            newSet.add(index);
        }
        return newSet;
    });
    setLastSelectedIndex(index);
  }, []);

  const deselectAllGlyphs = useCallback(() => {
    setSelectedIndices(new Set());
    setLastSelectedIndex(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedIndices.size > 0) {
        e.preventDefault();
        deselectAllGlyphs();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndices.size, deselectAllGlyphs]);

  const performAutoFit = () => {
    let targets = [];
    if (selectedIndices.size > 0) targets = glyphs.filter(g => selectedIndices.has(g.index));
    else targets = getVisibleGlyphs(); 

    if (targets.length === 0) return;

    const newOverrides = { ...overrides };
    
    targets.forEach(g => {
        if (!g.glyph.path || g.glyph.path.commands.length === 0) return;
        const bbox = g.glyph.getBoundingBox();
        const gW = bbox.x2 - bbox.x1;
        const gH = bbox.y2 - bbox.y1;
        if(gW === 0 || gH === 0) return;

        const maxDim = Math.max(gW, gH);
        const optimalScale = (g.fontMetrics.unitsPerEm / maxDim); 

        const s = newOverrides[g.index] || globalSettings;
        
        newOverrides[g.index] = {
            ...s,
            scale: optimalScale,
            translateX: 0,
            translateY: 0,
            positioning: 'center' 
        };
    });
    setOverrides(newOverrides);
    saveToHistory(globalSettings, newOverrides);
  };

  const generateSVGString = (glyph, settings) => {
    const padFactor = 1 - (settings.padding / 100);
    const baseSize = Math.min(settings.canvasWidth, settings.canvasHeight) * padFactor;
    const scaledFontSize = baseSize * settings.scale;
    
    const measurePath = glyph.glyph.getPath(0, 0, scaledFontSize);
    const bbox = measurePath.getBoundingBox();
    const gWidth = bbox.x2 - bbox.x1;
    const xPos = (settings.canvasWidth / 2) + settings.translateX - (gWidth / 2) - bbox.x1;
    let yPos;
    if (settings.positioning === 'center') {
        const gHeight = bbox.y2 - bbox.y1;
        yPos = (settings.canvasHeight / 2) + settings.translateY + (gHeight / 2) - bbox.y2;
    } else if (settings.positioning === 'metrics' && glyph.fontMetrics) {
        const totalHeight = glyph.fontMetrics.ascender - glyph.fontMetrics.descender;
        const baselineRatio = glyph.fontMetrics.ascender / totalHeight;
        const availableHeight = settings.canvasHeight * padFactor;
        const baselineY = (settings.canvasHeight - availableHeight) / 2 + (availableHeight * baselineRatio);
        yPos = baselineY + settings.translateY;
    } else {
        const baselineY = settings.canvasHeight * 0.65;
        yPos = baselineY + settings.translateY;
    }
    
    const d = glyph.glyph.getPath(xPos, yPos, scaledFontSize).toPathData(2);
    const cx = settings.canvasWidth / 2;
    const cy = settings.canvasHeight / 2;

    const strokeWidth = Math.abs(settings.strokeWidth - 1) * 2;
    const isTransparentBg = settings.backgroundColor === 'transparent';
    const finalStrokeWidth = (settings.strokeWidth < 1 && isTransparentBg) ? 0 : strokeWidth;

    let fill, strokeColor, strokeW;
    let bgRect = settings.backgroundColor !== 'transparent' ? `<rect width="100%" height="100%" fill="${settings.backgroundColor}"/>` : '';

    if (settings.renderMode === 'outline') {
        fill = 'none';
        strokeColor = settings.color;
        strokeW = settings.strokeWidth <= 1 ? 1 : finalStrokeWidth;
    } else if (settings.renderMode === 'negative') {
        fill = settings.backgroundColor === 'transparent' ? '#ffffff' : settings.backgroundColor;
        strokeColor = fill;
        strokeW = finalStrokeWidth;
        bgRect = `<rect width="100%" height="100%" fill="${settings.color}"/>`; 
    } else {
        fill = settings.color;
        strokeColor = settings.strokeWidth < 1 ? settings.backgroundColor : settings.color;
        strokeW = finalStrokeWidth;
    }

    return `
      <svg width="${settings.canvasWidth}" height="${settings.canvasHeight}" viewBox="0 0 ${settings.canvasWidth} ${settings.canvasHeight}" xmlns="http://www.w3.org/2000/svg">
        ${bgRect}
        <g transform="rotate(${settings.rotate}, ${cx}, ${cy}) scale(${settings.flipH?-1:1}, ${settings.flipV?-1:1})">
           <path d="${d}" fill="${fill}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round" paint-order="stroke" /> 
        </g>
      </svg>
    `;
  };

  const handleDownload = async (scope, targetBlock = null) => {
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      let targets = [];
      
      if (scope === 'selection') targets = glyphs.filter(g => selectedIndices.has(g.index));
      else if (scope === 'block' && targetBlock) targets = targetBlock.glyphs;
      else if (scope === 'errors') targets = glyphs.filter(g => errorIndices.has(g.index));
      else if (scope === 'view') targets = getVisibleGlyphs();
      else targets = filteredGlyphs; 
 
      if (scope === 'all') targets = glyphs; 
 
      // --- DYNAMIC FOLDER NAME LOGIC ---
      const currentFont = fontList[activeFontIndex];
      const fontName = currentFont ? currentFont.name.replace(/\s+/g, '_') : 'font';
      
      let modeLabel = filterMode; 
      
      if (scope === 'selection') {
          modeLabel = 'selected';
      }

      const folderName = `${fontName}_${modeLabel}_glyphs`;
      const folder = zip.folder(folderName);

      for (const g of targets) {
        const settings = getSettingsForGlyph(g.index);
        const svgString = generateSVGString(g, settings);
        
        let patternToUse = filenamePattern; 
        
        if (!g.unicode && filterMode === 'all') {
            patternToUse = ligaturePattern;
        }

        let fileNameBase = patternToUse
            .replace('{fontName}', fontName) 
            .replace('{name}', g.unicodeName || g.name || `glyph_${g.index}`) 
            .replace('{hex}', g.unicode ? g.unicode.toString(16).toUpperCase().padStart(4, '0') : 'NONE')
            .replace('{index}', g.index);
        
        fileNameBase = fileNameBase.replace(/[\/\\?%*:|"<>]/g, '-');

        if (exportFormat === 'svg' || exportFormat === 'both') folder.file(`${fileNameBase}.svg`, svgString);
        if (exportFormat === 'png' || exportFormat === 'both') {
          try {
            const pngBlob = await svgToPng(svgString, settings.canvasWidth, settings.canvasHeight, pngScale);
            folder.file(`${fileNameBase}.png`, pngBlob);
          } catch (e) { console.error(`Failed to convert`, e); }
        }
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${folderName}.zip`);
    } catch (error) {
      alert("An error occurred during export.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentSettings = selectedIndices.size > 0 ? (overrides[Array.from(selectedIndices)[0]] || globalSettings) : globalSettings;

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn("h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans relative", darkMode ? "dark" : "")}
    >
      
      {/* --- Global Loading Overlay for Mode Switch --- */}
      {isModeLoading && (
        <div className="absolute inset-0 z-[60] bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl flex items-center gap-3">
                 <Loader2 className="animate-spin text-violet-600" size={24}/>
                 <span className="font-semibold text-gray-700 dark:text-gray-200">Rendering Fonts...</span>
             </div>
        </div>
      )}

      {isDragging && (
        <div className="absolute inset-0 z-50 bg-violet-600/90 flex flex-col items-center justify-center text-white backdrop-blur-sm animate-in fade-in duration-200">
           <Upload size={64} className="mb-4 animate-bounce" />
           <h2 className="text-3xl font-bold">Drop Fonts Here</h2>
           <p className="text-violet-200 mt-2">You can drop multiple .ttf/.otf/.woff files</p>
        </div>
      )}

      {/* --- Sidebar (COLLAPSIBLE) --- */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        fontList={fontList}
        activeFontIndex={activeFontIndex}
        switchFont={switchFont}
        removeFont={removeFont}
        handleFileUpload={handleFileUpload}
        font={font}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        pngScale={pngScale}
        setPngScale={setPngScale}
        preset={preset}
        setPreset={setPreset}
        currentSettings={currentSettings}
        updateSetting={updateSetting}
        commitSettingChange={commitSettingChange}
        performAutoFit={performAutoFit}
        filenamePattern={filenamePattern}
        setFilenamePattern={setFilenamePattern}
        ligaturePattern={ligaturePattern}
        setLigaturePattern={setLigaturePattern}
        filterMode={filterMode}
        handleModeSwitch={handleModeSwitch}
        blocks={blocks}
        activeBlock={activeBlock}
        setActiveBlock={setActiveBlock}
        paginatedBlocks={paginatedBlocks}
        currentPage={currentPage}
        setViewMode={setViewMode}
        errorIndices={errorIndices}
        handleDownload={handleDownload}
        deleteBlock={deleteBlock}
      />

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 z-10 gap-4">
          <div className="flex items-center gap-4 flex-1">
             {/* --- APP TITLE MOVES HERE IF SIDEBAR CLOSED --- */}
             {!isSidebarOpen && <AppLogo />}

             <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search glyphs (e.g. 'A', '0041', 'U+0995')" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                />
             </div>

             {viewMode !== 'all' && (
               <Button variant="secondary" size="sm" onClick={() => { setViewMode('all'); setActiveBlock(null); }}>
                  <ChevronLeft size={14} /> Back to All
               </Button>
             )}

             {errorIndices.size > 0 && (
               <button 
                 onClick={() => setViewMode(viewMode === 'errors' ? 'all' : 'errors')}
                 className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors", viewMode === 'errors' ? "bg-red-600 text-white border-red-600" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100")}
               >
                 <AlertTriangle size={14} /> {errorIndices.size} Clipping
               </button>
             )}
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 border-r pr-4 mr-1 border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)">
                   <Undo2 size={18}/>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)">
                   <Redo2 size={18}/>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleReset} title="Reset All Settings">
                   <RotateCcw size={18}/>
                </Button>
             </div>

             <Button variant="ghost" onClick={() => setDarkMode(!darkMode)} size="icon">
               {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
             </Button>
             {font && (
               <div className="flex items-center gap-2 border-l pl-4 border-gray-200 dark:border-gray-700">
                 <Button variant="secondary" size="sm" onClick={() => handleDownload('view')} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Download View'}
                 </Button>
                 <Button variant="primary" size="sm" onClick={() => handleDownload('all')} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Download All'}
                 </Button>
               </div>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black/20 p-8 relative custom-scrollbar scroll-smooth">
           {!font ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Type size={64} className="text-gray-300 mb-4"/>
                <h2 className="text-xl font-bold text-gray-400">Drag & Drop Fonts</h2>
                <p className="text-sm text-gray-400 mt-2">You can drop multiple files (e.g. Regular & Bold)</p>
             </div>
           ) : (
             <>
               {(viewMode === 'block' || viewMode === 'errors') && (
                 <div>
                     <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                           {viewMode === 'errors' ? <span className="text-red-500 flex items-center gap-2"><AlertTriangle/> Clipping Errors</span> : <span>{activeBlock?.name}</span>}
                        </h2>
                        {viewMode === 'block' && <span className="text-sm text-gray-500 font-mono">{formatRange(activeBlock.originalStart || activeBlock.start, activeBlock.originalEnd || activeBlock.end)}</span>}
                     </div>
                     <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(120px,1fr))] pb-32">
                        {getVisibleGlyphs().map(g => (
                            <GlyphCard 
                              key={g.index} 
                              g={g} 
                              settings={getSettingsForGlyph(g.index)}
                              isSelected={selectedIndices.has(g.index)}
                              isError={errorIndices.has(g.index)}
                              toggleSelection={toggleSelection}
                              onUpdatePosition={handleUpdateGlyphPos}
                              onDragEnd={handleDragEnd}
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
                            collapsedBlocks={collapsedBlocks}
                            setCollapsedBlocks={setCollapsedBlocks}
                            errorIndices={errorIndices}
                            selectedIndices={selectedIndices}
                            setSelectedIndices={setSelectedIndices}
                            deleteBlock={deleteBlock}
                            handleDownload={handleDownload}
                            setViewMode={setViewMode}
                            setActiveBlock={setActiveBlock}
                            getSettingsForGlyph={getSettingsForGlyph}
                            toggleSelection={toggleSelection}
                            handleUpdateGlyphPos={handleUpdateGlyphPos}
                            handleDragEnd={handleDragEnd}
                        />
                     ))}
                     {paginatedBlocks.length === 0 && <div className="text-gray-500 text-center mt-20">No glyphs found matching your search.</div>}
                 </div>
               )}
             </>
           )}
        </div>

        {font && viewMode === 'all' && <PaginationControls currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={paginatedBlocks.length} />}

        {isScanning && (
           <div className="fixed bottom-20 right-8 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-gray-700 animate-in slide-in-from-bottom-5">
              <Loader2 className="animate-spin text-violet-400" size={20} />
              <div>
                 <div className="text-xs font-bold">Scanning for Errors...</div>
                 <div className="text-[10px] text-gray-400">Checking entire font ({scanProgress}%)</div>
              </div>
           </div>
        )}

        {selectedIndices.size > 0 && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-top-4 border border-gray-700">
             <div className="font-semibold text-sm flex items-center gap-2">
                <span className="bg-violet-500 text-xs px-2 py-0.5 rounded-full">{selectedIndices.size}</span>
                <span>Selected</span>
             </div>
             <div className="h-4 w-px bg-gray-700"></div>
             
             <button onClick={() => handleDownload('selection')} className="flex items-center gap-2 text-sm hover:text-green-400 transition-colors" disabled={isProcessing} title="Download Selected">
                <Download size={16} /> <span className="hidden sm:inline">{isProcessing ? '...' : 'Download'}</span>
             </button>
             
             <button onClick={() => handleDeleteGlyphs(selectedIndices)} className="flex items-center gap-2 text-sm hover:text-red-400 transition-colors" title="Remove Selected from List">
                <Trash2 size={16} /> <span className="hidden sm:inline">Remove</span>
             </button>
             
             <button
               onClick={deselectAllGlyphs}
               className="flex items-center gap-2 text-sm hover:text-orange-400 transition-colors border-l pl-4 border-gray-700"
               title="Deselect all (Esc)"
             >
               <X size={16} />
               <span className="hidden sm:inline">Deselect All</span>
             </button>
          </div>
        )}
      </main>
    </div>
  );
}