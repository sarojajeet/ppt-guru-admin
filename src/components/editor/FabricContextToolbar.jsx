/**
 * FabricContextToolbar — Formatting toolbar for Fabric canvas
 *
 * Text: font family, size, bold/italic/underline/strikethrough, align, color
 * Shape: fill color, stroke color, stroke width
 */

import { memo } from 'react';
import { Icon } from '@iconify/react';
import { FONTS, FONT_SIZES } from './constants';
import { containsLatex } from './utils';

const STROKE_WIDTHS = [1, 2, 3, 4, 5];

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

/** Color picker button with icon + underline swatch */
const ColorPickerButton = ({ icon, title, value, onChange }) => (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
        <button
            className="nn-toolbar-btn"
            onMouseDown={e => {
                e.preventDefault();
                e.currentTarget.parentElement.querySelector('input[type="color"]').click();
            }}
            title={title}
            style={{
                width: 32, height: 32, borderRadius: 6,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--nn-border)',
                cursor: 'pointer', background: 'transparent',
                transition: 'all 0.15s ease-out', position: 'relative', overflow: 'hidden',
                gap: 0, padding: 0,
            }}
        >
            <Icon icon={icon} width={14} height={14} style={{ color: 'var(--nn-text-secondary)', flexShrink: 0 }} />
            <div style={{
                position: 'absolute', bottom: 0, left: 3, right: 3, height: 4,
                borderRadius: '2px 2px 4px 4px',
                background: value,
                boxShadow: `0 0 6px ${value}44`,
            }} />
        </button>
        <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none', bottom: 0, left: '50%' }}
            tabIndex={-1}
        />
    </div>
);

/** Trailing buttons shared by both toolbars */
const TrailingButtons = ({ selectedElement, onDeleteElement, undo, redo, canUndo, canRedo }) => (
    <>
        <div style={{ flex: 1 }} />
        <ToolbarButton
            icon="fa-solid:trash-can" label="Delete"
            onClick={() => selectedElement && onDeleteElement(selectedElement.id)}
            btnTitle="Delete element"
        />
        <Divider />
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
    </>
);

const FabricContextToolbar = memo(function FabricContextToolbar({
    visible, selectedElement, activeObject, theme,
    onUpdateElement, onDeleteElement, directUpdateRef,
    undo, redo, canUndo, canRedo,
    isMobile,
}) {
    const isTextbox = activeObject && typeof activeObject.set === 'function';

    /* ── Helper: update Fabric object + data model (skips full canvas rebuild) ── */
    const applyUpdate = (updates) => {
        if (!selectedElement) return;
        if (directUpdateRef?.current) {
            directUpdateRef.current(selectedElement.id, updates);
        } else {
            // Fallback: update Fabric object directly + data model
            if (activeObject) {
                Object.entries(updates).forEach(([k, v]) => {
                    activeObject.set(k === 'color' ? 'fill' : k, v);
                });
                activeObject.dirty = true;
                activeObject.canvas?.requestRenderAll();
            }
            onUpdateElement(selectedElement.id, updates);
        }
    };

    /* ── Text formatting helpers ──────────────────── */
    const toggleStyle = (prop, onVal, offVal) => {
        if (!activeObject) return;
        if (activeObject.isEditing && activeObject.getSelectedText && activeObject.getSelectedText()) {
            const styles = activeObject.getSelectionStyles();
            const allOn = styles.length > 0 && styles.every(s => s[prop] === onVal);
            activeObject.setSelectionStyles({ [prop]: allOn ? offVal : onVal });
            activeObject.dirty = true;
            activeObject.canvas?.requestRenderAll();
        } else {
            const cur = activeObject[prop];
            activeObject.set(prop, cur === onVal ? offVal : onVal);
            activeObject.dirty = true;
            activeObject.canvas?.requestRenderAll();
        }
        if (selectedElement) {
            const cur = activeObject[prop];
            // Mark as internal so canvas doesn't do full rebuild
            onUpdateElement(selectedElement.id, { [prop]: cur });
        }
    };

    const getCurrentStyle = (prop) => {
        if (!activeObject) return undefined;
        if (activeObject.isEditing && activeObject.getSelectedText && activeObject.getSelectedText()) {
            const styles = activeObject.getSelectionStyles();
            if (styles.length > 0) return styles[0][prop];
        }
        return activeObject[prop];
    };

    /* ── Helper to normalize fill to a 7-char hex for <input type="color"> ── */
    const toHexColor = (val, fallback) => {
        if (!val) return fallback;
        const s = String(val);
        // Already #rrggbb
        if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
        // #rrggbbaa → strip alpha
        if (/^#[0-9a-fA-F]{8}$/.test(s)) return s.slice(0, 7);
        // rgba(r,g,b,a) or rgb(r,g,b)
        const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
            const hex = (c) => parseInt(c).toString(16).padStart(2, '0');
            return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
        }
        return fallback;
    };

    const toolbarStyle = {
        height: 44, flexShrink: 0,
        background: 'var(--nn-bg-glass-heavy)',
        backdropFilter: 'var(--nn-glass-blur)',
        borderBottom: '1px solid var(--nn-border)',
    };

    const isText = selectedElement?.type === 'text';
    const isShape = selectedElement?.type === 'shape';
    const isMath = isText && containsLatex(selectedElement?.content);

    return (
        <div
            className={`flex items-center gap-1 ${isMobile ? 'px-2' : 'px-3'} overflow-x-auto`}
            style={{
                ...toolbarStyle,
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.15s ease-out',
                pointerEvents: visible ? 'auto' : 'none',
            }}
        >
            {visible && isShape && (
                <>
                    {/* Fill color */}
                    <span style={{ fontSize: 11, color: 'var(--nn-text-tertiary)', marginRight: 2 }}>Fill</span>
                    <ColorPickerButton
                        icon="fa-solid:fill-drip"
                        title="Fill color"
                        value={toHexColor(selectedElement?.fill, '#4da6ff')}
                        onChange={val => applyUpdate({ fill: val })}
                    />

                    <Divider />

                    {/* Stroke color */}
                    <span style={{ fontSize: 11, color: 'var(--nn-text-tertiary)', marginRight: 2 }}>Stroke</span>
                    <ColorPickerButton
                        icon="fa-solid:pen"
                        title="Stroke color"
                        value={toHexColor(selectedElement?.stroke, '#4da6ff')}
                        onChange={val => applyUpdate({ stroke: val })}
                    />

                    <Divider />

                    {/* Stroke width */}
                    <span style={{ fontSize: 11, color: 'var(--nn-text-tertiary)', marginRight: 2 }}>Width</span>
                    <select
                        value={selectedElement?.strokeWidth || 2}
                        onMouseDown={e => e.stopPropagation()}
                        onChange={e => applyUpdate({ strokeWidth: parseInt(e.target.value) })}
                        className="nn-select"
                        style={{ minWidth: 50, fontSize: 11, padding: '4px 20px 4px 6px' }}
                    >
                        {STROKE_WIDTHS.map(w => <option key={w} value={w}>{w}px</option>)}
                    </select>

                    {/* Trailing: delete, undo, redo */}
                    <TrailingButtons
                        selectedElement={selectedElement}
                        onDeleteElement={onDeleteElement}
                        undo={undo} redo={redo}
                        canUndo={canUndo} canRedo={canRedo}
                    />
                </>
            )}

            {visible && !isShape && (
                <>
                    {/* Font family */}
                    <select
                        value={selectedElement?.fontFamily || 'Inter'}
                        onMouseDown={e => e.stopPropagation()}
                        onChange={e => applyUpdate({ fontFamily: e.target.value })}
                        disabled={!isText || isMath}
                        className="nn-select"
                        style={{ minWidth: isMobile ? 75 : 105, fontSize: 11, padding: '4px 20px 4px 6px', opacity: (!isText || isMath) ? 0.4 : 1 }}
                    >
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>

                    {/* Font size */}
                    <select
                        value={selectedElement?.fontSize || 24}
                        onMouseDown={e => e.stopPropagation()}
                        onChange={e => applyUpdate({ fontSize: parseInt(e.target.value) })}
                        disabled={!isText}
                        className="nn-select"
                        style={{ minWidth: isMobile ? 45 : 55, fontSize: 11, padding: '4px 20px 4px 6px', opacity: !isText ? 0.4 : 1 }}
                    >
                        {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                    </select>

                    <Divider />

                    {/* B / I / U / S */}
                    <ToolbarButton
                        icon="fa-solid:bold" label="Bold"
                        active={isTextbox && getCurrentStyle('fontWeight') === 'bold'}
                        disabled={!isTextbox || isMath}
                        onClick={() => toggleStyle('fontWeight', 'bold', 'normal')}
                    />
                    <ToolbarButton
                        icon="fa-solid:italic" label="Italic"
                        active={isTextbox && getCurrentStyle('fontStyle') === 'italic'}
                        disabled={!isTextbox || isMath}
                        onClick={() => toggleStyle('fontStyle', 'italic', 'normal')}
                    />
                    <ToolbarButton
                        icon="fa-solid:underline" label="Underline"
                        active={isTextbox && getCurrentStyle('underline') === true}
                        disabled={!isTextbox || isMath}
                        onClick={() => toggleStyle('underline', true, false)}
                    />
                    <ToolbarButton
                        icon="fa-solid:strikethrough" label="Strikethrough"
                        active={isTextbox && getCurrentStyle('linethrough') === true}
                        disabled={!isTextbox || isMath}
                        onClick={() => toggleStyle('linethrough', true, false)}
                    />

                    <Divider />

                    {/* Alignment */}
                    <ToolbarButton
                        icon="fa-solid:align-left" label="Align Left"
                        active={isTextbox && activeObject?.textAlign === 'left'}
                        disabled={!isTextbox || isMath}
                        onClick={() => applyUpdate({ textAlign: 'left' })}
                    />
                    <ToolbarButton
                        icon="fa-solid:align-center" label="Align Center"
                        active={isTextbox && activeObject?.textAlign === 'center'}
                        disabled={!isTextbox || isMath}
                        onClick={() => applyUpdate({ textAlign: 'center' })}
                    />
                    <ToolbarButton
                        icon="fa-solid:align-right" label="Align Right"
                        active={isTextbox && activeObject?.textAlign === 'right'}
                        disabled={!isTextbox || isMath}
                        onClick={() => applyUpdate({ textAlign: 'right' })}
                    />

                    <Divider />

                    {/* Color picker */}
                    <div style={{ position: 'relative', display: 'inline-flex', opacity: !isText ? 0.4 : 1, pointerEvents: !isText ? 'none' : 'auto' }}>
                        <button
                            className="nn-toolbar-btn"
                            onMouseDown={e => {
                                e.preventDefault();
                                if (isText) e.currentTarget.parentElement.querySelector('input[type="color"]').click();
                            }}
                            title="Text color"
                            style={{
                                width: 32, height: 32, borderRadius: 6,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid var(--nn-border)',
                                cursor: isText ? 'pointer' : 'not-allowed', background: 'transparent',
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
                                background: selectedElement?.color || theme.text,
                                boxShadow: `0 0 6px ${(selectedElement?.color || theme.text)}44`,
                            }} />
                        </button>
                        <input
                            type="color"
                            value={selectedElement?.color || theme.text}
                            onChange={e => {
                                const newColor = e.target.value;
                                if (activeObject?.isEditing && activeObject.getSelectedText && activeObject.getSelectedText()) {
                                    activeObject.setSelectionStyles({ fill: newColor });
                                    activeObject.dirty = true;
                                    activeObject.canvas?.requestRenderAll();
                                } else {
                                    applyUpdate({ color: newColor });
                                }
                            }}
                            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none', bottom: 0, left: '50%' }}
                            tabIndex={-1}
                        />
                    </div>

                    {/* Trailing: delete, undo, redo */}
                    <TrailingButtons
                        selectedElement={selectedElement}
                        onDeleteElement={onDeleteElement}
                        undo={undo} redo={redo}
                        canUndo={canUndo} canRedo={canRedo}
                    />
                </>
            )}
        </div>
    );
});

export default FabricContextToolbar;
