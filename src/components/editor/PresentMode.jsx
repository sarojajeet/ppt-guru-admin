import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { SLIDE_W, SLIDE_H } from './constants';
import { renderMathInHtml } from './utils';
import ShapeElement from './ShapeElement';

export default function PresentMode({ slides, startIndex, theme, onClose }) {
    const [idx, setIdx] = useState(startIndex);
    const [scale, setScale] = useState(1);
    const slide = slides[idx];

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); setIdx(i => Math.min(slides.length - 1, i + 1)); }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        const update = () => {
            setScale(Math.min(window.innerWidth / SLIDE_W, window.innerHeight / SLIDE_H));
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    return (
        <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                width: SLIDE_W, height: SLIDE_H,
                transform: `scale(${scale})`, transformOrigin: 'center center',
                background: theme.bg, color: theme.text, overflow: 'hidden',
                position: 'relative', flexShrink: 0,
            }}>
                {slide.elements.map(el => (
                    <div key={el.id} style={{
                        position: 'absolute',
                        left: el.x, top: el.y,
                        width: el.w, height: el.h,
                    }}>
                        {el.type === 'text' ? (
                            <div style={{
                                fontSize: el.fontSize || 24,
                                fontFamily: el.fontFamily || 'Inter',
                                color: el.color || theme.text,
                                whiteSpace: 'pre-wrap', width: '100%', height: '100%', padding: 4,
                                overflow: 'hidden',
                            }} dangerouslySetInnerHTML={{ __html: renderMathInHtml(el.content) }} />
                        ) : el.type === 'image' && el.content ? (
                            <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : el.type === 'shape' ? (
                            <ShapeElement element={el} />
                        ) : null}
                    </div>
                ))}
            </div>

            {idx > 0 && (
                <button onClick={(e) => { e.stopPropagation(); setIdx(i => i - 1); }}
                    style={{
                        position: 'fixed', left: 16, top: '50%', transform: 'translateY(-50%)',
                        background: 'var(--nn-bg-glass)', border: '1px solid var(--nn-border)',
                        color: 'white', borderRadius: 12, width: 48, height: 80,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', zIndex: 100, backdropFilter: 'var(--nn-glass-blur)',
                    }}>
                    <Icon icon="fa-solid:chevron-left" width={28} height={28} />
                </button>
            )}
            {idx < slides.length - 1 && (
                <button onClick={(e) => { e.stopPropagation(); setIdx(i => i + 1); }}
                    style={{
                        position: 'fixed', right: 16, top: '50%', transform: 'translateY(-50%)',
                        background: 'var(--nn-bg-glass)', border: '1px solid var(--nn-border)',
                        color: 'white', borderRadius: 12, width: 48, height: 80,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', zIndex: 100, backdropFilter: 'var(--nn-glass-blur)',
                    }}>
                    <Icon icon="fa-solid:chevron-right" width={28} height={28} />
                </button>
            )}

            <div style={{
                position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--nn-bg-glass-heavy)', backdropFilter: 'var(--nn-glass-blur)',
                border: '1px solid var(--nn-border)',
                borderRadius: 100, padding: '6px 18px',
                color: 'var(--nn-text-secondary)', fontSize: 13, fontFamily: 'monospace', zIndex: 100,
            }}>
                <span style={{ color: 'var(--nn-accent-emerald)', fontWeight: 700 }}>{idx + 1}</span> / {slides.length}
            </div>
        </div>
    );
}
