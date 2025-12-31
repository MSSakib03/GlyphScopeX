import React from 'react';
import { cn } from '../utils/utils';
import { AlertTriangle, X } from 'lucide-react'; // Ensure imports are correct

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
    {/* Updated SVG Logo */}
    <svg 
      viewBox="0 0 100 100" 
      className="w-10 h-10 shrink-0" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M16.9.4h66.3c8.9 0 16.1 7.3 16.1 16.3v66.7c0 9-7.2 16.3-16.1 16.3H16.9C8 99.6.7 92.4.7 83.4V16.6C.7 7.6 8 .4 16.9.4" 
        fill="#4f46e5" 
      />
      <path 
        d="M18.7 18.7h62.5v62.5H18.7z" 
        style={{ fill: 'none', stroke: '#fff', strokeWidth: '4.5' }} 
      />
      <path 
        fill="#fff" 
        d="M10.9 10.9h15.6v15.6H10.9zm0 62.5h15.6V89H10.9zm62.5 0H89V89H73.4zm0-62.5H89v15.6H73.4z" 
      />
      <path 
        fill="#4f46e5" 
        d="M14.3 76.8H23v8.7h-8.7zm0-62.5H23V23h-8.7zm62.5 0h8.7V23h-8.7zm0 62.5h8.7v8.7h-8.7z" 
      />
      <path 
        fill="#fff" 
        d="M50.9 31 40.2 60.4h-4.4l12.3-32.3h2.8zm8.3 17.5V52H41.1v-3.5zm.6 11.9L49.1 31l-.1-2.8h2.8l12.3 32.3h-4.3z" 
      />
      <path 
        style={{ fill: 'none', stroke: '#fff', strokeWidth: '4', strokeLinecap: 'round', strokeLinejoin: 'round' }} 
        d="M33.9 67.8h32.2" 
      />
    </svg>

    <div className="font-bold text-lg tracking-tight text-gray-900 dark:text-white leading-tight whitespace-nowrap">
      <span className="block">GlyphForge</span>
      <span className="block text-sm font-normal opacity-80">Font Glyph Exporter</span>
    </div>
  </div>
);

// --- NEW MODERN CONFIRMATION MODAL ---
export const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", isDangerous = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative transform scale-100 animate-in zoom-in-95 duration-200">
        
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          <div className={cn("p-3 rounded-full", isDangerous ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-violet-100 text-violet-600")}>
            <AlertTriangle size={24} />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
          </div>

          <div className="flex gap-3 w-full mt-4">
            <Button variant="secondary" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button variant={isDangerous ? "danger" : "primary"} onClick={onConfirm} className="flex-1">
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};