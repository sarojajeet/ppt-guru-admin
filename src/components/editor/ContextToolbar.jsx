import { memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@iconify/react';
import { FONTS, FONT_SIZES } from './constants';

const ToolbarButton = ({ icon, label, active, onClick, disabled, title: btnTitle }) => (
    <button
        onMouseDown={(e) => {
            e.preventDefault();
            if (!disabled && onClick) onClick();
        }}
        disabled={disabled}
        title={btnTitle || label}
        className="nn-toolbar-btn"
        style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 6, flexShrink: 0,
            transition: 'all 0.15s ease-out',
            background: active ? 'var(--nn-accent-emerald)' : 'transparent',
            color: active ? '#fff' : disabled ? 'var(--nn-text-disabled)' : 'var(--nn-text-secondary)',
            border: active ? 'none' : '1px solid transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
        }}
    >
        <Icon icon={icon} width={15} height={15} />
    </button>
);

const Divider = () => (
    <div style={{ height: 22, width: 1, background: 'var(--nn-border)', margin: '0 4px', flexShrink: 0 }} />
);

const ContextToolbar = memo(function ContextToolbar({ visible, selectedElement, activeEditor, theme, onUpdateElement, onDeleteElement, undo, redo, canUndo, canRedo, isMobile }) {
    return (
        <AnimatePresence>
            {visible && selectedElement?.type === 'text' && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className={`flex items-center gap-1 ${isMobile ? 'px-2' : 'px-3'} overflow-x-auto`}
                    style={{
                        height: 44, flexShrink: 0,
                        background: 'var(--nn-bg-glass-heavy)',
                        backdropFilter: 'var(--nn-glass-blur)',
                        borderBottom: '1px solid var(--nn-border)',
                    }}
                >
                    {/* Font family */}
                    <select
                        value={selectedElement.fontFamily || 'Inter'}
                        onMouseDown={e => e.stopPropagation()}
                        onChange={e => {
                            onUpdateElement(selectedElement.id, { fontFamily: e.target.value });
                            activeEditor?.commands.focus();
                        }}
                        className="nn-select"
                        style={{ minWidth: isMobile ? 75 : 105, fontSize: 11, padding: '4px 20px 4px 6px' }}
                    >
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>

                    {/* Font size */}
                    <select
                        value={selectedElement.fontSize || 24}
                        onMouseDown={e => e.stopPropagation()}
                        onChange={e => {
                            onUpdateElement(selectedElement.id, { fontSize: parseInt(e.target.value) });
                            activeEditor?.commands.focus();
                        }}
                        className="nn-select"
                        style={{ minWidth: isMobile ? 45 : 55, fontSize: 11, padding: '4px 20px 4px 6px' }}
                    >
                        {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                    </select>

                    <Divider />

                    {/* B / I / U / S */}
                    <ToolbarButton icon="fa-solid:bold" label="Bold" active={activeEditor?.isActive('bold')} disabled={!activeEditor}
                        onClick={() => activeEditor?.chain().focus().toggleBold().run()} />
                    <ToolbarButton icon="fa-solid:italic" label="Italic" active={activeEditor?.isActive('italic')} disabled={!activeEditor}
                        onClick={() => activeEditor?.chain().focus().toggleItalic().run()} />
                    <ToolbarButton icon="fa-solid:underline" label="Underline" active={activeEditor?.isActive('underline')} disabled={!activeEditor}
                        onClick={() => activeEditor?.chain().focus().toggleUnderline().run()} />
                    <ToolbarButton icon="fa-solid:strikethrough" label="Strikethrough" active={activeEditor?.isActive('strike')} disabled={!activeEditor}
                        onClick={() => activeEditor?.chain().focus().toggleStrike().run()} />

                    <Divider />

                    {/* Alignment */}
                    <ToolbarButton icon="fa-solid:align-left" label="Align Left" active={activeEditor?.isActive({ textAlign: 'left' })} disabled={!activeEditor}
                        onClick={() => activeEditor?.chain().focus().setTextAlign('left').run()} />
                    <ToolbarButton icon="fa-solid:align-center" label="Align Center" active={activeEditor?.isActive({ textAlign: 'center' })} disabled={!activeEditor}
                        onClick={() => activeEditor?.chain().focus().setTextAlign('center').run()} />
                    <ToolbarButton icon="fa-solid:align-right" label="Align Right" active={activeEditor?.isActive({ textAlign: 'right' })} disabled={!activeEditor}
                        onClick={() => activeEditor?.chain().focus().setTextAlign('right').run()} />

                    <Divider />

                    {/* Lists */}
                    <ToolbarButton icon="fa-solid:list-ul" label="Bullet List" active={activeEditor?.isActive('bulletList')} disabled={!activeEditor}
                        onClick={() => activeEditor?.chain().focus().toggleBulletList().run()} />
                    <ToolbarButton icon="fa-solid:list-ol" label="Numbered List" active={activeEditor?.isActive('orderedList')} disabled={!activeEditor}
                        onClick={() => activeEditor?.chain().focus().toggleOrderedList().run()} />

                    <Divider />

                    {/* Color picker */}
                    <div style={{ position: 'relative', display: 'inline-flex' }}>
                        <button
                            className="nn-toolbar-btn"
                            onMouseDown={e => {
                                e.preventDefault();
                                e.currentTarget.parentElement.querySelector('input[type="color"]').click();
                            }}
                            title={activeEditor ? 'Color for selected text' : 'Text box color'}
                            style={{
                                width: 32, height: 32, borderRadius: 6,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid var(--nn-border)',
                                cursor: 'pointer', background: 'transparent',
                                transition: 'all 0.15s ease-out', position: 'relative', overflow: 'hidden',
                                gap: 0, padding: 0,
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                <path d="M13.2 2h-2.4L4 18h2.5l1.7-4.5h7.6L17.5 18H20L13.2 2zM9.2 12L12 4.8 14.8 12H9.2z" fill="var(--nn-text-secondary)" />
                            </svg>
                            <div style={{
                                position: 'absolute', bottom: 0, left: 3, right: 3, height: 4,
                                borderRadius: '2px 2px 4px 4px',
                                background: selectedElement.color || theme.text,
                                boxShadow: `0 0 6px ${(selectedElement.color || theme.text)}44`,
                            }} />
                        </button>
                        <input
                            type="color"
                            value={selectedElement.color || theme.text}
                            onChange={e => {
                                const color = e.target.value;
                                if (activeEditor) {
                                    activeEditor.chain().focus().setColor(color).run();
                                }
                                onUpdateElement(selectedElement.id, { color });
                            }}
                            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none', bottom: 0, left: '50%' }}
                            tabIndex={-1}
                        />
                    </div>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Delete */}
                    <ToolbarButton icon="fa-solid:trash-can" label="Delete" onClick={() => onDeleteElement(selectedElement.id)}
                        btnTitle="Delete element" />

                    <Divider />

                    {/* Undo/Redo */}
                    <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
                        className="nn-toolbar-btn"
                        style={{
                            padding: 4, borderRadius: 6, transition: 'all 0.15s ease-out',
                            color: canUndo ? 'var(--nn-text-secondary)' : 'var(--nn-text-disabled)',
                            cursor: canUndo ? 'pointer' : 'not-allowed', background: 'transparent', border: 'none',
                        }}>
                        <Icon icon="fa-solid:rotate-left" width={15} height={15} />
                    </button>
                    <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
                        className="nn-toolbar-btn"
                        style={{
                            padding: 4, borderRadius: 6, transition: 'all 0.15s ease-out',
                            color: canRedo ? 'var(--nn-text-secondary)' : 'var(--nn-text-disabled)',
                            cursor: canRedo ? 'pointer' : 'not-allowed', background: 'transparent', border: 'none',
                        }}>
                        <Icon icon="fa-solid:rotate-right" width={15} height={15} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

export default ContextToolbar;
