import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { generateFinalDocument } from '@/services/api';

const A4PreviewEditor = () => {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [content, setContent] = useState([]);

    useEffect(() => {
        // Get rendered content from navigation state
        if (location.state?.renderedContent) {
            const rendered = location.state.renderedContent;

            // Parse the rendered content into editable sections
            if (typeof rendered === 'string') {
                // Split by paragraphs or sections
                const sections = rendered.split('\n\n').filter(s => s.trim());
                setContent(sections.map((text, idx) => ({
                    id: idx,
                    text: text,
                    type: text.startsWith('#') ? 'heading' : 'paragraph'
                })));
            } else if (Array.isArray(rendered)) {
                setContent(rendered.map((item, idx) => ({
                    id: idx,
                    text: item.text || item,
                    type: item.type || 'paragraph'
                })));
            }
        }
        setLoading(false);
    }, [location.state]);

    const handleContentChange = (id, newText) => {
        setContent(prev => prev.map(item =>
            item.id === id ? { ...item, text: newText } : item
        ));
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            // Combine all sections back into text
            const finalText = content.map(item => item.text).join('\n\n');

            // Send to backend for file generation
            const res = await generateFinalDocument(documentId, 'A4', { text: finalText });
            const { downloadUrl } = res.data;

            // Trigger download
            window.open(downloadUrl, '_blank');

            // Navigate back after successful download
            setTimeout(() => {
                navigate(`/editor/${documentId}`);
            }, 1000);

        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to generate A4 document.");
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <i className="ri-loader-4-line text-4xl animate-spin text-indigo-500"></i>
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
                        <i className="ri-file-text-line text-blue-500"></i>
                        A4 Document Preview
                    </h2>
                </div>

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-lg transition flex items-center gap-2 font-bold shadow-lg disabled:opacity-50"
                >
                    {isDownloading ? (
                        <>
                            <i className="ri-loader-4-line animate-spin"></i>
                            Generating...
                        </>
                    ) : (
                        <>
                            <i className="ri-download-2-fill"></i>
                            Download A4
                        </>
                    )}
                </button>
            </div>

            {/* A4 Preview */}
            <div className="flex-1 flex justify-center overflow-y-auto">
                <div className="w-full max-w-4xl bg-white shadow-2xl rounded-lg p-16 text-slate-900">
                    {content.length === 0 ? (
                        <div className="text-center text-slate-400 py-20">
                            <i className="ri-file-text-line text-6xl mb-4"></i>
                            <p>No content to preview</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {content.map((section) => (
                                <div key={section.id} className="group">
                                    {section.type === 'heading' ? (
                                        <textarea
                                            value={section.text}
                                            onChange={(e) => handleContentChange(section.id, e.target.value)}
                                            className="w-full text-3xl font-bold border-2 border-transparent hover:border-blue-300 focus:border-blue-500 rounded-lg p-2 resize-none overflow-hidden bg-transparent focus:bg-blue-50/50 transition"
                                            rows={Math.ceil(section.text.length / 50) || 1}
                                        />
                                    ) : (
                                        <textarea
                                            value={section.text}
                                            onChange={(e) => handleContentChange(section.id, e.target.value)}
                                            className="w-full text-base leading-relaxed border-2 border-transparent hover:border-blue-300 focus:border-blue-500 rounded-lg p-2 resize-none overflow-hidden bg-transparent focus:bg-blue-50/50 transition"
                                            rows={Math.ceil(section.text.length / 80) || 2}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default A4PreviewEditor;
