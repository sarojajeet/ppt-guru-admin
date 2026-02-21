import React from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

export const PropertiesPanel = ({
    activeObject,
    onUpdateProperty,
    onMoveLayer,
    canvasBgColor,
    onUpdateBackground
}) => {

    // ✨ When no object is selected → show slide background controls ✨
    if (!activeObject) {
        return (
            <div className="p-5 space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                        Slide Properties
                    </h3>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">
                            Background Color
                        </label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={canvasBgColor}
                                onChange={(e) => onUpdateBackground(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer border border-gray-600 bg-gray-900"
                            />
                            <span className="text-sm font-mono text-gray-300">
                                {canvasBgColor.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-gray-500 italic">
                    Select an element on the canvas to edit its specific properties.
                </div>
            </div>
        );
    }

    const isText =
        activeObject.type === 'i-text' ||
        activeObject.type === 'text' ||
        activeObject.type === 'textbox';

    return (
        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar h-[calc(100vh-60px)]">

            {/* 1. APPEARANCE */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                    Appearance
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">
                            Fill Color
                        </label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={activeObject.fill || '#000000'}
                                onChange={(e) => onUpdateProperty('fill', e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer border border-gray-600 bg-gray-900"
                            />
                            <span className="text-sm font-mono text-gray-300">
                                {activeObject.fill || 'None'}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">
                            Opacity ({Math.round((activeObject.opacity || 1) * 100)}%)
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={activeObject.opacity || 1}
                            onChange={(e) =>
                                onUpdateProperty('opacity', parseFloat(e.target.value))
                            }
                            className="w-full cursor-pointer accent-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* 2. TEXT PROPERTIES */}
            {isText && (
                <div className="pt-6 border-t border-gray-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                        Text Formatting
                    </h3>

                    <div className="mb-4">
                        <label className="text-xs text-gray-400 mb-1 block">
                            Font Size ({activeObject.fontSize}px)
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="150"
                            step="1"
                            value={activeObject.fontSize || 30}
                            onChange={(e) =>
                                onUpdateProperty('fontSize', parseInt(e.target.value))
                            }
                            className="w-full cursor-pointer accent-indigo-500"
                        />
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() =>
                                onUpdateProperty(
                                    'fontWeight',
                                    activeObject.fontWeight === 'bold' ? 'normal' : 'bold'
                                )
                            }
                            className={`flex-1 flex justify-center p-2 rounded border transition-all ${activeObject.fontWeight === 'bold'
                                    ? 'bg-indigo-600 text-white border-indigo-500'
                                    : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                                }`}
                        >
                            <Bold size={16} />
                        </button>

                        <button
                            onClick={() =>
                                onUpdateProperty(
                                    'fontStyle',
                                    activeObject.fontStyle === 'italic' ? 'normal' : 'italic'
                                )
                            }
                            className={`flex-1 flex justify-center p-2 rounded border transition-all ${activeObject.fontStyle === 'italic'
                                    ? 'bg-indigo-600 text-white border-indigo-500'
                                    : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                                }`}
                        >
                            <Italic size={16} />
                        </button>

                        <button
                            onClick={() =>
                                onUpdateProperty('underline', !activeObject.underline)
                            }
                            className={`flex-1 flex justify-center p-2 rounded border transition-all ${activeObject.underline
                                    ? 'bg-indigo-600 text-white border-indigo-500'
                                    : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                                }`}
                        >
                            <Underline size={16} />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => onUpdateProperty('textAlign', 'left')}
                            className={`flex-1 flex justify-center p-2 rounded border transition-all ${activeObject.textAlign === 'left'
                                    ? 'bg-indigo-600 text-white border-indigo-500'
                                    : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                                }`}
                        >
                            <AlignLeft size={16} />
                        </button>

                        <button
                            onClick={() => onUpdateProperty('textAlign', 'center')}
                            className={`flex-1 flex justify-center p-2 rounded border transition-all ${activeObject.textAlign === 'center'
                                    ? 'bg-indigo-600 text-white border-indigo-500'
                                    : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                                }`}
                        >
                            <AlignCenter size={16} />
                        </button>

                        <button
                            onClick={() => onUpdateProperty('textAlign', 'right')}
                            className={`flex-1 flex justify-center p-2 rounded border transition-all ${activeObject.textAlign === 'right'
                                    ? 'bg-indigo-600 text-white border-indigo-500'
                                    : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                                }`}
                        >
                            <AlignRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* 3. ARRANGEMENT */}
            <div className="pt-6 border-t border-gray-700">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                    Arrangement
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => onMoveLayer('up')}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 hover:text-white border border-gray-600 text-xs py-2 rounded text-gray-300 transition-all"
                    >
                        Bring Forward
                    </button>
                    <button
                        onClick={() => onMoveLayer('down')}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 hover:text-white border border-gray-600 text-xs py-2 rounded text-gray-300 transition-all"
                    >
                        Send Backward
                    </button>
                </div>
            </div>

        </div>
    );
};