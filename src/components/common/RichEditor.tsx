import type { FC } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface RichEditorProps {
  value: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
}

export const RichEditor: FC<RichEditorProps> = ({
  value,
  onChange,
  placeholder = "Write something...",
  minHeight = "150px",
  readOnly = false,
}) => {
  const modules = {
    toolbar: readOnly
      ? false
      : [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [
            { list: "ordered" },
            { list: "bullet" },
            { indent: "-1" },
            { indent: "+1" },
          ],
          ["link", "code-block"],
          ["clean"],
        ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "indent",
    "link",
    "code-block",
  ];

  return (
    <div
      className={`rich-editor-wrapper ${readOnly ? "read-only" : ""}`}
      style={{ marginBottom: readOnly ? "0" : "10px" }}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={readOnly ? undefined : onChange}
        modules={modules}
        formats={formats}
        placeholder={readOnly ? "" : placeholder}
        readOnly={readOnly}
        style={{
          background: readOnly ? "transparent" : "rgba(255, 255, 255, 0.05)",
          color: "#fff",
          borderRadius: "8px",
        }}
      />
      <style>{`
        /* Edit Mode Styles */
        .rich-editor-wrapper:not(.read-only) .ql-toolbar {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .rich-editor-wrapper:not(.read-only) .ql-container {
          border-color: rgba(255, 255, 255, 0.2);
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          min-height: ${minHeight};
          font-size: 0.95rem;
        }

        /* Read Only Mode Styles */
        .rich-editor-wrapper.read-only .ql-container.ql-snow {
          border: none;
        }
        .rich-editor-wrapper.read-only .ql-editor {
          padding: 0;
          min-height: auto;
          font-size: 0.85rem;
          color: var(--text-main);
        }

        /* Shared Styles */
        .rich-editor-wrapper .ql-editor.ql-blank::before {
          color: rgba(255, 255, 255, 0.4);
          font-style: normal;
        }
        .rich-editor-wrapper .ql-snow .ql-stroke {
          stroke: #fff;
        }
        .rich-editor-wrapper .ql-snow .ql-fill {
          fill: #fff;
        }
        .rich-editor-wrapper .ql-snow .ql-picker {
          color: #fff;
        }
        .rich-editor-wrapper .ql-snow .ql-picker-options {
          background-color: #333;
          border-color: #444;
        }
      `}</style>
    </div>
  );
};
