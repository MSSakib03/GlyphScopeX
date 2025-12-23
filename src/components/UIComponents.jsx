import React from 'react';
import { cn } from '../utils/utils';

export const Button = ({ children, onClick, variant = 'primary', className, disabled, size='md', title }) => {
  const base = "font-medium transition-all flex items-center justify-center gap-2 rounded-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const sizes = { xs: "px-1.5 py-1 text-[10px]", sm: "px-2 py-1 text-xs", md: "px-4 py-2 text-sm", icon: "p-2" };
  const variants = {
    primary: "bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-200 dark:shadow-none",
    secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 dark:bg-red-900/20 dark:border-red-800",
    ghost: "hover:bg-gray-100 text-gray-600 dark:text-gray-400 dark:hover:bg-gray-800",
    outline: "border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
    active: "bg-violet-600 text-white border-violet-600"
  };
  return (
    <button onClick={onClick} disabled={disabled} title={title} className={cn(base, sizes[size], variants[variant], className)}>
      {children}
    </button>
  );
};

export const SliderControl = ({ label, value, min, max, step, onChange, onAfterChange, unit = '' }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="flex items-center bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded px-2 py-0.5">
        <input 
          type="number" 
          value={value} 
          onChange={(e) => {
             const val = Number(e.target.value);
             onChange(val);
             if(onAfterChange) onAfterChange(val); 
          }}
          className="w-12 text-right bg-transparent text-xs font-mono focus:outline-none"
        />
        <span className="text-xs text-gray-400 ml-1">{unit}</span>
      </div>
    </div>
    <input 
      type="range" min={min} max={max} step={step} 
      value={value} 
      onChange={(e) => onChange(Number(e.target.value))}
      onMouseUp={(e) => onAfterChange && onAfterChange(Number(e.target.value))} 
      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600 dark:bg-gray-700"
    />
  </div>
);

export const AppLogo = () => (
  <div className="flex items-center gap-3">
    <svg viewBox="0 0 100 100" className="w-10 h-10 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.9.4h66.3c8.9 0 16.1 7.3 16.1 16.3v66.7c0 9-7.2 16.3-16.1 16.3H16.9C8 99.6.7 92.4.7 83.4V16.6C.7 7.6 8 .4 16.9.4" fill="#4f46e5" />
      <path fill="#fff" d="M65.5 54.4c-.4-1.6-2.9-9.2-8-16.9-.1-.1-.1-.1-.2-.1L34 31.2c-.4-.1-.8.4-.4.7l10 10.1c1.1-.6 2.6-.4 3.5.6.3.2.4.5.6.8.6 1.2.4 2.6-.6 3.5s-2.4 1.2-3.5.6c-.3-.2-.6-.3-.8-.6-1-1-1.1-2.4-.6-3.5l-10-10.1c-.3-.3-.9 0-.7.4L37.6 57c0 .1.1.2.1.2 7.2 4.9 15.3 7.6 16.9 8 .2 0 .3 0 .4-.1l10.3-10.3c.2-.1.2-.3.2-.4m-7.7 3.9h-2.1l-.4-1.2-.5-1.6-.2-.4h-4.9c-.1 0-.3.4-.4.9-.2.5-.4 1.1-.5 1.5l-.2.6h-1.1c-.6 0-1.1 0-1.1-.1s.5-1.4 1.1-3c3.6-9.9 3.5-9.6 3.7-9.5.1 0 .6.1 1.2.1.6 0 1.2 0 1.2.1.1.1 1.2 3.2 1.6 4.3s1.3 3.6 2.4 6.7c.3.8.5 1.4.5 1.5.2 0 0 .1-.2.1" />
      <path fill="#fff" d="M53.2 50.1c-.4-1.1-.7-2-.8-2.1-.2-.1-.3.1-.8 1.7-.3.9-.6 1.9-.8 2.4s-.3.9-.2 1 .4.1.9.1H53c.5 0 .9 0 1-.1.1 0 .1-.3-.1-.6 0-.2-.4-1.3-.7-2.4m18.1 7.6-2.2-2.2c-.5-.5-1.3-.5-1.8 0L55.8 67c-.5.5-.5 1.3 0 1.8L58 71c.5.5 1.3.5 1.9 0l11.5-11.5c.4-.5.4-1.3-.1-1.8" />
      <path d="M18.7 18.7h62.5v62.5H18.7z" fill="none" stroke="#fff" strokeWidth="5.333" />
      <path fill="#fff" d="M10.9 10.9h15.6v15.6H10.9zm0 62.5h15.6V89H10.9zm62.5 0H89V89H73.4zm0-62.5H89v15.6H73.4z" />
    </svg>
    <div className="font-bold text-lg tracking-tight text-gray-900 dark:text-white leading-tight whitespace-nowrap">
      <span className="block">GlyphForge</span>
      <span className="block text-sm font-normal opacity-80">Font Glyph Exporter</span>
    </div>
  </div>
);