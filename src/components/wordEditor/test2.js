import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import JoditEditor from "jodit-react";
import "katex/dist/katex.min.css";
import "mathlive";

import "./TextEditorFinal.css";
import { getDocument } from "@/services/api";
  // Handle insert math
 
const TextEditorWithMath = () => {
  const { documentId } = useParams();
  const editor = useRef(null);

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);



  // Fetch document
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

  // Convert LaTeX → math-field HTML
  const convertLatexToMathLive = (html) => {
    return html.replace(/\\\((.*?)\\\)/g, (_, formula) => {
      return `<math-field class="math-field" readonly>${formula}</math-field>`;
    });
  };

//    const insertMath = () => {
//     if (!editor.current) return;
//     const latex = "x^2";
//     editor.current.selection.insertHTML(`<math-field class="math-field">${latex}</math-field>`);
//   };
  // Convert math-field → LaTeX before saving
  const convertMathLiveToLatex = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;

    div.querySelectorAll("math-field").forEach((el) => {
      const latex = el.getValue();
      const textNode = document.createTextNode(`\\(${latex}\\)`);
      el.replaceWith(textNode);
    });

    return div.innerHTML;
  };

  // Handle insert math
  const insertMath = () => {
    if (!editor.current) return;

    const latex = "x^2";

    editor.current.selection.insertHTML(
      `<math-field class="math-field">${latex}</math-field>`
    );
  };

  // Jodit config
const config = useMemo(() => ({
  readonly: false,
  height: 400,

  buttons: [
    "bold",
    "italic",
    "underline",
    "|",
    "ul",
    "ol",
    "|",
     {
    name: "insertMath",
    iconURL: "https://cdn-icons-png.flaticon.com/512/992/992651.png",
    exec: insertMath,
    tooltip: "Insert Math",
  },
    "font",
    "fontsize",
    "brush",
    "|",
    "image",
    "link",
    "|",
    "align",
    "undo",
    "redo",
  ],

  uploader: {
    insertImageAsBase64URI: true,
  },

  events: {
    beforeCommand: function () {
      try {
        const node = this.selection?.current();

        if (node?.closest?.("math-field")) {
          return false;
        }
      } catch (e) {
        console.warn("beforeCommand error", e);
      }
    },
  },
}), []);

  // Handle blur → save content
  const handleBlur = (newContent) => {
    const latexContent = convertMathLiveToLatex(newContent);
    setContent(latexContent);
  };

  // Enable click-to-edit
useEffect(() => {
  const enableEditing = () => {
    document.querySelectorAll(".math-field").forEach((el) => {
      // Click to edit
      el.addEventListener("click", (e) => {
        e.stopPropagation(); // IMPORTANT
        el.removeAttribute("readonly");
        el.focus();
      });

      // Prevent Jodit from hijacking keyboard
      el.addEventListener("keydown", (e) => {
        e.stopPropagation(); // 🔥 KEY FIX
      });

      // Restore readonly on blur
      el.addEventListener("blur", () => {
        el.setAttribute("readonly", true);
      });
    });
  };

  enableEditing();
}, [content]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="main-content">
      <h1>Math Editor</h1>

      <div className="editor-container">
        <JoditEditor
          ref={editor}
          value={convertLatexToMathLive(content)}
          config={config}
          tabIndex={1}
          onBlur={handleBlur}
          onChange={() => {}}
        />
      </div>

     <div className="preview-container">
  <div className="a4-page">
    <h2>Preview (Saved LaTeX):</h2>
    <div dangerouslySetInnerHTML={{ __html: content }} />
  </div>
</div>
    </div>
  );
};

export default TextEditorWithMath;