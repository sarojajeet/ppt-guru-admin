import React, { useEffect, useRef } from "react";

const JoditEditor = ({ value, onChange, config = {}, apiKey }) => {
  const textareaRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    // Prevent loading script multiple times
    if (window.Jodit) {
      initEditor();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/jodit-pro@latest/build/jodit.min.js";

    script.onload = () => {
      initEditor();
    };

    document.head.appendChild(script);

    function initEditor() {
      if (!textareaRef.current) return;

      editorRef.current = window.Jodit.make(textareaRef.current, {
        height: 500, // IMPORTANT (prevents blank UI)
        ...config,
        events: {
          ...(config.events || {}),
          change: (newValue) => {
            onChange?.(newValue);
          },
        },
      });

      if (value) {
        editorRef.current.value = value;
      }
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destruct();
      }
      // ❌ DO NOT REMOVE SCRIPT
    };
  }, [apiKey]);

  // ✅ Sync value updates (VERY IMPORTANT)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.value) {
      editorRef.current.value = value;
    }
  }, [value]);

  return <textarea ref={textareaRef} defaultValue={value} />;
};

export default JoditEditor;