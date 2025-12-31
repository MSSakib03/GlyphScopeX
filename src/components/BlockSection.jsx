import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Trash2, CheckSquare, Square, Download } from 'lucide-react';
import { cn, formatRange } from '../utils/utils';
import { Button } from './UIComponents';
import GlyphCard from './GlyphCard';

const BlockSection = ({ 
    block, collapsedBlocks, setCollapsedBlocks, errorIndices, selectedIndices, setSelectedIndices, deleteBlock, handleDownload, setViewMode, setActiveBlock, getSettingsForGlyph, toggleSelection, handleUpdateGlyphPos, handleDragEnd, setCurrentPage, comparisonMap,
    showGuidelines // New prop
}) => {
  const collapseKey = `${block.name}-${block.glyphs[0]?.index}`;
  const isCollapsed = collapsedBlocks.has(collapseKey);
  const hasError = useMemo(() => block.glyphs.some(g => errorIndices.has(g.index)), [block.glyphs, errorIndices]);
  const isAllSelected = block.glyphs.every(g => selectedIndices.has(g.index));

  return (
    <div className={cn("mb-8 border rounded-xl overflow-hidden shadow-sm transition-colors", hasError ? "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50")}>
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" onClick={() => { const newSet = new Set(collapsedBlocks); if (newSet.has(collapseKey)) newSet.delete(collapseKey); else newSet.add(collapseKey); setCollapsedBlocks(newSet); }}>
        <div className="flex items-center gap-3">
           {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
           <div><h3 className={cn("font-bold flex items-center gap-2", hasError ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-gray-200")}>{block.name}{hasError && <AlertTriangle size={14} className="animate-pulse"/>}</h3><span className="text-xs text-gray-500 font-mono">{formatRange(block.originalStart || block.start, block.originalEnd || block.end)} • {block.count} Glyphs</span></div>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
           {!block.isPartial && (<Button variant="ghost" size="icon" onClick={() => deleteBlock(block)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30" title="Delete Block"><Trash2 size={16} /></Button>)}
           <Button variant="ghost" size="icon" onClick={() => { const newSet = new Set(selectedIndices); if (isAllSelected) block.glyphs.forEach(g => newSet.delete(g.index)); else block.glyphs.forEach(g => newSet.add(g.index)); setSelectedIndices(newSet); }} title={isAllSelected ? "Deselect Block" : "Select Block"}>{isAllSelected ? <CheckSquare size={18} className="text-violet-600"/> : <Square size={18} className="text-gray-400"/>}</Button>
           <Button variant="ghost" size="icon" onClick={() => handleDownload('block', block)} title="Download Block"><Download size={16}/></Button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="p-4 grid gap-4 grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
           {block.glyphs.map(g => {
              let compGlyph = null;
              if (comparisonMap) {
                  if (g.unicode !== undefined) compGlyph = comparisonMap.get(g.unicode);
                  if (!compGlyph && g.name) compGlyph = comparisonMap.get(g.name);
              }
              return (
                <GlyphCard 
                    key={g.index} 
                    g={g} 
                    comparisonG={compGlyph}
                    settings={getSettingsForGlyph(g.index)}
                    isSelected={selectedIndices.has(g.index)}
                    isError={errorIndices.has(g.index)}
                    toggleSelection={toggleSelection}
                    onUpdatePosition={handleUpdateGlyphPos}
                    onDragEnd={handleDragEnd}
                    showGuidelines={showGuidelines} // Pass down
                />
              );
           })}
        </div>
      )}
    </div>
  );
};

export default BlockSection;