import { memo } from 'react';
import { Icon } from '@iconify/react';

const TopBar = memo(function TopBar({
    onBack,
    activeIndex, totalSlides,
    onPrevSlide, onNextSlide,
    onPresent, onExportPPTX,
    onServerGenerate, isGenerating,
    isMobile, isTablet, isMobileOrTablet,
}) {
    return (
        <div className={`flex items-center justify-between ${isMobile ? 'px-3' : 'px-5'} z-20`}
            style={{
                height: 52, flexShrink: 0,
                background: 'var(--nn-bg-glass-heavy)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--nn-border)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}>
            {/* Left zone */}
            <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                <button onClick={onBack} title="Back to Home"
                    className="nn-toolbar-btn"
                    style={{
                        padding: 8, borderRadius: '50%', transition: 'all 0.15s ease-out',
                        color: 'var(--nn-text-secondary)', cursor: 'pointer',
                        background: 'transparent', border: 'none',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--nn-bg-surface)'; e.currentTarget.style.color = 'var(--nn-text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--nn-text-secondary)'; }}>
                    <Icon icon="fa-solid:arrow-left" width={18} height={18} />
                </button>
                {!isMobile && (
                    <div style={{ marginLeft: 4 }}>
                        <h1 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                            <span style={{ color: 'var(--nn-accent-emerald)' }}>Neural</span>Notes
                        </h1>
                        <p style={{ fontSize: 10, color: 'var(--nn-text-muted)', fontWeight: 500, lineHeight: 1 }}>{totalSlides} slides</p>
                    </div>
                )}
            </div>

            {/* Center zone — slide navigator pill (desktop only) */}
            {!isMobileOrTablet && (
                <div className="flex items-center gap-1" style={{
                    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--nn-bg-surface)', border: '1px solid var(--nn-border)',
                    borderRadius: 20, padding: '4px 6px',
                }}>
                    <button onClick={onPrevSlide}
                        disabled={activeIndex === 0}
                        style={{
                            width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: 'none', cursor: activeIndex === 0 ? 'default' : 'pointer',
                            color: activeIndex === 0 ? 'var(--nn-text-disabled)' : 'var(--nn-text-secondary)',
                            transition: 'all 0.15s ease-out',
                        }}>
                        <Icon icon="fa-solid:chevron-left" width={16} height={16} />
                    </button>
                    <span style={{
                        fontSize: 12, fontWeight: 700, color: 'var(--nn-text-primary)',
                        minWidth: 48, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                    }}>
                        <span style={{ color: 'var(--nn-accent-emerald)' }}>{activeIndex + 1}</span>
                        <span style={{ color: 'var(--nn-text-muted)', fontWeight: 500 }}> / {totalSlides}</span>
                    </span>
                    <button onClick={onNextSlide}
                        disabled={activeIndex === totalSlides - 1}
                        style={{
                            width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: 'none', cursor: activeIndex === totalSlides - 1 ? 'default' : 'pointer',
                            color: activeIndex === totalSlides - 1 ? 'var(--nn-text-disabled)' : 'var(--nn-text-secondary)',
                            transition: 'all 0.15s ease-out',
                        }}>
                        <Icon icon="fa-solid:chevron-right" width={16} height={16} />
                    </button>
                </div>
            )}

            {/* Right zone */}
            <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                <button onClick={onPresent} title="Present slideshow"
                    className="nn-toolbar-btn"
                    style={{
                        display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 6,
                        padding: isMobile ? '6px 10px' : '6px 16px', fontSize: 12, fontWeight: 700, borderRadius: 20,
                        background: 'var(--nn-gradient-emerald)', color: '#fff',
                        boxShadow: 'var(--nn-shadow-glow-emerald)',
                        transition: 'all 0.15s ease-out', cursor: 'pointer', border: 'none',
                    }}>
                    <Icon icon="fa-solid:play" width={14} height={14} /> {!isMobile && 'Present'}
                </button>

                {!isMobile && (
                    <>
                        <div style={{ width: 1, height: 24, background: 'var(--nn-border)', margin: '0 4px', flexShrink: 0 }} />

                        <button onClick={() => onServerGenerate('ppt')} disabled={isGenerating} title="Generate PPT on server"
                            className="nn-toolbar-btn"
                            style={{
                                display: 'flex', alignItems: 'center', gap: isTablet ? 0 : 6,
                                padding: isTablet ? '6px 10px' : '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                                background: 'transparent', color: 'var(--nn-text-secondary)',
                                border: '1px solid var(--nn-border)',
                                transition: 'all 0.15s ease-out', cursor: isGenerating ? 'wait' : 'pointer',
                                opacity: isGenerating ? 0.5 : 1,
                            }}
                            onMouseEnter={e => { if (!isGenerating) { e.currentTarget.style.borderColor = 'var(--nn-border-hover)'; e.currentTarget.style.background = 'var(--nn-bg-surface)'; } }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--nn-border)'; e.currentTarget.style.background = 'transparent'; }}>
                            <Icon icon="fa-solid:file-powerpoint" width={14} height={14} /> {!isTablet && (isGenerating ? '...' : 'PPT')}
                        </button>
                        <button onClick={() => onServerGenerate('pdf')} disabled={isGenerating} title="Generate PDF on server"
                            className="nn-toolbar-btn"
                            style={{
                                display: 'flex', alignItems: 'center', gap: isTablet ? 0 : 6,
                                padding: isTablet ? '6px 10px' : '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                                background: 'transparent', color: 'var(--nn-text-secondary)',
                                border: '1px solid var(--nn-border)',
                                transition: 'all 0.15s ease-out', cursor: isGenerating ? 'wait' : 'pointer',
                                opacity: isGenerating ? 0.5 : 1,
                            }}
                            onMouseEnter={e => { if (!isGenerating) { e.currentTarget.style.borderColor = 'var(--nn-border-hover)'; e.currentTarget.style.background = 'var(--nn-bg-surface)'; } }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--nn-border)'; e.currentTarget.style.background = 'transparent'; }}>
                            <Icon icon="fa-solid:file-pdf" width={14} height={14} /> {!isTablet && (isGenerating ? '...' : 'PDF')}
                        </button>

                        <div style={{ width: 1, height: 24, background: 'var(--nn-border)', margin: '0 4px', flexShrink: 0 }} />
                    </>
                )}

                <button onClick={onExportPPTX} title="Download as PPTX"
                    className="nn-toolbar-btn"
                    style={{
                        display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 6,
                        padding: isMobile ? '6px 10px' : '6px 18px', fontSize: 12, fontWeight: 700, borderRadius: 20,
                        background: 'transparent', color: 'var(--nn-accent-sky)',
                        border: '1.5px solid var(--nn-accent-sky)',
                        transition: 'all 0.15s ease-out', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <Icon icon="fa-solid:download" width={14} height={14} /> {!isMobile && 'Download'}
                </button>
            </div>
        </div>
    );
});

export default TopBar;
