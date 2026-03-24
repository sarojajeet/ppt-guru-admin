import { useRef, useState, useEffect, memo } from 'react';
import { Rnd } from 'react-rnd';
import { SLIDE_W, SLIDE_H } from './constants';
import TipTapTextElement from './TipTapTextElement';
import ImageElement from './ImageElement';
import ShapeElement from './ShapeElement';

// Static resize handle styles — extracted outside component to avoid re-creation
const SELECTED_RESIZE_HANDLES = {
    topLeft: { width: 12, height: 12, background: 'var(--nn-accent-emerald)', borderRadius: '50%', border: '2px solid #fff', top: -6, left: -6, zIndex: 100 },
    topRight: { width: 12, height: 12, background: 'var(--nn-accent-emerald)', borderRadius: '50%', border: '2px solid #fff', top: -6, right: -6, zIndex: 100 },
    bottomLeft: { width: 12, height: 12, background: 'var(--nn-accent-emerald)', borderRadius: '50%', border: '2px solid #fff', bottom: -6, left: -6, zIndex: 100 },
    bottomRight: { width: 12, height: 12, background: 'var(--nn-accent-emerald)', borderRadius: '50%', border: '2px solid #fff', bottom: -6, right: -6, zIndex: 100 },
};
const EMPTY_RESIZE_HANDLES = {};

const SlideCanvas = memo(function SlideCanvas({ slide, theme, selectedId, editingId, onSelectElement, onStartEdit, onUpdateElement, onEditorReady, isMobile }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);

    const padding = isMobile ? 4 : 16;

    useEffect(() => {
        const update = () => {
            if (!containerRef.current?.parentElement) return;
            const p = containerRef.current.parentElement;
            const aW = p.offsetWidth - padding;
            const aH = p.offsetHeight - padding;
            setScale(Math.min(aW / SLIDE_W, aH / SLIDE_H));
        };
        update();

        // Use ResizeObserver for reliable scaling when drawer opens/closes
        const parent = containerRef.current?.parentElement;
        let ro;
        if (parent && typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(update);
            ro.observe(parent);
        }
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('resize', update);
            ro?.disconnect();
        };
    }, [padding]);

    const handleBgClick = (e) => {
        if (e.target === containerRef.current || e.target.dataset.slideBg) {
            onSelectElement(null);
        }
    };

    return (
        <div className="flex-1 flex justify-center items-center overflow-hidden w-full h-full relative">
            <div
                ref={containerRef}
                className="relative"
                style={{
                    width: SLIDE_W, height: SLIDE_H,
                    background: theme.bg, color: theme.text,
                    transform: `scale(${scale})`, transformOrigin: 'center center',
                    flexShrink: 0, overflow: 'visible', borderRadius: 8,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 12px 30px rgba(0,0,0,0.35), 0 30px 70px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)',
                }}
                onMouseDown={handleBgClick}
            >
                <div data-slide-bg="true" style={{ position: 'absolute', inset: 0, background: theme.bg, borderRadius: 8, zIndex: 0 }} />

                {slide.elements.map(el => {
                    const isSelected = selectedId === el.id;
                    const isEditing = editingId === el.id;

                    return (
                        <Rnd
                            key={el.id}
                            bounds="parent"
                            size={{ width: el.w, height: el.h }}
                            position={{ x: el.x, y: el.y }}
                            onDragStop={(_, d) => onUpdateElement(el.id, { x: d.x, y: d.y })}
                            onResizeStop={(_, __, ref, ___, pos) => onUpdateElement(el.id, { w: ref.offsetWidth, h: ref.offsetHeight, ...pos })}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                if (!isSelected) {
                                    onSelectElement(el.id);
                                }
                            }}
                            enableResizing={isSelected && !isEditing}
                            disableDragging={isEditing}
                            resizeHandleStyles={isSelected ? SELECTED_RESIZE_HANDLES : EMPTY_RESIZE_HANDLES}
                            style={{
                                zIndex: isSelected ? 50 : 10,
                                outline: isSelected ? '2px solid var(--nn-accent-emerald)' : 'none',
                                boxShadow: isSelected ? '0 0 0 1px var(--nn-accent-emerald-glow)' : 'none',
                                borderRadius: 2,
                            }}
                        >
                            {el.type === 'text' ? (
                                <TipTapTextElement
                                    element={el}
                                    theme={theme}
                                    isSelected={isSelected}
                                    isEditing={isEditing}
                                    onContentChange={(html) => onUpdateElement(el.id, { content: html })}
                                    onEditorReady={onEditorReady}
                                    onStartEdit={() => onStartEdit(el.id)}
                                />
                            ) : el.type === 'image' ? (
                                <ImageElement
                                    element={el}
                                    onContentChange={(src) => onUpdateElement(el.id, { content: src })}
                                />
                            ) : el.type === 'shape' ? (
                                <ShapeElement element={el} />
                            ) : null}
                        </Rnd>
                    );
                })}
            </div>
        </div>
    );
});

export default SlideCanvas;
