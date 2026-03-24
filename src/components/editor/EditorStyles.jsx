export default function EditorStyles() {
    return (
        <style>{`
            .tiptap { outline: none; height: 100%; }
            .tiptap p { margin: 0 0 0.25em 0; }
            .tiptap h1, .tiptap h2, .tiptap h3 { margin: 0 0 0.25em 0; font-weight: 700; }
            .tiptap ul { padding-left: 1.4em; margin: 0.2em 0; list-style-type: disc; }
            .tiptap ol { padding-left: 1.4em; margin: 0.2em 0; list-style-type: decimal; }
            .tiptap li { margin: 0.1em 0; }
            .tiptap li p { margin: 0; }
            .tiptap p.is-editor-empty:first-child::before {
                content: attr(data-placeholder);
                float: left; color: rgba(148,163,184,0.4); pointer-events: none; height: 0;
            }

            .nn-select {
                background: var(--nn-bg-surface);
                color: var(--nn-text-primary);
                font-size: 12px;
                border-radius: 8px;
                padding: 6px 24px 6px 8px;
                outline: none;
                border: 1px solid var(--nn-border);
                transition: all 0.15s ease-out;
                cursor: pointer;
                appearance: none;
                -webkit-appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' fill='none' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 8px center;
            }
            .nn-select:hover {
                border-color: var(--nn-border-hover);
                background-color: var(--nn-bg-primary);
            }
            .nn-select:focus {
                border-color: var(--nn-accent-emerald);
                box-shadow: 0 0 0 2px var(--nn-accent-emerald-glow);
            }
            .nn-select option {
                background: var(--nn-bg-secondary);
                color: var(--nn-text-primary);
            }

            .nn-toolbar-btn {
                transition: all 0.15s ease-out;
            }
            .nn-toolbar-btn:hover:not(:disabled) {
                transform: translateY(-1px);
            }
            .nn-toolbar-btn:active:not(:disabled) {
                transform: translateY(0px);
            }

            .nn-sidebar-scroll::-webkit-scrollbar { width: 4px; }
            .nn-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
            .nn-sidebar-scroll::-webkit-scrollbar-thumb { background: var(--nn-text-disabled); border-radius: 4px; }
            .nn-sidebar-scroll::-webkit-scrollbar-thumb:hover { background: var(--nn-text-muted); }
            .nn-sidebar-scroll { scrollbar-width: thin; scrollbar-color: var(--nn-text-disabled) transparent; }

            @keyframes editorFadeIn {
                from { opacity: 0; transform: translateY(4px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* ── ProseMirror math overlay editor ─────────────── */
            .prosemirror-math-overlay-editor .ProseMirror {
                outline: none;
                white-space: pre-wrap;
                word-break: break-word;
            }
            .prosemirror-math-overlay-editor .ProseMirror p {
                margin: 0 0 0.3em 0;
            }
            /* Math source editing: visible text in the inline editor */
            .prosemirror-math-overlay-editor .math-node .math-src {
                color: #a78bfa;
            }
            .prosemirror-math-overlay-editor .math-node.ProseMirror-selectednode .math-src {
                color: #c4b5fd;
            }
            /* Selected math node background in dark theme */
            .prosemirror-math-overlay-editor math-display.ProseMirror-selectednode {
                background-color: rgba(167,139,250,0.15);
            }
            .prosemirror-math-overlay-editor .math-node.math-select .math-render {
                background-color: rgba(167,139,250,0.25);
            }
            /* Fix KaTeX render color inside dark overlay */
            .prosemirror-math-overlay-editor .math-render .katex {
                color: inherit;
            }
        `}</style>
    );
}
