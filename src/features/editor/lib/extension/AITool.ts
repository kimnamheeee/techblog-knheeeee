import { Editor, Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiTool: {
      improveSelection: () => ReturnType;
      acceptDiff: () => ReturnType;
      discardDiff: () => ReturnType;
    };
  }

  interface Storage {
    aiTool: {
      status: "idle" | "loading" | "result";
      diffHtml: string | null;
      originalText: string | null;
      improvedText: string | null;
      range: { from: number; to: number } | null;
    };
  }
}

export const AITool = Extension.create({
  name: "aiTool",

  addStorage() {
    return {
      status: "idle" as "idle" | "loading" | "result",
      diffHtml: null as string | null,
      originalText: null as string | null,
      improvedText: null as string | null,
      range: null as { from: number; to: number } | null,
    };
  },

  addCommands() {
    return {
      improveSelection:
        () =>
        ({ editor }: { editor: Editor }) => {
          const { from, to } = editor.state.selection;
          const selected = editor.state.doc.textBetween(from, to, "");

          if (!selected) return false;

          editor.storage.aiTool.status = "loading";
          editor.storage.aiTool.originalText = selected;
          editor.storage.aiTool.diffHtml = null;
          editor.storage.aiTool.improvedText = null;
          editor.storage.aiTool.range = { from, to };

          return true;
        },

      acceptDiff:
        () =>
        ({ editor }: { editor: Editor }) => {
          const improvedText = editor.storage.aiTool.improvedText;
          const range = editor.storage.aiTool.range;

          if (!improvedText || !range) return false;
          if (!editor.view) return false;

          const state = editor.view.state;

          let tr = state.tr;
          tr = tr.replaceWith(
            range.from,
            range.to,
            state.schema.text(improvedText)
          );

          editor.view.dispatch(tr);

          editor.storage.aiTool.status = "idle";
          editor.storage.aiTool.diffHtml = null;
          editor.storage.aiTool.originalText = null;
          editor.storage.aiTool.improvedText = null;
          editor.storage.aiTool.range = null;

          return true;
        },

      discardDiff:
        () =>
        ({ editor }: { editor: Editor }) => {
          const originalText = editor.storage.aiTool.originalText;
          const range = editor.storage.aiTool.range;

          if (!originalText || !range) return false;
          if (!editor.view) return false;

          const state = editor.view.state;

          let tr = state.tr;
          tr = tr.replaceWith(
            range.from,
            range.to,
            state.schema.text(originalText)
          );

          editor.view.dispatch(tr);

          editor.storage.aiTool.status = "idle";
          editor.storage.aiTool.diffHtml = null;
          editor.storage.aiTool.originalText = null;
          editor.storage.aiTool.improvedText = null;
          editor.storage.aiTool.range = null;

          return true;
        },
    };
  },
});
