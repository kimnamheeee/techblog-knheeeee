"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { Placeholder } from "@tiptap/extensions";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";

import { useEditorStore } from "../model/editorStore";

export default function ContentEditor() {
  const { setMarkdownText } = useEditorStore();
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Placeholder.configure({
        placeholder: "내용을 입력하세요...",
      }),
    ],
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setMarkdownText(editor.getText());
    },
  });

  return <EditorContent editor={editor} />;
}
