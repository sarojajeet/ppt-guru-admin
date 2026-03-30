import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

const JoditProEditor = forwardRef(({ value, onChange, config = {}, apiKey }, ref) => {
  const textareaRef = useRef(null);
  const editorRef = useRef(null);

  useImperativeHandle(ref, () => ({
    get value() {
      return editorRef.current?.value;
    },
    set value(val) {
      if (editorRef.current) {
        editorRef.current.value = val;
      }
    },
    editor: editorRef.current
  }));

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://cloud.xdsoft.net/v4/jodit-pro/?key=${apiKey}`;

    script.onload = async () => {
  if (!window.JoditLoader) {
    console.error("JoditLoader not found");
    return;
  }

  await window.JoditLoader.ready();

  if (!window.Jodit) {
    console.error("Jodit not loaded");
    return;
  }

  editorRef.current = window.Jodit.make(textareaRef.current, {
    ...config,
    events: {
      change: (newValue) => {
        onChange?.(newValue);
      },
      ...(config.events || {})
    }
  });

  if (value) {
    editorRef.current.value = value;
  }
};

    document.head.appendChild(script);

    return () => {
      if (editorRef.current) {
        editorRef.current.destruct();
      }
      document.head.removeChild(script);
    };
  }, [apiKey]);

  // Sync external value updates
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.value) {
      editorRef.current.value = value;
    }
  }, [value]);

  return <textarea ref={textareaRef} />;
});

export default JoditProEditor;