/**
 * FabricEditor — Fabric.js-based Slide Editor
 *
 * Layout: [LeftIconBar 60px] [LeftDrawer ~250px] [TopBar              ]
 *                                                 [FabricContextToolbar?]
 *                                                 [    FabricCanvas     ]
 *                                                 [  StatusBar          ]
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import pptxgen from 'pptxgenjs';
import 'katex/dist/katex.min.css';

// import { getDocument, generateDocument } from '../../services/document.service';
import { useResponsive } from '../../hooks/useResponsive';

import { SLIDE_W, SLIDE_H, THEMES } from './constants';
import { createTextElement, createImageElement, createShapeElement, defaultSlide, parseSlides, htmlToPlainText } from './utils';
import EditorStyles from './EditorStyles';
import TopBar from './TopBar';
import LeftIconBar from './LeftIconBar';
import LeftDrawerPanel from './LeftDrawerPanel';
import FabricContextToolbar from './FabricContextToolbar';
import StatusBar from './StatusBar';
import PresentMode from './PresentMode';
import { getDocument } from '@/services/api';
import FabricCanvas from './FabricCanvas';

export default function FabricEditor() {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const { isMobile, isTablet, isMobileOrTablet } = useResponsive();

    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const hasStarted = useRef(false);

    const [slides, setSlides] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [themeIdx, setThemeIdx] = useState(0);
    const [selectedId, setSelectedId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [isPresentMode, setIsPresentMode] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeObject, setActiveObject] = useState(null);   // Fabric Textbox object (or null)
    const [sessionImages, setSessionImages] = useState([]);
    const directUpdateRef = useRef(null);                     // set by FabricCanvas for direct Fabric obj updates

    const [activeTool, setActiveTool] = useState('slides');

    // History (refs for storage, state only for canUndo/canRedo UI)
    const historyRef = useRef([]);
    const historyIdxRef = useRef(-1);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const historyDebounce = useRef(null);

    // Ref mirrors for stable callbacks & keyboard handler
    const activeIndexRef = useRef(activeIndex);
    useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

    const selectedIdRef = useRef(selectedId);
    useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

    const editingIdRef = useRef(editingId);
    useEffect(() => { editingIdRef.current = editingId; }, [editingId]);

    const isPresentModeRef = useRef(isPresentMode);
    useEffect(() => { isPresentModeRef.current = isPresentMode; }, [isPresentMode]);

    const themeRef = useRef(THEMES[themeIdx]);
    useEffect(() => { themeRef.current = THEMES[themeIdx]; }, [themeIdx]);

    const theme = THEMES[themeIdx];
    const slide = slides[activeIndex];
    const selectedElement = useMemo(
        () => slide?.elements.find(el => el.id === selectedId) || null,
        [slide, selectedId]
    );

    // ── Tool select handler (toggle drawer) ──────────────────────────────────
    const handleToolSelect = useCallback((tool) => {
        setActiveTool(prev => prev === tool ? null : tool);
    }, []);

    // ── Load document ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!documentId) { navigate('/'); return; }
        if (hasStarted.current) return;
        hasStarted.current = true;
        loadDocument();
    }, [documentId]);

    async function loadDocument() {
        setLoading(true);
        try {
            const doc = await getDocument(documentId);
            const raw = doc?.data?.slideData || doc.aiContent || null;
            console.log('[FabricEditor] Loaded document:', { doc, raw });
            const parsed = parseSlides(raw);
            setSlides(parsed);
            historyRef.current = [JSON.stringify(parsed)];
            historyIdxRef.current = 0;
            setCanUndo(false);
            setCanRedo(false);
        } catch (err) {
            console.error('[FabricEditor] load:', err);
            setFetchError(err.message || 'Failed to load document.');
        } finally {
            setLoading(false);
        }
    }

    // ── History ──────────────────────────────────────────────────────────────
    const syncHistoryState = useCallback(() => {
        setCanUndo(historyIdxRef.current > 0);
        setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
    }, []);

    const addToHistory = useCallback((newSlides) => {
        clearTimeout(historyDebounce.current);
        historyDebounce.current = setTimeout(() => {
            const serialized = JSON.stringify(newSlides);
            const trimmed = historyRef.current.slice(0, historyIdxRef.current + 1);
            trimmed.push(serialized);
            if (trimmed.length > 50) trimmed.shift();
            historyRef.current = trimmed;
            historyIdxRef.current = Math.min(historyIdxRef.current + 1, 49);
            syncHistoryState();
        }, 400);
    }, [syncHistoryState]);

    const undo = useCallback(() => {
        if (historyIdxRef.current > 0) {
            historyIdxRef.current -= 1;
            setSlides(JSON.parse(historyRef.current[historyIdxRef.current]));
            syncHistoryState();
        }
    }, [syncHistoryState]);

    const redo = useCallback(() => {
        if (historyIdxRef.current < historyRef.current.length - 1) {
            historyIdxRef.current += 1;
            setSlides(JSON.parse(historyRef.current[historyIdxRef.current]));
            syncHistoryState();
        }
    }, [syncHistoryState]);

    // ── Slide operations ─────────────────────────────────────────────────────
    const updateElement = useCallback((elId, updates) => {
        setSlides(prev => {
            const idx = activeIndexRef.current;
            const next = prev.map((s, i) => {
                if (i !== idx) return s;
                return { ...s, elements: s.elements.map(el => el.id === elId ? { ...el, ...updates } : el) };
            });
            addToHistory(next);
            return next;
        });
    }, [addToHistory]);

    const deleteElement = useCallback((id) => {
        setSlides(prev => {
            const idx = activeIndexRef.current;
            const next = [...prev];
            next[idx] = { ...next[idx], elements: next[idx].elements.filter(el => el.id !== id) };
            addToHistory(next);
            return next;
        });
        setSelectedId(null);
        setEditingId(null);
        setActiveObject(null);
    }, [addToHistory]);

    // ── Keyboard shortcuts (stable — registers once) ─────────────────────────
    const deleteElementRef = useRef(deleteElement);
    useEffect(() => { deleteElementRef.current = deleteElement; }, [deleteElement]);

    useEffect(() => {
        const onKey = (e) => {
            if (isPresentModeRef.current) return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
            if (e.key === 'Delete' || (e.key === 'Backspace' && !editingIdRef.current)) {
                if (selectedIdRef.current && !editingIdRef.current) {
                    e.preventDefault();
                    deleteElementRef.current(selectedIdRef.current);
                }
            }
            if (e.key === 'Escape') {
                if (editingIdRef.current) { setEditingId(null); setActiveObject(null); }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [undo, redo]);

    const addText = useCallback((html = '<p>New Text Box</p>', fontSize = 24) => {
        // Convert HTML preset text to plain text for Fabric
        const plainText = htmlToPlainText(html) || 'New Text Box';
        const el = createTextElement(plainText, 50 + Math.random() * 100, 50 + Math.random() * 100, { fontSize });
        setSlides(prev => {
            const idx = activeIndexRef.current;
            const next = [...prev];
            next[idx] = { ...next[idx], elements: [...next[idx].elements, el] };
            addToHistory(next);
            return next;
        });
        setSelectedId(el.id);
        setEditingId(null);
    }, [addToHistory]);

    const addImage = useCallback((src = '') => {
        const x = 100 + Math.random() * 100;
        const y = 100 + Math.random() * 100;

        const insertEl = (el) => {
            setSlides(prev => {
                const idx = activeIndexRef.current;
                const next = [...prev];
                next[idx] = { ...next[idx], elements: [...next[idx].elements, el] };
                addToHistory(next);
                return next;
            });
            setSelectedId(el.id);
            if (el.content) {
                setSessionImages(prev => prev.includes(el.content) ? prev : [...prev, el.content]);
            }
        };

        if (src) {
            // Load image first to calculate proper dimensions preserving aspect ratio
            const tmpImg = new Image();
            tmpImg.onload = () => {
                const maxW = 500, maxH = 400;
                const ratio = Math.min(maxW / tmpImg.naturalWidth, maxH / tmpImg.naturalHeight, 1);
                const w = Math.round(tmpImg.naturalWidth * ratio);
                const h = Math.round(tmpImg.naturalHeight * ratio);
                insertEl({ ...createImageElement(src, x, y), w, h });
            };
            tmpImg.onerror = () => insertEl(createImageElement(src, x, y));
            tmpImg.src = src;
        } else {
            insertEl(createImageElement('', x, y));
        }
    }, [addToHistory]);

    const addShape = useCallback((shapeType) => {
        const t = themeRef.current;
        const el = createShapeElement(shapeType, 150 + Math.random() * 100, 100 + Math.random() * 100, {
            fill: `${t.accent}33`,
            stroke: t.accent,
        });
        setSlides(prev => {
            const idx = activeIndexRef.current;
            const next = [...prev];
            next[idx] = { ...next[idx], elements: [...next[idx].elements, el] };
            addToHistory(next);
            return next;
        });
        setSelectedId(el.id);
    }, [addToHistory]);

    const addSlide = useCallback(() => {
        const s = defaultSlide(slides.length);
        setSlides(prev => { const n = [...prev]; n.splice(activeIndex + 1, 0, s); return n; });
        setActiveIndex(activeIndex + 1);
        setSelectedId(null);
        setEditingId(null);
        setActiveObject(null);
    }, [activeIndex, slides.length]);

    const deleteSlide = useCallback(() => {
        if (slides.length <= 1) return;
        setSlides(prev => prev.filter((_, i) => i !== activeIndex));
        setActiveIndex(Math.max(0, activeIndex - 1));
        setSelectedId(null);
        setEditingId(null);
        setActiveObject(null);
    }, [activeIndex, slides.length]);

    const prevSlide = useCallback(() => setActiveIndex(i => Math.max(0, i - 1)), []);
    const nextSlide = useCallback(() => setActiveIndex(i => Math.min(slides.length - 1, i + 1)), [slides.length]);

    const selectSlide = useCallback((i) => {
        setActiveIndex(i);
        setSelectedId(null);
        setEditingId(null);
    }, []);

    // ── Stable callback refs for JSX props ───────────────────────────────────
    const handleBack = useCallback(() => navigate('/'), [navigate]);
    const handlePresent = useCallback(() => setIsPresentMode(true), []);
    const handleClosePresent = useCallback(() => setIsPresentMode(false), []);
    const handleSelectElement = useCallback((id) => {
        setSelectedId(id);
        if (!id) { setEditingId(null); setActiveObject(null); }
    }, []);
    const handleStartEdit = useCallback((id) => setEditingId(id), []);
    const handleEditDone = useCallback(() => { setEditingId(null); }, []);
    const handleEditorReady = useCallback((obj) => setActiveObject(obj), []);
    const handleCloseDrawer = useCallback(() => setActiveTool(null), []);

    // ── Export ────────────────────────────────────────────────────────────────
    const exportPPTX = async () => {
        const pres = new pptxgen();
        pres.layout = 'LAYOUT_16x9';
        slides.forEach(s => {
            const pptSlide = pres.addSlide();
            pptSlide.background = { fill: theme.bg.replace('#', '') };
            s.elements.forEach(el => {
                const fX = 10 / SLIDE_W;
                const fY = 5.625 / SLIDE_H;
                const opts = { x: el.x * fX, y: el.y * fY, w: el.w * fX, h: el.h * fY };
                if (el.type === 'text') {
                    const plainText = htmlToPlainText(el.content || '') || (el.content || '');
                    pptSlide.addText(plainText, {
                        ...opts, fontSize: (el.fontSize || 24) * 0.75,
                        fontFace: el.fontFamily || 'Inter',
                        color: (el.color || theme.text).replace('#', ''),
                        valign: 'top', wrap: true,
                    });
                } else if (el.type === 'image' && el.content) {
                    pptSlide.addImage({ data: el.content, ...opts });
                } else if (el.type === 'shape') {
                    const shapeMap = {
                        'rectangle': pres.ShapeType ? pres.ShapeType.rect : 'rect',
                        'rounded-rectangle': pres.ShapeType ? pres.ShapeType.roundRect : 'roundRect',
                        'circle': pres.ShapeType ? pres.ShapeType.ellipse : 'ellipse',
                        'triangle': pres.ShapeType ? pres.ShapeType.triangle : 'triangle',
                        'diamond': pres.ShapeType ? pres.ShapeType.diamond : 'diamond',
                        'star': pres.ShapeType ? pres.ShapeType.star5 : 'star5',
                        'line': pres.ShapeType ? pres.ShapeType.line : 'line',
                        'arrow': pres.ShapeType ? pres.ShapeType.rightArrow : 'rightArrow',
                    };
                    const pptShape = shapeMap[el.shapeType] || shapeMap['rectangle'];
                    try {
                        pptSlide.addShape(pptShape, {
                            ...opts,
                            fill: { color: (el.fill || '#4da6ff').replace('#', '').substring(0, 6) },
                            line: { color: (el.stroke || '#4da6ff').replace('#', ''), width: el.strokeWidth || 2 },
                        });
                    } catch {
                        // Fallback: skip shape if pptxgenjs doesn't support it
                    }
                }
            });
        });
        await pres.writeFile({ fileName: `NeuralNotes-${Date.now()}.pptx` });
    };

async function handleServerGenerate(format) {
    setIsGenerating(true);

    try {
        const response = await fetch('https://lionfish-app-pk8s6.ondigitalocean.app/api/document/export-pdf-slide', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                slides,
                theme,
                format
            }),
        });

        if (!response.ok) {
            throw new Error('Generation failed.');
        }

        const blob = await response.blob(); // ✅ FIX

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'slides.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();

    } catch (err) {
        alert(err.message || 'Failed to generate.');
    } finally {
        setIsGenerating(false);
    }
}

// const handleServerGenerate = async () => {
//     try {
//         const res = await fetch('http://localhost:8080/api/export-pdf', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ slides }) // your slide state
//         });

//         const blob = await res.blob();
//         const url = window.URL.createObjectURL(blob);

//         const a = document.createElement('a');
//         a.href = url;
//         a.download = 'slides.pdf';
//         a.click();

//     } catch (err) {
//         console.error(err);
//     }
// };

    // ── Loading / Error ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--nn-bg-primary)', color: 'var(--nn-text-primary)', gap: 16 }}>
                <div style={{ width: 48, height: 48, border: '3px solid var(--nn-border)', borderTopColor: 'var(--nn-accent-emerald)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: 'var(--nn-text-secondary)', fontSize: 14 }}>Loading presentation...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--nn-bg-primary)', color: 'var(--nn-text-primary)', gap: 16 }}>
                <p style={{ color: 'var(--nn-accent-rose)' }}>{fetchError}</p>
                <button onClick={() => navigate('/')}
                    style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 14, transition: 'all 0.2s',
                        background: 'var(--nn-bg-surface)', border: '1px solid var(--nn-border)',
                        color: 'var(--nn-text-primary)', cursor: 'pointer',
                    }}>
                    Go Home
                </button>
            </div>
        );
    }

    if (!slide) return null;

    const showContextToolbar = true;

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            {isPresentMode && (
                <PresentMode slides={slides} startIndex={activeIndex} theme={theme} onClose={handleClosePresent} />
            )}

            <div className="h-screen flex flex-col overflow-hidden font-sans" style={{ background: 'var(--nn-bg-primary)', color: 'var(--nn-text-primary)', animation: 'editorFadeIn 0.3s ease-out' }}>
                {/* Top Bar */}
                <TopBar
                    onBack={handleBack}
                    activeIndex={activeIndex}
                    totalSlides={slides.length}
                    onPrevSlide={prevSlide}
                    onNextSlide={nextSlide}
                    onPresent={handlePresent}
                    onExportPPTX={exportPPTX}
                    onServerGenerate={handleServerGenerate}
                    isGenerating={isGenerating}
                    isMobile={isMobile}
                    isTablet={isTablet}
                    isMobileOrTablet={isMobileOrTablet}
                />

                {/* Main content area */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Icon Bar (desktop only) */}
                    {!isMobile && (
                        <LeftIconBar
                            activeTool={activeTool}
                            onToolSelect={handleToolSelect}
                            isMobile={false}
                        />
                    )}

                    {/* Left Drawer Panel */}
                    <LeftDrawerPanel
                        activeTool={activeTool}
                        slides={slides}
                        activeIndex={activeIndex}
                        theme={theme}
                        onSelectSlide={selectSlide}
                        onAddSlide={addSlide}
                        onDeleteSlide={deleteSlide}
                        onAddText={addText}
                        onAddImage={addImage}
                        onAddShape={addShape}
                        themes={THEMES}
                        themeIdx={themeIdx}
                        onSelectTheme={setThemeIdx}
                        sessionImages={sessionImages}
                        isMobile={isMobile}
                        onClose={handleCloseDrawer}
                    />

                    {/* Canvas column */}
                    <div className="flex-1 flex flex-col relative overflow-hidden"
                        style={{
                            background: 'var(--nn-bg-primary)',
                            backgroundImage: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.15) 100%)',
                        }}>
                        {/* Context Toolbar (text formatting) */}
                        <FabricContextToolbar
                            visible={showContextToolbar}
                            selectedElement={selectedElement}
                            activeObject={activeObject}
                            theme={theme}
                            onUpdateElement={updateElement}
                            onDeleteElement={deleteElement}
                            directUpdateRef={directUpdateRef}
                            undo={undo}
                            redo={redo}
                            canUndo={canUndo}
                            canRedo={canRedo}
                            isMobile={isMobile}
                        />

                        {/* Canvas area */}
                        <div className={`flex-1 overflow-hidden ${isMobile ? 'p-0' : 'p-1'} flex justify-center items-center`}>
                            <div className="w-full h-full flex items-center justify-center">
                                <FabricCanvas
                                    slide={slide}
                                    theme={theme}
                                    selectedId={selectedId}
                                    editingId={editingId}
                                    onSelectElement={handleSelectElement}
                                    onStartEdit={handleStartEdit}
                                    onEditDone={handleEditDone}
                                    onUpdateElement={updateElement}
                                    onEditorReady={handleEditorReady}
                                    onDirectUpdateRef={directUpdateRef}
                                    isMobile={isMobile}
                                />
                            </div>
                        </div>

                        {/* Status Bar */}
                        <StatusBar
                            activeIndex={activeIndex}
                            totalSlides={slides.length}
                            theme={theme}
                            onPrevSlide={prevSlide}
                            onNextSlide={nextSlide}
                            isMobile={isMobile}
                        />
                    </div>
                </div>

                {/* Mobile bottom icon bar */}
                {isMobile && (
                    <LeftIconBar
                        activeTool={activeTool}
                        onToolSelect={handleToolSelect}
                        isMobile={true}
                    />
                )}
            </div>

            <EditorStyles />
        </>
    );
}
