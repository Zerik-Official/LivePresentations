import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useState } from "react";

import { useThemeStore } from "../../stores/themeStore";

interface Props {
  /** Code value. */
  value: string;
  /** Language id (javascript, typescript, python, etc.). */
  language?: string;
  /** Change handler. */
  onChange: (value: string) => void;
  /** Height of editor. */
  height?: string;
  /** Placeholder when empty. */
  placeholder?: string;
}

/**
 * Reusable code editor based on Monaco with auto indent, brackets and theme sync.
 * @param value - Code content
 * @param language - Monaco language
 * @param onChange - Callback
 * @param height - Height CSS
 */
export function CodeEditor({ value, language = "javascript", onChange, height = "220px" }: Props): React.ReactNode {
  const theme = useThemeStore((s) => s.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  /**
   * Handle editor mount to configure options.
   * @param editor - Monaco editor instance
   * @param monaco - Monaco namespace
   */
  const handleMount: OnMount = (editor, monaco) => {
    editor.onDidChangeModelContent(() => {
      const v = editor.getValue();
      onChange(v);
    });
    // Enable indent guides and bracket pair colorization
    monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "vs");
    editor.updateOptions({
      tabSize: 2,
      insertSpaces: true,
      autoIndent: "full",
      formatOnType: true,
      formatOnPaste: true,
      autoClosingBrackets: "always",
      autoClosingQuotes: "always",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      fontSize: 12,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      lineNumbers: "on",
      glyphMargin: false,
    });
  };

  useEffect(() => {
  }, [theme]);

  if (!mounted) return <div style={{ height }} className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800" />;

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <Editor
        height={height}
        language={language === "markup" ? "html" : language}
        value={value}
        theme={theme === "dark" ? "vs-dark" : "vs"}
        onMount={handleMount}
        onChange={(v) => onChange(v ?? "")}
        options={{
          tabSize: 2,
          insertSpaces: true,
          autoIndent: "full",
          formatOnType: true,
          formatOnPaste: true,
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          fontSize: 12,
          lineNumbers: "on",
        }}
      />
    </div>
  );
}