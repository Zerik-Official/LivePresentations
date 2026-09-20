interface SecretTextProps {
  text: string;
}

/**
 * Renders quoted text as an inline code-like secret and double-asterisk text as bold.
 */
export function SecretText({ text }: SecretTextProps): React.ReactNode {
  const parts = text.split(/('(?:[^'\n]+)'|\*\*(?:[^*\n]+)\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("'") && part.endsWith("'")) {
      return (
        <span
          key={index}
          style={{
            backgroundColor: "rgba(127, 127, 127, 0.22)",
            borderRadius: "0.2em",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "0.92em",
            padding: "0.08em 0.28em",
          }}
        >
          <SecretText text={part.slice(1, -1)} />
        </span>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index}>
          <SecretText text={part.slice(2, -2)} />
        </strong>
      );
    }

    return <span key={index}>{part}</span>;
  });
}