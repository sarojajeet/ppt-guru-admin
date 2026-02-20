import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDocuments } from '@/services/api';
import Swal from 'sweetalert2';

const DocumentList = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 8; // 👈 match UI grid nicely

    const navigate = useNavigate();

    useEffect(() => {
        fetchDocuments(page);
    }, [page]);

    const fetchDocuments = async (pageNumber = 1) => {
        setLoading(true);
        try {
            const res = await getAllDocuments({
                page: pageNumber,
                limit
            });

            if (res.data && res.data.documents) {
                setDocuments(res.data.documents);
                setTotalPages(res.data.totalPages);
            }
        } catch (err) {
            console.error("Failed to fetch documents:", err);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to load documents. Please try again later.',
                background: '#1e293b',
                color: '#fff',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (docId) => {
        navigate(`/editor/${docId}`);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="section-view">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <i className="ri-file-list-3-line text-indigo-500"></i>
                        Document Repository
                    </h2>
                    <p className="text-slate-400 mt-1">Manage and edit your AI-generated documents</p>
                </div>

                <button
                    onClick={() => fetchDocuments(page)}
                    className="p-2 w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition flex items-center justify-center border border-white/5"
                    title="Refresh List"
                >
                    <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
                </button>
            </div>

            {/* CONTENT */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="glass rounded-2xl p-6 h-48 animate-pulse">
                            <div className="w-12 h-12 bg-slate-800 rounded-xl mb-4"></div>
                            <div className="h-4 bg-slate-800 rounded w-3/4 mb-3"></div>
                            <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : documents.length === 0 ? (
                <div className="glass rounded-2xl p-20 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-700">
                    <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6 shadow-2xl">
                        <i className="ri-folder-open-line text-5xl text-slate-700"></i>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Documents Found</h3>
                    <p className="text-slate-400 max-w-md mx-auto mb-8">
                        You haven't processed any documents in the AI Lab yet. Start by uploading a file to generate content.
                    </p>
                    <button
                        onClick={() => navigate('/playground')}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center gap-2"
                    >
                        <i className="ri-flask-fill"></i>
                        Go to AI Lab
                    </button>
                </div>
            ) : (
                <>
                    {/* GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {documents.map((doc) => (
                            <div
                                key={doc._id}
                                className="glass p-6 rounded-2xl group relative hover:bg-white/5 transition-all duration-300 border border-white/5 hover:border-indigo-500/30 anim-pop"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                        <i className="ri-file-text-fill text-2xl"></i>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-800/50 px-2 py-1 rounded border border-white/5">
                                        MARKDOWN
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-white truncate group-hover:text-indigo-400 transition">
                                        {doc.title || "Untitled Document"}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <i className="ri-calendar-line"></i>
                                        {formatDate(doc.createdAt)}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(doc._id)}
                                        className="flex-1 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-600 text-sm font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <i className="ri-edit-box-line"></i>
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => navigate(`/ppt-editor/${doc._id}`)}
                                        className="w-10 h-10 bg-slate-800 hover:bg-orange-500/20 text-slate-400 hover:text-orange-400 border border-white/5 hover:border-orange-500/30 rounded-xl transition-all flex items-center justify-center"
                                    >
                                        <i className="ri-presentation-fill"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* PAGINATION */}
                    <div className="flex justify-center items-center gap-4 mt-10">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 rounded-lg bg-slate-800 text-white disabled:opacity-40"
                        >
                            Prev
                        </button>

                        <span className="text-slate-400">
                            Page <span className="text-white font-bold">{page}</span> of {totalPages}
                        </span>

                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 rounded-lg bg-slate-800 text-white disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default DocumentList;