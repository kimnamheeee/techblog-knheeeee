"use client";

import { type Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import { useCallback, useState } from "react";
import { diffToHtml } from "../../diffText";

type Status = "idle" | "loading" | "result";

export function AIToolMenu({ editor }: { editor: Editor }) {
  const [status, setStatus] = useState<Status>("idle");
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [improvedText, setImprovedText] = useState<string | null>(null);

  const handleImproveClick = useCallback(async () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    if (from === to) return;

    const selected = editor.state.doc.textBetween(from, to, "");
    if (!selected) return;

    setStatus("loading");
    setOriginalText(selected);
    setImprovedText(null);

    try {
      const res = await fetch("/api/editor/improve", {
        method: "POST",
        body: JSON.stringify({ text: selected }),
      });

      const data = await res.json();
      const improved = data.improvedText as string | undefined;

      if (!improved) {
        setStatus("idle");
        return;
      }

      const diffHtml = diffToHtml(selected, improved);

      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .deleteSelection()
        .insertContent(diffHtml)
        .run();

      const endPos = editor.state.selection.to;
      editor.commands.setTextSelection({ from, to: endPos });

      setImprovedText(improved);
      setStatus("result");
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  }, [editor]);

  const handleAccept = useCallback(() => {
    if (!editor) return;
    if (!improvedText) return;

    const state = editor.state;
    const { $from } = state.selection;

    const fromPos = $from.start();
    const toPos = $from.end();

    editor
      .chain()
      .focus()
      .insertContentAt({ from: fromPos, to: toPos }, improvedText)
      .run();

    setStatus("idle");
    setOriginalText(null);
    setImprovedText(null);
  }, [editor, improvedText]);

  const handleDiscard = useCallback(() => {
    if (!editor) return;
    if (!originalText) return;

    const state = editor.state;
    const { $from } = state.selection;

    const fromPos = $from.start();
    const toPos = $from.end();

    editor
      .chain()
      .focus()
      .insertContentAt({ from: fromPos, to: toPos }, originalText)
      .run();

    setStatus("idle");
    setOriginalText(null);
    setImprovedText(null);
  }, [editor, originalText]);

  return (
    <BubbleMenu editor={editor}>
      {
        {
          idle: (
            <div className="flex gap-2">
              <button onClick={handleImproveClick}>표현 다듬기</button>
              <button>AI에게 질문하기</button>
            </div>
          ),

          loading: (
            <div className="px-3 py-1 text-sm text-gray-500 flex items-center">
              <span className="animate-spin border w-4 h-4 rounded-full inline-block mr-2" />
              AI 다듬는 중...
            </div>
          ),

          result: (
            <div className="flex gap-2">
              <button onClick={handleAccept} className="text-green-600">
                Accept
              </button>
              <button onClick={handleDiscard} className="text-red-600">
                Discard
              </button>
            </div>
          ),
        }[status]
      }
    </BubbleMenu>
  );
}
