
import { analyzeDocument } from '@/services/api';
import React, { useState } from 'react';
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useNavigate } from 'react-router-dom';

const preprocessMath = (content) => {
  if (!content) return "";
  return content
    .replace(/\\\[(.*?)\\\]/gs, '$$$1$$') // Block math \[ ... \] -> $$ ... $$
    .replace(/\\\((.*?)\\\)/gs, '$$$1$$'); // Inline math \( ... \) -> $ ... $
};

const AILab = () => {
  const navigate = useNavigate();
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

  const openEditor = () => {
    if (!documentId) {
      alert("No document loaded. Please upload a file first.");
      return;
    }
    // Navigate to editor page
    navigate(`/editor/${documentId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            AI Processing Lab
          </h1>
          <p className="text-slate-400">Test Mathpix OCR & AI Formatting Engine</p>
          <button
            onClick={resetLab}
            className="mt-4 px-4 py-2 bg-red-600/20 border border-red-500 text-red-400 rounded-lg hover:bg-red-600/40 transition"
          >
            <i className="ri-restart-line mr-2"></i>
            Reset Engine
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-2xl p-8 hover:border-blue-500 transition-all duration-300">
              <label className="cursor-pointer flex flex-col items-center gap-4">
                <i className="ri-upload-cloud-2-fill text-6xl text-blue-500"></i>
                <div className="text-center">
                  <p className="text-lg font-bold">Upload Document</p>
                  <p className="text-sm text-slate-500">PDF, JPG, PNG supported</p>
                </div>
                <input
                  type="file"
                  onChange={runLabSimulation}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </label>
            </div>

            {/* Pipeline Steps */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <i className="ri-cpu-line text-purple-500"></i>
                Neural Pipeline
              </h3>
              {pipelineSteps.length === 0 ? (
                <p className="text-slate-600 text-center py-8">Engine Idle...</p>
              ) : (
                pipelineSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 mb-3 rounded-xl border bg-gradient-to-r ${step.color === 'green' ? 'from-green-900/20 to-green-800/20 border-green-700' :
                      step.color === 'yellow' ? 'from-yellow-900/20 to-yellow-800/20 border-yellow-700' :
                        step.color === 'blue' ? 'from-blue-900/20 to-blue-800/20 border-blue-700' :
                          'from-purple-900/20 to-purple-800/20 border-purple-700'
                      }`}
                  >
                    <i className={`${step.icon} text-2xl ${step.status === 'processing' ? 'animate-spin' : ''}`}></i>
                    <div className="flex-1">
                      <p className="font-bold">{step.title}</p>
                      <p className="text-xs text-slate-400">{step.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 relative min-h-[600px]">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <i className="ri-eye-line text-indigo-500"></i>
              Live Output
            </h3>

            {/* Edit Content Button */}
            {showPreview && (
              <div className="absolute top-6 right-6 z-10">
                <button
                  onClick={openEditor}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold py-3 px-6 rounded-lg shadow-2xl transition-all duration-200 flex items-center gap-2 hover:scale-105"
                >
                  <i className="ri-edit-box-fill"></i>
                  Edit Content
                </button>
              </div>
            )}

            {!showPreview && !showLoader && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-slate-700 font-mono text-xl tracking-widest animate-pulse">
                  WAITING FOR INPUT STREAM
                </p>
              </div>
            )}

            {showPreview && (
              <div className="bg-white text-slate-900 rounded-xl p-8 overflow-y-auto max-h-[550px] shadow-inner">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[[rehypeKatex, { strict: false }]]}
                  >
                    {preprocessMath(paperContent)}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {showLoader && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 border-8 border-slate-800 rounded-full"></div>
                  <div
                    className="absolute inset-0 border-8 border-t-blue-500 border-r-purple-500 border-transparent rounded-full animate-spin"
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                    {loaderProgress}%
                  </div>
                </div>
                <p className="text-sm font-mono tracking-wider text-blue-400 animate-pulse">
                  {loaderText}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILab;