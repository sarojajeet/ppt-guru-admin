import { memo } from 'react';
import { Icon } from '@iconify/react';

const StatusBar = memo(function StatusBar({ activeIndex, totalSlides, theme, onPrevSlide, onNextSlide, isMobile }) {
    return (
        <div className="flex items-center justify-between px-4"
            style={{
                height: isMobile ? 30 : 36, background: 'var(--nn-bg-secondary)',
                borderTop: '1px solid var(--nn-border)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                fontSize: 10, fontWeight: 500, color: 'var(--nn-text-muted)',
                fontVariantNumeric: 'tabular-nums', flexShrink: 0,
            }}>
            {/* Left zone — zoom indicator */}
            <div className="flex items-center gap-2">
                <Icon icon="fa-solid:magnifying-glass-minus" width={12} height={12} style={{ opacity: 0.4 }} />
                <span style={{ fontSize: 10, fontWeight: 600 }}>Fit</span>
                <Icon icon="fa-solid:magnifying-glass-plus" width={12} height={12} style={{ opacity: 0.4 }} />
            </div>

            {/* Center zone — slide micro-nav */}
            <div className="flex items-center gap-1">
                <button onClick={onPrevSlide}
                    disabled={activeIndex === 0}
                    style={{
                        width: 18, height: 18, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none', cursor: activeIndex === 0 ? 'default' : 'pointer',
                        color: activeIndex === 0 ? 'var(--nn-text-disabled)' : 'var(--nn-text-muted)',
                        transition: 'all 0.15s ease-out',
                    }}>
                    <Icon icon="fa-solid:chevron-left" width={12} height={12} />
                </button>
                <span style={{ fontSize: 10, fontWeight: 600 }}>
                    Slide <span style={{ color: 'var(--nn-accent-emerald)', fontWeight: 700 }}>{activeIndex + 1}</span> of {totalSlides}
                </span>
                <button onClick={onNextSlide}
                    disabled={activeIndex === totalSlides - 1}
                    style={{
                        width: 18, height: 18, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none', cursor: activeIndex === totalSlides - 1 ? 'default' : 'pointer',
                        color: activeIndex === totalSlides - 1 ? 'var(--nn-text-disabled)' : 'var(--nn-text-muted)',
                        transition: 'all 0.15s ease-out',
                    }}>
                    <Icon icon="fa-solid:chevron-right" width={12} height={12} />
                </button>
            </div>

            {/* Right zone — theme indicator */}
            {!isMobile && (
                <div className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.accent, border: '1px solid rgba(255,255,255,0.15)' }} />
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 9 }}>{theme.name}</span>
                </div>
            )}
        </div>
    );
});

export default StatusBar;
