/**
 * MathOverlayLayer — ProseMirror + KaTeX overlay for math elements on Fabric canvas
 *
 * For each text element containing LaTeX:
 * - Display mode: renders KaTeX HTML positioned over the invisible Fabric Rect
 * - Edit mode (editingId matches): shows a ProseMirror editor with
 *   @benrbray/prosemirror-math for inline WYSIWYG math editing
 *
 * Sits at z-index: 3 above the Fabric canvas (z-index: 2).
 * pointer-events: none on the container; only the active editor gets pointer-events.
 */

import { memo, useMemo, useRef, useEffect, useCallback } from 'react';
import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Node, Fragment, Slice } from 'prosemirror-model';
import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { mathPlugin, mathBackspaceCmd, insertMathCmd } from '@benrbray/prosemirror-math';
import '@benrbray/prosemirror-math/dist/prosemirror-math.css';

import { containsLatex, renderMathInHtml, htmlToPlainText } from './utils';
import { mathSchema, parseLatexTextToNodes, prosemirrorDocToPlainText } from './mathSchema';

const MathOverlayLayer = memo(function MathOverlayLayer({
    elements,
    scale,
    theme,
    editingId,
    onContentChange,
    onEditDone,
    onHeightChange,
}) {
    const mathElements = useMemo(
        () => (elements || []).filter(el => el.type === 'text' && containsLatex(el.content)),
        [elements],
    );

    if (mathElements.length === 0) return null;

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 3,
                pointerEvents: 'none',
                overflow: 'hidden',
            }}
        >
            {mathElements.map(el => (
                <MathOverlayItem
                    key={el.id}
                    el={el}
                    scale={scale}
                    theme={theme}
                    isEditing={editingId === el.id}
                    onContentChange={onContentChange}
                    onEditDone={onEditDone}
                    onHeightChange={onHeightChange}
                />
            ))}
        </div>
    );
});

/* ── Single math overlay item ────────────────────── */
const MathOverlayItem = memo(function MathOverlayItem({
    el, scale, theme, isEditing, onContentChange, onEditDone, onHeightChange,
}) {
    const displayRef = useRef(null);
    const editorContainerRef = useRef(null);
    const viewRef = useRef(null);
    const onContentChangeRef = useRef(onContentChange);
    const onEditDoneRef = useRef(onEditDone);

    // Keep refs current
    useEffect(() => { onContentChangeRef.current = onContentChange; }, [onContentChange]);
    useEffect(() => { onEditDoneRef.current = onEditDone; }, [onEditDone]);

    const plainContent = useMemo(() => htmlToPlainText(el.content || ''), [el.content]);

    const katexHtml = useMemo(
        () => renderMathInHtml(plainContent),
        [plainContent],
    );

    // Measure rendered height and report back to sync the Fabric Rect.
    // Uses ResizeObserver to catch height changes from width resize, font load, etc.
    useEffect(() => {
        if (isEditing || !displayRef.current || !onHeightChange) return;
        const node = displayRef.current;

        const measure = () => {
            const measured = node.offsetHeight;
            if (measured > 0) {
                // Add half-line buffer to ensure Rect fully encloses rendered text
                const bufferPx = (el.fontSize || 24) * 0.5;
                const unscaledH = Math.ceil(measured / scale) + Math.round(bufferPx);
                onHeightChange(el.id, unscaledH);
            }
        };

        // Observe size changes (covers width resize, content change, font load)
        const ro = new ResizeObserver(measure);
        ro.observe(node);

        // Also measure once immediately after paint
        const raf = requestAnimationFrame(measure);
        return () => { ro.disconnect(); cancelAnimationFrame(raf); };
    }, [scale, el.id, isEditing, onHeightChange]);

    // Initialize / destroy ProseMirror editor when entering/leaving edit mode
    useEffect(() => {
        if (!isEditing) {
            // Destroy editor when leaving edit mode
            if (viewRef.current) {
                viewRef.current.destroy();
                viewRef.current = null;
            }
            return;
        }

        const container = editorContainerRef.current;
        if (!container || viewRef.current) return;

        // Parse the content into ProseMirror document
        let doc;
        try {
            doc = mathSchema.nodeFromJSON({
                type: 'doc',
                content: parseLatexTextToNodes(plainContent),
            });
        } catch (e) {
            console.error('[MathOverlay] parse error, falling back:', e);
            doc = mathSchema.nodeFromJSON({
                type: 'doc',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: plainContent }] }],
            });
        }

        const state = EditorState.create({
            doc,
            schema: mathSchema,
            plugins: [
                history(),
                keymap({
                    'Mod-Space': insertMathCmd(mathSchema.nodes.math_inline),
                    'Backspace': mathBackspaceCmd,
                    'Escape': () => {
                        onEditDoneRef.current?.();
                        return true;
                    },
                }),
                keymap(baseKeymap),
                mathPlugin,
            ],
        });

        const view = new EditorView(container, {
            state,
            editable: () => true,
            handlePaste: (view, event) => {
                const text = event.clipboardData?.getData('text/plain');
                if (text && (text.includes('\\(') || text.includes('\\[') || text.includes('$'))) {
                    try {
                        const nodesJson = parseLatexTextToNodes(text);
                        const nodes = nodesJson.map(n => mathSchema.nodeFromJSON(n));
                        const fragment = Fragment.fromArray(nodes);
                        const newSlice = new Slice(fragment, 0, 0);
                        const tr = view.state.tr.replaceSelection(newSlice);
                        view.dispatch(tr);
                        return true;
                    } catch (e) {
                        console.error('[MathOverlay] paste error:', e);
                        return false;
                    }
                }
                return false;
            },
            dispatchTransaction(transaction) {
                const newState = view.state.apply(transaction);
                view.updateState(newState);
                if (transaction.docChanged) {
                    // Serialize ProseMirror doc back to plain text with LaTeX delimiters
                    const docJson = newState.doc.toJSON();
                    const serialized = prosemirrorDocToPlainText(docJson);
                    onContentChangeRef.current?.(el.id, serialized);
                }
            },
        });

        viewRef.current = view;
        view.focus();

        return () => {
            view.destroy();
            viewRef.current = null;
        };
    }, [isEditing, el.id]); // Only re-init when editing state changes

    // Handle click outside the editor to end editing
    useEffect(() => {
        if (!isEditing) return;
        const handleClickOutside = (e) => {
            const container = editorContainerRef.current;
            if (container && !container.contains(e.target)) {
                // Force ProseMirror selection out of any math node before closing
                const view = viewRef.current;
                if (view) {
                    try {
                        const tr = view.state.tr.setSelection(
                            TextSelection.atEnd(view.state.doc)
                        );
                        view.dispatch(tr);
                    } catch { /* ignore */ }
                }
                onEditDoneRef.current?.();
            }
        };
        // Use capture phase + slight delay to avoid the double-click that opened editing
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside, true);
        }, 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [isEditing]);

    // Intercept keydown on the editor container to stop propagation to Fabric/parent
    const handleKeyDown = useCallback((e) => {
        e.stopPropagation();
    }, []);

    const fontSize = (el.fontSize || 24) * scale;
    const color = el.color || theme.text;

    return (
        <div
            id={`math-overlay-${el.id}`}
            style={{
                position: 'absolute',
                left: el.x * scale,
                top: el.y * scale,
                width: el.w * scale,
                pointerEvents: isEditing ? 'auto' : 'none',
            }}
        >
            {isEditing ? (
                <div
                    ref={editorContainerRef}
                    onKeyDown={handleKeyDown}
                    className="prosemirror-math-overlay-editor"
                    style={{
                        width: '100%',
                        minHeight: Math.max(40, (el.h || 80) * scale),
                        fontSize,
                        color,
                        background: 'transparent',
                        // border: '2px solid #34d399',
                        borderRadius: 6,
                        padding: 6 * scale,
                        lineHeight: 1.6,
                        boxSizing: 'border-box',
                        cursor: 'text',
                    }}
                />
            ) : (
                <div
                    ref={displayRef}
                    dangerouslySetInnerHTML={{ __html: katexHtml }}
                    style={{
                        fontSize,
                        color,
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                    }}
                />
            )}
        </div>
    );
});

export default MathOverlayLayer;
