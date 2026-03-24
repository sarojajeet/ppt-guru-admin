/**
 * FabricCanvas — Fabric.js canvas with two-way sync to slide data model
 *
 * Math elements: text elements containing LaTeX (\(...\) or \[...\]) are
 * rendered as invisible Fabric Rects for selection/drag/resize. A KaTeX DOM
 * overlay (MathOverlayLayer) renders the actual math on top. Double-click
 * opens a textarea for raw content editing.
 *
 * Non-math text elements remain as Fabric Textbox objects (unchanged).
 *
 * DOM isolation: Fabric.js injects wrapper/upper-canvas elements around the
 * <canvas>. To avoid React reconciliation conflicts we give Fabric its own
 * container div and create the <canvas> imperatively.
 */

import { useRef, useState, useEffect, useCallback, memo } from 'react';
import * as fabric from 'fabric';
import { SLIDE_W, SLIDE_H } from './constants';
import { htmlToPlainText, containsLatex, latexToUnicode } from './utils';
import MathOverlayLayer from './MathOverlayLayer';

/* ── Font helpers ─────────────────────────────────── */
// Indic scripts (Devanagari, Bengali, Tamil, etc.) aren't supported by common
// web fonts (Inter, Roboto, Poppins …). Canvas measureText() with "Inter, sans-serif"
// uses the primary font's metrics (replacement glyphs) while the renderer uses the
// system fallback. This mismatch makes Fabric underestimate line widths → wrong height.
// Fix: use "sans-serif" directly for Indic text so measurement = rendering.
const INDIC_RE = /[\u0900-\u0DFF]/;
function getFontStack(baseFont, text) {
    if (INDIC_RE.test(text)) return 'sans-serif';
    return baseFont.includes(',') ? baseFont : `${baseFont}, sans-serif`;
}

/* ── Shape helpers ─────────────────────────────────── */
function createFabricShape(el) {
    const { shapeType, x, y, w, h, fill, stroke, strokeWidth = 2 } = el;
    const common = {
        left: x, top: y, width: w, height: h,
        fill: fill || 'rgba(77,166,255,0.3)',
        stroke: stroke || '#4da6ff',
        strokeWidth,
        strokeUniform: true,
        originX: 'left',
        originY: 'top',
        elementId: el.id,
        elementType: 'shape',
    };

    switch (shapeType) {
        case 'rectangle':
            return new fabric.Rect({ ...common });
        case 'rounded-rectangle':
            return new fabric.Rect({ ...common, rx: 12, ry: 12 });
        case 'circle':
            return new fabric.Ellipse({
                ...common,
                rx: w / 2, ry: h / 2,
                width: undefined, height: undefined,
            });
        case 'triangle':
            return new fabric.Triangle({ ...common });
        case 'diamond': {
            const pts = [
                { x: w / 2, y: 0 },
                { x: w, y: h / 2 },
                { x: w / 2, y: h },
                { x: 0, y: h / 2 },
            ];
            return new fabric.Polygon(pts, {
                ...common, left: x, top: y, width: w, height: h,
            });
        }
        case 'star': {
            const cx = w / 2, cy = h / 2;
            const outerR = Math.min(w, h) / 2;
            const innerR = outerR * 0.4;
            const pts = [];
            for (let i = 0; i < 10; i++) {
                const r = i % 2 === 0 ? outerR : innerR;
                const angle = (Math.PI / 2) + (Math.PI / 5) * i;
                pts.push({ x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) });
            }
            return new fabric.Polygon(pts, {
                ...common, left: x, top: y, width: w, height: h,
            });
        }
        case 'line':
            return new fabric.Line([x, y + h, x + w, y], {
                stroke: stroke || '#4da6ff',
                strokeWidth: Math.max(strokeWidth, 3),
                strokeLineCap: 'round',
                fill: null,
                originX: 'left',
                originY: 'top',
                elementId: el.id,
                elementType: 'shape',
            });
        case 'arrow': {
            const pathStr = `M 0 ${h / 2} L ${w * 0.85} ${h / 2} M ${w * 0.7} ${h * 0.3} L ${w * 0.9} ${h / 2} L ${w * 0.7} ${h * 0.7}`;
            return new fabric.Path(pathStr, {
                left: x, top: y,
                stroke: stroke || '#4da6ff',
                strokeWidth: Math.max(strokeWidth, 3),
                strokeLineCap: 'round',
                strokeLineJoin: 'round',
                fill: null,
                originX: 'left',
                originY: 'top',
                elementId: el.id,
                elementType: 'shape',
            });
        }
        default:
            return new fabric.Rect({ ...common });
    }
}

/* ── Control styles ────────────────────────────────── */
const CONTROL_STYLE = {
    cornerColor: '#34d399',
    cornerStrokeColor: '#fff',
    cornerStyle: 'circle',
    cornerSize: 12,
    borderColor: '#34d399',
    borderScaleFactor: 2,
    transparentCorners: false,
    padding: 4,
    // Fabric.js v7 changed default origin to center/center — we need left/top
    originX: 'left',
    originY: 'top',
};

/* ── FabricCanvas component ────────────────────────── */
const FabricCanvas = memo(function FabricCanvas({
    slide, theme, selectedId, editingId,
    onSelectElement, onStartEdit, onEditDone, onUpdateElement, onEditorReady, onDirectUpdateRef,
    isMobile,
}) {
    const wrapperRef = useRef(null);
    const fabricContainerRef = useRef(null);  // opaque div Fabric owns
    const fcRef = useRef(null);               // fabric.Canvas instance
    const [scale, setScale] = useState(1);
    const scaleRef = useRef(1);
    const isInternalUpdate = useRef(false);
    const slideIdRef = useRef(null);
    const isSyncing = useRef(false);

    const padding = isMobile ? 4 : 16;

    useEffect(() => { scaleRef.current = scale; }, [scale]);

    /* ── Direct property update (skips full canvas rebuild) ── */
    useEffect(() => {
        if (!onDirectUpdateRef) return;
        onDirectUpdateRef.current = (elementId, updates) => {
            const fc = fcRef.current;
            if (!fc) return;
            const obj = fc.getObjects().find(o => o.elementId === elementId);
            if (obj) {
                if (obj.elementType === 'math') {
                    // Math elements are invisible Rects — only update position/size, not text props
                    if (updates.fill !== undefined) obj.set('fill', updates.fill);
                    if (updates.stroke !== undefined) obj.set('stroke', updates.stroke);
                    if (updates.strokeWidth !== undefined) obj.set('strokeWidth', updates.strokeWidth);
                } else {
                    if (updates.color !== undefined) obj.set('fill', updates.color);
                    if (updates.fontFamily !== undefined) { obj.set('fontFamily', getFontStack(updates.fontFamily, obj.text || '')); obj.initDimensions(); }
                    if (updates.fontSize !== undefined) { obj.set('fontSize', updates.fontSize); obj.initDimensions(); }
                    if (updates.fontWeight !== undefined) obj.set('fontWeight', updates.fontWeight);
                    if (updates.fontStyle !== undefined) obj.set('fontStyle', updates.fontStyle);
                    if (updates.underline !== undefined) obj.set('underline', updates.underline);
                    if (updates.linethrough !== undefined) obj.set('linethrough', updates.linethrough);
                    if (updates.textAlign !== undefined) obj.set('textAlign', updates.textAlign);
                    if (updates.fill !== undefined) obj.set('fill', updates.fill);
                    if (updates.stroke !== undefined) obj.set('stroke', updates.stroke);
                    if (updates.strokeWidth !== undefined) obj.set('strokeWidth', updates.strokeWidth);
                }
                obj.dirty = true;
                obj.setCoords();
                fc.requestRenderAll();
            }
            isInternalUpdate.current = true;
            onUpdateElement(elementId, updates);
        };
    }, [onUpdateElement, onDirectUpdateRef]);

    /* ── Initialize Fabric canvas (imperative) ─────── */
    useEffect(() => {
        const container = fabricContainerRef.current;
        if (!container || fcRef.current) return;

        // Create the <canvas> element imperatively so React never touches it
        const canvasEl = document.createElement('canvas');
        canvasEl.width = SLIDE_W;
        canvasEl.height = SLIDE_H;
        container.appendChild(canvasEl);

        const fc = new fabric.Canvas(canvasEl, {
            width: SLIDE_W,
            height: SLIDE_H,
            selection: false,
            preserveObjectStacking: true,
            backgroundColor: 'transparent',
        });
        fcRef.current = fc;

        return () => {
            fc.dispose();
            fcRef.current = null;
            // Fabric.dispose removes its wrapper; clear anything left
            while (container.firstChild) container.removeChild(container.firstChild);
        };
    }, []);

    /* ── Scaling ──────────────────────────────────── */
    useEffect(() => {
        const update = () => {
            const parent = wrapperRef.current;
            if (!parent) return;
            const aW = parent.offsetWidth - padding;
            const aH = parent.offsetHeight - padding;
            const s = Math.min(aW / SLIDE_W, aH / SLIDE_H);
            setScale(s);
            scaleRef.current = s;
            const fc = fcRef.current;
            if (fc) {
                fc.setDimensions({ width: SLIDE_W * s, height: SLIDE_H * s });
                fc.setZoom(s);
                fc.requestRenderAll();
            }
        };
        update();

        let ro;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(update);
            if (wrapperRef.current) ro.observe(wrapperRef.current);
        }
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('resize', update);
            ro?.disconnect();
        };
    }, [padding]);

    /* ── Re-render after fonts load (fixes text measurement & wrapping) ── */
    useEffect(() => {
        if (!document.fonts) return;
        const handler = () => {
            const fc = fcRef.current;
            if (!fc) return;
            fc.getObjects().forEach(obj => {
                if (obj instanceof fabric.Textbox) {
                    obj.initDimensions();
                    obj.setCoords();
                }
            });
            fc.requestRenderAll();
        };
        document.fonts.ready.then(handler);
        document.fonts.addEventListener('loadingdone', handler);
        return () => document.fonts.removeEventListener('loadingdone', handler);
    }, []);

    /* ── Sync slide data → canvas objects ─────────── */
    const syncSlideToCanvas = useCallback((slideData) => {
        const fc = fcRef.current;
        if (!fc || !slideData) return;
        isSyncing.current = true;

        fc.clear();
        fc.backgroundColor = 'transparent';

        const promises = [];

        slideData.elements.forEach(el => {
            if (el.type === 'text') {
                const hasMath = containsLatex(el.content);

                // Clamp position & width so element stays within the slide
                const PAD = 10;
                const clampedX = Math.max(0, Math.min(el.x ?? 0, SLIDE_W - PAD));
                const clampedY = Math.max(0, Math.min(el.y ?? 0, SLIDE_H - PAD));
                const maxW = SLIDE_W - clampedX - PAD;
                const clampedW = Math.max(60, Math.min(el.w || 400, maxW));

                if (hasMath) {
                    // Math elements: invisible Rect for Fabric interaction;
                    // KaTeX rendering handled by MathOverlayLayer (DOM overlay)
                    const rect = new fabric.Rect({
                        left: clampedX,
                        top: clampedY,
                        width: clampedW,
                        height: el.h || 120,
                        fill: 'transparent',
                        stroke: 'transparent',
                        strokeWidth: 0,
                        ...CONTROL_STYLE,
                        padding: 1, // tighter selection box for math (overlay handles rendering)
                        elementId: el.id,
                        elementType: 'math',
                    });
                    rect.setControlsVisibility({ mt: false, mb: false });
                    fc.add(rect);
                } else {
                    // Non-math text: standard Fabric Textbox
                    const plainText = htmlToPlainText(el.content || '');
                    const displayText = plainText || ' ';

                    const baseFont = el.fontFamily || 'Inter';
                    const fontStack = getFontStack(baseFont, displayText);

                    // Only use splitByGrapheme for CJK scripts (no word spaces).
                    // Devanagari/Latin use word-based wrapping for accurate height measurement.
                    const hasCJK = /[\u4E00-\u9FFF\u3000-\u30FF\u31F0-\u31FF\uAC00-\uD7AF\u3400-\u4DBF\uF900-\uFAFF]/.test(displayText);

                    const tb = new fabric.Textbox(displayText, {
                        left: clampedX,
                        top: clampedY,
                        width: clampedW,
                        fontSize: el.fontSize || 24,
                        fontFamily: fontStack,
                        fill: el.color || theme.text,
                        fontWeight: el.fontWeight || 'normal',
                        fontStyle: el.fontStyle || 'normal',
                        underline: el.underline || false,
                        linethrough: el.linethrough || false,
                        textAlign: el.textAlign || 'left',
                        splitByGrapheme: hasCJK,
                        ...CONTROL_STYLE,
                        elementId: el.id,
                        elementType: 'text',
                    });
                    fc.add(tb);
                }
            } else if (el.type === 'image' && el.content) {
                const imgX = Math.max(0, Math.min(el.x ?? 0, SLIDE_W - 20));
                const imgY = Math.max(0, Math.min(el.y ?? 0, SLIDE_H - 20));
                const imgW = Math.min(el.w || 300, SLIDE_W - imgX);
                const imgH = Math.min(el.h || 200, SLIDE_H - imgY);

                const applyImage = (img) => {
                    if (!img || !fcRef.current) return;
                    img.set({
                        left: imgX,
                        top: imgY,
                        ...CONTROL_STYLE,
                        elementId: el.id,
                        elementType: 'image',
                    });
                    // Scale each axis independently to fit exact target dimensions
                    const sX = imgW / (img.width || imgW);
                    const sY = imgH / (img.height || imgH);
                    img.set({ scaleX: sX, scaleY: sY });
                    fc.add(img);
                    fc.requestRenderAll();
                };

                // Try with CORS first, fall back to no-CORS (tainted canvas but visible)
                const p = fabric.FabricImage.fromURL(el.content, { crossOrigin: 'anonymous' })
                    .then(applyImage)
                    .catch(() =>
                        fabric.FabricImage.fromURL(el.content)
                            .then(applyImage)
                            .catch(() => {})
                    );
                promises.push(p);
            } else if (el.type === 'image' && !el.content) {
                const phX = Math.max(0, Math.min(el.x ?? 0, SLIDE_W - 20));
                const phY = Math.max(0, Math.min(el.y ?? 0, SLIDE_H - 20));
                const rect = new fabric.Rect({
                    left: phX, top: phY,
                    width: Math.min(el.w || 300, SLIDE_W - phX),
                    height: Math.min(el.h || 200, SLIDE_H - phY),
                    fill: 'rgba(128,128,128,0.15)',
                    stroke: 'rgba(128,128,128,0.4)',
                    strokeWidth: 2,
                    strokeDashArray: [8, 4],
                    ...CONTROL_STYLE,
                    elementId: el.id,
                    elementType: 'image',
                });
                fc.add(rect);
            } else if (el.type === 'shape') {
                const clampedEl = {
                    ...el,
                    x: Math.max(0, Math.min(el.x ?? 0, SLIDE_W - 20)),
                    y: Math.max(0, Math.min(el.y ?? 0, SLIDE_H - 20)),
                };
                clampedEl.w = Math.min(el.w || 200, SLIDE_W - clampedEl.x);
                clampedEl.h = Math.min(el.h || 200, SLIDE_H - clampedEl.y);
                const shape = createFabricShape(clampedEl);
                if (shape) {
                    shape.set(CONTROL_STYLE);
                    fc.add(shape);
                }
            }
        });

        const finishSync = () => {
            isSyncing.current = false;
            if (selectedId) {
                const obj = fc.getObjects().find(o => o.elementId === selectedId);
                if (obj) {
                    fc.setActiveObject(obj);
                    onEditorReady(obj);
                }
            }
            fc.requestRenderAll();
        };

        if (promises.length > 0) {
            Promise.all(promises).then(finishSync);
        } else {
            finishSync();
        }
    }, [theme.text, selectedId]);

    useEffect(() => {
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        // If same slide and same element structure, update properties in place (no full rebuild)
        const fc = fcRef.current;
        if (fc && slide && slideIdRef.current === slide.id) {
            const objects = fc.getObjects();
            const canPatch = slide.elements.length > 0 &&
                slide.elements.every(el => objects.some(o => o.elementId === el.id));

            if (canPatch) {
                slide.elements.forEach(el => {
                    const obj = objects.find(o => o.elementId === el.id);
                    if (!obj) return;
                    if (obj.elementType === 'math') {
                        // Math Rects: update position/size only; rendering is via DOM overlay
                        obj.set('left', el.x ?? obj.left);
                        obj.set('top', el.y ?? obj.top);
                        obj.set('width', el.w ?? obj.width);
                        if (el.h) obj.set('height', el.h);
                        obj.setCoords();
                        obj.dirty = true;
                    } else if (obj.elementType === 'text') {
                        obj.set('fill', el.color || theme.text);
                        obj.set('fontFamily', getFontStack(el.fontFamily || 'Inter', obj.text || ''));
                        obj.set('fontSize', el.fontSize || 24);
                        obj.set('fontWeight', el.fontWeight || 'normal');
                        obj.set('fontStyle', el.fontStyle || 'normal');
                        obj.set('underline', el.underline || false);
                        obj.set('linethrough', el.linethrough || false);
                        obj.set('textAlign', el.textAlign || 'left');
                        obj.dirty = true;
                    } else if (obj.elementType === 'shape') {
                        if (el.fill !== undefined) obj.set('fill', el.fill);
                        if (el.stroke !== undefined) obj.set('stroke', el.stroke);
                        if (el.strokeWidth !== undefined) obj.set('strokeWidth', el.strokeWidth);
                        obj.dirty = true;
                    } else if (obj.elementType === 'image') {
                        obj.set('left', el.x ?? obj.left);
                        obj.set('top', el.y ?? obj.top);
                        if (el.w && el.h) {
                            // Use native image dimensions (immune to previous corruption)
                            const nativeW = obj._element?.naturalWidth || obj.width;
                            const nativeH = obj._element?.naturalHeight || obj.height;
                            // Self-heal: restore native width/height if they were overwritten
                            if (obj._element && (obj.width !== nativeW || obj.height !== nativeH)) {
                                obj.set({ width: nativeW, height: nativeH });
                            }
                            obj.set('scaleX', el.w / nativeW);
                            obj.set('scaleY', el.h / nativeH);
                        }
                        obj.setCoords();
                        obj.dirty = true;
                    }
                });
                fc.requestRenderAll();
                return;
            }
        }

        syncSlideToCanvas(slide);
        slideIdRef.current = slide?.id;
    }, [slide, syncSlideToCanvas, theme.text]);

    /* ── Update theme colors on existing text objects ── */
    useEffect(() => {
        const fc = fcRef.current;
        if (!fc) return;
        fc.getObjects().forEach(obj => {
            if (obj.elementType === 'text') {
                const el = slide?.elements.find(e => e.id === obj.elementId);
                if (el && !el.color) {
                    obj.set('fill', theme.text);
                }
            }
            // Math elements: theme color applied by MathOverlayLayer (DOM overlay)
        });
        fc.requestRenderAll();
    }, [theme.text, theme.bg]);

    /* ── Fabric event listeners ───────────────────── */
    useEffect(() => {
        const fc = fcRef.current;
        if (!fc) return;

        const onSelectionCreated = (e) => {
            if (isSyncing.current) return;
            const obj = e.selected?.[0];
            if (obj?.elementId) {
                onSelectElement(obj.elementId);
                onEditorReady(obj);
                // Math elements: enter edit mode immediately on select
                if (obj.elementType === 'math') {
                    onStartEdit(obj.elementId);
                }
            }
        };

        const onSelectionUpdated = (e) => {
            if (isSyncing.current) return;
            const obj = e.selected?.[0];
            if (obj?.elementId) {
                onSelectElement(obj.elementId);
                onEditorReady(obj);
                // Math elements: enter edit mode immediately on select
                if (obj.elementType === 'math') {
                    onStartEdit(obj.elementId);
                }
            }
        };

        const onSelectionCleared = () => {
            if (isSyncing.current) return;
            onSelectElement(null);
            onEditorReady(null);
        };

        const onObjectModified = (e) => {
            const obj = e.target;
            if (!obj?.elementId) return;
            isInternalUpdate.current = true;

            // Clamp position so objects stay within slide boundaries
            const clampedLeft = Math.max(0, Math.min(Math.round(obj.left), SLIDE_W - 20));
            const clampedTop = Math.max(0, Math.min(Math.round(obj.top), SLIDE_H - 20));

            if (obj.elementType === 'math') {
                // Math elements: Rect handles position/width; height is set
                // by MathOverlayLayer via onHeightChange after KaTeX re-renders
                const rawW = Math.round(obj.width * (obj.scaleX || 1));
                const newW = Math.min(rawW, SLIDE_W - clampedLeft - 10);
                obj.set({ scaleX: 1, scaleY: 1, width: newW, left: clampedLeft, top: clampedTop });
                obj.setCoords();
                onUpdateElement(obj.elementId, {
                    x: clampedLeft,
                    y: clampedTop,
                    w: newW,
                    // h omitted — MathOverlayLayer measures and sets it
                });
            } else if (obj.elementType === 'text') {
                const rawW = Math.round(obj.width * (obj.scaleX || 1));
                const newW = Math.min(rawW, SLIDE_W - clampedLeft - 10);
                // Reset scale and apply new width, then reflow text before reading height
                obj.set({ scaleX: 1, scaleY: 1, width: newW, left: clampedLeft, top: clampedTop });
                if (obj.initDimensions) obj.initDimensions();
                obj.setCoords();
                // Read actual height after text reflow
                const newH = Math.round(obj.height);
                onUpdateElement(obj.elementId, {
                    x: clampedLeft,
                    y: clampedTop,
                    w: newW,
                    h: newH,
                });
            } else if (obj.elementType === 'image') {
                // Self-heal: restore native dimensions if corrupted by previous code
                const imgEl = obj._element;
                if (imgEl?.naturalWidth && obj.width !== imgEl.naturalWidth) {
                    const dw = obj.getScaledWidth();
                    const dh = obj.getScaledHeight();
                    obj.set({ width: imgEl.naturalWidth, height: imgEl.naturalHeight,
                              scaleX: dw / imgEl.naturalWidth, scaleY: dh / imgEl.naturalHeight });
                }

                // Only update w/h when actually resizing — dragging (move) should
                // only update position to avoid rounding-triggered zoom artifacts.
                const action = e.transform?.action;
                const updates = { x: clampedLeft, y: clampedTop };
                if (action && action !== 'drag') {
                    updates.w = Math.round(obj.getScaledWidth());
                    updates.h = Math.round(obj.getScaledHeight());
                }
                onUpdateElement(obj.elementId, updates);
                obj.set({ left: clampedLeft, top: clampedTop });
                obj.setCoords();
            } else if (obj.elementType === 'shape') {
                // Shapes (Ellipse, Polygon, Path, Line, etc.): keep scale intact.
                // Resetting scaleX/scaleY to 1 and setting width/height directly
                // corrupts shapes whose rendering depends on rx/ry, points, or path
                // data — causing them to clip when shrunk.
                const displayW = Math.round(obj.getScaledWidth());
                const displayH = Math.round(obj.getScaledHeight());
                onUpdateElement(obj.elementId, {
                    x: clampedLeft, y: clampedTop, w: displayW, h: displayH,
                });
                obj.set({ left: clampedLeft, top: clampedTop });
                obj.setCoords();
            } else {
                const w = Math.round((obj.width || obj.getScaledWidth()) * (obj.scaleX || 1));
                const h = Math.round((obj.height || obj.getScaledHeight()) * (obj.scaleY || 1));
                onUpdateElement(obj.elementId, {
                    x: clampedLeft,
                    y: clampedTop,
                    w, h,
                });
                obj.set({ scaleX: 1, scaleY: 1, width: w, height: h, left: clampedLeft, top: clampedTop });
                obj.setCoords();
            }
            fc.requestRenderAll();
        };

        const onTextChanged = (e) => {
            const obj = e.target;
            if (!obj?.elementId) return;
            isInternalUpdate.current = true;
            onUpdateElement(obj.elementId, { content: obj.text });
        };

        const onTextEditingEntered = (e) => {
            const obj = e.target;
            if (!obj?.elementId) return;
            onStartEdit(obj.elementId);
            onEditorReady(obj);
        };

        const onTextEditingExited = () => {
            onEditorReady(null);
        };

        const onMouseDblClick = (e) => {
            const obj = e.target;
            if (!obj) return;
            if (obj.elementType === 'math') {
                // Math elements: open textarea overlay for editing (via MathOverlayLayer)
                fc.setActiveObject(obj);
                onStartEdit(obj.elementId);
                onEditorReady(obj);
                fc.requestRenderAll();
            } else if (obj.elementType === 'text' && obj instanceof fabric.Textbox) {
                fc.setActiveObject(obj);
                obj.enterEditing();
                obj.selectAll();
                fc.requestRenderAll();
            }
        };

        // Live overlay tracking: update DOM position directly during drag/scale
        const onObjectMoving = (e) => {
            const obj = e.target;
            if (obj?.elementType !== 'math') return;
            const overlay = document.getElementById(`math-overlay-${obj.elementId}`);
            if (overlay) {
                const s = scaleRef.current;
                overlay.style.left = `${obj.left * s}px`;
                overlay.style.top = `${obj.top * s}px`;
            }
        };

        const onObjectScaling = (e) => {
            const obj = e.target;
            if (!obj) return;

            // Text elements: convert scale to width change in real-time.
            // Per Fabric.js docs, Textbox Y-scaling is locked — only width
            // changes, height auto-adjusts from text reflow.
            if (obj.elementType === 'text' && obj instanceof fabric.Textbox) {
                const newWidth = Math.round(obj.width * (obj.scaleX || 1));
                obj.set({ width: newWidth, scaleX: 1, scaleY: 1 });
                obj.initDimensions();
                obj.setCoords();
                fc.requestRenderAll();
                return;
            }

            // Math elements: convert scale to width change, update overlay position
            if (obj.elementType === 'math') {
                const newWidth = Math.round(obj.width * (obj.scaleX || 1));
                obj.set({ width: newWidth, scaleX: 1, scaleY: 1 });
                obj.setCoords();

                const overlay = document.getElementById(`math-overlay-${obj.elementId}`);
                if (overlay) {
                    const s = scaleRef.current;
                    overlay.style.left = `${obj.left * s}px`;
                    overlay.style.top = `${obj.top * s}px`;
                    overlay.style.width = `${newWidth * s}px`;
                }
                fc.requestRenderAll();
            }
        };

        fc.on('selection:created', onSelectionCreated);
        fc.on('selection:updated', onSelectionUpdated);
        fc.on('selection:cleared', onSelectionCleared);
        fc.on('object:modified', onObjectModified);
        fc.on('text:changed', onTextChanged);
        fc.on('text:editing:entered', onTextEditingEntered);
        fc.on('text:editing:exited', onTextEditingExited);
        fc.on('mouse:dblclick', onMouseDblClick);
        fc.on('object:moving', onObjectMoving);
        fc.on('object:scaling', onObjectScaling);

        return () => {
            fc.off('selection:created', onSelectionCreated);
            fc.off('selection:updated', onSelectionUpdated);
            fc.off('selection:cleared', onSelectionCleared);
            fc.off('object:modified', onObjectModified);
            fc.off('text:changed', onTextChanged);
            fc.off('text:editing:entered', onTextEditingEntered);
            fc.off('text:editing:exited', onTextEditingExited);
            fc.off('mouse:dblclick', onMouseDblClick);
            fc.off('object:moving', onObjectMoving);
            fc.off('object:scaling', onObjectScaling);
        };
    }, [onSelectElement, onUpdateElement, onStartEdit, onEditorReady]);

    /* ── Math overlay callbacks ─────────────────────── */
    const handleMathContentChange = useCallback((elId, newContent) => {
        isInternalUpdate.current = true;
        onUpdateElement(elId, { content: newContent });
    }, [onUpdateElement]);

    const handleMathHeightChange = useCallback((elId, newH) => {
        const fc = fcRef.current;
        if (!fc) return;
        const obj = fc.getObjects().find(o => o.elementId === elId);
        if (obj && obj.elementType === 'math') {
            const curH = Math.round(obj.height);
            if (Math.abs(curH - newH) > 2) {
                obj.set('height', newH);
                obj.setCoords();
                fc.requestRenderAll();
                // Also persist to data model
                isInternalUpdate.current = true;
                onUpdateElement(elId, { h: newH });
            }
        }
    }, [onUpdateElement]);

    /* ── Click on empty area to deselect ──────────── */
    const handleWrapperClick = useCallback((e) => {
        if (e.target === wrapperRef.current) {
            const fc = fcRef.current;
            if (fc) {
                fc.discardActiveObject();
                fc.requestRenderAll();
            }
            onSelectElement(null);
        }
    }, [onSelectElement]);

    return (
        <div
            ref={wrapperRef}
            className="flex-1 flex justify-center items-center overflow-hidden w-full h-full relative"
            onMouseDown={handleWrapperClick}
        >
            <div
                style={{
                    width: SLIDE_W * scale,
                    height: SLIDE_H * scale,
                    position: 'relative',
                    flexShrink: 0,
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 12px 30px rgba(0,0,0,0.35), 0 30px 70px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)',
                }}
            >
                {/* Background layer (z-index: 0) */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: theme.bg,
                    borderRadius: 8, zIndex: 0,
                    pointerEvents: 'none',
                }} />

                {/*
                  Fabric canvas container (z-index: 2)
                  This div is React-opaque: Fabric creates/manages its own
                  DOM inside it (wrapper div, lower-canvas, upper-canvas).
                  React never reconciles its children → no insertBefore crash.
                */}
                <div
                    ref={fabricContainerRef}
                    style={{ position: 'absolute', inset: 0, zIndex: 2 }}
                />

                {/* KaTeX overlay for math elements (z-index: 3, above Fabric) */}
                <MathOverlayLayer
                    elements={slide?.elements}
                    scale={scale}
                    theme={theme}
                    editingId={editingId}
                    onContentChange={handleMathContentChange}
                    onEditDone={onEditDone}
                    onHeightChange={handleMathHeightChange}
                />
            </div>
        </div>
    );
});

export default FabricCanvas;
