import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { generateFinalDocument } from '@/services/api';

const PPTPreviewEditor = () => {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [slides, setSlides] = useState([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    useEffect(() => {
        // Get rendered content from navigation state
        if (location.state?.renderedContent) {
            const rendered = location.state.renderedContent;

            // Parse the rendered content into slides
            if (typeof rendered === 'string') {
                // Split by slide markers
                const slideTexts = rendered.split(/Slide\s*\d*:/i).filter(s => s.trim());
                setSlides(slideTexts.map((text, idx) => ({
                    id: idx,
                    title: `Slide ${idx + 1}`,
                    content: text.trim()
                })));
            } else if (Array.isArray(rendered)) {
                setSlides(rendered.map((item, idx) => ({
                    id: idx,
                    title: item.title || `Slide ${idx + 1}`,
                    content: item.content || item.text || ''
                })));
            }
        }
        setLoading(false);
    }, [location.state]);

    const handleSlideChange = (id, field, value) => {
        setSlides(prev => prev.map(slide =>
            slide.id === id ? { ...slide, [field]: value } : slide
        ));
    };

    const addSlide = () => {
        const newSlide = {
            id: slides.length,
            title: `Slide ${slides.length + 1}`,
            content: ''
        };
        setSlides([...slides, newSlide]);
        setCurrentSlideIndex(slides.length);
    };

    const deleteSlide = (id) => {
        if (slides.length <= 1) {
            alert("Cannot delete the last slide");
            return;
        }
        setSlides(prev => prev.filter(slide => slide.id !== id));
        if (currentSlideIndex >= slides.length - 1) {
            setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            // Format slides for backend
            const slidesText = slides.map((slide, idx) =>
                `Slide ${idx + 1}:\n${slide.title}\n${slide.content}`
            ).join('\n\n');

            // Send to backend for file generation
            const res = await generateFinalDocument(documentId, 'PPT', { text: slidesText, slides });
            const { downloadUrl } = res.data;

            // Trigger download
            window.open(downloadUrl, '_blank');

            // Navigate back after successful download
            setTimeout(() => {
                navigate(`/editor/${documentId}`);
            }, 1000);

        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to generate PPT document.");
        } finally {
            setIsDownloading(false);
        }
    };

    const currentSlide = slides[currentSlideIndex];

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <i className="ri-loader-4-line text-4xl animate-spin text-orange-500"></i>
                    <p>Loading Preview...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-950 p-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/editor/${documentId}`)}
                        className="text-slate-400 hover:text-white transition flex items-center gap-2"
                    >
                        <i className="ri-arrow-left-line"></i> Back to Editor
                    </button>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <i className="ri-slideshow-line text-orange-500"></i>
                        PowerPoint Preview
                    </h2>
                </div>

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-lg transition flex items-center gap-2 font-bold shadow-lg disabled:opacity-50"
                >
                    {isDownloading ? (
                        <>
                            <i className="ri-loader-4-line animate-spin"></i>
                            Generating...
                        </>
                    ) : (
                        <>
                            <i className="ri-download-2-fill"></i>
                            Download PPT
                        </>
                    )}
                </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Slide Thumbnails Sidebar */}
                <div className="w-64 bg-slate-900/50 border border-slate-700 rounded-lg p-4 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase">Slides</h3>
                        <button
                            onClick={addSlide}
                            className="text-green-500 hover:text-green-400 transition"
                            title="Add Slide"
                        >
                            <i className="ri-add-circle-fill text-xl"></i>
                        </button>
                    </div>
                    <div className="space-y-3">
                        {slides.map((slide, idx) => (
                            <div
                                key={slide.id}
                                onClick={() => setCurrentSlideIndex(idx)}
                                className={`relative group cursor-pointer p-3 rounded-lg border-2 transition ${currentSlideIndex === idx
                                    ? 'border-orange-500 bg-orange-500/10'
                                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                                    }`}
                            >
                                <div className="text-xs font-bold text-slate-400 mb-1">Slide {idx + 1}</div>
                                <div className="text-xs text-slate-300 truncate">{slide.title}</div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSlide(slide.id);
                                    }}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition"
                                    title="Delete Slide"
                                >
                                    <i className="ri-delete-bin-line"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Slide Editor */}
                <div className="flex-1 flex flex-col">
                    {slides.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center bg-slate-900/50 border border-slate-700 rounded-lg">
                            <div className="text-center text-slate-400">
                                <i className="ri-slideshow-line text-6xl mb-4"></i>
                                <p>No slides to preview</p>
                                <button
                                    onClick={addSlide}
                                    className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition"
                                >
                                    Add First Slide
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Slide Preview */}
                            <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg p-8 mb-4 overflow-y-auto">
                                <div className="w-full h-full bg-white rounded-lg shadow-2xl p-12 flex flex-col">
                                    {/* Slide Title */}
                                    <input
                                        type="text"
                                        value={currentSlide.title}
                                        onChange={(e) => handleSlideChange(currentSlide.id, 'title', e.target.value)}
                                        className="text-4xl font-bold text-slate-900 border-2 border-transparent hover:border-orange-300 focus:border-orange-500 rounded-lg p-2 mb-8 bg-transparent focus:bg-orange-50/50 transition"
                                        placeholder="Slide Title"
                                    />

                                    {/* Slide Content */}
                                    <textarea
                                        value={currentSlide.content}
                                        onChange={(e) => handleSlideChange(currentSlide.id, 'content', e.target.value)}
                                        className="flex-1 text-xl text-slate-700 leading-relaxed border-2 border-transparent hover:border-orange-300 focus:border-orange-500 rounded-lg p-4 resize-none bg-transparent focus:bg-orange-50/50 transition"
                                        placeholder="Slide content..."
                                    />
                                </div>
                            </div>

                            {/* Slide Navigation */}
                            <div className="flex justify-between items-center bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                                <button
                                    onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                                    disabled={currentSlideIndex === 0}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <i className="ri-arrow-left-line"></i>
                                    Previous
                                </button>

                                <span className="text-slate-400 font-mono">
                                    {currentSlideIndex + 1} / {slides.length}
                                </span>

                                <button
                                    onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                                    disabled={currentSlideIndex === slides.length - 1}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    Next
                                    <i className="ri-arrow-right-line"></i>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PPTPreviewEditor;
