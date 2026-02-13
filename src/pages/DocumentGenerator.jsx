import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Presentation, Upload, CheckCircle2, Loader2, Download, RefreshCcw, ArrowUpRight } from "lucide-react";
import api from "@/lib/api";

export default function DocumentGenerator() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("A4"); // Default selection
  const [status, setStatus] = useState("idle"); // idle, processing, success
const [downloadUrl, setDownloadUrl] = useState(null);
//   const handleGenerate = () => {
//     setStatus("processing");
//     // Simulate the API call provided in your backend code
//     setTimeout(() => setStatus("success"), 3000);
//   };

// const handleGenerate = async () => {
//   if (!file) return;

//   setStatus("processing");

//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("type", type);

//   try {
//     const response = await api.post("/document/generate", formData, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     });

//     // assuming backend returns { generatedFile: "url" }
//     window.location.href = response.data.generatedFile;
//     setStatus("success");
//   } catch (err) {
//     console.error(err);
//     alert("Generation failed");
//     setStatus("idle");
//   }
// };
const handleGenerate = async () => {
  if (!file) return;

  setStatus("processing");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  try {
    const response = await api.post("/document/generate", formData);

    const fileName = response.data.fileName;
    const fileUrl = `http://localhost:5000/files/${fileName}`;

    setDownloadUrl(fileUrl);
    setStatus("success");
  } catch (err) {
    console.error(err);
    alert("Generation failed");
    setStatus("idle");
  }
};
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Document AI</h1>
        <p className="text-slate-500">Transform images and PDFs into professional A4 documents or PPT presentations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Configuration */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-slate-400">1. Select Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button 
                onClick={() => setType("A4")}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${type === "A4" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-slate-200 text-slate-600"}`}
              >
                <FileText size={20} />
                <span className="font-semibold">A4 Document</span>
              </button>
              <button 
                onClick={() => setType("PPT")}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${type === "PPT" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-slate-200 text-slate-600"}`}
              >
                <Presentation size={20} />
                <span className="font-semibold">PowerPoint</span>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Upload & Processing */}
        <div className="md:col-span-2 space-y-6">
          <Card className="min-h-[400px] flex flex-col justify-center border-dashed border-2">
            <CardContent className="flex flex-col items-center py-10 text-center">
              {status === "idle" && (
                <>
                  <div className="h-20 w-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                    <Upload size={32} />
                  </div>
                  <h3 className="text-lg font-bold">Upload Source File</h3>
                  <p className="text-slate-500 mb-6 max-w-xs">Drop your image or PDF here. AI will extract text and format it.</p>
                  <input type="file" id="file-upload" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                  <label htmlFor="file-upload" className="cursor-pointer bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors">
                    {file ? file.name : "Select File"}
                  </label>
                  {file && (
                    <button 
                      onClick={handleGenerate}
                      className="mt-4 flex items-center gap-2 text-indigo-600 font-semibold hover:underline"
                    >
                      Start Generation <ArrowUpRight size={16} />
                    </button>
                  )}
                </>
              )}

              {status === "processing" && (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mx-auto" />
                  <h3 className="text-xl font-bold">AI is working...</h3>
                  <div className="text-sm text-slate-500 space-y-1">
                    <p className="animate-pulse">1. Extracting text via OCR</p>
                    <p className="opacity-50">2. Organizing with AI</p>
                    <p className="opacity-50">3. Building {type} file</p>
                  </div>
                </div>
              )}
{status === "success" && (
  <div className="space-y-6">
    <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
      <CheckCircle2 size={40} />
    </div>
    <div>
      <h3 className="text-2xl font-bold">Generation Complete!</h3>
      <p>Your {type} file is ready.</p>
    </div>

    <div className="flex gap-3 justify-center">
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold"
      >
        <Download size={18} /> Download
      </a>

      <button
        onClick={() => setStatus("idle")}
        className="flex items-center gap-2 border px-6 py-3 rounded-xl"
      >
        <RefreshCcw size={18} /> New File
      </button>
    </div>
  </div>
)}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}