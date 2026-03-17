// import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import JoditEditor from "jodit-react";
// import "./TextEditorFinal.css";
// import { getDocument } from "@/services/api";

// const TextEditorFinal = () => {
//   const { documentId } = useParams(); // get ID from URL
//   const editor = useRef(null);

//   const [content, setContent] = useState("");
//   const [loading, setLoading] = useState(true);
// console.log("content:", content);
//   // Fetch document on load
//   useEffect(() => {
//     const fetchDocument = async () => {
//       try {
//         const res = await getDocument(documentId);
//         console.log("Fetched document:", res?.data);
        
//         // assuming response like: { A4content: "<p>data</p>" }
//         setContent(res?.data?.A4content || "");
//       } catch (error) {
//         console.error("Error fetching document:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (documentId) {
//       fetchDocument();
//     }
//   }, [documentId]);

//   const config = useMemo(
//     () => ({
//       readonly: false,
//       placeholder: "Start typing...",
//       height: 400,
//     }),
//     []
//   );

//   const handleBlur = useCallback((newContent) => {
//     setContent(newContent);
//   }, []);

//   if (loading) return <p>Loading...</p>;

// return (
//   <div className="main-content">
//     <h1>Text Editor</h1>

//     <div className="editor-container">
//       <JoditEditor
//         ref={editor}
//         value={content}
//         config={config}
//         tabIndex={1}
//         onBlur={handleBlur}
//         onChange={() => {}}
//       />
//     </div>

//     <div className="preview-container">
//       <h2>Preview:</h2>
//       <div dangerouslySetInnerHTML={{ __html: content }} />
//     </div>
//   </div>
// );
// };

// export default TextEditorFinal;

import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import JoditEditor from "jodit-react";
import "./TextEditorFinal.css";
import { getDocument } from "@/services/api";

// ─── MathJax ko window mein load karo ───────────────────────────────────────
const loadMathJax = () => {
  return new Promise((resolve) => {
    if (window.MathJax) return resolve();

    window.MathJax = {
      tex: { inlineMath: [["\\(", "\\)"]], displayMath: [["\\[", "\\]"]] },
      svg: { fontCache: "global" },
      startup: { ready() { window.MathJax.startup.defaultReady(); resolve(); } },
    };

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
    script.async = true;
    document.head.appendChild(script);
  });
};

// ─── Kisi bhi DOM node mein math re-render karo ─────────────────────────────
const renderMath = (node) => {
  if (!node || !window.MathJax?.typesetPromise) return;
  window.MathJax.typesetPromise([node]).catch(console.error);
};

// ─────────────────────────────────────────────────────────────────────────────

const TextEditorFinal = () => {
  const { documentId } = useParams();
  const editor = useRef(null);
  const previewRef = useRef(null);   // ← preview div ka ref

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  // MathJax ek baar load karo
  useEffect(() => { loadMathJax(); }, []);

  // Document fetch karo
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await getDocument(documentId);
        setContent(res?.data?.A4content || "");
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (documentId) fetchDocument();
  }, [documentId]);

  // Content badle → preview mein math re-render karo
  useEffect(() => {
    if (previewRef.current) renderMath(previewRef.current);
  }, [content]);

  // Editor ke andar bhi re-render karo (Jodit iframe ke baad)
  useEffect(() => {
    if (!editor.current) return;
    const timer = setTimeout(() => {
      const iframe = editor.current?.workplace?.querySelector("iframe");
      const doc = iframe?.contentDocument;
      if (doc?.body) renderMath(doc.body);
      else if (editor.current?.workplace) renderMath(editor.current.workplace);
    }, 500); // Jodit fully load hone ka wait
    return () => clearTimeout(timer);
  }, [content]);

  const config = useMemo(() => ({
    readonly: false,
    placeholder: "Start typing...",
    height: 500,
    // MathJax CDN Jodit ke andar bhi inject karo
    extraCSS: "",
    iframe: true, // optional: true ho to alag inject karna padega
    events: {
      afterSetValue() {
        // Jodit content set hone ke baad math render
        setTimeout(() => {
          if (this.workplace) renderMath(this.workplace);
        }, 300);
      },
    },
  }), []);

  const handleBlur = useCallback((newContent) => {
    setContent(newContent);
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="main-content">
      <h1>Text Editor</h1>

      <div className="editor-container">
        <JoditEditor
          ref={editor}
          value={content}
          config={config}
          tabIndex={1}
          onBlur={handleBlur}
          onChange={() => {}}
        />
      </div>

      {/* ── Preview: ref lagao taaki MathJax yahan render kare ── */}
      <div className="preview-container">
        <h2>Preview:</h2>
        <div
          ref={previewRef}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
};

export default TextEditorFinal;