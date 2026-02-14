import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mathematics from "@tiptap/extension-mathematics";
import 'katex/dist/katex.min.css';
import { updateDocument, generateFinalDocument, getDocument } from '@/services/api';

const EditorPage = () => {
    const { documentId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingA4, setIsGeneratingA4] = useState(false);
    const [isGeneratingPPT, setIsGeneratingPPT] = useState(false);
    const [initialContent, setInitialContent] = useState('');

    // Initialize TipTap editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Mathematics,
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
            },
        },
    });

    // Fetch document content on mount
    useEffect(() => {
        const fetchContent = async () => {
            try {
                if (!documentId) return;
                const res = await getDocument(documentId);
                const docData = res.data;

                // Handle different content structures
                const rawContent = docData.content || docData.aiContent || "";

                // Convert object content to markdown if needed
                let text = '';
                if (typeof rawContent === 'object' && rawContent !== null) {
                    text = renderFromAI(rawContent);
                } else {
                    text = String(rawContent);
                }

                setInitialContent(text);

                // Set content in editor
                if (editor) {
                    editor.commands.setContent(text);
                }
            } catch (error) {
                console.error("Failed to fetch document:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [documentId, editor]);

    const renderFromAI = (aiData) => {
        if (!aiData) return "";
        if (typeof aiData === 'string') return aiData;

        const docTitle = aiData.title || "Mathematics Problem Set";
        let markdown = `<h1>${docTitle}</h1>`;

        if (Array.isArray(aiData.sections)) {
            aiData.sections.forEach((sec, idx) => {
                if (!sec.text || !sec.text.trim()) return;

                const qMatch = sec.text.match(/^(\d+)\.\s*/);
                const questionNum = qMatch ? qMatch[1] : (idx + 1);
                let cleanText = qMatch ? sec.text.replace(/^\d+\.\s*/, '') : sec.text;
                const heading = sec.heading || `Problem ${questionNum}`;

                markdown += `<h2>${heading}</h2><p>${cleanText}</p><hr>`;
            });
        }
        return markdown;
    };

    const handleSave = async () => {
        if (!editor) return;

        setIsSaving(true);
        try {
            const content = editor.getHTML();
            await updateDocument(documentId, content);
            alert("Document saved successfully!");
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save document.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateDocument = async (format) => {
        if (!editor) return;

        const setLoading = format === 'A4' ? setIsGeneratingA4 : setIsGeneratingPPT;
        setLoading(true);

        try {
            // Auto-save current content
            const content = editor.getHTML();
            await updateDocument(documentId, content);

            // Generate document
            const res = await generateFinalDocument(documentId, format);
            const { downloadUrl } = res.data;

            // Trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', '');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Generation failed:", error);
            alert(`Failed to generate ${format} document.`);
        } finally {
            setLoading(false);
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
                        onClick={() => navigate('/playground')}
                        className="text-slate-400 hover:text-white transition flex items-center gap-2"
                    >
                        <i className="ri-arrow-left-line"></i> Back to Lab
                    </button>
                    <h2 className="text-xl font-bold text-white">
                        Content Editor
                    </h2>
                </div>

                <div className="flex gap-3">
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

                    <button
                        onClick={() => handleGenerateDocument('A4')}
                        disabled={isGeneratingA4}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-lg transition flex items-center gap-2 font-bold shadow-lg disabled:opacity-50"
                    >
                        {isGeneratingA4 ? (
                            <i className="ri-loader-4-line animate-spin"></i>
                        ) : (
                            <i className="ri-file-pdf-fill"></i>
                        )}
                        Download A4
                    </button>

                    <button
                        onClick={() => handleGenerateDocument('PPT')}
                        disabled={isGeneratingPPT}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-lg transition flex items-center gap-2 font-bold shadow-lg disabled:opacity-50"
                    >
                        {isGeneratingPPT ? (
                            <i className="ri-loader-4-line animate-spin"></i>
                        ) : (
                            <i className="ri-slideshow-fill"></i>
                        )}
                        Download PPT
                    </button>
                </div>
            </div>

            {/* Editor Toolbar */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 flex gap-2 flex-wrap">
                <button
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`px-3 py-2 rounded ${editor?.isActive('bold') ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                    <i className="ri-bold"></i>
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`px-3 py-2 rounded ${editor?.isActive('italic') ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                    <i className="ri-italic"></i>
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`px-3 py-2 rounded ${editor?.isActive('heading', { level: 1 }) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                    <i className="ri-h-1"></i>
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`px-3 py-2 rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                    <i className="ri-h-2"></i>
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    className={`px-3 py-2 rounded ${editor?.isActive('bulletList') ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                    <i className="ri-list-unordered"></i>
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    className={`px-3 py-2 rounded ${editor?.isActive('orderedList') ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                    <i className="ri-list-ordered"></i>
                </button>
                <button
                    onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                    className="px-3 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                    <i className="ri-separator"></i>
                </button>
            </div>

            {/* Editor Content */}
            <div className="flex-1 bg-white text-slate-900 rounded-xl p-8 overflow-y-auto shadow-inner border-2 border-slate-700">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default EditorPage;