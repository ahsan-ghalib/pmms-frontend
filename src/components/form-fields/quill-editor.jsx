"use client";
import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const QuillEditor = ({ value, onChange, placeholder, heightClass }) => {
  const editorRef = useRef(null);
  const quillInstanceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Initialize Quill once
    if (!quillInstanceRef.current) {
      quillInstanceRef.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: placeholder || "Enter rich text content...",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ font: [] }],
            [{ size: [] }],
            ["bold", "italic", "underline", "strike", "blockquote"],
            [
              { list: "ordered" },
              { list: "bullet" },
              { indent: "-1" },
              { indent: "+1" },
            ],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            ["link", "image", "video"],
            ["clean"],
          ],
        },
      });

      // Listen for text changes
      quillInstanceRef.current.on("text-change", () => {
        if (onChange) {
          const html = quillInstanceRef.current.root.innerHTML;
          onChange(html);
        }
      });

      // Set height constraints on Quill editor
      if (containerRef.current) {
        const container = containerRef.current;
        const quillContainer = container.querySelector('.ql-container');
        const quillEditor = container.querySelector('.ql-editor');
        
        if (quillContainer) {
          quillContainer.style.height = '100%';
          quillContainer.style.display = 'flex';
          quillContainer.style.flexDirection = 'column';
        }
        
        if (quillEditor) {
          quillEditor.style.flex = '1';
          quillEditor.style.overflowY = 'auto';
        }
      }
    }

    // Update value when it changes externally
    if (value !== quillInstanceRef.current.root.innerHTML) {
      quillInstanceRef.current.root.innerHTML = value || "";
    }
  }, [value, onChange, placeholder]);

  return (
    <div 
      ref={containerRef}
      className={`border border-gray-300 dark:border-white/10 rounded-md ${heightClass} overflow-hidden flex flex-col`}
    >
      <div ref={editorRef} className="flex-1 flex flex-col" />
    </div>
  );
};

export default QuillEditor;
