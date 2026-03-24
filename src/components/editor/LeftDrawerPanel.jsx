import { useState, useRef, useCallback, useEffect, memo, useMemo } from 'react';
// import { motion, AnimatePresence } from 'motion/react';
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from '@iconify/react';
import { THEMES, SHAPE_TYPES } from './constants';
import { renderMathInHtml } from './utils';
import { ShapePreview } from './ShapeElement';

/* ── Memoized thumbnail text element (avoids re-running KaTeX) ── */
const SlideThumbnailText = memo(function SlideThumbnailText({ content, color, fontSize, fontFamily }) {
    const rendered = useMemo(() => renderMathInHtml(content), [content]);
    return (
        <div style={{ color, fontSize: fontSize || 24, fontFamily: fontFamily || 'Inter' }}
            dangerouslySetInnerHTML={{ __html: rendered }} />
    );
});

/* ── Sub-panel: Slides (with mouse-based drag reorder) ── */
const SlidesPanel = memo(function SlidesPanel({ slides, activeIndex, theme, onSelectSlide, onAddSlide, onDeleteSlide, onMoveSlide }) {
    const [dragState, setDragState] = useState(null); // { fromIndex, currentIndex }
    const containerRef = useRef(null);
    const itemRectsRef = useRef([]);
    const dragStartY = useRef(0);
    const didDrag = useRef(false);

    // Snapshot item positions on drag start
    const captureRects = useCallback(() => {
        if (!containerRef.current) return;
        const items = containerRef.current.querySelectorAll('[data-slide-idx]');
        itemRectsRef.current = Array.from(items).map(el => {
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, mid: r.top + r.height / 2 };
        });
    }, []);

    const getDropIndex = useCallback((clientY, fromIndex) => {
        const rects = itemRectsRef.current;
        if (!rects.length) return fromIndex;
        for (let i = 0; i < rects.length; i++) {
            if (clientY < rects[i].mid) return i;
        }
        return rects.length - 1;
    }, []);

    const handlePointerDown = useCallback((e, idx) => {
        // Ignore if clicking delete button
        if (e.target.closest('button')) return;
        e.preventDefault();
        dragStartY.current = e.clientY;
        didDrag.current = false;
        captureRects();

        const onMove = (ev) => {
            const dy = Math.abs(ev.clientY - dragStartY.current);
            if (dy > 4) {
                didDrag.current = true;
                const dropIdx = getDropIndex(ev.clientY, idx);
                setDragState({ fromIndex: idx, currentIndex: dropIdx });
            }
        };

        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            setDragState(prev => {
                if (prev && prev.fromIndex !== prev.currentIndex && onMoveSlide) {
                    onMoveSlide(prev.fromIndex, prev.currentIndex);
                }
                return null;
            });
            // If we didn't drag, treat as click
            if (!didDrag.current) {
                onSelectSlide(idx);
            }
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, [captureRects, getDropIndex, onMoveSlide, onSelectSlide]);

    return (
        <div ref={containerRef} className="nn-sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {slides.map((s, i) => {
                const isDragged = dragState?.fromIndex === i;
                const isDropTarget = dragState && dragState.currentIndex === i && dragState.fromIndex !== i;

                return (
                    <div key={s.id} data-slide-idx={i}
                        onPointerDown={e => handlePointerDown(e, i)}
                        style={{
                            position: 'relative',
                            cursor: dragState ? 'grabbing' : 'grab',
                            transition: 'all 0.15s ease-out',
                            transform: i === activeIndex && !isDragged ? 'scale(1.03)' : 'scale(1)',
                            opacity: isDragged ? 0.35 : (i === activeIndex ? 1 : 0.6),
                            userSelect: 'none',
                            touchAction: 'none',
                        }}
                        onMouseEnter={e => { if (i !== activeIndex && !dragState) e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={e => { if (i !== activeIndex && !dragState) e.currentTarget.style.opacity = '0.6'; }}>
                        {/* Drop indicator line */}
                        {isDropTarget && (
                            <div style={{
                                position: 'absolute',
                                top: dragState.fromIndex > dragState.currentIndex ? -7 : undefined,
                                bottom: dragState.fromIndex < dragState.currentIndex ? -7 : undefined,
                                left: 0, right: 0, height: 3,
                                background: 'var(--nn-accent-emerald)', borderRadius: 2,
                                boxShadow: '0 0 8px var(--nn-accent-emerald-glow)',
                                zIndex: 5,
                            }} />
                        )}
                        <span style={{
                            position: 'absolute', left: -6, top: 0, bottom: 0,
                            width: 4, borderRadius: '0 4px 4px 0',
                            background: 'var(--nn-accent-emerald)',
                            boxShadow: i === activeIndex ? '0 0 8px var(--nn-accent-emerald-glow)' : 'none',
                            opacity: i === activeIndex ? 1 : 0,
                            transition: 'opacity 0.15s ease-out',
                        }} />
                        <div style={{
                            aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden',
                            transition: 'all 0.15s ease-out', background: theme.bg,
                            border: i === activeIndex ? '2px solid var(--nn-accent-emerald)' : '1px solid var(--nn-border)',
                            boxShadow: i === activeIndex
                                ? '0 0 16px var(--nn-accent-emerald-glow), 0 4px 12px rgba(0,0,0,0.3)'
                                : 'none',
                            position: 'relative',
                        }}>
                            <div style={{ position: 'relative', transform: 'scale(0.22)', transformOrigin: 'top left', width: `${100/0.22}%`, height: `${100/0.22}%`, pointerEvents: 'none' }}>
                                {s.elements.map(el => (
                                    <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h, overflow: 'hidden' }}>
                                        {el.type === 'text' && (
                                            <SlideThumbnailText
                                                content={el.content}
                                                color={el.color || theme.text}
                                                fontSize={el.fontSize}
                                                fontFamily={el.fontFamily}
                                            />
                                        )}
                                        {el.type === 'image' && el.content && (
                                            <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <span style={{
                                position: 'absolute', bottom: 4, left: 4,
                                fontSize: 9, fontWeight: 700, color: '#fff',
                                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                                borderRadius: 4, padding: '1px 5px', lineHeight: '16px',
                            }}>{i + 1}</span>
                            {slides.length > 1 && i === activeIndex && (
                                <button onClick={(e) => { e.stopPropagation(); onDeleteSlide(); }}
                                    style={{
                                        position: 'absolute', top: 4, right: 4,
                                        width: 20, height: 20, borderRadius: 4,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                                        color: 'var(--nn-accent-rose)', cursor: 'pointer',
                                        transition: 'all 0.15s ease-out', border: 'none',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.3)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}>
                                    <Icon icon="fa-solid:xmark" width={12} height={12} />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            <button onClick={onAddSlide}
                style={{
                    aspectRatio: '16/9', borderRadius: 8, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    border: '2px dashed var(--nn-border)',
                    background: 'transparent', color: 'var(--nn-text-muted)',
                    transition: 'all 0.15s ease-out', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--nn-accent-emerald)'; e.currentTarget.style.color = 'var(--nn-accent-emerald)'; e.currentTarget.style.background = 'rgba(52,211,153,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--nn-border)'; e.currentTarget.style.color = 'var(--nn-text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                <Icon icon="fa-solid:plus" width={20} height={20} />
                <span style={{ fontSize: 10, fontWeight: 600 }}>Add Slide</span>
            </button>
        </div>
    );
});

/* ── Sub-panel: Text Presets ────────────────────── */
const TEXT_PRESETS = [
    { label: 'Heading', fontSize: 48, html: '<p><strong>Heading</strong></p>' },
    { label: 'Subheading', fontSize: 32, html: '<p><strong>Subheading</strong></p>' },
    { label: 'Body Text', fontSize: 20, html: '<p>Body text</p>' },
    { label: 'Caption', fontSize: 14, html: '<p>Caption text</p>' },
];

const TextPanel = memo(function TextPanel({ onAddText }) {
    return (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--nn-text-muted)', marginBottom: 4 }}>Click a preset to add a text box</p>
            {TEXT_PRESETS.map(preset => (
                <button
                    key={preset.label}
                    onClick={() => onAddText(preset.html, preset.fontSize)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        border: '1px solid var(--nn-border)',
                        background: 'var(--nn-bg-primary)', color: 'var(--nn-text-primary)',
                        transition: 'all 0.15s ease-out', width: '100%',
                        textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--nn-accent-emerald)'; e.currentTarget.style.background = 'var(--nn-bg-surface)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--nn-border)'; e.currentTarget.style.background = 'var(--nn-bg-primary)'; }}
                >
                    <span style={{ fontSize: Math.min(preset.fontSize * 0.45, 22), fontWeight: preset.fontSize >= 32 ? 700 : 400, lineHeight: 1.2 }}>
                        {preset.label}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--nn-text-muted)' }}>{preset.fontSize}px</span>
                </button>
            ))}
        </div>
    );
});

/* ── Sub-panel: Uploads ─────────────────────────── */
const UploadsPanel = memo(function UploadsPanel({ onAddImage, sessionImages = [] }) {
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => onAddImage(ev.target.result);
            reader.readAsDataURL(file);
        }
    }, [onAddImage]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => onAddImage(ev.target.result);
        reader.readAsDataURL(file);
    };

    return (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '24px 12px', borderRadius: 10, cursor: 'pointer',
                    border: '2px dashed var(--nn-border)', background: 'transparent',
                    transition: 'all 0.15s ease-out',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--nn-accent-sky)'; e.currentTarget.style.background = 'rgba(56,189,248,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--nn-border)'; e.currentTarget.style.background = 'transparent'; }}
            >
                <Icon icon="fa-solid:image" style={{ fontSize: 28, color: 'var(--nn-accent-sky)' }} />
                <span style={{ fontSize: 12, color: 'var(--nn-text-secondary)', fontWeight: 600 }}>Drop image or click</span>
                <span style={{ fontSize: 10, color: 'var(--nn-text-muted)' }}>PNG, JPG, SVG, GIF</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>

            {/* Empty image placeholder */}
            <button
                onClick={() => onAddImage('')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    border: '1px solid var(--nn-border)',
                    background: 'var(--nn-bg-primary)', color: 'var(--nn-text-secondary)',
                    transition: 'all 0.15s ease-out', width: '100%',
                    fontSize: 12, fontWeight: 600,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--nn-border-hover)'; e.currentTarget.style.background = 'var(--nn-bg-surface)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--nn-border)'; e.currentTarget.style.background = 'var(--nn-bg-primary)'; }}
            >
                <Icon icon="fa-solid:plus" width={14} height={14} /> Add image placeholder
            </button>

            {sessionImages.length > 0 && (
                <>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--nn-text-muted)', marginTop: 4 }}>Session Images</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {sessionImages.map((src, i) => (
                            <button key={i} onClick={() => onAddImage(src)} style={{
                                border: '1px solid var(--nn-border)', borderRadius: 6, overflow: 'hidden',
                                cursor: 'pointer', background: 'var(--nn-bg-primary)', padding: 0,
                                aspectRatio: '4/3',
                            }}>
                                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
});

/* ── Sub-panel: Shapes ──────────────────────────── */
const ShapesPanel = memo(function ShapesPanel({ onAddShape }) {
    return (
        <div style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: 11, color: 'var(--nn-text-muted)', marginBottom: 10 }}>Click a shape to add it to the slide</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {SHAPE_TYPES.map(shape => (
                    <button
                        key={shape.id}
                        onClick={() => onAddShape(shape.id)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                            border: '1px solid var(--nn-border)',
                            background: 'var(--nn-bg-primary)', color: 'var(--nn-text-secondary)',
                            transition: 'all 0.15s ease-out',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--nn-accent-emerald)'; e.currentTarget.style.background = 'var(--nn-bg-surface)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--nn-border)'; e.currentTarget.style.background = 'var(--nn-bg-primary)'; }}
                    >
                        <ShapePreview shapeType={shape.id} size={36} />
                        <span style={{ fontSize: 10, fontWeight: 600 }}>{shape.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
});

/* ── Sub-panel: Design / Themes ─────────────────── */
const DesignPanel = memo(function DesignPanel({ themes, themeIdx, onSelectTheme }) {
    return (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {themes.map((t, i) => (
                <button key={i} onClick={() => onSelectTheme(i)}
                    className="nn-toolbar-btn"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        transition: 'all 0.15s ease-out', cursor: 'pointer', width: '100%',
                        border: themeIdx === i ? '1.5px solid var(--nn-accent-emerald)' : '1px solid var(--nn-border)',
                        background: themeIdx === i ? 'var(--nn-bg-surface)' : 'var(--nn-bg-primary)',
                        boxShadow: themeIdx === i ? '0 0 12px var(--nn-accent-emerald-glow)' : 'none',
                    }}
                    onMouseEnter={e => { if (themeIdx !== i) { e.currentTarget.style.borderColor = 'var(--nn-border-hover)'; e.currentTarget.style.background = 'var(--nn-bg-surface)'; } }}
                    onMouseLeave={e => { if (themeIdx !== i) { e.currentTarget.style.borderColor = 'var(--nn-border)'; e.currentTarget.style.background = 'var(--nn-bg-primary)'; } }}>
                    <div style={{
                        width: 36, height: 24, borderRadius: 4, overflow: 'hidden', flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.1)', background: t.bg,
                        position: 'relative',
                    }}>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: t.accent }} />
                    </div>
                    <span style={{ color: 'var(--nn-text-secondary)', lineHeight: 1.2 }}>{t.name}</span>
                </button>
            ))}
        </div>
    );
});

/* ── Main Drawer Panel ──────────────────────────── */
const PANEL_TITLES = {
    slides: 'Slides',
    text: 'Text',
    uploads: 'Uploads',
    shapes: 'Shapes',
    design: 'Design',
};

const LeftDrawerPanel = memo(function LeftDrawerPanel({
    activeTool,
    slides, activeIndex, theme,
    onSelectSlide, onAddSlide, onDeleteSlide, onMoveSlide,
    onAddText, onAddImage, onAddShape,
    themes, themeIdx, onSelectTheme,
    sessionImages,
    isMobile,
    onClose,
}) {
    const isOpen = activeTool !== null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    {isMobile && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 40,
                                background: 'rgba(0,0,0,0.5)',
                                backdropFilter: 'blur(2px)',
                            }}
                        />
                    )}
                    <motion.div
                        initial={isMobile ? { y: '100%' } : { width: 0, opacity: 0 }}
                        animate={isMobile ? { y: 0 } : { width: 250, opacity: 1 }}
                        exit={isMobile ? { y: '100%' } : { width: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        style={{
                            flexShrink: 0, overflow: 'hidden',
                            background: 'var(--nn-bg-glass-heavy)',
                            backdropFilter: 'var(--nn-glass-blur)',
                            borderRight: isMobile ? 'none' : '1px solid var(--nn-border)',
                            display: 'flex', flexDirection: 'column',
                            ...(isMobile ? {
                                position: 'fixed', bottom: 56, left: 0, right: 0,
                                zIndex: 45, maxHeight: '60vh',
                                borderTop: '1px solid var(--nn-border)',
                                borderRadius: '16px 16px 0 0',
                            } : {}),
                        }}
                    >
                        {/* Panel header */}
                        <div style={{
                            padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: '1px solid var(--nn-border)', flexShrink: 0,
                        }}>
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nn-text-muted)' }}>
                                {PANEL_TITLES[activeTool] || ''}
                            </span>
                            {activeTool === 'slides' && (
                                <span style={{
                                    fontSize: 10, fontWeight: 700, color: '#fff', background: 'var(--nn-accent-emerald)',
                                    borderRadius: 10, padding: '1px 8px', lineHeight: '18px',
                                }}>{slides.length}</span>
                            )}
                            {isMobile && (
                                <button onClick={onClose}
                                    style={{ padding: 4, borderRadius: 6, color: 'var(--nn-text-muted)', cursor: 'pointer', background: 'transparent', border: 'none' }}>
                                    <Icon icon="fa-solid:xmark" width={16} height={16} />
                                </button>
                            )}
                        </div>

                        {/* Panel content */}
                        <div className="nn-sidebar-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                            {activeTool === 'slides' && (
                                <SlidesPanel
                                    slides={slides} activeIndex={activeIndex} theme={theme}
                                    onSelectSlide={onSelectSlide} onAddSlide={onAddSlide} onDeleteSlide={onDeleteSlide}
                                    onMoveSlide={onMoveSlide}
                                />
                            )}
                            {activeTool === 'text' && (
                                <TextPanel onAddText={onAddText} />
                            )}
                            {activeTool === 'uploads' && (
                                <UploadsPanel onAddImage={onAddImage} sessionImages={sessionImages} />
                            )}
                            {activeTool === 'shapes' && (
                                <ShapesPanel onAddShape={onAddShape} />
                            )}
                            {activeTool === 'design' && (
                                <DesignPanel themes={themes} themeIdx={themeIdx} onSelectTheme={onSelectTheme} />
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
});

export default LeftDrawerPanel;
