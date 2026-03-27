import React, { useRef, useMemo, useCallback, useState, useEffect } from "react";
import "./editor.css";

import { useParams } from "react-router-dom";
import JoditEditor from 'jodit-pro-react'; // ← Pro version
import 'jodit/es2021/jodit.min.css';
// import "jodit-pro/es2021/jodit.min.css";
import "katex/dist/katex.min.css";
import "mathlive";
import { getDocument } from "@/services/api";
const applyEditorColumns = (root, count) => {
  if (!root) return false;

  const normalizedCount = Math.max(1, count);
  root.dataset.columnCount = String(normalizedCount);
  root.classList.toggle('jodit-multi-column-layout', normalizedCount > 1);
root.style.columnCount = normalizedCount;
root.style.columnGap = normalizedCount > 1 ? '40px' : '0';
root.style.columnFill = normalizedCount > 1 ? 'balance' : 'auto';
  if (normalizedCount > 1) {
    return wrapTablesForColumns(root);
  }

  return unwrapTablesForSingleColumn(root);
};
const cleanupEmptyColumnTableWrappers = (root) => {
  if (!root) return false;

  let changed = false;

  root.querySelectorAll('.column-table-wrapper').forEach((wrapper) => {
    // If wrapper has no table inside, remove it
    if (!wrapper.querySelector('table')) {
      wrapper.remove();
      changed = true;
    }
  });

  return changed;
};
const unwrapTablesForSingleColumn = (root) => {
  if (!root) return false;

  let changed = false;

  root.querySelectorAll('.column-table-wrapper').forEach((wrapper) => {
    const table = wrapper.querySelector('table');
    if (table) {
      wrapper.parentNode.insertBefore(table, wrapper);
    }
    wrapper.remove();
    changed = true;
  });

  return changed;
};
const wrapTablesForColumns = (root) => {
  if (!root) return false;
const COLUMN_TABLE_WRAPPER_CLASS = "column-table-wrapper";
  let changed = cleanupEmptyColumnTableWrappers(root);
  root.querySelectorAll('table').forEach((table) => {
    if (table.closest(`.${COLUMN_TABLE_WRAPPER_CLASS}`)) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = COLUMN_TABLE_WRAPPER_CLASS;
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
    changed = true;
  });

  return changed;
};
const TextEditor = () => {

  const { documentId } = useParams();
  const editor = useRef(null);
  const [headerText, setHeaderText] = useState("Bihar Board Class 10th Notes");
  const [footerText, setFooterText] = useState("Powered by SlideGuru");
  const [watermarkText, setWatermarkText] = useState("SLIDEGURU");
  const [saveStatus, setSaveStatus] = useState('Saved to cloud ☁️'); 
const [columnCount, setColumnCount] = useState(1);
   const [watermarkImage, setWatermarkImage] = useState("");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.1);

    const stateRef = useRef({ headerText, footerText, watermarkText, watermarkImage, watermarkOpacity, setSaveStatus });
  useEffect(() => {
    stateRef.current = { headerText, footerText, watermarkText, watermarkImage, watermarkOpacity, setSaveStatus };
  }, [headerText, footerText, watermarkText, watermarkImage, watermarkOpacity, setSaveStatus]);

   

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


const handleExportPDF = useCallback(async () => {
  try {
    if (!editor.current) return;

    const rawHTML =
      editor.current?.value ||
      editor.current?.editor?.innerHTML ||
      "";

    const latexContent = convertMathLiveToLatex(rawHTML);

    const response = await fetch("https://lionfish-app-pk8s6.ondigitalocean.app/api/document/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: latexContent, columnCount:1 }), // ✅ send it
    });

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
}, []); 

const config = useMemo(() => ({
  readonly: false,
  // placeholder: "Start typing...",
  height: "auto",
  width: '100%',
license:'e5fb6af5-5f57-4d85-9264-3dced3379a60',
  toolbarAdaptive: false,   // ❗ IMPORTANT
  buttons: [
      'bold', 'italic', 'underline', 'strikethrough', 'eraser', '|',
      'ul', 'ol', 'indent', 'outdent', '|',
      'font', 'fontsize', 'paragraph', '|',
      'brush', 'color', '|',
      'align', 'table', 'link', 'image', 'hr', '|',
      'undo', 'redo', '|',
      'branding', 'fullsize', 'print', 'exportPDF', 'columns', 'pageBreak',
    ],

  controls:{
    columns: {
        name: 'columns',
        iconURL: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiAzaDdhMiAyIDAgMCAxIDIgMnYxNGEyIDIgMCAwIDEtMiAyaC03bTAtMThINWEyIDIgMCAwIDAtMiAydjE0YTIgMiAwIDAgMCAyIDJoN20wLTE4djE4Ii8+PC9zdmc+',
        tooltip: 'Columns',
        popup: (editor, current, close) => {
          const div = editor.create.fromHTML(`
            <div style="display:flex; flex-direction:column; background:white; min-width:120px; font-family:Inter,sans-serif; padding:4px;">
              <button class="col-btn" data-val="1" style="border:none; background:transparent; padding:8px 12px; text-align:left; cursor:pointer; width:100%; border-radius:4px;  color:#000000">One</button>
              <button class="col-btn" data-val="2" style="border:none; background:transparent; padding:8px 12px; text-align:left; cursor:pointer; width:100%; border-radius:4px; color:#000000;">Two</button>
              <button class="col-btn" data-val="3" style="border:none; background:transparent; padding:8px 12px; text-align:left; cursor:pointer; width:100%; border-radius:4px; color:#000000;">Three</button>
            </div>
          `);
          
          div.querySelectorAll('.col-btn').forEach(btn => {
            btn.addEventListener('mouseenter', e => e.target.style.backgroundColor = '#f3f4f6');
            btn.addEventListener('mouseleave', e => e.target.style.backgroundColor = 'transparent');
           btn.addEventListener('click', (e) => {
  const val = Number.parseInt(e.target.getAttribute('data-val') || '1', 10);

  const wysiwyg = editor.editor;
  if (!wysiwyg) return;

  applyEditorColumns(wysiwyg, val);

  setColumnCount(val); // ✅ STORE VALUE HERE

  editor.events.fire('change');
  close();
});
          });
          
          return div;
        }
      },
      branding: {
        name: 'branding',
        tooltip: 'Document Branding',
        iconURL: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMmwtMSAxbC0yLTFsMiAyIDMgMUwxMiAyIi8+PHBhdGggZD0iTTUgMTIgQTYuNSA2LjUgMCAwIDAgMTEuNSA1LjUiLz48cGF0aCBkPSJNMTEuNSAxOC41QTYuNSA2LjUgMCAwIDAgMTggMTIiLz48cGF0aCBkPSJNMTIgMTJoLjAxIi8+PC9zdmc+',
        popup: (editor, current, close) => {
          const div = editor.create.fromHTML(`
            <div style="display:flex; flex-direction:column; background:#ffffff; width:280px; font-family:'Inter',sans-serif; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.12); border:1px solid #e5e7eb; overflow:hidden;">
              <div style="background:#f8f9fa; padding:12px 16px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; gap:8px;">
                <svg width="16" height="16" fill="none" stroke="#4b5563" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2l-1 1l-2-1l2 2 3 1L12 2"/><path d="M5 12A6.5 6.5 0 0 0 11.5 5.5"/><path d="M11.5 18.5A6.5 6.5 0 0 0 18 12"/><path d="M12 12h.01"/></svg>
                <h4 style="margin:0; font-size:14px; font-weight:600; color:#1f2937;">Document Settings</h4>
              </div>
              
              <div style="padding:16px; display:flex; flex-direction:column; gap:16px;">
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <label style="font-size:12px; font-weight:500; color:#4b5563;">Page Header Text</label>
                  <input id="branding-header" type="text" placeholder="e.g. Chapter 1: Introduction" style="padding:8px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px; width: 100%; box-sizing: border-box; outline:none; transition:border 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#d1d5db'" />
                </div>
                
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <label style="font-size:12px; font-weight:500; color:#4b5563;">Page Footer Text</label>
                  <input id="branding-footer" type="text" placeholder="e.g. Powered by SlideGuru" style="padding:8px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px; width: 100%; box-sizing: border-box; outline:none; transition:border 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#d1d5db'" />
                </div>
                
                <div style="height:1px; background:#e5e7eb; margin:4px 0;"></div>
                
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <label style="font-size:12px; font-weight:500; color:#4b5563;">Background Watermark (Text)</label>
                  <input id="branding-watermark-text" type="text" placeholder="e.g. CONFIDENTIAL" style="padding:8px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px; width: 100%; box-sizing: border-box; outline:none; transition:border 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#d1d5db'" />
                </div>
                
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <label style="font-size:12px; font-weight:500; color:#4b5563; display:flex; justify-content:space-between;">
                    <span>Watermark (Image URL)</span>
                    <span style="font-size:10px; color:#9ca3af; background:#f3f4f6; padding:0 4px; border-radius:3px;">Overrides Text</span>
                  </label>
                  <input id="branding-watermark-image" type="text" placeholder="https://..." style="padding:8px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px; width: 100%; box-sizing: border-box; outline:none; transition:border 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#d1d5db'" />
                </div>
                
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <label style="font-size:12px; font-weight:500; color:#4b5563;">Image Transparency</label>
                    <span id="opacity-val-display" style="font-size:11px; color:#6b7280; font-weight:600;">10%</span>
                  </div>
                  <input id="branding-watermark-opacity" type="range" min="0.05" max="1" step="0.05" style="accent-color:#2563eb; cursor:pointer;" />
                </div>
                
                <button id="branding-save-btn" style="margin-top:8px; background:#2563eb; color:white; border:none; padding:10px; border-radius:6px; font-weight:600; font-size:13px; cursor:pointer; transition:background 0.2s;">
                  Apply Branding
                </button>
              </div>
            </div>
          `);

          // Populate current state (Detached from React Render Loop)
          div.querySelector('#branding-header').value = headerText;
          div.querySelector('#branding-footer').value = footerText;
          div.querySelector('#branding-watermark-text').value = watermarkText;
          div.querySelector('#branding-watermark-image').value = watermarkImage;
          div.querySelector('#branding-watermark-opacity').value = watermarkOpacity;
          div.querySelector('#opacity-val-display').innerText = Math.round(watermarkOpacity * 100) + '%';

          // Live display update for slider
          div.querySelector('#branding-watermark-opacity').addEventListener('input', (e) => {
             div.querySelector('#opacity-val-display').innerText = Math.round(e.target.value * 100) + '%';
          });

          // Attach hover effect
          const saveBtn = div.querySelector('#branding-save-btn');
          saveBtn.addEventListener('mouseenter', () => saveBtn.style.background = '#1d4ed8');
          saveBtn.addEventListener('mouseleave', () => saveBtn.style.background = '#2563eb');

          // Save and Sync to React ONLY on button click
          saveBtn.addEventListener('click', () => {
            setHeaderText(div.querySelector('#branding-header').value);
            setFooterText(div.querySelector('#branding-footer').value);
            setWatermarkText(div.querySelector('#branding-watermark-text').value);
            setWatermarkImage(div.querySelector('#branding-watermark-image').value);
            setWatermarkOpacity(parseFloat(div.querySelector('#branding-watermark-opacity').value));
            close();
          });

          return div;
        }
      },
      exportPDF: {
  name: "exportPDF",
  tooltip: "Export as PDF",
  iconURL:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTIxIDE1djRhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJ2LTRNMTcgOHY2TDEyIDE5IDcgMTQiLz48cGF0aCBkPSJNMTIgMTlWMyIvPjwvc3ZnPg==",
  exec: () => {
    handleExportPDF();
  },
}
  },

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
}), [handleExportPDF]);

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
    <div className="editor-container">
      <div className="editor-wrapper">
        <JoditEditor
          ref={editor}
          value={convertLatexToMathLive(content)}
          config={config}
          tabIndex={1}
          onBlur={handleBlur}
          onChange={() => {}}
        />
      </div>
    </div>
  );
};

export default TextEditor;

