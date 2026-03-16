import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import { getDocument } from '@/services/api';
import './WordEditor.css';
import katex from "katex";
import "katex/dist/katex.min.css";
// ---------------------------------------------------------------------------
// Markdown → HTML converter
// Handles: headings, hr, bold, italic, block/inline LaTeX, paragraphs
// ---------------------------------------------------------------------------
const markdownToHtml = (markdown) => {
  if (!markdown) return '';

  // Step 1 – protect LaTeX blocks from further processing
  const mathBlocks = [];
  let protected_ = markdown
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
      const idx = mathBlocks.length;
      mathBlocks.push(`<div class="math-block">\\[${math}\\]</div>`);
      return `%%MATHBLOCK${idx}%%`;
    })
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
      const idx = mathBlocks.length;
      mathBlocks.push(`<span class="math-inline">\\(${math}\\)</span>`);
      return `%%MATHBLOCK${idx}%%`;
    });

  // Step 2 – block-level transforms (line by line first)
  const lines = protected_.split('\n');
  const processedLines = lines.map(line => {
    if (/^### (.+)$/.test(line)) return `<h3>${line.replace(/^### /, '')}</h3>`;
    if (/^## (.+)$/.test(line))  return `<h2>${line.replace(/^## /, '')}</h2>`;
    if (/^# (.+)$/.test(line))   return `<h1>${line.replace(/^# /, '')}</h1>`;
    if (/^---$/.test(line.trim())) return '<hr/>';
    return line;
  });

  // Step 3 – group lines into paragraphs
  const blocks = processedLines.join('\n').split(/\n{2,}/);
  const html = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    // Already-tagged HTML elements — don't wrap
    if (/^<(h[1-6]|hr|div|ul|ol|li|table)/.test(trimmed)) return trimmed;

    // Inline markdown within the block
    let inline = trimmed
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em>$1</em>')
      .replace(/`(.+?)`/g,       '<code>$1</code>')
      .replace(/\n/g, '<br/>');

    return `<p>${inline}</p>`;
  }).join('\n');

  // Step 4 – restore math placeholders
  let final = html;
  mathBlocks.forEach((block, idx) => {
    final = final.replace(`%%MATHBLOCK${idx}%%`, block);
  });

  return final;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const WordEditor = () => {
  const { documentId } = useParams();
  const editorRef = useRef(null);

  const [content, setContent]           = useState('');
  console.log("Initial content:", content);
  const [isLoading, setIsLoading]       = useState(true);
  const [loadError, setLoadError]       = useState(null);
  const [saveStatus, setSaveStatus]     = useState('Saved to cloud ☁️');

  // Branding
  const [headerText, setHeaderText]               = useState('Bihar Board Class 10th Notes');
  const [footerText, setFooterText]               = useState('Powered by SlideGuru');
  const [watermarkText, setWatermarkText]         = useState('SLIDEGURU');
  const [watermarkImage, setWatermarkImage]       = useState('');
  const [watermarkOpacity, setWatermarkOpacity]   = useState(0.1);

  const timeoutRef  = useRef(null);
  const stateRef    = useRef({});

  const renderMath = useCallback(() => {
  if (!editorRef.current) return;

  const container = document.querySelector(".word-editor-wrapper");
  if (!container) return;

  // Block math
  container.querySelectorAll(".math-block").forEach((el) => {
    const tex = el.textContent.replace(/\\\[|\\\]/g, "").trim();

    try {
      katex.render(tex, el, {
        displayMode: true,
        throwOnError: false
      });
    } catch (err) {
      console.error("KaTeX block error:", err);
    }
  });

  // Inline math
  container.querySelectorAll(".math-inline").forEach((el) => {
    const tex = el.textContent.replace(/\\\(|\\\)/g, "").trim();

    try {
      katex.render(tex, el, {
        displayMode: false,
        throwOnError: false
      });
    } catch (err) {
      console.error("KaTeX inline error:", err);
    }
  });

}, []);

useEffect(() => {
  const timer = setTimeout(() => {
    renderMath();
  }, 50);

  return () => clearTimeout(timer);
}, [content, renderMath]);

  // Keep stateRef in sync so Jodit toolbar closures always have fresh values
  useEffect(() => {
    stateRef.current = {
      headerText,
      footerText,
      watermarkText,
      watermarkImage,
      watermarkOpacity,
      setSaveStatus,
    };
  }, [headerText, footerText, watermarkText, watermarkImage, watermarkOpacity]);

  // ---------------------------------------------------------------------------
  // Fetch document by ID from URL param
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!documentId) {
      setIsLoading(false);
      setLoadError('No document ID provided in the URL.');
      return;
    }

    const fetchDoc = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const doc = await getDocument(documentId);
        console.log("Fetched document:", doc);

        if (!doc) {
          throw new Error('Document not found.');
        }

        // Support both A4content (markdown) and direct html content
        if (doc.data.A4content) {
          setContent(markdownToHtml(doc.data.A4content));
        } else if (doc.htmlContent) {
          setContent(doc.htmlContent);
        } else {
          setContent('<p>This document appears to be empty.</p>');
        }

        // Restore branding if stored in doc
        if (doc.headerText)         setHeaderText(doc.headerText);
        if (doc.footerText)         setFooterText(doc.footerText);
        if (doc.watermarkText)      setWatermarkText(doc.watermarkText);
        if (doc.watermarkImage)     setWatermarkImage(doc.watermarkImage);
        if (doc.watermarkOpacity != null) setWatermarkOpacity(doc.watermarkOpacity);

      } catch (err) {
        console.error('Failed to load document:', err);
        setLoadError(err.message || 'Failed to load document.');
        setSaveStatus('Load failed ❌');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoc();
  }, [documentId]);

  // ---------------------------------------------------------------------------
  // Editor change handler with 1-second debounce save indicator
  // ---------------------------------------------------------------------------
  const handleEditorChange = useCallback((newContent) => {
    setContent(newContent);
    setSaveStatus('Saving...');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSaveStatus('Saved to cloud ☁️');
    }, 1000);
  }, []);

  // ---------------------------------------------------------------------------
  // Watermark background style
  // ---------------------------------------------------------------------------
  const getWatermarkStyle = () => {
    if (watermarkImage) return {};
    if (!watermarkText)  return { backgroundImage: 'none' };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123" viewBox="0 0 794 1123">
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="sans-serif" font-size="80" fill="rgba(0,0,0,0.04)"
        transform="rotate(-45, 397, 561)">${watermarkText}</text>
    </svg>`;
    return {
      backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
    };
  };

  // ---------------------------------------------------------------------------
  // Jodit config (memoised — deps excluded intentionally to prevent toolbar reset)
  // ---------------------------------------------------------------------------
  const config = useMemo(() => ({
    readonly: false,
    placeholder: '',
    minHeight: 1027,
    height: 1027,
    width: 794,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    toolbarSticky: false,
    toolbarAdaptive: false,
    imageBrowser: { enable: false },
    image: { editSrc: false, useImageEditor: false },
    resizer: { showSize: true, hideSizeTimeout: 1000 },
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', 'eraser', '|',
      'ul', 'ol', 'indent', 'outdent', '|',
      'font', 'fontsize', 'paragraph', '|',
      'brush', 'color', '|',
      'align', 'table', 'link', 'image', 'hr', '|',
      'undo', 'redo', '|',
      'branding', 'fullsize', 'print', 'exportPdf', 'columns', 'pageBreak',
    ],
    controls: {
      // ── Columns ────────────────────────────────────────────────────────────
      columns: {
        name: 'columns',
        iconURL:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiAzaDdhMiAyIDAgMCAxIDIgMnYxNGEyIDIgMCAwIDEtMiAyaC03bTAtMThINWEyIDIgMCAwIDAtMiAydjE0YTIgMiAwIDAgMCAyIDJoN20wLTE4djE4Ii8+PC9zdmc+',
        tooltip: 'Columns',
        popup: (editor, _current, close) => {
          const div = editor.create.fromHTML(`
            <div style="display:flex;flex-direction:column;background:white;min-width:120px;font-family:Inter,sans-serif;padding:4px;">
              <button class="col-btn" data-val="1" style="border:none;background:transparent;padding:8px 12px;text-align:left;cursor:pointer;width:100%;border-radius:4px;">One</button>
              <button class="col-btn" data-val="2" style="border:none;background:transparent;padding:8px 12px;text-align:left;cursor:pointer;width:100%;border-radius:4px;">Two</button>
              <button class="col-btn" data-val="3" style="border:none;background:transparent;padding:8px 12px;text-align:left;cursor:pointer;width:100%;border-radius:4px;">Three</button>
            </div>
          `);
          div.querySelectorAll('.col-btn').forEach(btn => {
            btn.addEventListener('mouseenter', e => (e.target.style.backgroundColor = '#f3f4f6'));
            btn.addEventListener('mouseleave', e => (e.target.style.backgroundColor = 'transparent'));
            btn.addEventListener('click', e => {
              const val = e.target.getAttribute('data-val');
              const wysiwyg = editor.editor;
              if (!wysiwyg) return;
              if (val === '1') {
                wysiwyg.style.columnCount = '1';
                wysiwyg.style.columnGap   = '0';
              } else if (val === '2') {
                wysiwyg.style.columnCount = '2';
                wysiwyg.style.columnGap   = '40px';
              } else {
                wysiwyg.style.columnCount = '3';
                wysiwyg.style.columnGap   = '40px';
              }
              close();
            });
          });
          return div;
        },
      },

      // ── Page Break ─────────────────────────────────────────────────────────
      pageBreak: {
        name: 'pageBreak',
        iconURL:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMSAxOEgzdjEtbTE4LTRIM3YtbTE4LTRIM1Y5bTE4IDRIM3YtbTE4IDhIM3pNMyA0aThsNCA0bTAtNHY0aDRtMCAxNGgtNG0wLTR2LTQiLz48L3N2Zz4=',
        tooltip: 'Insert Page Break',
        exec: editor => {
          editor.selection.insertHTML('<hr class="custom-page-break" />');
        },
      },

      // ── Export PDF ─────────────────────────────────────────────────────────
      exportPdf: {
        name: 'exportPdf',
        iconURL:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMSAxNXY0YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0ydi00TTcgMTBsNSA1IDUtNU0xMiAxNVYzIj48L3BhdGg+PC9zdmc+',
        tooltip: 'Download PDF',
        exec: async editor => {
          const {
            headerText, footerText, watermarkText,
            watermarkImage, watermarkOpacity, setSaveStatus,
          } = stateRef.current;

          setSaveStatus('Exporting PDF… ⏳');

          let overlayHtml = '';
          if (headerText)
            overlayHtml += `<div style="position:absolute;top:40px;left:0;right:0;text-align:center;font-family:serif;font-size:12px;color:#6b7280;">${headerText}</div>`;
          if (footerText)
            overlayHtml += `<div style="position:absolute;bottom:40px;left:0;right:0;text-align:center;font-family:serif;font-size:12px;color:#6b7280;">${footerText}</div>`;

          let watermarkHtml = '';
          if (watermarkImage) {
            watermarkHtml = `<img src="${watermarkImage}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:${watermarkOpacity};max-width:80%;max-height:80%;pointer-events:none;z-index:-1;" />`;
          } else if (watermarkText) {
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123" viewBox="0 0 794 1123">
              <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                font-family="sans-serif" font-size="80" fill="rgba(0,0,0,0.04)"
                transform="rotate(-45, 397, 561)">${watermarkText}</text>
            </svg>`;
            watermarkHtml = `<div style="position:absolute;inset:0;background-image:url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}');background-size:cover;pointer-events:none;z-index:-1;"></div>`;
          }

          let columnStyles = '';
          if (editor.editor) {
            const colCount = editor.editor.style.columnCount;
            const colGap   = editor.editor.style.columnGap;
            if (colCount && colCount !== '1')
              columnStyles = `column-count:${colCount};column-gap:${colGap};`;
          }

          const combinedHtml = `
            ${watermarkHtml}
            ${overlayHtml}
            <div style="padding:96px;font-family:Arial,sans-serif;box-sizing:border-box;width:794px;${columnStyles}">
              ${editor.value}
            </div>
          `;

          const designJson = {
            width: 794,
            height: 1123,
            slides: [{
              elements: [{
                type: 'html',
                content: combinedHtml,
                x: 0, y: 0,
                width: 794, height: 1123,
              }],
            }],
          };

          try {
            const response = await fetch('http://localhost:3001/export-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(designJson),
            });
            if (!response.ok) throw new Error('API error');
            const blob = await response.blob();
            const url  = window.URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = 'SlideGuru-Document.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setSaveStatus('PDF Exported ✅');
          } catch (e) {
            console.error(e);
            setSaveStatus('Export Failed ❌');
          }
          setTimeout(() => setSaveStatus('Saved to cloud ☁️'), 3000);
        },
      },

      // ── Print ──────────────────────────────────────────────────────────────
      print: {
        name: 'print',
        icon: 'print',
        tooltip: 'Print Document',
        exec: () => window.print(),
      },

      // ── Branding ───────────────────────────────────────────────────────────
      branding: {
        name: 'branding',
        tooltip: 'Document Branding',
        iconURL:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMmwtMSAxbC0yLTFsMiAyIDMgMUwxMiAyIi8+PHBhdGggZD0iTTUgMTIgQTYuNSA2LjUgMCAwIDAgMTEuNSA1LjUiLz48cGF0aCBkPSJNMTEuNSAxOC41QTYuNSA2LjUgMCAwIDAgMTggMTIiLz48cGF0aCBkPSJNMTIgMTJoLjAxIi8+PC9zdmc+',
        popup: (editor, _current, close) => {
          // Snapshot current branding state for the popup
          const snap = stateRef.current;

          const div = editor.create.fromHTML(`
            <div style="display:flex;flex-direction:column;background:#ffffff;width:280px;
              font-family:'Inter',sans-serif;border-radius:12px;
              box-shadow:0 8px 24px rgba(0,0,0,0.12);border:1px solid #e5e7eb;overflow:hidden;">

              <div style="background:#f8f9fa;padding:12px 16px;border-bottom:1px solid #e5e7eb;
                display:flex;align-items:center;gap:8px;">
                <svg width="16" height="16" fill="none" stroke="#4b5563" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M12 2l-1 1l-2-1l2 2 3 1L12 2"/>
                  <path d="M5 12A6.5 6.5 0 0 0 11.5 5.5"/>
                  <path d="M11.5 18.5A6.5 6.5 0 0 0 18 12"/>
                  <path d="M12 12h.01"/>
                </svg>
                <h4 style="margin:0;font-size:14px;font-weight:600;color:#1f2937;">Document Settings</h4>
              </div>

              <div style="padding:16px;display:flex;flex-direction:column;gap:16px;">
                <div style="display:flex;flex-direction:column;gap:6px;">
                  <label style="font-size:12px;font-weight:500;color:#4b5563;">Page Header Text</label>
                  <input id="b-header" type="text" placeholder="e.g. Chapter 1: Introduction"
                    style="padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;
                    width:100%;box-sizing:border-box;outline:none;"
                    onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#d1d5db'" />
                </div>

                <div style="display:flex;flex-direction:column;gap:6px;">
                  <label style="font-size:12px;font-weight:500;color:#4b5563;">Page Footer Text</label>
                  <input id="b-footer" type="text" placeholder="e.g. Powered by SlideGuru"
                    style="padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;
                    width:100%;box-sizing:border-box;outline:none;"
                    onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#d1d5db'" />
                </div>

                <div style="height:1px;background:#e5e7eb;margin:4px 0;"></div>

                <div style="display:flex;flex-direction:column;gap:6px;">
                  <label style="font-size:12px;font-weight:500;color:#4b5563;">Watermark Text</label>
                  <input id="b-wm-text" type="text" placeholder="e.g. CONFIDENTIAL"
                    style="padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;
                    width:100%;box-sizing:border-box;outline:none;"
                    onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#d1d5db'" />
                </div>

                <div style="display:flex;flex-direction:column;gap:6px;">
                  <label style="font-size:12px;font-weight:500;color:#4b5563;display:flex;
                    justify-content:space-between;">
                    <span>Watermark Image URL</span>
                    <span style="font-size:10px;color:#9ca3af;background:#f3f4f6;
                      padding:0 4px;border-radius:3px;">Overrides Text</span>
                  </label>
                  <input id="b-wm-img" type="text" placeholder="https://..."
                    style="padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;
                    width:100%;box-sizing:border-box;outline:none;"
                    onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#d1d5db'" />
                </div>

                <div style="display:flex;flex-direction:column;gap:6px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <label style="font-size:12px;font-weight:500;color:#4b5563;">Image Transparency</label>
                    <span id="b-opacity-label" style="font-size:11px;color:#6b7280;font-weight:600;">10%</span>
                  </div>
                  <input id="b-opacity" type="range" min="0.05" max="1" step="0.05"
                    style="accent-color:#2563eb;cursor:pointer;" />
                </div>

                <button id="b-save"
                  style="margin-top:8px;background:#2563eb;color:white;border:none;padding:10px;
                  border-radius:6px;font-weight:600;font-size:13px;cursor:pointer;">
                  Apply Branding
                </button>
              </div>
            </div>
          `);

          // Populate with current values
          div.querySelector('#b-header').value       = snap.headerText;
          div.querySelector('#b-footer').value       = snap.footerText;
          div.querySelector('#b-wm-text').value      = snap.watermarkText;
          div.querySelector('#b-wm-img').value       = snap.watermarkImage;
          div.querySelector('#b-opacity').value      = snap.watermarkOpacity;
          div.querySelector('#b-opacity-label').innerText =
            Math.round(snap.watermarkOpacity * 100) + '%';

          div.querySelector('#b-opacity').addEventListener('input', e => {
            div.querySelector('#b-opacity-label').innerText =
              Math.round(e.target.value * 100) + '%';
          });

          const saveBtn = div.querySelector('#b-save');
          saveBtn.addEventListener('mouseenter', () => (saveBtn.style.background = '#1d4ed8'));
          saveBtn.addEventListener('mouseleave', () => (saveBtn.style.background = '#2563eb'));
          saveBtn.addEventListener('click', () => {
            setHeaderText(div.querySelector('#b-header').value);
            setFooterText(div.querySelector('#b-footer').value);
            setWatermarkText(div.querySelector('#b-wm-text').value);
            setWatermarkImage(div.querySelector('#b-wm-img').value);
            setWatermarkOpacity(parseFloat(div.querySelector('#b-opacity').value));
            close();
          });

          return div;
        },
      },
    },
  }), []); // Intentionally empty — avoids Jodit toolbar re-mount on every keystroke

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="ms-word-app-shell">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="ms-word-header">
        <div className="ms-word-header-left">
          <div className="brand-logo">
            <svg className="brand-icon" viewBox="0 0 100 100" width="38" height="38"
              xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(45,50) rotate(-10) translate(-50,-50)">
                <rect x="25" y="15" width="50" height="70" rx="4" fill="#00793A"/>
              </g>
              <g transform="translate(55,55) rotate(5) translate(-50,-50)">
                <path d="M28,10 h32 l15,15 v52 a3,3 0 0,1 -3,3 h-44 a3,3 0 0,1 -3,-3 v-64 a3,3 0 0,1 3,-3 z"
                  fill="#FFFFFF" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.2))"/>
                <path d="M60,10 v15 h15 z" fill="#00A651"/>
                <rect x="33" y="28" width="16" height="4" rx="2" fill="#00A651"/>
                <rect x="33" y="38" width="30" height="4" rx="2" fill="#00A651"/>
                <rect x="33" y="48" width="30" height="4" rx="2" fill="#00A651"/>
                <rect x="33" y="58" width="30" height="4" rx="2" fill="#00A651"/>
                <rect x="33" y="68" width="22" height="4" rx="2" fill="#00A651"/>
              </g>
            </svg>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="brand-text-slide">Slide</span>
              <span className="brand-text-guru">Guru</span>
            </div>
          </div>
        </div>

        <div className="ms-word-header-right">
          <div className={`autosave-indicator ${saveStatus === 'Saving...' ? 'saving' : 'saved'}`}>
            {saveStatus === 'Saving...' ? (
              <><div className="save-spinner"/> Saving...</>
            ) : (
              <><span className="check-icon">✓</span> {saveStatus}</>
            )}
          </div>
        </div>
      </div>

      {/* ── Editor Area ─────────────────────────────────────────────────────── */}
      <div className="word-editor-scroll-area">
        <div className="word-editor-wrapper" style={getWatermarkStyle()}>

          {/* Screen-only image watermark */}
          {watermarkImage && (
            <img
              src={watermarkImage}
              className="screen-only screen-watermark-img"
              alt="Watermark"
              style={{ opacity: watermarkOpacity }}
            />
          )}

          {/* Loading state */}
          {isLoading && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.92)', zIndex: 10, gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '3px solid #e5e7eb', borderTopColor: '#2563eb',
                animation: 'spin 0.8s linear infinite',
              }}/>
              <span style={{ fontSize: 14, color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
                Loading document…
              </span>
            </div>
          )}

          {/* Error state */}
          {!isLoading && loadError && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 400, flexDirection: 'column', gap: 8,
              fontFamily: 'Inter, sans-serif',
            }}>
              <span style={{ fontSize: 32 }}>⚠️</span>
              <p style={{ fontSize: 15, color: '#ef4444', margin: 0 }}>{loadError}</p>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                Document ID: <code>{id}</code>
              </p>
            </div>
          )}

          {/* Editor — only render after load is complete and no error */}
          {!isLoading && !loadError && (
            <JoditEditor
              ref={editorRef}
              value={content}
              config={config}
              onBlur={() => handleEditorChange(content)}
              onChange={handleEditorChange}
            />
          )}

          {/* Print-only overlays */}
          <div className="print-only print-header">{headerText}</div>
          {watermarkImage
            ? <img src={watermarkImage} className="print-only print-watermark-img"
                alt="Watermark" style={{ opacity: watermarkOpacity }}/>
            : <div className="print-only print-watermark">{watermarkText}</div>
          }
          <div className="print-only print-footer">{footerText}</div>

        </div>
      </div>

      {/* Spinner keyframe — injected inline so no CSS file change needed */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default WordEditor;