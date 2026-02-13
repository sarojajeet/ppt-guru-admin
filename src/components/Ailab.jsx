
import { analyzeDocument, generateFinalDocument } from '@/services/api';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const preprocessMath = (content) => {
  if (!content) return "";
  return content
    .replace(/\\\[(.*?)\\\]/gs, '$$$1$$') // Block math \[ ... \] -> $$ ... $$
    .replace(/\\\((.*?)\\\)/gs, '$$$1$$'); // Inline math \( ... \) -> $ ... $
};

const AILab = () => {
  const [pipelineSteps, setPipelineSteps] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [documentId, setDocumentId] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [loaderText, setLoaderText] = useState('INITIALIZING...');
  const [paperContent, setPaperContent] = useState('');

  const resetLab = () => {
    setPipelineSteps([]);
    setShowPreview(false);
    setShowLoader(false);
    setLoaderProgress(0);
    setPaperContent('');
    setDocumentId(null);
  };

  const runLabSimulation = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset
    setPipelineSteps([]);
    setShowPreview(false);
    setShowLoader(true);
    setLoaderProgress(0);
    setLoaderText("UPLOADING FILE...");

    try {
      // STEP 1: Upload
      setPipelineSteps([{
        title: "Upload Complete",
        description: `File: ${file.name}`,
        color: "green",
        icon: "ri-checkbox-circle-fill",
        status: "complete"
      }]);

      // STEP 2: OCR
      setLoaderProgress(20);
      setLoaderText("CONNECTING TO OCR ENGINE...");

      setPipelineSteps(prev => [...prev, {
        title: "OCR Processing",
        description: "Extracting text...",
        color: "yellow",
        icon: "ri-loader-4-line",
        status: "processing"
      }]);

      const res = await analyzeDocument(file);
      if (res.data && res.data.documentId) {
        setDocumentId(res.data.documentId);
      }

      // STEP 3: Data Extraction done
      setLoaderProgress(50);
      setLoaderText("AI ANALYZING CONTENT...");

      setPipelineSteps(prev => {
        const updated = [...prev];
        updated[1].icon = "ri-checkbox-circle-fill";
        updated[1].status = "complete";
        return [...updated, {
          title: "Data Extraction",
          description: "Structured JSON created",
          color: "blue",
          icon: "ri-code-s-slash-line",
          status: "processing"
        }];
      });

      // STEP 4: Formatting
      setLoaderProgress(75);
      setLoaderText("AI FORMATTING DOCUMENT...");

      setPipelineSteps(prev => {
        const updated = [...prev];
        updated[2].icon = "ri-checkbox-circle-fill";
        updated[2].status = "complete";
        return [...updated, {
          title: "AI Formatting",
          description: "Preparing preview...",
          color: "purple",
          icon: "ri-magic-line",
          status: "processing"
        }];
      });

      // STEP 5: Complete
      setLoaderProgress(90);
      setLoaderText("FINAL RENDERING...");

      setPipelineSteps(prev => {
        const updated = [...prev];
        updated[3].icon = "ri-checkbox-circle-fill";
        updated[3].status = "complete";
        return [...updated, {
          title: "Complete",
          description: "Preview Generated",
          color: "green",
          icon: "ri-flag-2-fill",
          status: "complete"
        }];
      });

      setTimeout(() => {
        setShowLoader(false);
        setShowPreview(true);
        setPaperContent(renderFromAI(res.data.content));
      }, 500);

    } catch (err) {
      console.error(err);
      alert("Processing failed");
      setShowLoader(false);
    }
  };

  const renderFromAI = (aiData) => {
    const docTitle = aiData.title || "Mathematics Problem Set";

    let markdown = `# ${docTitle}\n\n`;

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

    return markdown;
  };

  const openEditor = (format) => {
    if (!documentId) {
      alert("No document loaded. Please upload a file first.");
      return;
    }
    const url = `/editor/${documentId}?format=${format}`;
    window.open(url, '_blank');
  };

  return (
    <div className="section-view">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">AI Processing Lab</h3>
          <p className="text-xs text-slate-400">Test Mathpix OCR & AI Formatting Engine</p>
        </div>
        <button
          onClick={resetLab}
          className="text-slate-400 hover:text-white text-sm flex items-center gap-2 transition hover:bg-white/5 px-3 py-1 rounded-lg"
        >
          <i className="ri-refresh-line"></i> Reset Engine
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 h-[calc(100vh-250px)]">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Upload Area */}
          <label className="glass p-6 md:p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center h-40 md:h-48 group bg-slate-900/30">
            <input
              type="file"
              className="hidden"
              onChange={runLabSimulation}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition group-hover:bg-indigo-500/20">
              <i className="ri-upload-cloud-2-fill text-3xl text-indigo-500"></i>
            </div>
            <h4 className="font-bold text-white">Upload Document</h4>
            <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG supported</p>
          </label>

          {/* Pipeline Steps */}
          <div className="glass p-4 md:p-6 rounded-2xl flex-1 overflow-hidden flex flex-col">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
              Neural Pipeline
            </h4>
            <div className="space-y-6 md:space-y-8 relative pl-6 border-l border-slate-700 ml-2 overflow-y-auto">
              {pipelineSteps.length === 0 ? (
                <div className="text-slate-600 text-sm italic">Engine Idle...</div>
              ) : (
                pipelineSteps.map((step, index) => (
                  <div key={index} className={`fade-in pl-4 border-l border-${step.color}-500 relative`}>
                    <i className={`${step.icon} absolute -left-[9px] text-${step.color}-500 bg-[#0f172a] ${step.status === 'processing' ? 'animate-spin' : ''}`}></i>
                    <div className="text-white text-sm font-bold">{step.title}</div>
                    <div className="text-xs text-slate-400">{step.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="glass p-1 rounded-2xl relative flex flex-col shadow-2xl shadow-black/50 h-full">
          <div className="bg-slate-900/80 p-3 rounded-t-xl flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Live Output
            </span>
            <div className="flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            </div>
          </div>

          {/* Action Buttons Overlay */}
          {showPreview && (
            <div className="absolute top-16 right-6 z-20 flex flex-col gap-3">
              <button
                onClick={() => openEditor('A4')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold py-3 px-6 rounded-lg shadow-2xl transition-all duration-200 flex items-center gap-2 hover:scale-105"
              >
                <i className="ri-file-pdf-line text-lg"></i>
                <span>Check PDF</span>
              </button>
              <button
                onClick={() => openEditor('PPT')}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-sm font-bold py-3 px-6 rounded-lg shadow-2xl transition-all duration-200 flex items-center gap-2 hover:scale-105"
              >
                <i className="ri-slideshow-line text-lg"></i>
                <span>Check PPT</span>
              </button>
            </div>
          )}

          <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center rounded-b-xl">
            {!showPreview && !showLoader && (
              <div className="text-center opacity-30">
                <i className="ri-file-text-line text-7xl text-slate-500"></i>
                <p className="text-slate-500 mt-4 text-sm font-mono">WAITING FOR INPUT STREAM</p>
              </div>
            )}

            {showPreview && (
              <div className="paper-preview w-full h-full p-6 md:p-10 overflow-y-auto text-left text-sm leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[[rehypeKatex, { strict: false }]]}
                  components={{
                    img: ({ node, ...props }) => (
                      <img {...props} style={{ maxWidth: "100%", margin: "1rem auto" }} />
                    )
                  }}
                >
                  {preprocessMath(paperContent)}
                </ReactMarkdown>

              </div>
            )}

            {showLoader && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
                  <div
                    className="loader-bar h-full bg-indigo-500"
                    style={{ width: `${loaderProgress}%` }}
                  ></div>
                </div>
                <div className="text-indigo-400 font-mono text-xs animate-pulse">
                  {loaderText}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILab;