import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { useRef, useEffect, useState } from "react";
import { isHtmlContent, stripHtml } from "@/utils/htmlUtils";

function toEditorHtml(value: string): string {
  if (!value) return "<p></p>";
  if (isHtmlContent(value)) return value;
  return value.split("\n").map((line) => `<p>${line || "<br>"}</p>`).join("");
}

function toEmitValue(html: string): string {
  if (/<(strong|mark|em|s|u|a|code|ul|ol|li)\b/i.test(html)) return html;
  return stripHtml(html);
}

interface Props {
  value: string;
  onChange: (html: string) => void;
  rows?: number;
  autoFocus?: boolean;
  onCtrlEnter?: () => void;
}

export function RichTextEditor({ value, onChange, rows = 2, autoFocus = false, onCtrlEnter }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const lastHtml = useRef("");
  const onChangeRef = useRef(onChange);
  const onCtrlEnterRef = useRef(onCtrlEnter);
  const [activeMarks, setActiveMarks] = useState({ bold: false, highlight: false });

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onCtrlEnterRef.current = onCtrlEnter; }, [onCtrlEnter]);

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = new Editor({
      element: containerRef.current,
      extensions: [
        StarterKit.configure({
          heading: false,
          blockquote: false,
          code: false,
          codeBlock: false,
          horizontalRule: false,
        }),
        Highlight,
      ],
      content: toEditorHtml(value),
      autofocus: autoFocus ? "end" : false,
      editorProps: {
        handleKeyDown: (_view, event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && onCtrlEnterRef.current) {
            onCtrlEnterRef.current();
            return true;
          }
          return false;
        },
      },
      onCreate: ({ editor }) => {
        lastHtml.current = toEmitValue(editor.getHTML());
        setActiveMarks({ bold: editor.isActive("bold"), highlight: editor.isActive("highlight") });
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const emitValue = toEmitValue(html);
        lastHtml.current = emitValue;
        onChangeRef.current(emitValue);
        setActiveMarks({ bold: editor.isActive("bold"), highlight: editor.isActive("highlight") });
      },
      onSelectionUpdate: ({ editor }) => {
        setActiveMarks({ bold: editor.isActive("bold"), highlight: editor.isActive("highlight") });
      },
    });

    editorRef.current = editor;
    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value (e.g. voice input, translate)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || editor.isDestroyed) return;
    if (value !== lastHtml.current) {
      editor.commands.setContent(toEditorHtml(value), { emitUpdate: false });
      lastHtml.current = value;
    }
  }, [value]);

  const btnCls = (active: boolean) =>
    `px-2 py-0.5 text-xs rounded transition-colors select-none ${
      active
        ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
    }`;

  return (
    <div className="w-full border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-indigo-400">
      <div className="flex items-center gap-0.5 px-1.5 py-0.5 border-b border-gray-200 dark:border-gray-600">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editorRef.current?.chain().focus().toggleBold().run();
          }}
          className={btnCls(activeMarks.bold)}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editorRef.current?.chain().focus().toggleHighlight().run();
          }}
          className={btnCls(activeMarks.highlight)}
          title="Highlight"
        >
          <span className="bg-yellow-200 dark:bg-yellow-700 px-0.5 rounded-sm">H</span>
        </button>
      </div>
      <div
        ref={containerRef}
        className="rte-content w-full px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100"
        style={{ minHeight: `${rows * 1.6 + 0.4}rem` }}
      />
    </div>
  );
}
