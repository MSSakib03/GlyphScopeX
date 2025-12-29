import React from 'react';
import { SkipBack, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { Button } from './UIComponents';

const PaginationControls = ({ currentPage, setCurrentPage, totalPages }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-2 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
           <Button variant="ghost" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} title="First Page">
               <SkipBack size={16} />
           </Button>
           <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>
               <ChevronLeft size={16} /> Prev
           </Button>
           <div className="px-4 text-sm font-mono text-gray-600 dark:text-gray-300">
               Page <span className="font-bold text-violet-600">{currentPage}</span> of {totalPages}
           </div>
           <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>
               <ChevronRight size={16} /> Next
           </Button>
           <Button variant="ghost" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} title="Last Page">
               <SkipForward size={16} />
           </Button>
        </div>
    );
};

export default PaginationControls;