"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";

import { useState, useEffect } from "react";

export default function ContentEditor() {
  const [markdownText, setMarkdownText] = useState("");

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
      const markdownText = editor.getText();
      setMarkdownText(markdownText);
    },
  });

  const editor2 = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Placeholder.configure({
        placeholder: "내용을 입력하세요...",
      }),
    ],
    immediatelyRender: false,
  });

  useEffect(() => {
    const parseMarkdown = () => {
      if (!editor2 || !editor2.markdown) {
        return;
      }
      try {
        editor2.commands.setContent(markdownText, { contentType: "markdown" });
      } catch (err) {
        console.error(err);
      }
    };
    parseMarkdown();
  }, [markdownText]);

  return (
    <>
      <EditorContent editor={editor} />
      <EditorContent editor={editor2} />
    </>
  );
}
