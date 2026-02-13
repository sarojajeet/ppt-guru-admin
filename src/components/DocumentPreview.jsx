import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getDocument } from '@/services/api';

const DocumentPreview = () => {
    const { documentId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Get file info from URL params if available, or fetch from doc
    const fileFromUrl = searchParams.get('file');
    const format = searchParams.get('format') || 'A4';

    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fileName, setFileName] = useState(fileFromUrl || "");

    useEffect(() => {
        const fetchDoc = async () => {
            if (!documentId) return;
            try {
                const res = await getDocument(documentId);
                setDoc(res.data);
                if (!fileName && res.data.generatedFile) {
                    setFileName(res.data.generatedFile);
                }
            } catch (err) {
                console.error("Error fetching doc", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDoc();
    }, [documentId]);

    const downloadUrl = fileName ? `http://localhost:5000/downloads/${fileName}` : null;

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
                <i className="ri-loader-4-line text-4xl animate-spin text-indigo-500"></i>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-slate-950 text-white p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate(`/editor/${documentId}`)} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                    <i className="ri-arrow-left-line"></i> Back to Editor
                </button>
                <h1 className="text-2xl font-bold">Professional Document Preview</h1>
                <div className="w-24"></div> {/* Spacer */}
            </div>

            <div className="flex-1 glass rounded-2xl p-8 flex flex-col items-center justify-center gap-6 border border-slate-700 bg-slate-900/50">
                <div className="text-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 \${format === 'PPT' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        <i className={`ri-\${format === 'PPT' ? 'slideshow' : 'file-pdf'}-fill text-5xl`}></i>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{format === 'PPT' ? 'PowerPoint Presentation' : 'PDF Document'} Ready</h2>
                    <p className="text-slate-400">Your professional document has been generated successfully.</p>
                    {fileName && <p className="text-xs text-slate-500 mt-2 font-mono">{fileName}</p>}
                </div>

                <div className="flex gap-4 mt-4">
                    {downloadUrl && (
                        <a
                            href={downloadUrl}
                            download
                            className={`px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-3 transition transform hover:scale-105 ${format === 'PPT' ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                        >
                            <i className="ri-download-cloud-2-line text-xl"></i>
                            Download {format}
                        </a>
                    )}
                </div>

                {/* Preview Frame for PDF only */}
                {format === 'A4' && downloadUrl && (
                    <div className="w-full max-w-4xl h-[500px] mt-8 bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                        <iframe src={downloadUrl} className="w-full h-full" title="PDF Preview"></iframe>
                    </div>
                )}
            </div>
        </div >
    );
};

export default DocumentPreview;
