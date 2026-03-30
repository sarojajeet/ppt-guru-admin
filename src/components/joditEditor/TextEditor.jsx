import React, { useRef, useState, useEffect, useCallback } from "react";
import "./editor.css";
import { useParams } from "react-router-dom";
import "katex/dist/katex.min.css";
import "mathlive";
import { getDocument } from "@/services/api";




// ─── LaTeX ↔ MathLive Helpers ───────────────────────────────────────────────

const convertLatexToMathLive = (html) =>
  html.replace(
    /\\\((.*?)\\\)/g,
    (_, formula) =>
      `<math-field class="math-field" readonly>${formula}</math-field>`
  );

const convertMathLiveToLatex = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll("math-field").forEach((el) => {
    const latex = el.getValue?.() ?? el.innerText ?? "";
    el.replaceWith(document.createTextNode(`\\(${latex}\\)`));
  });
  return div.innerHTML;
};

// ─── JODIT CLOUD API KEY ─────────────────────────────────────────────────────
const JODIT_CLOUD_API_KEY = "e5fb6af5-5f57-4d85-9264-3dced3379a60"; // ← Replace with your key

// ─── Main Component ──────────────────────────────────────────────────────────

const TextEditor = () => {
  const { documentId } = useParams();

  // DOM refs
  const textareaRef = useRef(null);
  const editorRef = useRef(null); // holds the Jodit instance
  const scriptRef = useRef(null);

  // State
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [editorReady, setEditorReady] = useState(false);

  const [headerText, setHeaderText] = useState("Bihar Board Class 10th Notes");
  const [footerText, setFooterText] = useState("Powered by SlideGuru");
  const [watermarkText, setWatermarkText] = useState("SLIDEGURU");
  const [watermarkImage, setWatermarkImage] = useState("");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.1);
  const [columnCount, setColumnCount] = useState(1);
  const [saveStatus, setSaveStatus] = useState("Saved to cloud ☁️");

  // Keep a ref of branding state so Jodit popup closures always read fresh values
  const brandingRef = useRef({
    headerText,
    footerText,
    watermarkText,
    watermarkImage,
    watermarkOpacity,
  });
  useEffect(() => {
    brandingRef.current = {
      headerText,
      footerText,
      watermarkText,
      watermarkImage,
      watermarkOpacity,
    };
  }, [headerText, footerText, watermarkText, watermarkImage, watermarkOpacity]);

  // ── Fetch document ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await getDocument(documentId);
        setContent(res?.data?.A4content || "");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (documentId) fetchDocument();
  }, [documentId]);

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const handleExportPDF = useCallback(async () => {
    try {
      const jodit = editorRef.current;
      if (!jodit) return;
      const rawHTML = jodit.value || jodit.editor?.innerHTML || "";
      const latexContent = convertMathLiveToLatex(rawHTML);

      const response = await fetch(
        "https://lionfish-app-pk8s6.ondigitalocean.app/api/document/export-pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: latexContent,           columnCount: columnCount, // ✅ dynamic now
 }),
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "document.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("PDF export failed", err);
    }
  }, [columnCount]);

  // ── Build Jodit config object ───────────────────────────────────────────────
  // Defined as a function so we can call it after the Cloud script loads.
  // We capture handleExportPDF, brandingRef, setColumnCount via closure.
  const buildConfig = useCallback(() => {
    return {
      readonly: false,
      height: "auto",
      width: "100%",
      toolbarAdaptive: false,
      buttons: [
        "bold", "italic", "underline", "strikethrough", "eraser", "|",
        "ul", "ol", "indent", "outdent", "|",
        "font", "fontsize", "paragraph", "|",
        "brush", "color", "|",
        "align", "table", "link", "image", "hr", "|",
        "undo", "redo", "|",
        "branding", "fullsize", "print", "exportPDF", "columns", "pageBreak",
      ],
      controls: {
 columns: {
  name: "columns",
  tooltip: "Columns",
  list: {
    1: "1 Column",
    2: "2 Columns",
    3: "3 Columns",
  },
  exec: (editor, _, { control }) => {
    const col = parseInt(control.args[0]);

    setColumnCount(col);

    const editorContainer = editor.editor;
    editorContainer.style.columnCount = col;
    editorContainer.style.columnGap = "20px";
  },
},
        // ── Export PDF ────────────────────────────────────────────────────────
        exportPDF: {
          name: "exportPDF",
          tooltip: "Export as PDF",
          iconURL:
            "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTIxIDE1djRhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJ2LTRNMTcgOHY2TDEyIDE5IDcgMTQiLz48cGF0aCBkPSJNMTIgMTlWMyIvPjwvc3ZnPg==",
          exec: () => handleExportPDF(),
        },
      },

      uploader: { insertImageAsBase64URI: true },

      events: {
        beforeCommand() {
          try {
            const node = this.selection?.current();
            if (node?.closest?.("math-field")) return false;
          } catch (e) {
            console.warn("beforeCommand error", e);
          }
        },
        // Fired by Jodit Cloud after every content change
        change(newValue) {
          // We update React state lazily (same as onBlur before)
          // Uncomment below if you want live sync:
          // setContent(convertMathLiveToLatex(newValue));
        },
      },
    };
  }, [handleExportPDF]);

  // ── Load Jodit Cloud script & initialize editor ─────────────────────────────
  useEffect(() => {
    if (loading) return; // wait until content is fetched

    // Avoid double-loading
    if (scriptRef.current) return;

    const script = document.createElement("script");
    script.src = `https://cloud.xdsoft.net/v4/jodit-pro/?key=${JODIT_CLOUD_API_KEY}`;
    script.async = true;

    script.onload = () => {
      window.JoditLoader.ready().then(() => {
        if (!textareaRef.current) return;

        const config = buildConfig();

        const jodit = window.Jodit.make(textareaRef.current, config);

        // Set initial content (LaTeX → MathLive)
        jodit.value = convertLatexToMathLive(content);
// Apply column style after load
jodit.editor.style.columnCount = columnCount;
jodit.editor.style.columnGap = "20px";
        // Sync content back to React on blur (same behaviour as before)
        jodit.events.on("blur", () => {
          const latexContent = convertMathLiveToLatex(jodit.value);
          setContent(latexContent);
        });

        editorRef.current = jodit;
        setEditorReady(true);
      });
    };

    script.onerror = () => console.error("Failed to load Jodit Cloud script");

    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      // Cleanup on unmount
      if (editorRef.current) {
        editorRef.current.destruct();
        editorRef.current = null;
      }
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [loading, content, buildConfig]);

  // ── Enable click-to-edit on math-field elements ─────────────────────────────
  useEffect(() => {
    document.querySelectorAll(".math-field").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        el.removeAttribute("readonly");
        el.focus();
      });
      el.addEventListener("keydown", (e) => e.stopPropagation());
      el.addEventListener("blur", () => el.setAttribute("readonly", true));
    });
  }, [content, editorReady]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <p>Loading...</p>;

  return (
    <div className="editor-container">
      <div className="editor-wrapper">
        {/*
          Jodit Cloud replaces this <textarea> in-place.
          Do NOT set value here — Jodit manages the DOM directly.
        */}
        <textarea ref={textareaRef} style={{ display: "none" }} />
      </div>
    </div>
  );
};

export default TextEditor;