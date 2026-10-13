import { useEffect, useRef } from "react";

interface Props {
  /** Number of digits */
  length: number;
  /** Digits typed so far */
  value: string;
  onChange: (value: string) => void;
  /** Called when every digit has been entered */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  /** Marks the boxes as invalid */
  invalid?: boolean;
}

/**
 * One-time code input with one box per digit.
 * Supports typing, backspace, arrow keys, pasting the whole code and the
 * browser's one-time-code autofill.
 * @param length - Number of digits
 * @param value - Current digits
 * @param onChange - Change handler
 * @param onComplete - Completion handler
 * @param disabled - Disabled state
 * @param invalid - Invalid state
 * @returns Code input
 */
export function OtpInput({ length, value, onChange, onComplete, disabled, invalid }: Props): React.ReactNode {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    // After a rejected code the boxes are cleared; put the cursor back at the start.
    if (value === "" && !disabled) inputs.current[0]?.focus();
  }, [value, disabled]);

  /**
   * Store new digits and move the focus after them.
   * @param next - Digits to store
   */
  function commit(next: string): void {
    const digits = next.replace(/\D/g, "").slice(0, length);
    onChange(digits);
    inputs.current[Math.min(digits.length, length - 1)]?.focus();
    if (digits.length === length) onComplete?.(digits);
  }

  /**
   * Handle typing or autofill in one box.
   * @param index - Box index
   * @param typed - Text the box received
   */
  function handleInput(index: number, typed: string): void {
    const digits = typed.replace(/\D/g, "");
    if (!digits) return;
    commit(value.slice(0, index) + digits + value.slice(index + digits.length));
  }

  /**
   * Handle navigation and deletion keys.
   * @param index - Box index
   * @param e - Keyboard event
   */
  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Backspace") {
      e.preventDefault();
      const target = value[index] ? index : Math.max(0, index - 1);
      onChange(value.slice(0, target));
      inputs.current[target]?.focus();
    } else if (e.key === "ArrowLeft") {
      inputs.current[Math.max(0, index - 1)]?.focus();
    } else if (e.key === "ArrowRight") {
      inputs.current[Math.min(length - 1, index + 1)]?.focus();
    }
  }

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="Código de verificación">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            inputs.current[index] = node;
          }}
          value={value[index] ?? ""}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Dígito ${index + 1}`}
          aria-invalid={invalid}
          disabled={disabled}
          autoFocus={index === 0}
          onChange={(e) => handleInput(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => {
            e.preventDefault();
            commit(e.clipboardData.getData("text"));
          }}
          onFocus={(e) => e.target.select()}
          className={`h-12 w-10 rounded-lg border bg-(--input-bg) text-center text-xl font-semibold tabular-nums text-(--input-text) outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 disabled:opacity-50 dark:focus:border-zinc-300 dark:focus:ring-white ${invalid ? "border-red-400 dark:border-red-500" : "border-(--input-border)"}`}
        />
      ))}
    </div>
  );
}
