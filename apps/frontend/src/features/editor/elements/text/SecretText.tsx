interface SecretTextProps {
  text: string;
}

/**
 * Renders text between single quotes as an inline code-like secret.
 */
export function SecretText({ text }: SecretTextProps): React.ReactNode {
  const parts = text.split(/'([^'\n]+)'/g);

  return parts.map((part, index) => {
    const isSecret = index % 2 === 1;
    if (!isSecret) return <span key={index}>{part}</span>;

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
        {part}
      </span>
    );
  });
}