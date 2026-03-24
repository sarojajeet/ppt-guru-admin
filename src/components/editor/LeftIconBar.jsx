import { Icon } from '@iconify/react';

const TOOLS = [
    { id: 'slides', icon: 'fa-solid:images', label: 'Slides' },
    { id: 'text', icon: 'fa-solid:font', label: 'Text' },
    { id: 'uploads', icon: 'fa-solid:file-image', label: 'Uploads' },
    { id: 'shapes', icon: 'fa-solid:shapes', label: 'Shapes' },
    { id: 'design', icon: 'fa-solid:palette', label: 'Design' },
];

export default function LeftIconBar({ activeTool, onToolSelect, isMobile }) {
    if (isMobile) {
        // Horizontal bottom bar for mobile
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                height: 56,
                background: 'var(--nn-bg-glass-heavy)',
                backdropFilter: 'var(--nn-glass-blur)',
                borderTop: '1px solid var(--nn-border)',
                flexShrink: 0,
            }}>
                {TOOLS.map(tool => {
                    const isActive = activeTool === tool.id;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => onToolSelect(tool.id)}
                            title={tool.label}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                padding: '6px 12px', borderRadius: 8,
                                background: isActive ? 'var(--nn-accent-emerald)' : 'transparent',
                                color: isActive ? '#fff' : 'var(--nn-text-muted)',
                                border: 'none', cursor: 'pointer',
                                transition: 'all 0.15s ease-out',
                            }}
                        >
                            <Icon icon={tool.icon} width={20} height={20} />
                            <span style={{ fontSize: 9, fontWeight: 600 }}>{tool.label}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    // Desktop: vertical left icon strip
    return (
        <div style={{
            width: 60, flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            paddingTop: 12, gap: 4,
            background: 'var(--nn-bg-glass-heavy)',
            backdropFilter: 'var(--nn-glass-blur)',
            borderRight: '1px solid var(--nn-border)',
        }}>
            {TOOLS.map(tool => {
                const isActive = activeTool === tool.id;
                return (
                    <button
                        key={tool.id}
                        onClick={() => onToolSelect(tool.id)}
                        title={tool.label}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                            width: 48, padding: '8px 0', borderRadius: 10,
                            background: isActive ? 'var(--nn-accent-emerald)' : 'transparent',
                            color: isActive ? '#fff' : 'var(--nn-text-muted)',
                            border: 'none', cursor: 'pointer',
                            transition: 'all 0.15s ease-out',
                            boxShadow: isActive ? '0 0 12px var(--nn-accent-emerald-glow)' : 'none',
                        }}
                    >
                        <Icon icon={tool.icon} width={20} height={20} />
                        <span style={{ fontSize: 9, fontWeight: 600, lineHeight: 1 }}>{tool.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
