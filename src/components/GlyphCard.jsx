import React, { useState, useRef, useMemo } from 'react';
import { cn } from '../utils/utils';
import { Copy, Check } from 'lucide-react'; // New icons

const GlyphCard = React.memo(({ g, comparisonG, settings, isSelected, isError, toggleSelection, onUpdatePosition, onDragEnd, showGuidelines }) => { // showGuidelines prop added
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialTx: 0, initialTy: 0 });
  const hasMovedRef = useRef(false);
  const [copied, setCopied] = useState(false); // For copy feedback

  const strokeWidth = Math.abs(settings.strokeWidth - 1) * 2; 
  const strokeColor = settings.strokeWidth < 1 ? settings.backgroundColor : settings.color;
  const isTransparentBg = settings.backgroundColor === 'transparent';
  const finalStrokeWidth = (settings.strokeWidth < 1 && isTransparentBg) ? 0 : strokeWidth;

  let fill, stroke, strokeClr;
  if (settings.renderMode === 'outline') {
    fill = 'none';
    strokeClr = settings.color;
    stroke = settings.strokeWidth <= 1 ? 1 : finalStrokeWidth; 
  } else if (settings.renderMode === 'negative') {
    fill = settings.backgroundColor === 'transparent' ? '#ffffff' : settings.backgroundColor;
    strokeClr = fill;
    stroke = finalStrokeWidth;
  } else {
    fill = settings.color;
    strokeClr = settings.strokeWidth < 1 ? settings.backgroundColor : settings.color;
    stroke = finalStrokeWidth;
  }

  // Helper to calculate Path Data
  const calculatePathData = (glyphData) => {
    if (!glyphData || !glyphData.glyph.path || glyphData.glyph.path.commands.length === 0) return null;
    
    const padFactor = 1 - (settings.padding / 100);
    const baseSize = Math.min(settings.canvasWidth, settings.canvasHeight) * padFactor;
    const scaledFontSize = baseSize * settings.scale;
    
    const measurePath = glyphData.glyph.getPath(0, 0, scaledFontSize);
    const bbox = measurePath.getBoundingBox();
    const gWidth = bbox.x2 - bbox.x1;
    
    const xPos = (settings.canvasWidth / 2) + settings.translateX - (gWidth / 2) - bbox.x1;
    
    let yPos;
    if (settings.positioning === 'center') {
      const gHeight = bbox.y2 - bbox.y1;
      yPos = (settings.canvasHeight / 2) + settings.translateY + (gHeight / 2) - bbox.y2;
    } else if (settings.positioning === 'metrics' && glyphData.fontMetrics) {
      const totalHeight = glyphData.fontMetrics.ascender - glyphData.fontMetrics.descender;
      const baselineRatio = glyphData.fontMetrics.ascender / totalHeight;
      const availableHeight = settings.canvasHeight * padFactor;
      const baselineY = (settings.canvasHeight - availableHeight) / 2 + (availableHeight * baselineRatio);
      yPos = baselineY + settings.translateY;
    } else {
      const baselineY = settings.canvasHeight * 0.65;
      yPos = baselineY + settings.translateY;
    }

    const finalPath = glyphData.glyph.getPath(xPos, yPos, scaledFontSize);
    return { d: finalPath.toPathData(2), yPos, fontScale: scaledFontSize / glyphData.fontMetrics.unitsPerEm };
  };

  const pathData = useMemo(() => calculatePathData(g), [g, settings]);
  const d = pathData?.d;
  
  // Calculate Guidelines Positions (Relative to Canvas)
  const guides = useMemo(() => {
    if (!showGuidelines || !pathData || !g.fontMetrics) return null;
    const { yPos, fontScale } = pathData;
    // In SVG coords (y goes down), but font coords y goes up.
    // yPos is the baseline position in SVG pixels.
    return {
        baseline: yPos,
        ascender: yPos - (g.fontMetrics.ascender * fontScale),
        descender: yPos - (g.fontMetrics.descender * fontScale)
    };
  }, [showGuidelines, pathData, g.fontMetrics]);

  const d2 = useMemo(() => comparisonG ? calculatePathData(comparisonG)?.d : null, [comparisonG, settings]);

  const cx = settings.canvasWidth / 2;
  const cy = settings.canvasHeight / 2;

  const bgStyle = settings.backgroundColor === 'transparent' 
    ? { backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '12px 12px' }
    : { backgroundColor: settings.backgroundColor };

  // --- COPY HANDLER ---
  const handleCopy = (e) => {
      e.stopPropagation();
      if (!d) return;
      const svgCode = `<svg viewBox="0 0 ${settings.canvasWidth} ${settings.canvasHeight}" xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="${fill}"/></svg>`;
      navigator.clipboard.writeText(svgCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY, initialTx: settings.translateX, initialTy: settings.translateY };
    e.target.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMovedRef.current = true;
    onUpdatePosition(g.index, dragStartRef.current.initialTx + dx, dragStartRef.current.initialTy + dy);
  };
  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
    if (!hasMovedRef.current) toggleSelection(g.index, e.shiftKey || e.ctrlKey);
    else if(onDragEnd) onDragEnd(); 
  };

  return (
    <div className={cn("group bg-white dark:bg-gray-800 rounded-lg border-2 transition-all overflow-hidden flex flex-col hover:shadow-md relative", isSelected ? "border-violet-600 ring-2 ring-violet-200 dark:ring-violet-900" : (isError ? "border-red-400 bg-red-50 dark:bg-red-900/10" : "border-gray-100 dark:border-gray-700"))}>
      
      {/* Copy Button Overlay */}
      <button 
        onClick={handleCopy}
        className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-sm border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-violet-600"
        title="Copy SVG Code"
      >
          {copied ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
      </button>

      <div className={cn("relative flex-1 min-h-[100px] p-2 flex items-center justify-center touch-none", isDragging ? "cursor-grabbing" : "cursor-grab")} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
          <div style={{ width: '100%', aspectRatio: `${settings.canvasWidth}/${settings.canvasHeight}`, maxHeight: '120px' }} className="relative flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 rounded border border-gray-100 dark:border-gray-700 overflow-hidden" style={bgStyle}>
              {settings.renderMode === 'negative' && (<div className="w-full h-full" style={{ backgroundColor: settings.color }}></div>)}
            </div>
            
            <svg viewBox={`0 0 ${settings.canvasWidth} ${settings.canvasHeight}`} className="w-full h-full overflow-visible relative z-10">
              <g transform={`rotate(${settings.rotate}, ${cx}, ${cy}) scale(${settings.flipH?-1:1}, ${settings.flipV?-1:1})`}>
                
                {/* Visual Guidelines */}
                {guides && (
                    <g strokeWidth="0.5" className="opacity-50">
                        <line x1="-1000" x2="1000" y1={guides.ascender} y2={guides.ascender} stroke="#10b981" strokeDasharray="2,2" vectorEffect="non-scaling-stroke"/>
                        <line x1="-1000" x2="1000" y1={guides.baseline} y2={guides.baseline} stroke="#3b82f6" vectorEffect="non-scaling-stroke"/>
                        <line x1="-1000" x2="1000" y1={guides.descender} y2={guides.descender} stroke="#ef4444" strokeDasharray="2,2" vectorEffect="non-scaling-stroke"/>
                    </g>
                )}

                {d ? (<path d={d} fill={fill} stroke={strokeClr} strokeWidth={stroke} paintOrder="stroke" strokeLinejoin="round" />) : <text x="50%" y="50%" textAnchor="middle" fill="#ccc" fontSize="20">?</text>}
                {d2 && (<path d={d2} fill={settings.comparisonColor} opacity={settings.comparisonOpacity} stroke="none"/>)}
              </g>
            </svg>
          </div>
      </div>
      <div className="px-2 py-1.5 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 text-center pointer-events-none flex flex-col justify-center min-h-[40px]">
         <div className="text-[10px] font-bold font-mono text-gray-600 dark:text-gray-300 leading-tight" title={g.hex}>{g.hex}</div>
         <div className="text-[9px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-0.5" title={g.unicodeName}>{g.unicodeName}</div>
      </div>
    </div>
  );
}, (prev, next) => {
  return prev.g.index === next.g.index && prev.comparisonG === next.comparisonG && prev.isSelected === next.isSelected && prev.isError === next.isError && prev.settings === next.settings && prev.showGuidelines === next.showGuidelines; // Checked new prop
});

export default GlyphCard;