import React, { useState, useEffect } from 'react';
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { updateDocument, generateFinalDocument, getDocument } from '@/services/api';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

const preprocessMath = (content) => {
    if (typeof content !== 'string') return "";
    return content
        .replace(/\\\[(.*?)\\\]/gs, '$$$1$$') // Block math \[ ... \] -> $$ ... $$
        .replace(/\\\((.*?)\\\)/gs, '$$$1$$'); // Inline math \( ... \) -> $ ... $
};

const renderFromAI = (aiData) => {
    if (!aiData) return "";
    // If it's already a string, return it
    if (typeof aiData === 'string') return aiData;

    const docTitle = aiData.title || "Mathematics Problem Set";
    let markdown = `# ${docTitle}\n\n`;

    if (Array.isArray(aiData.sections)) {
        aiData.sections.forEach((sec, idx) => {
            if (!sec.text || !sec.text.trim()) return;

            // Extract question number if present
            const qMatch = sec.text.match(/^(\d+)\.\s*/);
            const questionNum = qMatch ? qMatch[1] : (idx + 1);

            // Remove question number from text if it exists
            let cleanText = qMatch ? sec.text.replace(/^\d+\.\s*/, '') : sec.text;

            // Create heading
            const heading = sec.heading || `Problem ${questionNum}`;

            markdown += `## ${heading}\n\n${cleanText}\n\n---\n\n`;
        });
    }
    return markdown;
};

const EditorPage = () => {
    const { documentId } = useParams();
    const [searchParams] = useSearchParams();
    const format = searchParams.get('format') || 'A4';
    const navigate = useNavigate();

    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                if (!documentId) return;
                const res = await getDocument(documentId);
                const docData = res.data;

                // Handle different content structures
                const rawContent = docData.aiContent || docData.content || "";

                // Convert object content to markdown if needed
                const text = (typeof rawContent === 'object' && rawContent !== null)
                    ? renderFromAI(rawContent)
                    : String(rawContent);

                setContent(text);
            } catch (error) {
                console.error("Failed to fetch document:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [documentId]);
    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (documentId) {
                const processedContent = preprocessMath(content);
                await updateDocument(documentId, processedContent);
                alert("Document saved successfully!");
            } else {
                alert("Error: No document ID found.");
            }
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save document.");
        } finally {
            setIsSaving(false);
        }
    };


    const handleGenerateValues = async (selectedFormat) => {
        setIsGenerating(true);
        try {
            const processedContent = preprocessMath(content);
            await updateDocument(documentId, processedContent);

            const res = await generateFinalDocument(documentId, selectedFormat);

            if (selectedFormat === "PPT") {
                navigate(`/ppt-editor/${documentId}`, {
                    state: res.data
                });
            } else {
                navigate(`/a4-editor/${documentId}`, {
                    state: res.data
                });
            }

        } catch (error) {
            console.error("Generation failed:", error);
            alert("Failed to generate document.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <i className="ri-loader-4-line text-4xl animate-spin text-indigo-500"></i>
                    <p>Loading Editor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col gap-4 bg-slate-950 p-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/playground')} // Go back to playground
                        className="text-slate-400 hover:text-white transition flex items-center gap-2"
                    >
                        <i className="ri-arrow-left-line"></i> Back to Lab
                    </button>
                    <h2 className="text-xl font-bold text-white">
                        {format} Editor
                    </h2>
                </div>

                <div className="flex gap-3">

                    {/* Save */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <i className="ri-loader-4-line animate-spin"></i>
                        ) : (
                            <i className="ri-save-3-line"></i>
                        )}
                        Save
                    </button>

                    {/* A4 Button */}
                    <button
                        onClick={() => handleGenerateValues("A4")}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 rounded-lg transition flex items-center gap-2 font-bold text-white shadow-lg disabled:opacity-50"
                    >
                        <i className="ri-file-download-fill"></i>
                        Open As A4
                    </button>

                    {/* PPT Button */}
                    <button
                        onClick={() => handleGenerateValues("PPT")}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 rounded-lg transition flex items-center gap-2 font-bold text-white shadow-lg disabled:opacity-50"
                    >
                        <i className="ri-file-download-fill"></i>
                        Open As PPT
                    </button>

                </div>

            </div>

            {/* Editor Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
                {/* Input Area */}
                <div className="bg-slate-900/30 border border-slate-700 rounded-xl p-4 flex flex-col h-full">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2">Markdown Input</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="flex-1 bg-transparent text-slate-200 font-mono text-sm resize-none focus:outline-none p-2"
                        placeholder="# Enter your content here..."
                    />
                </div>

                {/* Live Preview */}
                <div className="bg-white text-slate-900 rounded-xl p-8 overflow-y-auto shadow-inner h-full">
                    <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[[rehypeKatex, { strict: false }]]}
                        >
                            {preprocessMath(content)}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
