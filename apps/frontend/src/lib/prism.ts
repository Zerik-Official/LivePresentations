import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-java";
import "prismjs/themes/prism-tomorrow.css";

const ALIAS: Record<string, string> = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  html: "markup",
  xml: "markup",
  svg: "markup",
  react: "jsx",
  "react.js": "jsx",
  reactjs: "jsx",
  "react-js": "jsx",
  "react.jsx": "jsx",
  "react.ts": "tsx",
  reactts: "tsx",
  "react-ts": "tsx",
  "react.tsx": "tsx",
};

export const LANGUAGES: { value: string; label: string }[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "React (JSX)" },
  { value: "tsx", label: "React (TSX)" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "sql", label: "SQL" },
  { value: "json", label: "JSON" },
  { value: "css", label: "CSS" },
  { value: "markup", label: "HTML / XML" },
  { value: "bash", label: "Bash" },
];

const LABELS: Record<string, string> = Object.fromEntries(LANGUAGES.map((l) => [l.value, l.label]));

/**
 * Resolve a user provided language name to a loaded Prism grammar key.
 * @param input - Raw language name
 * @returns Language key guaranteed to exist in Prism.languages
 */
export function resolveLang(input?: string): string {
  const raw = (input ?? "javascript").toLowerCase().trim();
  const lang = ALIAS[raw] ?? raw;
  return Prism.languages[lang] ? lang : "javascript";
}

/**
 * Human readable label for a resolved language key.
 * @param lang - Resolved language key
 * @returns Display label
 */
export function langLabel(lang: string): string {
  return LABELS[lang] ?? lang;
}

/**
 * Highlight source code with Prism.
 * @param code - Source code to highlight
 * @param language - Requested language name
 * @returns Highlighted HTML and the resolved language key
 */
export function highlight(code: string, language?: string): { html: string; lang: string } {
  const lang = resolveLang(language);
  const grammar = Prism.languages[lang] as Prism.Grammar;
  return { html: Prism.highlight(code, grammar, lang), lang };
}
