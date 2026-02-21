import React, { useRef } from 'react';
import {
    Square,
    Circle,
    Type,
    Trash,
    Image as ImageIcon,
    Download,
    Sigma,
    Undo2,
    Redo2,
    Presentation,
    Eraser,
    FileDown
} from 'lucide-react';

export const Toolbar = ({
    onAddRect,
    onAddCircle,
    onAddText,
    onDelete,
    onImageUpload,
    onDownload,
    onAddMath,
    onUndo,
    onRedo,
    onDownloadPPTX,
    onDownloadPDF,
    onClear
}) => {
    const fileInputRef = useRef(null);

    const handleMathClick = () => {
        const eq = prompt("Enter LaTeX Equation:");
        if (eq) onAddMath(eq);
    };

    return (
        <div className="flex gap-2 p-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg mb-4 w-max mx-auto z-10 items-center">
            <button onClick={onUndo} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded" title="Undo (Ctrl+Z)">
                <Undo2 size={18} />
            </button>
            <button onClick={onRedo} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded" title="Redo (Ctrl+Y)">
                <Redo2 size={18} />
            </button>

            <div className="w-px h-6 bg-gray-700 mx-1"></div>

            <button onClick={onAddRect} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded" title="Rectangle">
                <Square size={18} />
            </button>
            <button onClick={onAddCircle} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded" title="Circle">
                <Circle size={18} />
            </button>
            <button onClick={onAddText} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded" title="Text">
                <Type size={18} />
            </button>
            <button onClick={handleMathClick} className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded" title="Math Equation">
                <Sigma size={18} />
            </button>

            <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded" title="Upload Image">
                <ImageIcon size={18} />
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={onImageUpload}
                accept="image/*"
                className="hidden"
            />

            <div className="w-px h-6 bg-gray-700 mx-1"></div>

            <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-500/20 rounded" title="Delete Selected">
                <Trash size={18} />
            </button>
            <button onClick={onClear} className="p-2 text-orange-400 hover:bg-orange-500/20 rounded" title="Clear Entire Slide">
                <Eraser size={18} />
            </button>

            <div className="w-px h-6 bg-gray-700 mx-1"></div>

            <button onClick={onDownload} className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded" title="Download Current Slide (PNG)">
                <Download size={18} />
            </button>
            <button onClick={onDownloadPDF} className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded" title="Export All Slides as PDF">
                <FileDown size={18} />
            </button>
            <button onClick={onDownloadPPTX} className="p-2 text-green-400 hover:text-white hover:bg-green-500/20 rounded" title="Export All Slides as PPTX">
                <Presentation size={18} />
            </button>
        </div>
    );
};