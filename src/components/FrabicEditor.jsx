import React, { useState, useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { Plus, Trash2, Check, Loader2 } from 'lucide-react';
import pptxgen from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import * as fabric from 'fabric';
import { useLocation, useParams } from 'react-router-dom';
import { getDocument } from '@/services/api';
import { useSlideStore } from '@/store/useSlideStore';
import { PropertiesPanel } from './PropertiesPanel';
import { useFabric } from '@/hooks/useFabric';

// ─────────────────────────────────────────────────────────────
// HELPER: Convert AI-generated content → Fabric-renderable slides
// ─────────────────────────────────────────────────────────────

/**
 * Parses whatever structure comes back from backend `doc.content`
 * and converts it into an array of slide descriptor objects.
 *
 * Supported content shapes from backend:
 *   A) Array of slides:   [{ title, body, bullets, background }, ...]
 *   B) Object with slides key: { slides: [...] }
 *   C) Object with sections key: { title, sections: [{ heading, text }, ...] }
 *   D) Plain string (markdown / text) — split by "---" separators
 */

const extractQuestionAndOptions = (text) => {
    if (!text) return { body: text, bullets: [] };

    const optionStart = text.search(/[A-D]\)/);

    if (optionStart === -1) {
        return { body: text, bullets: [] };
    }

    const question = text.slice(0, optionStart).trim();
    const optionsText = text.slice(optionStart).trim();

    const options = optionsText
        .split(/(?=[A-D]\))/)
        .map(o => o.trim())
        .filter(Boolean);

    return { body: question, bullets: options };
};


const parseContentToSlides = (content) => {
    if (!content) return [];
    console.log("content to parsedType", content)
    // Already structured
    if (Array.isArray(content)) return content.map(normalizeSlideDescriptor);

    if (typeof content === 'object') {
        if (Array.isArray(content.slides)) return content.slides.map(normalizeSlideDescriptor);
        if (Array.isArray(content.sections)) {
            return content.sections.map((sec, i) =>
                normalizeSlideDescriptor({
                    title: sec.heading || `Slide ${i + 1}`,
                    body: sec.text || '',
                })
            );
        }
        return [normalizeSlideDescriptor(content)];
    }

    if (typeof content === 'string') {
        // 🔹 Split by "Slide X:"
        const slideBlocks = content
            .split(/Slide\s+\d+:/i)
            .map(s => s.trim())
            .filter(Boolean);

        return slideBlocks.map((block, i) => {
            // Extract image markdown
            const imageMatches = [...block.matchAll(/!\[\]\((.*?)\)/g)];
            const images = imageMatches.map(m => m[1]);

            // Remove image markdown from text
            let cleanText = block.replace(/!\[\]\(.*?\)/g, '').trim();

            const lines = cleanText.split('\n').filter(l => l.trim());

            const title = lines[0] || `Slide ${i + 1}`;
            const rawBody = lines.slice(1).join('\n');

            const { body, bullets } = extractQuestionAndOptions(rawBody);

            return normalizeSlideDescriptor({
                title,
                body,
                bullets,
                images,
            });
        });
    }

    return [];
};
/**
 * Normalise any slide object into a consistent shape:
 * { title, body, bullets[], bgColor }
 */
const normalizeSlideDescriptor = (raw = {}) => ({
    title: raw.title || raw.heading || raw.name || 'Untitled',
    body: raw.body || raw.text || raw.content || raw.description || '',
    bullets: Array.isArray(raw.bullets) ? raw.bullets
        : Array.isArray(raw.points) ? raw.points
            : Array.isArray(raw.items) ? raw.items
                : [],
    images: Array.isArray(raw.images) ? raw.images : [],   // ✅ ADD THIS

    bgColor: raw.background || raw.bgColor || raw.backgroundColor || '#1e1e2e',
});



/**
 * Takes a slide descriptor and builds a fabric.js JSON object
 * that can be loaded with canvas.loadFromJSON()
 */
const buildFabricSlideJSON = (slide, canvasWidth = 960, canvasHeight = 540) => {
    const objects = [];
    console.log(slide);

    // ── Background rect (fabric background color is set separately,
    //    but we add a rect so it shows in the objects list too)
    // We skip adding a separate rect and instead use the `background` key.

    // ── Title
    if (slide.title) {
        objects.push({
            type: 'textbox',
            version: '5.3.0',
            left: 500,
            top: 50,
            width: canvasWidth - 120,
            height: 80,
            text: slide.title,
            fontSize: 38,
            fontWeight: 'bold',
            fill: '#ffffff',
            fontFamily: 'Arial',
            textAlign: 'left',
            selectable: true,
        });
    }

    // ── Body text (if no bullets)
    // ── Question text
    if (slide.body) {
        objects.push({
            type: 'textbox',
            version: '5.3.0',
            left: 500,
            top: 200,
            width: canvasWidth - 120,
            height: 150,
            text: slide.body,
            fontSize: 22,
            fill: '#e0e0e0',
            fontFamily: 'Arial',
            textAlign: 'left',
            selectable: true,
        });
    }
    if (slide.images?.length) {
        slide.images.forEach((imgUrl, index) => {
            objects.push({
                type: 'image',
                version: '5.3.0',
                left: 500,
                top: 150 + index * 180,
                scaleX: 0.5,
                scaleY: 0.5,
                src: imgUrl,
                selectable: true,
            });
        });
    }
    // ── Bullet points
    // ── Options (A, B, C, D)
    if (slide.bullets.length > 0) {
        const bulletText = slide.bullets.join('\n');
        objects.push({
            type: 'textbox',
            version: '5.3.0',
            left: 500,
            top: 360,
            width: canvasWidth - 160,
            height: canvasHeight - 400,
            text: bulletText,
            fontSize: 20,
            fill: '#ffffff',
            fontFamily: 'Arial',
            textAlign: 'left',
            lineHeight: 1.8,
            selectable: true,
        });
    }

    return {
        version: '5.3.0',
        objects,
        background: slide.bgColor || '#1e1e2e',
    };
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

function FabricEditor() {
    const {
        canvasRef, activeObject, addRect, addCircle, addText,
        deleteObject, updateProperty, moveLayer, handleImageUpload,
        downloadCanvas, addMathEquation, undo, redo,
        canvasBgColor, updateBackgroundColor, clearCanvas,
        loadSlideJSON,   // ✅ you need to expose this from useFabric (see note below)
    } = useFabric();

    const {
        slides, activeSlideId, addSlide,
        setActiveSlide, deleteSlide,
        setSlides,       // ✅ expose a setter so we can bulk-insert slides
    } = useSlideStore();

    const location = useLocation();
    const { documentId } = useParams();
    console.log(documentId)

    const [isExporting, setIsExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState("");
    const [isLoadingDoc, setIsLoadingDoc] = useState(false);

    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [selectedPdfSlides, setSelectedPdfSlides] = useState([]);

    // ─── Load document content on mount ──────────────────────
    useEffect(() => {
        const loadDocumentContent = async () => {
            // Priority 1: data already passed via navigation state
            const stateData = location.state;

            let rawContent = null;

            if (stateData?.data) {
                // generateFinalDocument returned { success, format, data }
                rawContent = stateData.data;
            } else if (stateData && typeof stateData === 'object' && !stateData.documentId) {
                // Whole state IS the content
                rawContent = stateData;
            }

            // Priority 2: fetch fresh from backend using documentId
            if (!rawContent && documentId) {
                setIsLoadingDoc(true);
                try {
                    const res = await getDocument(documentId);
                    const doc = res.data;
                    rawContent = doc.content || doc.aiContent || null;
                } catch (err) {
                    console.error("Failed to fetch document for PPT editor:", err);
                } finally {
                    setIsLoadingDoc(false);
                }
            }

            if (!rawContent) return;

            // Parse content → slide descriptors → fabric JSON → slide store
            const slideDescriptors = parseContentToSlides(rawContent);

            if (slideDescriptors.length === 0) return;

            const newSlides = slideDescriptors.map((desc, i) => ({
                id: `loaded-slide-${i}-${Date.now()}`,
                fabricData: buildFabricSlideJSON(desc),
                thumbnail: null,
            }));

            // Push all slides into the store (replaces existing empty slides)
            setSlides(newSlides);

            // Activate the first slide — the canvas will pick it up via
            // the existing activeSlideId watcher in useFabric / useSlideStore
            if (newSlides.length > 0) {
                setActiveSlide(newSlides[0].id);
            }
        };

        loadDocumentContent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [documentId]);

    // ─── PPTX EXPORT ─────────────────────────────────────────
    const downloadPPTX = async () => {
        setIsExporting(true);
        setExportMessage("Generating Editable PPTX...");
        try {
            const pptx = new pptxgen();
            pptx.layout = 'LAYOUT_16x9';
            const PX_TO_INCH = 96;

            for (let i = 0; i < slides.length; i++) {
                const slideData = slides[i];
                const pptSlide = pptx.addSlide();

                if (slideData.fabricData?.background) {
                    let bgColor = typeof slideData.fabricData.background === 'string'
                        ? slideData.fabricData.background.replace('#', '')
                        : 'FFFFFF';
                    pptSlide.background = { color: bgColor };
                }

                if (slideData.fabricData?.objects) {
                    for (const obj of slideData.fabricData.objects) {
                        const type = (obj.type || '').toLowerCase();
                        const x = (obj.left || 0) / PX_TO_INCH;
                        const y = (obj.top || 0) / PX_TO_INCH;
                        const w = ((obj.width || 0) * (obj.scaleX || 1)) / PX_TO_INCH;
                        const h = ((obj.height || 0) * (obj.scaleY || 1)) / PX_TO_INCH;
                        const rot = obj.angle || 0;

                        let fillStr = 'FFFFFF';
                        if (typeof obj.fill === 'string' && obj.fill.startsWith('#')) {
                            fillStr = obj.fill.substring(1);
                        }
                        const opacity = obj.opacity !== undefined ? obj.opacity : 1;
                        const transparency = Math.round(100 - (opacity * 100));

                        if (type === 'rect') {
                            pptSlide.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: fillStr, transparency }, rotate: rot });
                        } else if (type === 'circle') {
                            pptSlide.addShape(pptx.ShapeType.ellipse, { x, y, w, h, fill: { color: fillStr, transparency }, rotate: rot });
                        } else if (type.includes('text')) {
                            const textContent = obj.text ? String(obj.text) : ' ';
                            pptSlide.addText(textContent, {
                                x, y,
                                w: w > 0 ? w * 1.5 : 5,
                                h: h > 0 ? h * 1.5 : 2,
                                fontSize: (obj.fontSize || 30) * 0.75,
                                color: fillStr,
                                bold: obj.fontWeight === 'bold' || obj.fontWeight >= 700,
                                italic: obj.fontStyle === 'italic',
                                underline: obj.underline ? { style: 'single' } : false,
                                align: obj.textAlign || 'left',
                                valign: 'top',
                                rotate: rot,
                                transparency,
                                wrap: true,
                                autoFit: true,
                            });
                        } else if (type === 'image' && obj.src) {
                            pptSlide.addImage({ data: obj.src, x, y, w, h, rotate: rot });
                        }
                    }
                }
            }

            await pptx.writeFile({ fileName: `Quantum-Editable-${Date.now()}.pptx` });
        } catch (error) {
            console.error(error);
            alert("PPTX Export Error!");
        } finally {
            setIsExporting(false);
        }
    };

    // ─── PDF MODAL ────────────────────────────────────────────
    const handleOpenPdfModal = () => {
        setSelectedPdfSlides(slides.map(s => s.id));
        setIsPdfModalOpen(true);
    };

    const togglePdfSelection = (id) => {
        setSelectedPdfSlides(prev =>
            prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
        );
    };

    const downloadSelectedPDF = async () => {
        if (selectedPdfSlides.length === 0) {
            alert("Please select at least one slide!");
            return;
        }

        setIsPdfModalOpen(false);
        setIsExporting(true);
        setExportMessage("Generating High-Quality PDF...");

        try {
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540] });
            const hiddenCanvasEl = document.createElement('canvas');
            hiddenCanvasEl.width = 960;
            hiddenCanvasEl.height = 540;
            const staticCanvas = new fabric.StaticCanvas(hiddenCanvasEl);

            const slidesToExport = slides.filter(s => selectedPdfSlides.includes(s.id));

            for (let i = 0; i < slidesToExport.length; i++) {
                const slideData = slidesToExport[i];
                if (i > 0) pdf.addPage([960, 540], 'landscape');

                if (slideData.fabricData) {
                    await staticCanvas.loadFromJSON(slideData.fabricData);
                    staticCanvas.requestRenderAll();
                    await new Promise(resolve => setTimeout(resolve, 200));
                    const hdImage = staticCanvas.toDataURL({ format: 'png', multiplier: 2 });
                    pdf.addImage(hdImage, 'PNG', 0, 0, 960, 540);
                }
            }

            staticCanvas.dispose();
            pdf.save(`Quantum-Notes-${Date.now()}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("PDF export failed.");
        } finally {
            setIsExporting(false);
        }
    };

    // ─── RENDER ───────────────────────────────────────────────
    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">

            {/* Loading overlay while fetching document */}
            {isLoadingDoc && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-[200] backdrop-blur-sm">
                    <Loader2 size={48} className="animate-spin text-indigo-400 mb-4" />
                    <p className="text-white font-semibold text-lg">Loading Presentation...</p>
                    <p className="text-gray-400 text-sm mt-1">Fetching content from server</p>
                </div>
            )}

            {/* PDF SELECTION MODAL */}
            {isPdfModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 w-[700px] max-w-[90%] flex flex-col max-h-[90vh]">
                        <h2 className="text-xl font-bold text-white mb-2">Select Pages for PDF</h2>
                        <p className="text-gray-400 text-sm mb-4">Choose the slides you want to include in your exported PDF document.</p>

                        <div className="flex gap-2 mb-4">
                            <button onClick={() => setSelectedPdfSlides(slides.map(s => s.id))} className="text-xs font-medium bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-all">Select All</button>
                            <button onClick={() => setSelectedPdfSlides([])} className="text-xs font-medium bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-all">Deselect All</button>
                            <span className="ml-auto text-xs text-indigo-400 font-bold self-center bg-indigo-500/10 px-3 py-1 rounded-full">
                                {selectedPdfSlides.length} Selected
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar p-2 flex-1">
                            {slides.map((slide, i) => (
                                <div
                                    key={slide.id}
                                    onClick={() => togglePdfSelection(slide.id)}
                                    className={`relative border-2 rounded-lg cursor-pointer overflow-hidden aspect-video transition-all shadow-md group
                                        ${selectedPdfSlides.includes(slide.id) ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 bg-white hover:border-gray-500'}`}
                                >
                                    {slide.thumbnail ? (
                                        <img src={slide.thumbnail} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="thumb" />
                                    ) : (
                                        <span className="text-gray-400 font-medium text-xs flex justify-center items-center h-full">Slide {i + 1}</span>
                                    )}
                                    <div className="absolute top-1.5 left-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white shadow">{i + 1}</div>
                                    <div className={`absolute bottom-1.5 right-1.5 w-5 h-5 rounded-md border flex items-center justify-center shadow-lg transition-all
                                        ${selectedPdfSlides.includes(slide.id) ? 'bg-indigo-500 border-indigo-500' : 'bg-gray-800/80 border-gray-400'}`}>
                                        {selectedPdfSlides.includes(slide.id) && <Check size={14} className="text-white" strokeWidth={3} />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                            <button onClick={() => setIsPdfModalOpen(false)} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all">Cancel</button>
                            <button onClick={downloadSelectedPDF} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all">
                                Export {selectedPdfSlides.length} Pages
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LEFT SIDEBAR */}
            <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col p-4 gap-4">
                <div className="text-indigo-400 font-bold text-xl">Quantum Editor</div>
                <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-2 custom-scrollbar">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            onClick={() => setActiveSlide(slide.id)}
                            className={`group relative aspect-video bg-white border-2 rounded-lg cursor-pointer flex items-center justify-center transition-all overflow-hidden
                                ${activeSlideId === slide.id ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-gray-700 hover:border-gray-500'}`}
                        >
                            {slide.thumbnail
                                ? <img src={slide.thumbnail} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                                : <span className="text-gray-400 font-medium text-xs">Slide {index + 1}</span>
                            }
                            <span className="absolute bottom-1 left-1 bg-black/80 text-[10px] px-1.5 rounded text-gray-300">{index + 1}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }}
                                className="absolute top-1 right-1 p-1.5 bg-red-500/90 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                                title="Delete Slide"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
                <button onClick={addSlide} className="w-full py-3 bg-gray-900 border border-gray-700 rounded-lg flex justify-center items-center gap-2 text-sm text-gray-400 hover:text-white transition-all">
                    <Plus size={16} /> New Slide
                </button>
            </div>

            {/* CENTER WORKSPACE */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-gray-950 p-8">
                {isExporting && (
                    <div className="absolute top-4 bg-indigo-600 text-white px-6 py-2 rounded-full shadow-lg z-50 animate-pulse font-medium">
                        {exportMessage}
                    </div>
                )}

                <Toolbar
                    onAddRect={addRect} onAddCircle={addCircle} onAddText={addText} onDelete={deleteObject}
                    onImageUpload={handleImageUpload} onDownload={downloadCanvas} onAddMath={addMathEquation}
                    onUndo={undo} onRedo={redo} onDownloadPPTX={downloadPPTX} onClear={clearCanvas}
                    onDownloadPDF={handleOpenPdfModal}
                />

                <div className="shadow-2xl border border-gray-700 bg-white rounded-sm">
                    <canvas ref={canvasRef} />
                </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700 text-sm font-bold text-gray-300">Properties</div>
                <PropertiesPanel
                    activeObject={activeObject}
                    onUpdateProperty={updateProperty}
                    onMoveLayer={moveLayer}
                    canvasBgColor={canvasBgColor}
                    onUpdateBackground={updateBackgroundColor}
                />
            </div>
        </div>
    );
}

export default FabricEditor;