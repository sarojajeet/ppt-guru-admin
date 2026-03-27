// import React, { useState, useEffect } from 'react';
// import ReactMarkdown from "react-markdown";
// import remarkMath from "remark-math";
// import rehypeKatex from "rehype-katex";
// import "katex/dist/katex.min.css";
// import { updateDocument, generateFinalDocument, getDocument } from '@/services/api';
// import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

// const preprocessMath = (content) => {
//     if (typeof content !== 'string') return "";
//     return content
//         .replace(/\\\[(.*?)\\\]/gs, '$$$1$$') // Block math \[ ... \] -> $$ ... $$
//         .replace(/\\\((.*?)\\\)/gs, '$$$1$$'); // Inline math \( ... \) -> $ ... $
// };

// const renderFromAI = (aiData) => {
//     if (!aiData) return "";
//     // If it's already a string, return it
//     if (typeof aiData === 'string') return aiData;

//     const docTitle = aiData.title || "Mathematics Problem Set";
//     let markdown = `# ${docTitle}\n\n`;

//     if (Array.isArray(aiData.sections)) {
//         aiData.sections.forEach((sec, idx) => {
//             if (!sec.text || !sec.text.trim()) return;

//             // Extract question number if present
//             const qMatch = sec.text.match(/^(\d+)\.\s*/);
//             const questionNum = qMatch ? qMatch[1] : (idx + 1);

//             // Remove question number from text if it exists
//             let cleanText = qMatch ? sec.text.replace(/^\d+\.\s*/, '') : sec.text;

//             // Create heading
//             const heading = sec.heading || `Problem ${questionNum}`;

//             markdown += `## ${heading}\n\n${cleanText}\n\n---\n\n`;
//         });
//     }
//     return markdown;
// };

// const EditorPage = () => {
//     const { documentId } = useParams();
//     const [searchParams] = useSearchParams();
//     const format = searchParams.get('format') || 'A4';
//     const navigate = useNavigate();

//     const [content, setContent] = useState("");
//     const [loading, setLoading] = useState(true);
//     const [isSaving, setIsSaving] = useState(false);
//     const [isGenerating, setIsGenerating] = useState(false);

//     useEffect(() => {
//         const fetchContent = async () => {
//             try {
//                 if (!documentId) return;
//                 const res = await getDocument(documentId);
//                 const docData = res.data;

//                 // Handle different content structures
//                 const rawContent = docData.aiContent || docData.content || "";

//                 // Convert object content to markdown if needed
//                 const text = (typeof rawContent === 'object' && rawContent !== null)
//                     ? renderFromAI(rawContent)
//                     : String(rawContent);

//                 setContent(text);
//             } catch (error) {
//                 console.error("Failed to fetch document:", error);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchContent();
//     }, [documentId]);
//     const handleSave = async () => {
//         setIsSaving(true);
//         try {
//             if (documentId) {
//                 const processedContent = preprocessMath(content);
//                 await updateDocument(documentId, processedContent);
//                 alert("Document saved successfully!");
//             } else {
//                 alert("Error: No document ID found.");
//             }
//         } catch (error) {
//             console.error("Save failed:", error);
//             alert("Failed to save document.");
//         } finally {
//             setIsSaving(false);
//         }
//     };


//     // const handleGenerateValues = async (selectedFormat) => {
//     //     setIsGenerating(true);
//     //     try {
//     //         const processedContent = preprocessMath(content);
//     //         // await updateDocument(documentId, processedContent);

//     //         // const res = await generateFinalDocument(documentId, selectedFormat);

//     //         if (selectedFormat === "PPT") {
//     //             navigate(`/fabric-editor/${documentId}`, {
//     //                 state: res.data
//     //             });
//     //         } else {
//     //             navigate(`/a4-editor/${documentId}`, {
//     //                 state: res.data
//     //             });
//     //         }

//     //     } catch (error) {
//     //         console.error("Generation failed:", error);
//     //         alert("Failed to generate document.");
//     //     } finally {
//     //         setIsGenerating(false);
//     //     }
//     // };

//    const handleGenerateValues = (selectedFormat) => {
//     if (selectedFormat === "PPT") {
//         navigate(`/fabric-editor/${documentId}`);
//     } else {
//         navigate(`/a4-editor/${documentId}`);
//     }
// };
//     if (loading) {
//         return (
//             <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
//                 <div className="flex flex-col items-center gap-4">
//                     <i className="ri-loader-4-line text-4xl animate-spin text-indigo-500"></i>
//                     <p>Loading Editor...</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="h-screen flex flex-col gap-4 bg-slate-950 p-4">
//             {/* Header */}
//             <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg border border-slate-700">
//                 <div className="flex items-center gap-4">
//                     <button
//                         onClick={() => navigate('/playground')} // Go back to playground
//                         className="text-slate-400 hover:text-white transition flex items-center gap-2"
//                     >
//                         <i className="ri-arrow-left-line"></i> Back to Lab
//                     </button>
//                     <h2 className="text-xl font-bold text-white">
//                         {format} Editor
//                     </h2>
//                 </div>

//                 <div className="flex gap-3">

//                     {/* Save */}
//                     <button
//                         onClick={handleSave}
//                         disabled={isSaving}
//                         className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
//                     >
//                         {isSaving ? (
//                             <i className="ri-loader-4-line animate-spin"></i>
//                         ) : (
//                             <i className="ri-save-3-line"></i>
//                         )}
//                         Save
//                     </button>

//                     {/* A4 Button */}
//                     <button
//                         onClick={() => handleGenerateValues("A4")}
//                         disabled={isGenerating}
//                         className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 rounded-lg transition flex items-center gap-2 font-bold text-white shadow-lg disabled:opacity-50"
//                     >
//                         <i className="ri-file-download-fill"></i>
//                         Open As A4
//                     </button>

//                     {/* PPT Button */}
//                     <button
//                         onClick={() => handleGenerateValues("PPT")}
//                         disabled={isGenerating}
//                         className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 rounded-lg transition flex items-center gap-2 font-bold text-white shadow-lg disabled:opacity-50"
//                     >
//                         <i className="ri-file-download-fill"></i>
//                         Open As PPT
//                     </button>

//                 </div>

//             </div>

//             {/* Editor Content */}
//             <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
//                 {/* Input Area */}
//                 <div className="bg-slate-900/30 border border-slate-700 rounded-xl p-4 flex flex-col h-full">
//                     <label className="text-xs font-bold text-slate-400 uppercase mb-2">Markdown Input</label>
//                     <textarea
//                         value={content}
//                         onChange={(e) => setContent(e.target.value)}
//                         className="flex-1 bg-transparent text-slate-200 font-mono text-sm resize-none focus:outline-none p-2"
//                         placeholder="# Enter your content here..."
//                     />
//                 </div>

//                 {/* Live Preview */}
//                 <div className="bg-white text-slate-900 rounded-xl p-8 overflow-y-auto shadow-inner h-full">
//                     <div className="prose prose-sm max-w-none">
//                         <ReactMarkdown
//                             remarkPlugins={[remarkMath]}
//                             rehypePlugins={[[rehypeKatex, { strict: false }]]}
//                         >
//                             {preprocessMath(content)}
//                         </ReactMarkdown>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default EditorPage;

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { updateDocument, getDocument } from '@/services/api';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

const preprocessMath = (content) => {
    if (typeof content !== 'string') return "";
    return content
        .replace(/\\\[(.*?)\\\]/gs, '$$$1$$')
        .replace(/\\\((.*?)\\\)/gs, '$$$1$$');
};

const renderFromAI = (aiData) => {
    if (!aiData) return "";
    if (typeof aiData === 'string') return aiData;

    const docTitle = aiData.title || "Mathematics Problem Set";
    let markdown = `# ${docTitle}\n\n`;

    if (Array.isArray(aiData.sections)) {
        aiData.sections.forEach((sec, idx) => {
            if (!sec.text || !sec.text.trim()) return;
            const qMatch = sec.text.match(/^(\d+)\.\s*/);
            const questionNum = qMatch ? qMatch[1] : (idx + 1);
            let cleanText = qMatch ? sec.text.replace(/^\d+\.\s*/, '') : sec.text;
            const heading = sec.heading || `Problem ${questionNum}`;
            markdown += `## ${heading}\n\n${cleanText}\n\n---\n\n`;
        });
    }
    return markdown;
};

const POLL_INTERVAL = 3000; // poll every 3 seconds
const MAX_POLLS = 60;       // give up after 3 minutes

const EditorPage = () => {
    const { documentId } = useParams();
    const [searchParams] = useSearchParams();
    const format = searchParams.get('format') || 'A4';
    const navigate = useNavigate();

    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [docStatus, setDocStatus] = useState("processing"); // "processing" | "generated" | "error"

    const pollCountRef = useRef(0);
    const pollTimerRef = useRef(null);

    // Fetch document content once on mount
    useEffect(() => {
        const fetchContent = async () => {
            try {
                if (!documentId) return;
                const res = await getDocument(documentId);
                const docData = res.data;

                const rawContent = docData.aiContent || docData.content || "";
                const text = (typeof rawContent === 'object' && rawContent !== null)
                    ? renderFromAI(rawContent)
                    : String(rawContent);

                setContent(text);
                setDocStatus(docData.status || "processing");
            } catch (error) {
                console.error("Failed to fetch document:", error);
                setDocStatus("error");
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [documentId]);

    // Start polling when status is not yet "generated"
    useEffect(() => {
        if (docStatus === "generated" || docStatus === "error" || !documentId) return;

        const poll = async () => {
            if (pollCountRef.current >= MAX_POLLS) {
                setDocStatus("error");
                return;
            }
            pollCountRef.current += 1;

            try {
                const res = await getDocument(documentId);
                const status = res.data?.status;
                if (status === "generated") {
                    setDocStatus("generated");
                    // Optionally refresh content after generation
                    const rawContent = res.data.aiContent || res.data.content || "";
                    const text = (typeof rawContent === 'object' && rawContent !== null)
                        ? renderFromAI(rawContent)
                        : String(rawContent);
                    setContent(text);
                } else {
                    pollTimerRef.current = setTimeout(poll, POLL_INTERVAL);
                }
            } catch (err) {
                console.error("Polling error:", err);
                pollTimerRef.current = setTimeout(poll, POLL_INTERVAL);
            }
        };

        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL);

        return () => {
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        };
    }, [docStatus, documentId]);

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

    const handleGenerateValues = (selectedFormat) => {
        if (selectedFormat === "PPT") {
            navigate(`/fabric-editor/${documentId}`);
        } else {
            navigate(`/a4-editor/${documentId}`);
        }
    };

    const isProcessing = docStatus !== "generated";

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
            {/* Processing Banner */}
            {isProcessing && (
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2.5 text-amber-300 text-sm">
                    <i className="ri-loader-4-line animate-spin text-amber-400 text-base flex-shrink-0"></i>
                    <span>
                        Your document is being generated in the background. The export buttons will unlock once it's ready.
                    </span>
                    <span className="ml-auto flex gap-1 items-center opacity-60 text-xs">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/playground')}
                        className="text-slate-400 hover:text-white transition flex items-center gap-2"
                    >
                        <i className="ri-arrow-left-line"></i> Back to Lab
                    </button>
                    <h2 className="text-xl font-bold text-white">
                        {format} Editor
                    </h2>
                </div>

                <div className="flex gap-3 items-center">
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
                    <div className="relative group">
                        <button
                            onClick={() => !isProcessing && handleGenerateValues("A4")}
                            disabled={isProcessing}
                            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-bold text-white shadow-lg
                                ${isProcessing
                                    ? 'bg-slate-700 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 cursor-pointer'
                                }`}
                        >
                            {isProcessing ? (
                                <i className="ri-loader-4-line animate-spin"></i>
                            ) : (
                                <i className="ri-file-download-fill"></i>
                            )}
                            Open As A4
                        </button>
                        {isProcessing && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded-md border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                                <i className="ri-time-line mr-1"></i>Generating document…
                            </div>
                        )}
                    </div>

                    {/* PPT Button */}
                    <div className="relative group">
                        <button
                            onClick={() => !isProcessing && handleGenerateValues("PPT")}
                            disabled={isProcessing}
                            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-bold text-white shadow-lg
                                ${isProcessing
                                    ? 'bg-slate-700 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 cursor-pointer'
                                }`}
                        >
                            {isProcessing ? (
                                <i className="ri-loader-4-line animate-spin"></i>
                            ) : (
                                <i className="ri-file-download-fill"></i>
                            )}
                            Open As PPT
                        </button>
                        {isProcessing && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded-md border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                                <i className="ri-time-line mr-1"></i>Generating slides…
                            </div>
                        )}
                    </div>
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