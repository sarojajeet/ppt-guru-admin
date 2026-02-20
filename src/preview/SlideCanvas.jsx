import { useState, useRef, useCallback } from "react";

const STICKERS = ["✅", "❌", "⭐", "🔥", "💡", "🎓", "🧠", "🏆"];

const defaultSlide = () => ({
    id: Date.now(),
    headerText: "NexGen v7",
    headerBgColor: "#1a1a2e",
    headerTextColor: "#e2b96f",
    logoUrl: null,
    logoPosition: "left",
    stickers: [],
    equation: "",
    qrValue: "",
    qrDataUrl: null,
    bgColor: "#0f0f1a",
    textColor: "#ffffff",
});

function SlideCanvas({ slide, scale = 1 }) {
    return (
        <div
            style={{
                width: 720,
                height: 405,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                background: slide.bgColor,
                position: "relative",
                overflow: "hidden",
                fontFamily: "'Courier New', monospace",
                border: "2px solid #2a2a4a",
            }}
        >
            {/* Header Bar */}
            <div
                style={{
                    background: slide.headerBgColor,
                    color: slide.headerTextColor,
                    padding: "12px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: 56,
                    borderBottom: `2px solid ${slide.headerTextColor}33`,
                }}
            >
                {slide.logoPosition === "left" && slide.logoUrl && (
                    <img src={slide.logoUrl} alt="logo" style={{ height: 36, marginRight: 12 }} />
                )}
                <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, flex: 1 }}>
                    {slide.headerText || ""}
                </span>
                {slide.logoPosition === "right" && slide.logoUrl && (
                    <img src={slide.logoUrl} alt="logo" style={{ height: 36, marginLeft: 12 }} />
                )}
            </div>

            {/* Stickers */}
            {slide.stickers.map((s, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        left: s.x,
                        top: s.y,
                        fontSize: 32,
                        cursor: "default",
                        userSelect: "none",
                    }}
                >
                    {s.emoji}
                </div>
            ))}

            {/* Equation */}
            {slide.equation && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 60,
                        left: 20,
                        color: slide.textColor,
                        fontFamily: "serif",
                        fontSize: 18,
                        background: "#ffffff10",
                        padding: "8px 16px",
                        borderRadius: 4,
                        border: "1px solid #ffffff20",
                    }}
                >
                    {slide.equation}
                </div>
            )}

            {/* QR Code */}
            {slide.qrDataUrl && (
                <div style={{ position: "absolute", bottom: 20, right: 20 }}>
                    <img src={slide.qrDataUrl} alt="QR" style={{ width: 80, height: 80 }} />
                </div>
            )}

            {/* Grid overlay for aesthetics */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
            }} />
        </div>
    );
}

export default function NexGenV7() {
    const [slides, setSlides] = useState([defaultSlide()]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [panel, setPanel] = useState(null); // null | 'header' | 'sticker' | 'equation' | 'qr'
    const [equationInput, setEquationInput] = useState("x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}");
    const [qrInput, setQrInput] = useState("");
    const [draggingSticker, setDraggingSticker] = useState(null);
    const canvasRef = useRef(null);
    const fileRef = useRef(null);

    const slide = slides[currentIdx];

    const updateSlide = (patch) => {
        setSlides(prev => prev.map((s, i) => i === currentIdx ? { ...s, ...patch } : s));
    };

    const addSlide = () => {
        const ns = defaultSlide();
        setSlides(prev => [...prev, ns]);
        setCurrentIdx(slides.length);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => updateSlide({ logoUrl: ev.target.result });
        reader.readAsDataURL(file);
    };

    // Simple QR generation using a public API (encoded as data URL via canvas)
    const generateQR = async () => {
        if (!qrInput) return;
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrInput)}`;
        updateSlide({ qrValue: qrInput, qrDataUrl: url });
        setPanel(null);
    };

    const insertSticker = (emoji) => {
        const newSticker = { emoji, x: 80 + Math.random() * 400, y: 80 + Math.random() * 200 };
        updateSlide({ stickers: [...slide.stickers, newSticker] });
    };

    const insertEquation = () => {
        updateSlide({ equation: equationInput });
        setPanel(null);
    };

    const sidebarBtn = (label, id) => (
        <button
            onClick={() => setPanel(panel === id ? null : id)}
            style={{
                display: "flex", alignItems: "center", gap: 8,
                background: panel === id ? "#e2b96f" : "transparent",
                color: panel === id ? "#0f0f1a" : "#a0a0c0",
                border: "none", padding: "10px 16px", width: "100%",
                cursor: "pointer", fontSize: 13, fontWeight: 600,
                letterSpacing: 1, textAlign: "left",
                borderBottom: "1px solid #1a1a3a",
                transition: "all 0.15s",
            }}
        >
            {label}
        </button>
    );

    const inputStyle = {
        background: "#0f0f1a", border: "1px solid #2a2a4a", color: "#e0e0ff",
        padding: "8px 12px", borderRadius: 4, width: "100%", fontSize: 13,
        fontFamily: "'Courier New', monospace", boxSizing: "border-box",
    };

    const btnStyle = (variant = "primary") => ({
        background: variant === "primary" ? "#e2b96f" : "#1a1a3a",
        color: variant === "primary" ? "#0f0f1a" : "#a0a0c0",
        border: "none", padding: "8px 16px", borderRadius: 4,
        cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: 1,
    });

    return (
        <div style={{
            display: "flex", flexDirection: "column", height: "100vh",
            background: "#09090f", color: "#e0e0ff",
            fontFamily: "'Courier New', monospace",
        }}>
            {/* Top Bar */}
            <div style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "0 24px", height: 52,
                background: "#0f0f1a", borderBottom: "2px solid #1a1a3a",
            }}>
                <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: 3, color: "#e2b96f" }}>
                    NexGen v7
                </span>
                <div style={{ flex: 1 }} />
                <button style={btnStyle("secondary")}>Header Branding</button>
                <button style={btnStyle("secondary")}>▶ Present</button>
                <button style={btnStyle("secondary")}>PDF</button>
                <button style={btnStyle("secondary")}>PPTX</button>
                <button style={{ ...btnStyle("primary"), marginLeft: 8 }}>SLIDES</button>
            </div>

            {/* Main Layout */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Left Sidebar */}
                <div style={{ width: 200, background: "#0f0f1a", borderRight: "2px solid #1a1a3a", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "12px 16px", fontSize: 10, letterSpacing: 2, color: "#4a4a6a", borderBottom: "1px solid #1a1a3a" }}>
                        TOOLS
                    </div>
                    {sidebarBtn("HEADER BRANDING", "header")}
                    {sidebarBtn("STICKERS", "sticker")}
                    {sidebarBtn("INSERT EQUATION", "equation")}
                    {sidebarBtn("GENERATE QR CODE", "qr")}

                    {/* Panel Content */}
                    <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                        {panel === "header" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <div style={{ fontSize: 10, letterSpacing: 2, color: "#6060a0", marginBottom: 4 }}>HEADER TEXT</div>
                                <input
                                    style={inputStyle}
                                    value={slide.headerText}
                                    onChange={e => updateSlide({ headerText: e.target.value })}
                                    placeholder="Header text..."
                                />
                                <div style={{ fontSize: 10, letterSpacing: 2, color: "#6060a0", marginTop: 4 }}>LOGO</div>
                                <button onClick={() => fileRef.current.click()} style={btnStyle("secondary")}>
                                    Upload Logo
                                </button>
                                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button onClick={() => updateSlide({ logoPosition: "left" })} style={{ ...btnStyle(slide.logoPosition === "left" ? "primary" : "secondary"), flex: 1, fontSize: 11 }}>Left</button>
                                    <button onClick={() => updateSlide({ logoPosition: "right" })} style={{ ...btnStyle(slide.logoPosition === "right" ? "primary" : "secondary"), flex: 1, fontSize: 11 }}>Right</button>
                                    <button onClick={() => updateSlide({ logoUrl: null })} style={{ ...btnStyle("secondary"), flex: 1, fontSize: 11 }}>Clear</button>
                                </div>
                                <div style={{ fontSize: 10, letterSpacing: 2, color: "#6060a0", marginTop: 4 }}>BG COLOR</div>
                                <input type="color" value={slide.headerBgColor} onChange={e => updateSlide({ headerBgColor: e.target.value })}
                                    style={{ width: "100%", height: 32, background: "none", border: "1px solid #2a2a4a", borderRadius: 4, cursor: "pointer" }} />
                                <div style={{ fontSize: 10, letterSpacing: 2, color: "#6060a0" }}>TEXT COLOR</div>
                                <input type="color" value={slide.headerTextColor} onChange={e => updateSlide({ headerTextColor: e.target.value })}
                                    style={{ width: "100%", height: 32, background: "none", border: "1px solid #2a2a4a", borderRadius: 4, cursor: "pointer" }} />
                            </div>
                        )}
                        {panel === "sticker" && (
                            <div>
                                <div style={{ fontSize: 10, letterSpacing: 2, color: "#6060a0", marginBottom: 8 }}>CLICK TO ADD</div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                                    {STICKERS.map(s => (
                                        <button key={s} onClick={() => insertSticker(s)} style={{
                                            fontSize: 24, background: "#1a1a3a", border: "1px solid #2a2a4a",
                                            borderRadius: 6, padding: 8, cursor: "pointer",
                                            transition: "transform 0.1s",
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                                            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                        >{s}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {panel === "equation" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ fontSize: 10, letterSpacing: 2, color: "#6060a0" }}>LaTeX EQUATION</div>
                                <textarea
                                    style={{ ...inputStyle, height: 80, resize: "vertical" }}
                                    value={equationInput}
                                    onChange={e => setEquationInput(e.target.value)}
                                />
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button onClick={insertEquation} style={{ ...btnStyle("primary"), flex: 1 }}>Insert</button>
                                    <button onClick={() => setPanel(null)} style={{ ...btnStyle("secondary"), flex: 1 }}>Cancel</button>
                                </div>
                            </div>
                        )}
                        {panel === "qr" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ fontSize: 10, letterSpacing: 2, color: "#6060a0" }}>URL / TEXT</div>
                                <input
                                    style={inputStyle}
                                    value={qrInput}
                                    onChange={e => setQrInput(e.target.value)}
                                    placeholder="https://..."
                                />
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button onClick={generateQR} style={{ ...btnStyle("primary"), flex: 1 }}>Generate</button>
                                    <button onClick={() => setPanel(null)} style={{ ...btnStyle("secondary"), flex: 1 }}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Slide counter */}
                    <div style={{
                        padding: "10px 16px", borderTop: "1px solid #1a1a3a",
                        fontSize: 12, color: "#6060a0", letterSpacing: 1,
                    }}>
                        {currentIdx + 1}/{slides.length}
                    </div>
                </div>

                {/* Canvas Area */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {/* Toolbar row */}
                    <div style={{
                        padding: "8px 16px", borderBottom: "1px solid #1a1a3a",
                        display: "flex", gap: 10, alignItems: "center",
                        background: "#0d0d1a",
                    }}>
                        <button onClick={addSlide} style={btnStyle("secondary")}>+ New Slide</button>
                        <div style={{ fontSize: 10, letterSpacing: 2, color: "#3a3a6a" }}>
                            HEADER BRANDING
                        </div>
                    </div>

                    {/* Slide canvas */}
                    <div style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                        background: "radial-gradient(ellipse at center, #131328 0%, #09090f 100%)",
                        overflow: "auto", padding: 32,
                    }}>
                        <div
                            ref={canvasRef}
                            style={{ position: "relative", width: 720, height: 405, boxShadow: "0 0 60px #000a, 0 0 0 1px #2a2a4a" }}
                            onClick={(e) => {
                                // Place sticker on click if sticker panel open
                            }}
                        >
                            <SlideCanvas slide={slide} scale={1} />
                        </div>
                    </div>

                    {/* Slide strip */}
                    <div style={{
                        height: 90, borderTop: "2px solid #1a1a3a",
                        display: "flex", gap: 8, padding: "8px 16px",
                        background: "#0d0d1a", overflowX: "auto", alignItems: "center",
                    }}>
                        {slides.map((s, i) => (
                            <div
                                key={s.id}
                                onClick={() => setCurrentIdx(i)}
                                style={{
                                    width: 120, height: 68, flexShrink: 0, cursor: "pointer",
                                    border: `2px solid ${i === currentIdx ? "#e2b96f" : "#2a2a4a"}`,
                                    borderRadius: 4, overflow: "hidden", position: "relative",
                                    transition: "border-color 0.15s",
                                }}
                            >
                                <div style={{ transform: "scale(0.1667)", transformOrigin: "top left", width: 720, height: 405, pointerEvents: "none" }}>
                                    <SlideCanvas slide={s} />
                                </div>
                                <div style={{
                                    position: "absolute", bottom: 2, right: 4,
                                    fontSize: 8, color: "#4a4a6a", letterSpacing: 1,
                                }}>{i + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}