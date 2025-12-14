import { type Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import { useCallback, useState, useRef, useEffect } from "react";
import { diffToHtml } from "../../../diffText";
import { SwitchCase } from "@/shared/ui/SwitchCase";
import { IdleMenu } from "./IdleMenu";
import { LoadingMenu } from "./LoadingMenu";
import { ResultMenu } from "./ResultMenu";
import { toast } from "sonner";
import { openDiffInterruptionModal } from "../AIToolModal/DiffInterruptionModal";

type Status = "idle" | "loading" | "result";

export function AIToolMenu({ editor }: { editor: Editor }) {
  const [status, setStatus] = useState<Status>("idle");
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [improvedText, setImprovedText] = useState<string | null>(null);

  const isProgrammaticSelectionChangeRef = useRef(false);
  const hasShownInterruptionRef = useRef(false);
  const lastSelectedRef = useRef<{ from: number; to: number } | null>(null);
  const bubbleMenuRef = useRef<HTMLDivElement | null>(null);

  const handleDiscard = useCallback(() => {
    if (!editor) return;
    if (!originalText) return;

    const state = editor.state;
    const { $from } = state.selection;

    const fromPos = $from.start();
    const toPos = $from.end();

    isProgrammaticSelectionChangeRef.current = true;
    try {
      editor
        .chain()
        .focus()
        .insertContentAt({ from: fromPos, to: toPos }, originalText)
        .run();
    } finally {
      isProgrammaticSelectionChangeRef.current = false;
    }

    setStatus("idle");
    hasShownInterruptionRef.current = false;
    setOriginalText(null);
    setImprovedText(null);
  }, [editor, originalText]);

  const handleSelectionChange = useCallback(
    (eventType: "selectionUpdate" | "blur", event?: FocusEvent | null) => {
      if (!editor) return;

      const { from, to } = editor.state.selection;

      const previousSelection = lastSelectedRef.current;

      if (isProgrammaticSelectionChangeRef.current || status === "idle") {
        lastSelectedRef.current = { from, to };
        return;
      }

      const shouldIgnoreBlurToBubbleMenu =
        eventType === "blur" &&
        (() => {
          const nextTarget = (event as FocusEvent | null)
            ?.relatedTarget as Node | null;
          return (
            !!nextTarget &&
            !!bubbleMenuRef.current &&
            bubbleMenuRef.current.contains(nextTarget)
          );
        })();

      if (shouldIgnoreBlurToBubbleMenu) {
        lastSelectedRef.current = { from, to };
        return;
      }

      if (hasShownInterruptionRef.current) {
        lastSelectedRef.current = { from, to };
        return;
      }

      if (status === "result" && previousSelection) {
        hasShownInterruptionRef.current = true;

        void (async () => {
          const accepted = await openDiffInterruptionModal({
            reason: "discard-result",
          });

          if (accepted) {
            handleDiscard();
          } else {
            isProgrammaticSelectionChangeRef.current = true;
            try {
              editor
                .chain()
                .focus()
                .setTextSelection({
                  from: previousSelection.from,
                  to: previousSelection.to,
                })
                .run();
            } finally {
              isProgrammaticSelectionChangeRef.current = false;
              hasShownInterruptionRef.current = false;
            }
          }
        })();
      }

      lastSelectedRef.current = { from, to };
    },
    [editor, status, handleDiscard]
  );

  useEffect(() => {
    if (!editor) return;

    const selectionHandler = () => handleSelectionChange("selectionUpdate");
    const blurHandler = ({ event }: { event: FocusEvent }) =>
      handleSelectionChange("blur", event);

    editor.on("selectionUpdate", selectionHandler);
    editor.on("blur", blurHandler);

    return () => {
      editor.off("selectionUpdate", selectionHandler);
      editor.off("blur", blurHandler);
    };
  }, [editor, handleSelectionChange]);

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

      if (improved.trim() === selected.trim()) {
        setStatus("idle");
        toast("수정할 내용이 없습니다.", {
          duration: 1000,
          position: "bottom-left",
          className: "!bottom-20",
        });
        return;
      }

      const diffHtml = diffToHtml(selected, improved);
      isProgrammaticSelectionChangeRef.current = true;

      try {
        editor
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .deleteSelection()
          .insertContent(diffHtml)
          .run();

        const endPos = editor.state.selection.to;
        editor.commands.setTextSelection({ from, to: endPos });
      } finally {
        isProgrammaticSelectionChangeRef.current = false;
      }
      setImprovedText(improved);
      hasShownInterruptionRef.current = false;
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

    isProgrammaticSelectionChangeRef.current = true;
    try {
      editor
        .chain()
        .focus()
        .insertContentAt({ from: fromPos, to: toPos }, improvedText)
        .run();
    } finally {
      isProgrammaticSelectionChangeRef.current = false;
    }

    setStatus("idle");
    hasShownInterruptionRef.current = false;
    setOriginalText(null);
    setImprovedText(null);
  }, [editor, improvedText]);

  return (
    <BubbleMenu editor={editor} ref={bubbleMenuRef}>
      <SwitchCase
        value={status}
        caseBy={{
          idle: <IdleMenu onImprove={handleImproveClick} />,
          loading: <LoadingMenu />,
          result: (
            <ResultMenu onAccept={handleAccept} onDiscard={handleDiscard} />
          ),
        }}
        default={<IdleMenu onImprove={handleImproveClick} />}
      />
    </BubbleMenu>
  );
}
