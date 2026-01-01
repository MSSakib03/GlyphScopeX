import React, { useState, useEffect, useRef } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Layers, CheckSquare, Square, SlidersHorizontal, MousePointer2, SplinePointer, Type, ArrowUp, ArrowDown, Download, AlertTriangle, GripVertical } from 'lucide-react'; // GripVertical Added
import { Button, SliderControl } from './UIComponents';
import { saveAs } from 'file-saver';
import opentype from 'opentype.js'; 

const getAutoColor = (index) => {
    const colors = ['#FF0000', '#0000FF', '#008000', '#FFA500', '#800080', '#008080', '#FF00FF', '#A52A2A'];
    return colors[index % colors.length];
};

const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

const TypeTester = ({ fontList, darkMode }) => {
    const [text, setText] = useState(""); 
    const [fontSize, setFontSize] = useState(48);
    const [align, setAlign] = useState('center');
    const [padH, setPadH] = useState(20);
    const [padV, setPadV] = useState(20);
    const [fitMode, setFitMode] = useState('together'); 
    const [manualCanvasW, setManualCanvasW] = useState(1000);
    const [manualCanvasH, setManualCanvasH] = useState(200);
    const [calcW, setCalcW] = useState(1000);
    const [calcH, setCalcH] = useState(200);
    const [textColor, setTextColor] = useState(darkMode ? '#FFFFFF' : '#000000');
    const [viewMode, setViewMode] = useState('list'); 
    const [exportTransparent, setExportTransparent] = useState(true);
    const [svgExportType, setSvgExportType] = useState('text'); 
    const [selectedFonts, setSelectedFonts] = useState(new Set(fontList.map((_, i) => i)));
    const [fontStyles, setFontStyles] = useState({});
    const [layerOrder, setLayerOrder] = useState([]);
    
    // --- NEW: Drag State ---
    const [draggedItem, setDraggedItem] = useState(null);

    const loadedFonts = useRef(new Set());
    const [isFontsReady, setIsFontsReady] = useState(false);
    const canvasRefs = useRef({});

    useEffect(() => {
        setLayerOrder(fontList.map((_, i) => i));

        const loadFonts = async () => {
            const promises = fontList.map(async (f, index) => {
                const uniqueName = `tt-font-${index}`;
                if (loadedFonts.current.has(uniqueName)) return;

                try {
                    const arrayBuffer = f.fontObj.toArrayBuffer();
                    const fontFace = new FontFace(uniqueName, arrayBuffer);
                    await fontFace.load();
                    document.fonts.add(fontFace);
                    loadedFonts.current.add(uniqueName);
                } catch (e) {
                    console.error(`Failed to load ${f.name}`, e);
                }
            });

            await Promise.all(promises);
            setIsFontsReady(true);
        };
        loadFonts();
    }, [fontList]);

    useEffect(() => {
        setFontStyles(prev => {
            const newStyles = { ...prev };
            fontList.forEach((_, i) => {
                if (!newStyles[i]) {
                    newStyles[i] = { 
                        color: getAutoColor(i), 
                        opacity: 0.7 
                    };
                }
            });
            return newStyles;
        });
    }, [fontList]);

    const measureTextDimensions = (ctx, fontIndex, currentText, currentSize) => {
        const uniqueName = `tt-font-${fontIndex}`;
        ctx.font = `${currentSize}px "${uniqueName}"`;
        const metrics = ctx.measureText(currentText);
        
        const ascent = metrics.actualBoundingBoxAscent || currentSize;
        const descent = metrics.actualBoundingBoxDescent || (currentSize * 0.25);
        const width = metrics.width;
        
        return {
            w: Math.ceil(width + (padH * 2)),
            h: Math.ceil(ascent + descent + (padV * 2))
        };
    };

    useEffect(() => {
        if (!isFontsReady || fontList.length === 0) return;

        if (fitMode === 'together' || (fitMode === 'separate' && viewMode === 'overlay')) {
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            
            let maxW = 0;
            let maxH = 0;

            const fontsToMeasure = (selectedFonts.size === 0 || selectedFonts.size === fontList.length) 
                ? fontList.map((_, i) => i) 
                : Array.from(selectedFonts);

            fontsToMeasure.forEach(index => {
                const dims = measureTextDimensions(ctx, index, text, fontSize);
                if (dims.w > maxW) maxW = dims.w;
                if (dims.h > maxH) maxH = dims.h;
            });

            if (maxW > 0) {
                setCalcW(maxW);
                setCalcH(maxH);
            }
        }
    }, [text, fontSize, padH, padV, selectedFonts, fontList, fitMode, viewMode, isFontsReady]);

    const draw = () => {
        if (!isFontsReady) return;

        if (viewMode === 'list') {
            fontList.forEach((f, i) => {
                const canvas = canvasRefs.current[`list-${i}`];
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const uniqueName = `tt-font-${i}`;

                let currentW = manualCanvasW;
                let currentH = manualCanvasH;

                if (fitMode === 'together') {
                    currentW = calcW;
                    currentH = calcH;
                } else if (fitMode === 'separate') {
                    const dims = measureTextDimensions(ctx, i, text, fontSize);
                    currentW = dims.w;
                    currentH = dims.h;
                }

                if (canvas.width !== currentW || canvas.height !== currentH) {
                    canvas.width = currentW;
                    canvas.height = currentH;
                }

                ctx.clearRect(0, 0, currentW, currentH);
                
                if (!exportTransparent) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, currentW, currentH);
                }

                ctx.font = `${fontSize}px "${uniqueName}"`;
                ctx.fillStyle = textColor;
                ctx.textBaseline = 'middle';
                
                let x = padH;
                if (align === 'center') x = currentW / 2;
                if (align === 'right') x = currentW - padH;
                
                ctx.textAlign = align;
                ctx.fillText(text, x, currentH / 2);
            });
        }

        if (viewMode === 'overlay') {
            const canvas = canvasRefs.current['overlay'];
            if (!canvas) return;
            
            const w = fitMode === 'none' ? manualCanvasW : calcW;
            const h = fitMode === 'none' ? manualCanvasH : calcH;

            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, w, h);

            if (!exportTransparent) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, w, h);
            }

            layerOrder.forEach((fontIdx) => {
                if (!selectedFonts.has(fontIdx)) return;
                
                const style = fontStyles[fontIdx] || { color: '#000000', opacity: 1 };
                const uniqueName = `tt-font-${fontIdx}`;

                ctx.save();
                ctx.globalAlpha = style.opacity;
                ctx.font = `${fontSize}px "${uniqueName}"`;
                ctx.fillStyle = style.color;
                ctx.textBaseline = 'middle';

                let x = padH;
                if (align === 'center') x = w / 2;
                if (align === 'right') x = w - padH;

                ctx.textAlign = align;
                ctx.fillText(text, x, h / 2);
                ctx.restore();
            });
        }
    };

    useEffect(() => {
        const t = setTimeout(draw, 10); 
        return () => clearTimeout(t);
    }, [text, fontSize, align, manualCanvasW, manualCanvasH, calcW, calcH, textColor, fontList, viewMode, fitMode, padH, padV, selectedFonts, fontStyles, isFontsReady, exportTransparent, layerOrder]);

    const updateFontStyle = (index, key, value) => {
        setFontStyles(prev => ({
            ...prev,
            [index]: {
                ...(prev[index] || { color: getAutoColor(index), opacity: 0.7 }),
                [key]: value
            }
        }));
    };

    // --- DRAG HANDLERS ---
    const handleDragStart = (e, index) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        const draggedIdx = draggedItem;
        if (draggedIdx === null || draggedIdx === index) return;

        const newOrder = [...layerOrder];
        const draggedOrderIdx = newOrder.indexOf(draggedIdx);
        const targetOrderIdx = newOrder.indexOf(index);
        
        newOrder.splice(draggedOrderIdx, 1);
        newOrder.splice(targetOrderIdx, 0, draggedIdx);
        
        setLayerOrder(newOrder);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const toggleFontSelection = (index) => {
        const newSet = new Set(selectedFonts);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        setSelectedFonts(newSet);
    };
    
    const handleDownload = (canvasId, fileName, format = 'png') => {
         const canvas = canvasRefs.current[canvasId];
        if (!canvas) return;

        if (format === 'png') {
            canvas.toBlob(blob => {
                saveAs(blob, fileName + '.png');
            }, 'image/png');
        } else if (format === 'svg') {
            const w = canvas.width;
            const h = canvas.height;
            const x = align === 'center' ? w/2 : (align === 'right' ? w - padH : padH);
            
            let svgContent = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;
            
            let css = "<defs><style>";
            const fontsToEmbed = new Set();
            if (canvasId === 'overlay') {
                layerOrder.forEach(i => { if(selectedFonts.has(i)) fontsToEmbed.add(i); });
            } else {
                const idx = parseInt(canvasId.split('-')[1]);
                fontsToEmbed.add(idx);
            }

            fontsToEmbed.forEach(idx => {
                const f = fontList[idx];
                if (f && f.fontObj) {
                    const base64 = arrayBufferToBase64(f.fontObj.toArrayBuffer());
                    css += `
                        @font-face {
                            font-family: '${f.name}';
                            src: url('data:font/ttf;base64,${base64}') format('truetype');
                        }
                    `;
                }
            });
            css += "text { dominant-baseline: middle; }</style></defs>";
            svgContent += css;

            if (!exportTransparent) svgContent += `<rect width="100%" height="100%" fill="white"/>`;
            
            if (canvasId === 'overlay') {
                 layerOrder.forEach((i) => {
                    if (!selectedFonts.has(i)) return;
                    const f = fontList[i];
                    const style = fontStyles[i] || { color: '#000000', opacity: 1 };
                    
                    if (svgExportType === 'outline' && f.fontObj) {
                        try {
                            let pathX = x;
                            const width = f.fontObj.getAdvanceWidth(text, fontSize);
                            if (align === 'center') pathX = x - (width / 2);
                            if (align === 'right') pathX = x - width;

                            const path = f.fontObj.getPath(text, pathX, h/2 + (fontSize * 0.35), fontSize); 
                            const pathData = path.toPathData(2);
                            svgContent += `<path d="${pathData}" fill="${style.color}" fill-opacity="${style.opacity}" />`;
                        } catch (err) {
                            svgContent += `<text x="${x}" y="${h/2}" font-family="${f.name}" font-size="${fontSize}px" fill="${style.color}" opacity="${style.opacity}" text-anchor="${align === 'center' ? 'middle' : (align === 'right' ? 'end' : 'start')}">${text}</text>`;
                        }
                    } else {
                        svgContent += `<text x="${x}" y="${h/2}" font-family="${f.name}" font-size="${fontSize}px" fill="${style.color}" opacity="${style.opacity}" text-anchor="${align === 'center' ? 'middle' : (align === 'right' ? 'end' : 'start')}">${text}</text>`;
                    }
                 });
            } else {
                 const idx = parseInt(canvasId.split('-')[1]);
                 const f = fontList[idx];
                 const fName = f ? f.name : 'sans-serif';
                 
                 if (svgExportType === 'outline' && f && f.fontObj) {
                     let pathX = x;
                     const width = f.fontObj.getAdvanceWidth(text, fontSize);
                     if (align === 'center') pathX = x - (width / 2);
                     if (align === 'right') pathX = x - width;

                     const path = f.fontObj.getPath(text, pathX, h/2 + (fontSize * 0.35), fontSize);
                     const pathData = path.toPathData(2);
                     svgContent += `<path d="${pathData}" fill="${textColor}" />`;
                 } else {
                    svgContent += `<text x="${x}" y="${h/2}" font-family="${fName}" font-size="${fontSize}px" fill="${textColor}" text-anchor="${align === 'center' ? 'middle' : (align === 'right' ? 'end' : 'start')}">${text}</text>`;
                 }
            }
            svgContent += `</svg>`;
            
            const blob = new Blob([svgContent], {type: "image/svg+xml;charset=utf-8"});
            const suffix = svgExportType === 'outline' ? '_shape' : '_embedded';
            saveAs(blob, fileName + suffix + '.svg');
        }
    };


    return (
        <div className="p-6 space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-5">
                <textarea 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500 outline-none text-xl min-h-[80px] resize-y font-sans"
                    placeholder="Type here to test fonts..."
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 space-y-4 border-r border-gray-100 dark:border-gray-700 pr-4">
                        <SliderControl label="Font Size" value={fontSize} min={12} max={200} step={1} onChange={setFontSize} unit="px" />
                        <div className="grid grid-cols-2 gap-2">
                             <SliderControl label="Pad H" value={padH} min={0} max={200} step={5} onChange={setPadH} unit="px" />
                             <SliderControl label="Pad V" value={padV} min={0} max={200} step={5} onChange={setPadV} unit="px" />
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-3 border-r border-gray-100 dark:border-gray-700 pr-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Canvas Size</label>
                            <div className="flex bg-gray-100 dark:bg-gray-900 rounded p-0.5">
                                <button title="Manual Size" onClick={() => setFitMode('none')} className={`px-2 py-0.5 text-[10px] rounded ${fitMode === 'none' ? 'bg-white shadow text-violet-600' : 'text-gray-500'}`}>Manual</button>
                                <button title="Fit largest of selected" onClick={() => setFitMode('together')} className={`px-2 py-0.5 text-[10px] rounded ${fitMode === 'together' ? 'bg-white shadow text-violet-600' : 'text-gray-500'}`}>Fit Max</button>
                                {viewMode === 'list' && (
                                    <button title="Fit each individually" onClick={() => setFitMode('separate')} className={`px-2 py-0.5 text-[10px] rounded ${fitMode === 'separate' ? 'bg-white shadow text-violet-600' : 'text-gray-500'}`}>Fit Sep</button>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <input type="number" disabled={fitMode !== 'none'} value={fitMode !== 'none' ? calcW : manualCanvasW} onChange={(e) => setManualCanvasW(Number(e.target.value))} className="w-full p-2 bg-gray-50 dark:bg-gray-900 border rounded text-sm disabled:opacity-60" placeholder="W"/>
                            <input type="number" disabled={fitMode !== 'none'} value={fitMode !== 'none' ? calcH : manualCanvasH} onChange={(e) => setManualCanvasH(Number(e.target.value))} className="w-full p-2 bg-gray-50 dark:bg-gray-900 border rounded text-sm disabled:opacity-60" placeholder="H"/>
                        </div>
                        
                         <div className="mt-4 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800">
                             <div className="mb-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Export Options</label>
                             </div>
                             
                             <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                                    <input 
                                        type="checkbox" 
                                        checked={exportTransparent} 
                                        onChange={(e) => setExportTransparent(e.target.checked)} 
                                        className="rounded text-violet-600 focus:ring-violet-500"
                                    />
                                    Transparent PNG
                                </label>
                                
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">SVG Mode:</span>
                                    <div className="flex bg-gray-100 dark:bg-gray-900 p-0.5 rounded" title="SVG Export Type">
                                        <button onClick={() => setSvgExportType('text')} className={`px-2 py-1 rounded text-[10px] flex gap-1 items-center ${svgExportType==='text' ? 'bg-white shadow text-violet-600' : 'text-gray-400'}`}>
                                            <Type size={12}/> Text
                                        </button>
                                        <button onClick={() => setSvgExportType('outline')} className={`px-2 py-1 rounded text-[10px] flex gap-1 items-center ${svgExportType==='outline' ? 'bg-white shadow text-violet-600' : 'text-gray-400'}`}>
                                            <SplinePointer size={12}/> Path
                                        </button>
                                    </div>
                                </div>
                             </div>
                             
                             {svgExportType === 'outline' && (
                                <div className="mt-2 flex items-start gap-1.5 text-[10px] text-amber-600 bg-amber-50 p-1.5 rounded border border-amber-100">
                                    <AlertTriangle size={12} className="mt-0.5"/>
                                    <span>Warning: Shape mode may break ligatures & positioning in complex scripts (e.g., Bengali, Devanagari, Arabic). Use <b>Text mode</b> for 100% accuracy.</span>
                                </div>
                             )}
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-3">
                         <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-500 uppercase">Appearance</label>
                            <div className="flex bg-gray-100 dark:bg-gray-900 p-0.5 rounded-lg">
                                <button onClick={() => setAlign('left')} className={`p-1 rounded ${align==='left' ? 'bg-white dark:bg-gray-700 shadow text-violet-600' : 'text-gray-400'}`}><AlignLeft size={14}/></button>
                                <button onClick={() => setAlign('center')} className={`p-1 rounded ${align==='center' ? 'bg-white dark:bg-gray-700 shadow text-violet-600' : 'text-gray-400'}`}><AlignCenter size={14}/></button>
                                <button onClick={() => setAlign('right')} className={`p-1 rounded ${align==='right' ? 'bg-white dark:bg-gray-700 shadow text-violet-600' : 'text-gray-400'}`}><AlignRight size={14}/></button>
                             </div>
                          </div>
                          
                          {viewMode === 'list' && (
                             <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                                 <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-6 w-6 rounded cursor-pointer border-none bg-transparent"/>
                                 <span className="text-xs text-gray-500 font-mono">Base Color</span>
                             </div>
                          )}

                          <div className="flex gap-2 pt-1">
                             <button onClick={() => setViewMode('list')} className={`flex-1 flex justify-center items-center gap-2 py-1.5 rounded-lg text-xs font-bold border ${viewMode==='list' ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                                 <AlignLeft size={14}/> List
                             </button>
                             <button onClick={() => setViewMode('overlay')} className={`flex-1 flex justify-center items-center gap-2 py-1.5 rounded-lg text-xs font-bold border ${viewMode==='overlay' ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                                 <Layers size={14}/> Overlay
                             </button>
                         </div>
                    </div>
                </div>

                {viewMode === 'overlay' && (
                    <div className="pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                         <div className="flex items-center justify-between mb-2">
                             <label className="text-[10px] font-bold text-gray-500 uppercase">Manage Layers & Styles</label>
                             <span className="text-[10px] text-gray-400">Drag items to reorder (Bottom = Top Layer)</span>
                         </div>
                         <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                             {[...layerOrder].reverse().map((originalIndex, visualIndex) => {
                                 const f = fontList[originalIndex];
                                 const isSelected = selectedFonts.has(originalIndex);
                                 const style = fontStyles[originalIndex] || { color: '#000000', opacity: 1 };
                                 const isDragging = draggedItem === originalIndex;

                                 return (
                                     <div 
                                        key={originalIndex} 
                                        draggable="true"
                                        onDragStart={(e) => handleDragStart(e, originalIndex)}
                                        onDragOver={(e) => handleDragOver(e, originalIndex)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center gap-3 p-2 rounded-lg border transition-all cursor-move select-none ${isSelected ? 'bg-gray-50 dark:bg-gray-900 border-gray-200' : 'bg-transparent border-transparent opacity-60 hover:opacity-100'} ${isDragging ? 'opacity-50 ring-2 ring-violet-400' : ''}`}
                                     >
                                         <GripVertical size={14} className="text-gray-300 cursor-grab active:cursor-grabbing"/>
                                         <input 
                                             type="checkbox" 
                                             checked={isSelected} 
                                             onChange={() => toggleFontSelection(originalIndex)}
                                             className="rounded text-violet-600 h-4 w-4"
                                         />
                                         <span className="text-xs font-bold w-24 truncate" title={f.name}>{f.name}</span>
                                         <div className={`flex items-center gap-3 flex-1 justify-end transition-opacity ${isSelected ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                                             <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 cursor-pointer relative group">
                                                 <input 
                                                     type="color" 
                                                     value={style.color} 
                                                     onChange={(e) => updateFontStyle(originalIndex, 'color', e.target.value)}
                                                     className="absolute -top-2 -left-2 w-10 h-10 p-0 border-0 opacity-0 cursor-pointer"
                                                 />
                                                 <div className="w-full h-full" style={{backgroundColor: style.color}}/>
                                             </div>
                                             <div className="w-20 flex items-center gap-1">
                                                 <SlidersHorizontal size={10} className="text-gray-400"/>
                                                 <input 
                                                     type="range" min="0" max="1" step="0.1" 
                                                     value={style.opacity}
                                                     onChange={(e) => updateFontStyle(originalIndex, 'opacity', parseFloat(e.target.value))}
                                                     className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                                 />
                                             </div>
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {!isFontsReady && <div className="text-center py-10 text-gray-400 animate-pulse">Loading Font Engines...</div>}

                {isFontsReady && viewMode === 'list' ? (
                    fontList.map((f, idx) => (
                        <div key={idx} className={`border rounded-xl overflow-hidden shadow-sm ${selectedFonts.has(idx) ? 'border-violet-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                            <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleFontSelection(idx)}>
                                    <button className={selectedFonts.has(idx) ? "text-violet-600" : "text-gray-300 hover:text-gray-500"}>
                                        {selectedFonts.has(idx) ? <CheckSquare size={18}/> : <Square size={18}/>}
                                    </button>
                                    <span className="font-bold text-sm text-gray-700 dark:text-gray-300 select-none">{f.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="xs" onClick={() => handleDownload(`list-${idx}`, f.name, 'png')} className="text-xs">PNG</Button>
                                    <Button variant="ghost" size="xs" onClick={() => handleDownload(`list-${idx}`, f.name, 'svg')} className="text-xs">SVG</Button>
                                </div>
                            </div>
                            <div className="p-4 overflow-auto flex justify-center bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')]">
                                <canvas ref={el => canvasRefs.current[`list-${idx}`] = el} className="border border-dashed border-gray-200 shadow-sm bg-transparent" style={{maxWidth: '100%', height: 'auto'}} />
                            </div>
                        </div>
                    ))
                ) : isFontsReady && (
                    <div className="border border-violet-200 dark:border-violet-900 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-md">
                        <div className="bg-violet-50 dark:bg-violet-900/20 px-4 py-3 border-b border-violet-100 dark:border-violet-800 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 font-bold text-sm"><Layers size={16}/> Overlay Preview</div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="xs" onClick={() => handleDownload('overlay', 'overlay_comparison', 'svg')}>Download SVG</Button>
                                <Button variant="ghost" size="xs" onClick={() => handleDownload('overlay', 'overlay_comparison', 'png')}>Download PNG</Button>
                            </div>
                        </div>
                        <div className="p-8 overflow-auto flex justify-center bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] min-h-[300px]">
                            {selectedFonts.size > 0 ? (
                                <canvas ref={el => canvasRefs.current['overlay'] = el} className="border border-dashed border-violet-300 shadow-lg bg-transparent" style={{maxWidth: '100%', height: 'auto', objectFit: 'contain'}} />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-gray-400 h-full w-full py-10"><MousePointer2 size={48} className="mb-2 opacity-50"/><p>Select fonts to overlay</p></div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TypeTester;