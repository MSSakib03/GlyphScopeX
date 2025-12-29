import React from 'react';
import { PanelLeftClose, PanelLeftOpen, Upload, FileType, X, Download, Layers, AlignEndHorizontal, AlignVerticalJustifyCenter, Baseline, Maximize, MoveHorizontal, MoveVertical, Palette, FileSignature, Grid, LayoutGrid, Eye, Trash2, CheckSquare, Square } from 'lucide-react';
import { cn, PRESETS, formatRange } from '../utils/utils';
import { Button, SliderControl, AppLogo } from './UIComponents';

const Sidebar = ({
  isSidebarOpen, setIsSidebarOpen, fontList, activeFontIndex, switchFont, removeFont, handleFileUpload,
  font, exportFormat, setExportFormat, pngScale, setPngScale, preset, setPreset,
  currentSettings, updateSetting, commitSettingChange, performAutoFit,
  filenamePattern, setFilenamePattern, ligaturePattern, setLigaturePattern, filterMode, handleModeSwitch,
  blocks, activeBlock, setActiveBlock, paginatedBlocks, currentPage, setCurrentPage, setViewMode, 
  errorIndices, handleDownload, deleteBlock, selectedIndices, setSelectedIndices
}) => {
  return (
    <aside className={cn(
      "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 z-20 shadow-xl overflow-hidden transition-all duration-300 ease-in-out",
      isSidebarOpen ? "w-80" : "w-[60px]" // Fixed collapsed width
    )}>
      {/* --- SIDEBAR HEADER --- */}
      <div className={cn("h-16 flex items-center border-b border-gray-100 dark:border-gray-800 transition-all", isSidebarOpen ? "px-4 justify-between" : "justify-center px-0")}>
         {isSidebarOpen && <AppLogo />}
         <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}>
            {isSidebarOpen ? <PanelLeftClose size={20}/> : <PanelLeftOpen size={20}/>}
         </Button>
      </div>

      <div className={cn("flex-1 overflow-y-auto custom-scrollbar", !isSidebarOpen && "hidden")}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            {fontList.length === 0 ? (
              <label className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-all">
                 <Upload className="text-gray-400 mb-2" size={20}/>
                 <span className="text-xs font-bold text-gray-500">Upload Fonts</span>
                 <p className="text-[10px] text-gray-400 mt-1 text-center">TTF, OTF, WOFF</p>
                 <input type="file" className="hidden" accept=".ttf,.otf,.woff" multiple onChange={handleFileUpload} />
              </label>
            ) : (
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-400 uppercase">Loaded Fonts</div>
                    <label className="text-[10px] text-violet-600 cursor-pointer hover:underline flex items-center gap-1">
                       <Upload size={10}/> Add More
                       <input type="file" className="hidden" accept=".ttf,.otf,.woff" multiple onChange={handleFileUpload} />
                    </label>
                 </div>
                 
                 <div className="space-y-2">
                    {fontList.map((f, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => switchFont(idx)}
                          className={cn(
                            "group flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                            activeFontIndex === idx 
                              ? "bg-violet-50 border-violet-200 dark:bg-violet-900/30 dark:border-violet-700" 
                              : "bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:border-violet-200"
                          )}
                        >
                            <div className={cn("p-1.5 rounded", activeFontIndex === idx ? "bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-200" : "bg-gray-100 dark:bg-gray-700 text-gray-500")}>
                                <FileType size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={cn("text-xs font-semibold truncate", activeFontIndex === idx ? "text-violet-900 dark:text-violet-100" : "text-gray-700 dark:text-gray-300")}>
                                    {f.name}
                                </div>
                                <div className="text-[10px] text-gray-400">{f.glyphs.length} Glyphs</div>
                            </div>
                            <button 
                                onClick={(e) => removeFont(e, idx)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-400 rounded transition-all"
                                title="Remove font"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                 </div>
              </div>
            )}
        </div>

        <div className="p-4 space-y-6">
          <div className="space-y-3">
             <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Download size={12}/> Export Settings</label>
             <div className="grid grid-cols-2 gap-2">
               <div className="col-span-2 grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                 {['svg', 'png', 'both'].map(fmt => (
                   <button key={fmt} onClick={() => setExportFormat(fmt)} className={cn("px-2 py-1.5 text-xs font-medium rounded-md capitalize transition-all", exportFormat === fmt ? "bg-white dark:bg-gray-700 text-violet-600 shadow-sm" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300")}>
                     {fmt}
                   </button>
                 ))}
               </div>
               {(exportFormat === 'png' || exportFormat === 'both') && (
                 <div className="col-span-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500">PNG Size:</span>
                    <div className="flex gap-1">
                      {[1, 2, 4].map(scale => (
                          <button 
                           key={scale} 
                           onClick={() => setPngScale(scale)}
                           className={cn("px-2 py-0.5 text-[10px] font-bold rounded border transition-colors", pngScale === scale ? "bg-violet-100 text-violet-700 border-violet-200" : "bg-white text-gray-500 border-gray-200")}
                          >
                            {scale}x
                          </button>
                      ))}
                    </div>
                 </div>
               )}
             </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Layers size={12}/> Canvas</label>
            <select value={preset} onChange={(e) => { setPreset(e.target.value); if(e.target.value!=='custom'){ updateSetting('canvasWidth', PRESETS[e.target.value].w); updateSetting('canvasHeight', PRESETS[e.target.value].h); commitSettingChange(); }}} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none">
               {Object.entries(PRESETS).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}
            </select>
            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1"><label className="text-[10px] text-gray-500">W</label><input type="number" value={currentSettings.canvasWidth} onChange={(e)=>updateSetting('canvasWidth', Number(e.target.value))} className="w-full p-1.5 text-xs bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded"/></div>
               <div className="space-y-1"><label className="text-[10px] text-gray-500">H</label><input type="number" value={currentSettings.canvasHeight} onChange={(e)=>updateSetting('canvasHeight', Number(e.target.value))} className="w-full p-1.5 text-xs bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded"/></div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase">Adjustments</label>
            
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
               <button onClick={() => { updateSetting('positioning', 'baseline'); commitSettingChange(); }} title="Relative Baseline" className={cn("flex-1 text-xs py-1 rounded flex items-center justify-center gap-1", currentSettings.positioning === 'baseline' ? "bg-white dark:bg-gray-700 shadow-sm text-violet-600" : "text-gray-500")}>
                  <AlignEndHorizontal size={12} className="rotate-90"/> Base
               </button>
               <button onClick={() => { updateSetting('positioning', 'center'); commitSettingChange(); }} title="Geometric Center" className={cn("flex-1 text-xs py-1 rounded flex items-center justify-center gap-1", currentSettings.positioning === 'center' ? "bg-white dark:bg-gray-700 shadow-sm text-violet-600" : "text-gray-500")}>
                  <AlignVerticalJustifyCenter size={12}/> Center
               </button>
               <button onClick={() => { updateSetting('positioning', 'metrics'); commitSettingChange(); }} title="Use Font Metrics (Ascender/Descender)" className={cn("flex-1 text-xs py-1 rounded flex items-center justify-center gap-1", currentSettings.positioning === 'metrics' ? "bg-white dark:bg-gray-700 shadow-sm text-violet-600" : "text-gray-500")}>
                  <Baseline size={12}/> Metrics
               </button>
            </div>

            <Button variant="outline" size="sm" onClick={performAutoFit} className="w-full text-violet-600 border-violet-200 hover:bg-violet-50" title="Auto Fit & Center">
               <Maximize size={14}/> Auto Fit & Center
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Move X</label>
                 <input type="number" value={currentSettings.translateX} onChange={(e) => updateSetting('translateX', Number(e.target.value))} className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"/>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Move Y</label>
                 <input type="number" value={currentSettings.translateY} onChange={(e) => updateSetting('translateY', Number(e.target.value))} className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"/>
              </div>
            </div>

            <SliderControl label="Scale" value={currentSettings.scale} min={0.1} max={5} step={0.1} unit="x" onChange={(v) => updateSetting('scale', v)} onAfterChange={commitSettingChange} />
            <SliderControl label="Padding" value={currentSettings.padding} min={0} max={60} step={1} unit="%" onChange={(v) => updateSetting('padding', v)} onAfterChange={commitSettingChange} />
            <SliderControl label="Stroke Width" value={currentSettings.strokeWidth} min={0} max={5} step={0.05} unit="" onChange={(v) => updateSetting('strokeWidth', v)} onAfterChange={commitSettingChange} />

            <div className="grid grid-cols-2 gap-2 mt-2">
               <Button variant="outline" size="sm" onClick={() => { updateSetting('flipH', !currentSettings.flipH); commitSettingChange(); }} className={currentSettings.flipH ? "bg-violet-50 border-violet-200 text-violet-700" : ""} title="Flip Horizontal">
                 <MoveHorizontal size={14}/> Flip H
               </Button>
               <Button variant="outline" size="sm" onClick={() => { updateSetting('flipV', !currentSettings.flipV); commitSettingChange(); }} className={currentSettings.flipV ? "bg-violet-50 border-violet-200 text-violet-700" : ""} title="Flip Vertical">
                 <MoveVertical size={14}/> Flip V
               </Button>
            </div>
            <SliderControl label="Rotate" value={currentSettings.rotate} min={0} max={360} step={1} unit="°" onChange={(v) => updateSetting('rotate', v)} onAfterChange={commitSettingChange} />
            
            {/* --- COLORS & STYLE SECTION --- */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Palette size={12}/> Appearance</label>
              
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-20 text-[10px] text-gray-500 font-semibold">Style</div>
                 <div className="flex-1 flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
                    {['fill', 'outline', 'negative'].map(mode => (
                        <button key={mode} onClick={() => { updateSetting('renderMode', mode); commitSettingChange(); }} className={cn("flex-1 text-[10px] py-1 rounded capitalize transition-all", currentSettings.renderMode === mode ? "bg-white dark:bg-gray-700 shadow-sm text-violet-600 font-bold" : "text-gray-500")}>
                           {mode}
                        </button>
                    ))}
                 </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-20 text-[10px] text-gray-500 font-semibold">Fill Color</div>
                <div className="flex-1 flex items-center gap-2 p-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                  <input type="color" value={currentSettings.color} onChange={(e) => updateSetting('color', e.target.value)} onBlur={commitSettingChange} className="h-5 w-6 border-none rounded cursor-pointer bg-transparent" />
                  <input type="text" value={currentSettings.color} onChange={(e) => updateSetting('color', e.target.value)} onBlur={commitSettingChange} className="flex-1 bg-transparent text-xs font-mono focus:outline-none uppercase" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                 <div className="w-20 text-[10px] text-gray-500 font-semibold">Background</div>
                 <div className="flex-1 flex items-center gap-1">
                    <button onClick={() => { updateSetting('backgroundColor', 'transparent'); commitSettingChange(); }} className={cn("h-6 w-6 rounded border flex items-center justify-center text-[10px]", currentSettings.backgroundColor === 'transparent' ? "border-violet-500 ring-1 ring-violet-500" : "border-gray-200")} title="Transparent">
                       <div className="w-full h-full bg-[length:4px_4px]" style={{ backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)' }}></div>
                    </button>
                    <button onClick={() => { updateSetting('backgroundColor', '#FFFFFF'); commitSettingChange(); }} className={cn("h-6 w-6 rounded border bg-white", currentSettings.backgroundColor === '#FFFFFF' ? "border-violet-500 ring-1 ring-violet-500" : "border-gray-200")} title="White"></button>
                    <button onClick={() => { updateSetting('backgroundColor', '#000000'); commitSettingChange(); }} className={cn("h-6 w-6 rounded border bg-black", currentSettings.backgroundColor === '#000000' ? "border-violet-500 ring-1 ring-violet-500" : "border-gray-600")} title="Black"></button>
                    
                    <div className={cn("w-28 flex items-center gap-1 p-1 border rounded-lg bg-white dark:bg-gray-800", currentSettings.backgroundColor !== 'transparent' && currentSettings.backgroundColor !== '#FFFFFF' && currentSettings.backgroundColor !== '#000000' ? "border-violet-500" : "border-gray-200 dark:border-gray-700")}>
                       <input type="color" value={currentSettings.backgroundColor === 'transparent' ? '#ffffff' : currentSettings.backgroundColor} onChange={(e) => updateSetting('backgroundColor', e.target.value)} onBlur={commitSettingChange} className="h-6 w-6 border-none rounded cursor-pointer bg-transparent shrink-0" />
                       <input type="text" value={currentSettings.backgroundColor === 'transparent' ? '' : currentSettings.backgroundColor} placeholder="HEX" onChange={(e) => updateSetting('backgroundColor', e.target.value)} onBlur={commitSettingChange} className="flex-1 min-w-0 bg-transparent text-[10px] font-mono focus:outline-none uppercase" />
                    </div>
                 </div>
              </div>
            </div>

            {/* --- UPDATED: FILENAME PATTERN SECTION --- */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><FileSignature size={12}/> Filename Pattern</label>
              
              {/* Unicode Pattern */}
              <div className="space-y-1">
                  <label className="text-[9px] text-gray-500">For Unicode Glyphs</label>
                  <div className="flex items-center gap-2 p-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <input 
                      type="text" 
                      value={filenamePattern} 
                      onChange={(e) => setFilenamePattern(e.target.value)} 
                      className="flex-1 p-1 bg-transparent text-xs font-mono focus:outline-none"
                      placeholder="U+{hex}" 
                    />
                  </div>
              </div>

              {/* Ligature Pattern - ONLY VISIBLE IF MODE IS ALL */}
              {filterMode === 'all' && (
                  <div className="space-y-1 animate-in slide-in-from-top-2">
                      <label className="text-[9px] text-gray-500">For Ligatures/Non-Unicode</label>
                      <div className="flex items-center gap-2 p-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 border-l-4 border-l-violet-400">
                      <input 
                          type="text" 
                          value={ligaturePattern} 
                          onChange={(e) => setLigaturePattern(e.target.value)} 
                          className="flex-1 p-1 bg-transparent text-xs font-mono focus:outline-none"
                          placeholder="{name}" 
                      />
                      </div>
                  </div>
              )}

              <div className="flex flex-wrap gap-1 text-[9px] text-gray-400">
                  <span className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{`{fontName}`}</span>
                  <span className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{`{name}`}</span>
                  <span className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{`{hex}`}</span>
                  <span className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{`{index}`}</span>
              </div>
            </div>

          </div>

          {font && (
             <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
               <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-2">
                   <button onClick={() => handleModeSwitch('unicode')} className={cn("flex-1 text-xs py-1.5 rounded flex items-center justify-center gap-1.5 font-medium transition-all", filterMode === 'unicode' ? "bg-white dark:bg-gray-700 shadow-sm text-violet-600" : "text-gray-500")}>
                      <Grid size={12}/> Unicode Only
                   </button>
                   <button onClick={() => handleModeSwitch('all')} className={cn("flex-1 text-xs py-1.5 rounded flex items-center justify-center gap-1.5 font-medium transition-all", filterMode === 'all' ? "bg-white dark:bg-gray-700 shadow-sm text-violet-600" : "text-gray-500")}>
                      <LayoutGrid size={12}/> All (Ligatures)
                   </button>
               </div>

               <label className="text-xs font-bold text-gray-400 uppercase flex items-center justify-between">
                 <span>Detected Blocks</span>
                 <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 px-1.5 rounded text-[10px]">{blocks.length}</span>
               </label>
               <div className="space-y-1">
                   {blocks.map((block, idx) => {
                     const isAllSelected = block.glyphs.every(g => selectedIndices.has(g.index));
                     return (
                     <div key={idx} className={cn("group flex flex-col p-2 rounded-lg border transition-all", activeBlock === block ? "bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800" : "bg-white border-transparent hover:border-gray-200 dark:bg-gray-800/50 dark:hover:border-gray-700")}>
                        <div className="flex justify-between items-start mb-1">
                           <div>
                              <div className={cn("text-xs font-semibold truncate max-w-[150px]", block.glyphs.some(g => errorIndices.has(g.index)) ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-200")} title={block.name}>{block.name}</div>
                              <div className="text-[10px] font-mono text-gray-400">{formatRange(block.originalStart || block.start, block.originalEnd || block.end)}</div>
                           </div>
                           <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500">{block.count}</span>
                        </div>
                        
                        {/* --- SIDEBAR PANEL ICONS --- */}
                        <div className="flex items-center gap-1 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { setViewMode('block'); setActiveBlock(block); setCurrentPage(1); }} title="View Only This Block" className="p-1 hover:bg-violet-100 dark:hover:bg-violet-800 rounded text-violet-600"><Eye size={14}/></button>
                           
                           {/* --- SELECT BLOCK BUTTON --- */}
                           <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  const newSet = new Set(selectedIndices);
                                  if (isAllSelected) {
                                      block.glyphs.forEach(g => newSet.delete(g.index));
                                  } else {
                                      block.glyphs.forEach(g => newSet.add(g.index));
                                  }
                                  setSelectedIndices(newSet);
                              }}
                              title={isAllSelected ? "Deselect Block" : "Select Block"}
                              className={cn("p-1 rounded transition-colors", isAllSelected ? "text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700")}
                           >
                              {isAllSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                           </button>

                           {/* --- TRASH & DOWNLOAD ICONS --- */}
                           <div className="ml-auto flex items-center gap-1">
                              <button onClick={() => deleteBlock(block)} title="Delete Block" className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-500"><Trash2 size={14}/></button>
                              <button onClick={() => handleDownload('block', block)} title="Download Block" className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded text-green-600"><Download size={14}/></button>
                           </div>
                        </div>
                     </div>
                   )})}
               </div>
             </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;