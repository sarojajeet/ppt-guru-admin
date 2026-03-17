import React, { useRef, useMemo, useCallback } from "react";
import JoditEditor from "jodit-react";

const TextEditor = ({ value, onChange }) => {
  const editor = useRef(null);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start typing...",
      height: 400,
      buttons: [
        "bold",
        "italic",
        "underline",
        "|",
        "ul",
        "ol",
        "|",
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
    }),
    []
  );

  const handleBlur = useCallback(
    (newContent) => {
      onChange(newContent);
    },
    [onChange]
  );

  return (
    <JoditEditor
      ref={editor}
      value={value}
      config={config}
      tabIndex={1}
      onBlur={handleBlur}
      onChange={() => {}}
    />
  );
};

export default TextEditor;