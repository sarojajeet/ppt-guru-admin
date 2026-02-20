import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import pptxgen from "pptxgenjs";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/* ─────────────────────────────────────────────
   THEME PRESETS
   ───────────────────────────────────────────── */
const THEMES = [
    { name: "Corporate Blue", bg: "#1e3a5f", text: "#ffffff", accent: "#4da6ff", titleBg: "#16304f" },
    { name: "Dark Slate", bg: "#1e293b", text: "#e2e8f0", accent: "#818cf8", titleBg: "#0f172a" },
    { name: "Clean White", bg: "#ffffff", text: "#1e293b", accent: "#3b82f6", titleBg: "#f1f5f9" },
    { name: "Forest Green", bg: "#1a3a2a", text: "#d1fae5", accent: "#34d399", titleBg: "#0f2a1a" },
    { name: "Crimson", bg: "#3b0a0a", text: "#fee2e2", accent: "#f87171", titleBg: "#2b0000" },
    { name: "Midnight Purple", bg: "#1e1040", text: "#ede9fe", accent: "#a78bfa", titleBg: "#150a30" },
    { name: "Warm Amber", bg: "#2d1f00", text: "#fde68a", accent: "#fbbf24", titleBg: "#1a1200" },
    { name: "Ocean Teal", bg: "#083344", text: "#e0f2fe", accent: "#38bdf8", titleBg: "#042030" },
];

const FONTS = [
    "Inter", "Roboto", "Poppins", "Montserrat", "Playfair Display",
    "Oswald", "Source Code Pro", "Georgia", "Arial", "Verdana"
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96];

const SLIDE_W = 960;
const SLIDE_H = 540;

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */
const createTextElement = (content = "New Text Box", x = 100, y = 100) => ({
    id: "el-" + Math.random().toString(36).substr(2, 9),
    type: "text",
    content,
    x, y,
    w: 400, h: 120,
    fontSize: 24,
    fontFamily: "Inter",
    color: "",
    bold: false, italic: false,
    align: "left",
});

const createImageElement = (url = "", x = 200, y = 150) => ({
    id: "el-" + Math.random().toString(36).substr(2, 9),
    type: "image",
    content: url,
    x, y,
    w: 300, h: 200,
});

const createDrawingElement = (dataUrl, x = 0, y = 0, w = SLIDE_W, h = SLIDE_H) => ({
    id: "el-" + Math.random().toString(36).substr(2, 9),
    type: "drawing",
    content: dataUrl,
    x, y, w, h,
});

const defaultSlide = (idx = 0) => ({
    id: "slide-" + Date.now() + idx,
    elements: [createTextElement(`Slide ${idx + 1} Title`, 50, 50)],
});

const parseSlides = (rawData) => {
    if (!rawData) return [defaultSlide(0)];
    const text = typeof rawData === "string" ? rawData : rawData.data || "";
    const parts = text.split(/Slide\s+\d+:/i).filter(Boolean);
    if (parts.length === 0) return [defaultSlide(0)];
    return parts.map((body, idx) => {
        const slide = defaultSlide(idx);
        slide.elements = [
            { ...createTextElement("Slide Title", 50, 50), w: 860, fontSize: 48, bold: true, content: `Slide ${idx + 1}` },
            { ...createTextElement(body.trim(), 50, 150), w: 860, h: 300, fontSize: 24 }
        ];
        return slide;
    });
};

const renderWithLatex = (text) => {
    const parts = text.split(/(\$.*?\$)/g);
    return parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$")) {
            return <InlineMath key={i} math={part.slice(1, -1)} />;
        }
        return <span key={i}>{part}</span>;
    });
};

/* ─────────────────────────────────────────────
   PRESENT MODE OVERLAY
   ───────────────────────────────────────────── */
const PresentMode = ({ slides, activeIndex: initialIndex, theme, onClose, onSaveDrawing }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [tool, setTool] = useState("none"); // none | pen | eraser | laser
    const [penColor, setPenColor] = useState("#ff3b3b");
    const [penSize, setPenSize] = useState(4);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [laserPos, setLaserPos] = useState(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const lastPoint = useRef(null);
    const controlsTimer = useRef(null);
    const slide = slides[currentIndex];

    // Auto-hide controls
    useEffect(() => {
        const show = () => {
            setShowControls(true);
            clearTimeout(controlsTimer.current);
            if (tool === "none") {
                controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
            }
        };
        window.addEventListener("mousemove", show);
        return () => { window.removeEventListener("mousemove", show); clearTimeout(controlsTimer.current); };
    }, [tool]);

    // Keyboard nav
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") nextSlide();
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") prevSlide();
            if (e.key === "Escape") onClose();
            if (e.key === "p") setTool(t => t === "pen" ? "none" : "pen");
            if (e.key === "e") setTool(t => t === "eraser" ? "none" : "eraser");
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [currentIndex]);

    const nextSlide = () => { if (currentIndex < slides.length - 1) { clearCanvas(); setCurrentIndex(i => i + 1); } };
    const prevSlide = () => { if (currentIndex > 0) { clearCanvas(); setCurrentIndex(i => i - 1); } };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: ((clientX - rect.left) / rect.width) * SLIDE_W,
            y: ((clientY - rect.top) / rect.height) * SLIDE_H,
        };
    };

    const startDraw = (e) => {
        if (tool === "none" || tool === "laser") return;
        e.preventDefault();
        setIsDrawing(true);
        lastPoint.current = getPos(e);
        const ctx = canvasRef.current.getContext("2d");
        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    };

    const draw = (e) => {
        if (tool === "laser") {
            const pos = getPos(e);
            setLaserPos(pos);
            return;
        }
        if (!isDrawing || tool === "none") return;
        e.preventDefault();
        const ctx = canvasRef.current.getContext("2d");
        const pos = getPos(e);
        ctx.lineWidth = tool === "eraser" ? penSize * 6 : penSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
        ctx.strokeStyle = penColor;
        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPoint.current = pos;
    };

    const endDraw = () => {
        setIsDrawing(false);
        setLaserPos(null);
        lastPoint.current = null;
    };

    const saveDrawingToSlide = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        // Check if canvas has actual drawings
        const ctx = canvas.getContext("2d");
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const hasDrawing = data.some(v => v !== 0);
        if (!hasDrawing) return;
        onSaveDrawing(currentIndex, dataUrl);
        clearCanvas();
    };

    const TOOL_COLORS = ["#ff3b3b", "#ffcc00", "#00e676", "#40c4ff", "#fff", "#000"];

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[1000] bg-black flex items-center justify-center"
            style={{ cursor: tool === "pen" ? "crosshair" : tool === "eraser" ? "cell" : tool === "laser" ? "none" : "default" }}
        >
            {/* Slide Content */}
            <div className="relative w-full h-full flex items-center justify-center">
                <div
                    className="relative"
                    style={{
                        width: "100vw",
                        height: "56.25vw",
                        maxHeight: "100vh",
                        maxWidth: "177.78vh",
                        background: theme.bg,
                        color: theme.text,
                        overflow: "hidden",
                    }}
                >
                    {/* Slide Elements */}
                    {slide.elements.map((el) => (
                        <div key={el.id} style={{ position: "absolute", left: `${(el.x / SLIDE_W) * 100}%`, top: `${(el.y / SLIDE_H) * 100}%`, width: `${(el.w / SLIDE_W) * 100}%`, height: `${(el.h / SLIDE_H) * 100}%` }}>
                            {el.type === "text" ? (
                                <div style={{
                                    fontSize: `${(el.fontSize / SLIDE_H) * 100}vh`,
                                    fontFamily: el.fontFamily,
                                    color: el.color || theme.text,
                                    fontWeight: el.bold ? "bold" : "normal",
                                    fontStyle: el.italic ? "italic" : "normal",
                                    textAlign: el.align,
                                    whiteSpace: "pre-wrap",
                                    width: "100%", height: "100%",
                                    padding: "0.5%",
                                }}>{renderWithLatex(el.content)}</div>
                            ) : el.type === "image" || el.type === "drawing" ? (
                                <img src={el.content} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            ) : null}
                        </div>
                    ))}

                    {/* Drawing Canvas */}
                    <canvas
                        ref={canvasRef}
                        width={SLIDE_W}
                        height={SLIDE_H}
                        style={{
                            position: "absolute", inset: 0,
                            width: "100%", height: "100%",
                            pointerEvents: tool !== "none" ? "all" : "none",
                            zIndex: 10,
                        }}
                        onMouseDown={startDraw}
                        onMouseMove={draw}
                        onMouseUp={endDraw}
                        onMouseLeave={() => { endDraw(); setLaserPos(null); }}
                        onTouchStart={startDraw}
                        onTouchMove={draw}
                        onTouchEnd={endDraw}
                    />

                    {/* Laser pointer */}
                    {tool === "laser" && laserPos && (
                        <div style={{
                            position: "absolute",
                            left: `${(laserPos.x / SLIDE_W) * 100}%`,
                            top: `${(laserPos.y / SLIDE_H) * 100}%`,
                            transform: "translate(-50%, -50%)",
                            zIndex: 20,
                            pointerEvents: "none",
                        }}>
                            <div style={{
                                width: 20, height: 20,
                                borderRadius: "50%",
                                background: "rgba(255,50,50,0.9)",
                                boxShadow: "0 0 0 6px rgba(255,50,50,0.3), 0 0 20px rgba(255,50,50,0.6)",
                                animation: "pulse 0.8s ease-in-out infinite",
                            }} />
                        </div>
                    )}

                    {/* Laser canvas overlay */}
                    {tool === "laser" && (
                        <div
                            style={{ position: "absolute", inset: 0, zIndex: 9, cursor: "none" }}
                            onMouseMove={draw}
                            onMouseLeave={() => setLaserPos(null)}
                        />
                    )}
                </div>
            </div>

            {/* Slide Counter */}
            <div style={{
                position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.7)", borderRadius: 100, padding: "6px 18px",
                color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "monospace",
                transition: "opacity 0.3s", opacity: showControls ? 1 : 0, zIndex: 100,
            }}>
                {currentIndex + 1} / {slides.length}
            </div>

            {/* Left nav */}
            <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                style={{
                    position: "fixed", left: 16, top: "50%", transform: "translateY(-50%)",
                    background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "white", borderRadius: 12, width: 44, height: 80,
                    fontSize: 22, cursor: "pointer", opacity: showControls && currentIndex > 0 ? 1 : 0,
                    transition: "opacity 0.3s", zIndex: 100, backdropFilter: "blur(8px)",
                }}
            >‹</button>

            {/* Right nav */}
            <button
                onClick={nextSlide}
                disabled={currentIndex === slides.length - 1}
                style={{
                    position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)",
                    background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "white", borderRadius: 12, width: 44, height: 80,
                    fontSize: 22, cursor: "pointer", opacity: showControls && currentIndex < slides.length - 1 ? 1 : 0,
                    transition: "opacity 0.3s", zIndex: 100, backdropFilter: "blur(8px)",
                }}
            >›</button>

            {/* Floating Toolbar */}
            <div style={{
                position: "fixed", bottom: 20, right: 20,
                display: "flex", flexDirection: "column", alignItems: "flex-end",
                gap: 8, zIndex: 200,
                opacity: showControls ? 1 : 0,
                transition: "opacity 0.4s",
                pointerEvents: showControls ? "all" : "none",
            }}>
                {/* Color picker row (show when pen active) */}
                {tool === "pen" && (
                    <div style={{
                        display: "flex", gap: 6, background: "rgba(10,10,20,0.85)",
                        borderRadius: 40, padding: "8px 12px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(12px)",
                        alignItems: "center",
                    }}>
                        {TOOL_COLORS.map(c => (
                            <button key={c} onClick={() => setPenColor(c)} style={{
                                width: 22, height: 22, borderRadius: "50%", background: c,
                                border: penColor === c ? "3px solid white" : "2px solid rgba(255,255,255,0.2)",
                                cursor: "pointer", transition: "transform 0.15s",
                                transform: penColor === c ? "scale(1.25)" : "scale(1)",
                            }} />
                        ))}
                        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)", margin: "0 4px" }} />
                        {[2, 4, 8, 14].map(s => (
                            <button key={s} onClick={() => setPenSize(s)} style={{
                                width: s + 10, height: s + 10, borderRadius: "50%",
                                background: penSize === s ? penColor : "rgba(255,255,255,0.3)",
                                border: penSize === s ? "2px solid white" : "2px solid transparent",
                                cursor: "pointer", transition: "all 0.15s",
                                minWidth: 12, minHeight: 12,
                            }} />
                        ))}
                    </div>
                )}

                {/* Main tool buttons */}
                <div style={{
                    display: "flex", gap: 8,
                    background: "rgba(10,10,20,0.85)",
                    borderRadius: 40, padding: "8px 14px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(16px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    alignItems: "center",
                }}>
                    {/* Pen */}
                    <ToolBtn
                        active={tool === "pen"}
                        onClick={() => setTool(t => t === "pen" ? "none" : "pen")}
                        title="Pen (P)"
                        icon={
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                                <path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
                            </svg>
                        }
                    />

                    {/* Eraser */}
                    <ToolBtn
                        active={tool === "eraser"}
                        onClick={() => setTool(t => t === "eraser" ? "none" : "eraser")}
                        title="Eraser (E)"
                        icon={
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M20 20H7L3 16l10-10 7 7-2.5 2.5" /><path d="M6.5 17.5l5-5" />
                            </svg>
                        }
                    />

                    {/* Laser */}
                    <ToolBtn
                        active={tool === "laser"}
                        onClick={() => setTool(t => t === "laser" ? "none" : "laser")}
                        title="Laser Pointer"
                        icon={
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                                <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12" />
                            </svg>
                        }
                    />

                    {/* Clear */}
                    <ToolBtn
                        onClick={clearCanvas}
                        title="Clear drawings"
                        icon={
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                        }
                        danger
                    />

                    {/* Save drawing to slide */}
                    <ToolBtn
                        onClick={saveDrawingToSlide}
                        title="Save drawing to slide"
                        icon={
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                            </svg>
                        }
                        accent
                    />

                    <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.15)" }} />

                    {/* Minimize/Exit */}
                    <ToolBtn
                        onClick={onClose}
                        title="Exit presentation (Esc)"
                        icon={
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
                            </svg>
                        }
                    />
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};

const ToolBtn = ({ active, onClick, title, icon, danger, accent }) => {
    const bg = active
        ? "rgba(99,102,241,0.8)"
        : danger
            ? "rgba(239,68,68,0.1)"
            : accent
                ? "rgba(34,197,94,0.15)"
                : "transparent";
    const color = active ? "#fff" : danger ? "#f87171" : accent ? "#4ade80" : "rgba(255,255,255,0.7)";
    const border = active ? "1px solid rgba(99,102,241,0.8)" : "1px solid transparent";

    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                width: 38, height: 38, borderRadius: 10,
                background: bg, border, color,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
            }}
            onMouseEnter={e => {
                if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={e => {
                if (!active) e.currentTarget.style.background = bg;
            }}
        >
            {icon}
        </button>
    );
};

/* ─────────────────────────────────────────────
   SLIDE CANVAS (W/ RND)
   ───────────────────────────────────────────── */
const SlideCanvas = ({ slide, theme, onUpdate, selectedElementId, setSelectedElementId, editingElementId, setEditingElementId }) => {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current?.parentElement) return;
            const parent = containerRef.current.parentElement;
            const padding = 64;
            const availW = parent.offsetWidth - padding;
            const availH = parent.offsetHeight - padding;
            const scaleX = availW / SLIDE_W;
            const scaleY = availH / SLIDE_H;
            setScale(Math.min(scaleX, scaleY, 1.2));
        };
        updateScale();
        window.addEventListener("resize", updateScale);
        return () => window.removeEventListener("resize", updateScale);
    }, []);

    const updateElement = (id, updates) => {
        const nextElements = slide.elements.map(el => el.id === id ? { ...el, ...updates } : el);
        onUpdate("elements", nextElements);
    };

    const handleImageUpload = (id, e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => updateElement(id, { content: ev.target.result });
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex-1 flex justify-center items-center overflow-hidden w-full h-full relative">
            <div
                className="relative shadow-2xl rounded-sm"
                style={{
                    width: `${SLIDE_W}px`,
                    height: `${SLIDE_H}px`,
                    background: theme.bg,
                    color: theme.text,
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    flexShrink: 0,
                    overflow: "visible",
                }}
                ref={containerRef}
                onMouseDown={(e) => { if (e.target === containerRef.current) setSelectedElementId(null); }}
            >
                {/* Background fill — ensures slide area is visually defined */}
                <div style={{ position: "absolute", inset: 0, background: theme.bg, borderRadius: 2, zIndex: 0 }} />
                {slide.elements.map((el) => {
                    const isSelected = selectedElementId === el.id;

                    // Shared resize handle styles — large, visible handles that sit outside the element border
                    const resizeHandleStyles = isSelected ? {
                        topLeft: { width: 14, height: 14, background: "#3b82f6", borderRadius: "50%", border: "2px solid #fff", top: -7, left: -7, zIndex: 100, cursor: "nw-resize" },
                        topRight: { width: 14, height: 14, background: "#3b82f6", borderRadius: "50%", border: "2px solid #fff", top: -7, right: -7, zIndex: 100, cursor: "ne-resize" },
                        bottomLeft: { width: 14, height: 14, background: "#3b82f6", borderRadius: "50%", border: "2px solid #fff", bottom: -7, left: -7, zIndex: 100, cursor: "sw-resize" },
                        bottomRight: { width: 14, height: 14, background: "#3b82f6", borderRadius: "50%", border: "2px solid #fff", bottom: -7, right: -7, zIndex: 100, cursor: "se-resize" },
                        top: { height: 10, background: "rgba(59,130,246,0.5)", top: -5, left: 14, right: 14, zIndex: 99, cursor: "n-resize", borderRadius: 4 },
                        bottom: { height: 10, background: "rgba(59,130,246,0.5)", bottom: -5, left: 14, right: 14, zIndex: 99, cursor: "s-resize", borderRadius: 4 },
                        left: { width: 10, background: "rgba(59,130,246,0.5)", left: -5, top: 14, bottom: 14, zIndex: 99, cursor: "w-resize", borderRadius: 4 },
                        right: { width: 10, background: "rgba(59,130,246,0.5)", right: -5, top: 14, bottom: 14, zIndex: 99, cursor: "e-resize", borderRadius: 4 },
                    } : {};

                    if (el.type === "drawing") {
                        return (
                            <Rnd
                                key={el.id}
                                size={{ width: el.w, height: el.h }}
                                position={{ x: el.x, y: el.y }}
                                onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                                onResizeStop={(e, direction, ref, delta, position) => updateElement(el.id, { w: ref.offsetWidth, h: ref.offsetHeight, ...position })}
                                onMouseDown={() => setSelectedElementId(el.id)}
                                enableResizing={isSelected}
                                disableDragging={!isSelected}
                                resizeHandleStyles={resizeHandleStyles}
                                style={{
                                    zIndex: isSelected ? 50 : 10,
                                    overflow: "visible",
                                    outline: isSelected ? "2px solid #3b82f6" : "none",
                                    boxShadow: isSelected ? "0 0 0 1px rgba(59,130,246,0.3)" : "none",
                                }}
                            >
                                <img src={el.content} alt="drawing" style={{ width: "100%", height: "100%", pointerEvents: "none", display: "block" }} />
                            </Rnd>
                        );
                    }
                    return (
                        <Rnd
                            key={el.id}
                            bounds="parent"
                            size={{ width: el.w, height: el.h }}
                            position={{ x: el.x, y: el.y }}
                            onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                            onResizeStop={(e, direction, ref, delta, position) => updateElement(el.id, { w: ref.offsetWidth, h: ref.offsetHeight, ...position })}
                            onMouseDown={() => setSelectedElementId(el.id)}
                            enableResizing={isSelected}
                            disableDragging={!isSelected || editingElementId === el.id}
                            resizeHandleStyles={resizeHandleStyles}
                            style={{
                                zIndex: isSelected ? 50 : 10,
                                overflow: "visible",
                                outline: isSelected ? "2px solid #3b82f6" : "none",
                                boxShadow: isSelected ? "0 4px 20px rgba(59,130,246,0.2)" : "none",
                            }}
                        >
                            {el.type === "text" ? (
                                editingElementId === el.id ? (
                                    <textarea
                                        autoFocus
                                        value={el.content}
                                        onChange={(e) => updateElement(el.id, { content: e.target.value })}
                                        onBlur={() => setEditingElementId(null)}
                                        className="w-full h-full bg-transparent border-none outline-none resize-none p-2 leading-snug overflow-hidden appearance-none"
                                        style={{ fontSize: `${el.fontSize}px`, fontFamily: el.fontFamily, color: el.color || theme.text, fontWeight: el.bold ? "bold" : "normal", fontStyle: el.italic ? "italic" : "normal", textAlign: el.align, background: 'transparent' }}
                                    />
                                ) : (
                                    <div
                                        onDoubleClick={() => setEditingElementId(el.id)}
                                        className="w-full h-full p-2 cursor-text select-none"
                                        style={{ fontSize: `${el.fontSize}px`, fontFamily: el.fontFamily, color: el.color || theme.text, fontWeight: el.bold ? "bold" : "normal", fontStyle: el.italic ? "italic" : "normal", textAlign: el.align, whiteSpace: "pre-wrap" }}
                                    >
                                        {renderWithLatex(el.content)}
                                    </div>
                                )
                            ) : (
                                <div className="w-full h-full relative group">
                                    {el.content ? (
                                        <img src={el.content} alt="" className="w-full h-full object-contain pointer-events-none" />
                                    ) : (
                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-slate-500 hover:border-blue-400 opacity-60">
                                            <span className="text-4xl">🖼️</span>
                                            <span className="text-xs mt-1">Click to Upload</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(el.id, e)} />
                                        </label>
                                    )}
                                </div>
                            )}
                        </Rnd>
                    );
                })}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   TOOLBAR
   ───────────────────────────────────────────── */
const Toolbar = ({ slide, onUpdate, theme, themeIdx, setThemeIdx, addText, addImage, selectedElement, deleteElement, undo, redo, canUndo, canRedo }) => {
    const [activeTab, setActiveTab] = useState("insert");

    const updateEl = (updates) => {
        if (!selectedElement) return;
        const next = slide.elements.map(el => el.id === selectedElement.id ? { ...el, ...updates } : el);
        onUpdate("elements", next);
    };

    return (
        <div className="flex flex-col bg-slate-900 border-b border-slate-700">
            <div className="flex items-center justify-between px-4">
                <div className="flex gap-2 pt-2">
                    {["insert", "style", "design"].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 text-xs font-semibold rounded-t capitalize transition ${activeTab === tab ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"}`}>{tab}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                    <button onClick={undo} disabled={!canUndo} className={`p-1.5 rounded hover:bg-slate-800 transition ${canUndo ? "text-slate-300" : "text-slate-600 cursor-not-allowed"}`} title="Undo (Ctrl+Z)"><span className="text-sm">↩️</span></button>
                    <button onClick={redo} disabled={!canRedo} className={`p-1.5 rounded hover:bg-slate-800 transition ${canRedo ? "text-slate-300" : "text-slate-600 cursor-not-allowed"}`} title="Redo (Ctrl+Y)"><span className="text-sm">↪️</span></button>
                </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 min-h-[48px]">
                {activeTab === "insert" && (
                    <>
                        <button onClick={addText} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition font-medium">+ Text Box</button>
                        <button onClick={addImage} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded transition font-medium">+ Image</button>
                        <div className="h-6 w-px bg-slate-700 mx-2" />
                        {selectedElement && <button onClick={() => deleteElement(selectedElement.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs rounded transition font-medium">🗑️ Delete Selected</button>}
                    </>
                )}
                {activeTab === "style" && selectedElement && selectedElement.type === "text" && (
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                        <select value={selectedElement.fontFamily} onChange={e => updateEl({ fontFamily: e.target.value })} className="bg-slate-700 text-white text-xs rounded p-1.5 outline-none border border-slate-600 focus:border-blue-500">
                            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <select value={selectedElement.fontSize} onChange={e => updateEl({ fontSize: parseInt(e.target.value) })} className="bg-slate-700 text-white text-xs rounded p-1.5 outline-none border border-slate-600 focus:border-blue-500">
                            {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                        </select>
                        <div className="flex bg-slate-700 rounded border border-slate-600">
                            <button onClick={() => updateEl({ bold: !selectedElement.bold })} className={`px-2.5 py-1 text-xs transition ${selectedElement.bold ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-600"}`}>B</button>
                            <button onClick={() => updateEl({ italic: !selectedElement.italic })} className={`px-2.5 py-1 text-xs transition border-x border-slate-600 ${selectedElement.italic ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-600"}`}>I</button>
                            <input type="color" value={selectedElement.color || theme.text} onChange={e => updateEl({ color: e.target.value })} className="w-8 h-full bg-transparent border-0 cursor-pointer p-0.5" />
                        </div>
                        <div className="flex bg-slate-700 rounded border border-slate-600">
                            {["left", "center", "right"].map(a => (
                                <button key={a} onClick={() => updateEl({ align: a })} className={`px-2 py-1 text-xs transition ${selectedElement.align === a ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-600"} ${a === "center" ? "border-x border-slate-600" : ""}`}>
                                    {a === "left" ? "⫷" : a === "center" ? "⫸⫷" : "⫸"}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === "style" && !selectedElement && <span className="text-slate-500 text-xs italic">Select an element to edit its style.</span>}
                {activeTab === "design" && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {THEMES.map((t, i) => (
                            <button key={i} onClick={() => setThemeIdx(i)} className={`flex shrink-0 items-center gap-2 px-2 py-1.5 rounded text-[10px] transition border ${themeIdx === i ? "border-blue-500 bg-slate-700 ring-1 ring-blue-500" : "border-slate-700 bg-slate-900 hover:bg-slate-700"}`}>
                                <div className="w-4 h-4 rounded border border-white/20" style={{ background: t.bg }} />
                                <span className="text-slate-200">{t.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
const PPTEditor = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [slides, setSlides] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [themeIdx, setThemeIdx] = useState(0);
    const [selectedElementId, setSelectedElementId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editingElementId, setEditingElementId] = useState(null);
    const [isPresentMode, setIsPresentMode] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    useEffect(() => {
        if (state) {
            const parsed = parseSlides(state.data || state);
            setSlides(parsed);
            setHistory([JSON.stringify(parsed)]);
            setHistoryIndex(0);
        } else {
            const initial = [defaultSlide(0)];
            setSlides(initial);
            setHistory([JSON.stringify(initial)]);
            setHistoryIndex(0);
        }
    }, [state]);

    const addToHistory = (newSlides) => {
        const serialized = JSON.stringify(newSlides);
        if (historyIndex >= 0 && history[historyIndex] === serialized) return;
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(serialized);
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) { const nextIdx = historyIndex - 1; setSlides(JSON.parse(history[nextIdx])); setHistoryIndex(nextIdx); }
    };
    const redo = () => {
        if (historyIndex < history.length - 1) { const nextIdx = historyIndex + 1; setSlides(JSON.parse(history[nextIdx])); setHistoryIndex(nextIdx); }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isPresentMode) return;
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') { e.preventDefault(); undo(); }
                else if (e.key === 'y') { e.preventDefault(); redo(); }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [historyIndex, history, isPresentMode]);

    const theme = THEMES[themeIdx];
    const slide = slides[activeIndex];
    const selectedElement = slide?.elements.find(el => el.id === selectedElementId);

    const updateSlide = (field, value) => {
        setSlides(prev => {
            const next = [...prev];
            next[activeIndex] = { ...next[activeIndex], [field]: value };
            addToHistory(next);
            return next;
        });
    };

    const updateSlideAtIndex = (idx, field, value) => {
        setSlides(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: value };
            addToHistory(next);
            return next;
        });
    };

    const addText = () => {
        const nextEl = createTextElement("New Text Box", 50, 50);
        updateSlide("elements", [...slide.elements, nextEl]);
        setSelectedElementId(nextEl.id);
    };

    const addImage = () => {
        const nextEl = createImageElement("", 100, 100);
        updateSlide("elements", [...slide.elements, nextEl]);
        setSelectedElementId(nextEl.id);
    };

    const deleteElement = (id) => {
        updateSlide("elements", slide.elements.filter(el => el.id !== id));
        setSelectedElementId(null);
    };

    const addSlide = () => {
        const next = [...slides];
        next.splice(activeIndex + 1, 0, defaultSlide(next.length));
        setSlides(next);
        setActiveIndex(activeIndex + 1);
    };

    const deleteSlide = () => {
        if (slides.length <= 1) return;
        const next = slides.filter((_, i) => i !== activeIndex);
        setSlides(next);
        setActiveIndex(Math.max(0, activeIndex - 1));
    };

    const handleSaveDrawing = (slideIndex, dataUrl) => {
        setSlides(prev => {
            const next = [...prev];
            const drawingEl = createDrawingElement(dataUrl, 0, 0, SLIDE_W, SLIDE_H);
            next[slideIndex] = { ...next[slideIndex], elements: [...next[slideIndex].elements, drawingEl] };
            addToHistory(next);
            return next;
        });
    };

    const exportPPT = async () => {
        const pres = new pptxgen();
        pres.layout = "LAYOUT_16x9";
        slides.forEach(s => {
            const pptSlide = pres.addSlide();
            pptSlide.background = { fill: theme.bg.replace("#", "") };
            s.elements.forEach(el => {
                const factorX = 10 / 960;
                const factorY = 5.625 / 540;
                const options = { x: el.x * factorX, y: el.y * factorY, w: el.w * factorX, h: el.h * factorY };
                if (el.type === "text") {
                    pptSlide.addText(el.content, { ...options, fontSize: el.fontSize * 0.75, fontFace: el.fontFamily, color: (el.color || theme.text).replace("#", ""), bold: el.bold, italic: el.italic, align: el.align, valign: "top" });
                } else if ((el.type === "image" || el.type === "drawing") && el.content) {
                    pptSlide.addImage({ data: el.content, ...options });
                }
            });
        });
        pres.writeFile({ fileName: `Presentation-${Date.now()}.pptx` });
    };

    if (slides.length === 0) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white">Loading...</div>;

    return (
        <>
            {isPresentMode && (
                <PresentMode
                    slides={slides}
                    activeIndex={activeIndex}
                    theme={theme}
                    onClose={() => setIsPresentMode(false)}
                    onSaveDrawing={handleSaveDrawing}
                />
            )}

            <div className="h-screen flex flex-col bg-slate-950 overflow-hidden text-slate-100 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shadow-md z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white">
                            <span className="text-xl">←</span>
                        </button>
                        <div>
                            <h1 className="text-sm font-bold tracking-tight">Presentation Guru</h1>
                            <p className="text-[10px] text-slate-500 font-medium">{slides.length} slides • {theme.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Present Button */}
                        <button
                            onClick={() => setIsPresentMode(true)}
                            className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-lg active:scale-95"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            Present
                        </button>

                        <button onClick={() => { setIsSaving(true); setTimeout(() => setIsSaving(false), 1500); }} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${isSaving ? "bg-green-600 shadow-[0_0_15px_rgba(22,163,74,0.4)]" : "bg-slate-800 hover:bg-slate-700 active:scale-95"}`}>
                            {isSaving ? "✓ Saved" : "Save Draft"}
                        </button>
                        <button onClick={exportPPT} className="px-5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-lg active:scale-95">
                            Download PPTX
                        </button>
                    </div>
                </div>

                <Toolbar
                    slide={slide}
                    onUpdate={updateSlide}
                    theme={theme}
                    themeIdx={themeIdx}
                    setThemeIdx={setThemeIdx}
                    addText={addText}
                    addImage={addImage}
                    selectedElement={selectedElement}
                    deleteElement={deleteElement}
                    undo={undo}
                    redo={redo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                />

                <div className="flex flex-1 overflow-hidden">
                    {/* Thumbnails */}
                    <div className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col z-10">
                        <div className="p-3">
                            <button onClick={addSlide} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded border border-slate-700 transition flex items-center justify-center gap-2">
                                <span>+</span> New Slide
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3 custom-scrollbar">
                            {slides.map((s, i) => (
                                <div key={s.id} onClick={() => { setActiveIndex(i); setSelectedElementId(null); }} className={`relative group cursor-pointer transition-all duration-200 ${i === activeIndex ? "scale-[1.03]" : "opacity-60 hover:opacity-100"}`}>
                                    <span className={`absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r bg-blue-500 transition-opacity ${i === activeIndex ? "opacity-100" : "opacity-0"}`} />
                                    <div className={`aspect-video rounded border overflow-hidden transition-colors ${i === activeIndex ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-700 hover:border-slate-500"}`} style={{ background: theme.bg }}>
                                        <div className="w-full h-full relative" style={{ transform: 'scale(0.2)', transformOrigin: 'top left', width: '500%', height: '500%' }}>
                                            {s.elements.map(el => (
                                                <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h }}>
                                                    {el.type === 'text' && <div style={{ color: el.color || theme.text, fontSize: el.fontSize, fontWeight: el.bold ? 'bold' : 'normal' }}>{el.content}</div>}
                                                    {(el.type === 'image' || el.type === 'drawing') && el.content && <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-1.5 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{i + 1}</span>
                                        {slides.length > 1 && i === activeIndex && (
                                            <button onClick={(e) => { e.stopPropagation(); deleteSlide(); }} className="p-1 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">✕</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="flex-1 flex flex-col bg-slate-950/50 relative overflow-hidden">
                        <div className="flex-1 overflow-auto p-4 flex justify-center items-center custom-scrollbar">
                            <div className="w-full h-full flex items-center justify-center">
                                {slide && (
                                    <SlideCanvas
                                        slide={slide}
                                        theme={theme}
                                        onUpdate={updateSlide}
                                        selectedElementId={selectedElementId}
                                        setSelectedElementId={setSelectedElementId}
                                        editingElementId={editingElementId}
                                        setEditingElementId={setEditingElementId}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="h-8 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 text-[10px] font-medium text-slate-500">
                            <div className="flex items-center gap-4">
                                <span>SLIDE {activeIndex + 1} OF {slides.length}</span>
                                <span className="uppercase tracking-widest">{theme.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedElement ? (
                                    <span className="text-blue-400 uppercase tracking-widest">SELECTED: {selectedElement.type} ({Math.round(selectedElement.w)} x {Math.round(selectedElement.h)})</span>
                                ) : <span>NO SELECTION</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
                `}</style>
            </div>
        </>
    );
};

export default PPTEditor;