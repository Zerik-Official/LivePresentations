import { FiCheck } from "react-icons/fi";

interface CheckboxProps {
  /** Whether the checkbox is currently selected */
  checked: boolean;
  /** Callback fired whenever the checked state changes */
  onChange: (checked: boolean) => void;
  /** Primary label shown beside the checkbox */
  label: string;
  /** Optional supporting text displayed beneath the label */
  description?: string;
  /** Disables interaction and visually dims the component when true */
  disabled?: boolean;
}

/**
 * Checkbox component with label and description, styled for light and dark modes.
 * Uses `var(--input-bg)`, `var(--input-border)` and zinc dark mode tokens.
 * @param checked - Checked state
 * @param onChange - Change handler
 * @param label - Main label
 * @param description - Supporting text
 * @param disabled - Disabled state
 */
export function Checkbox({ checked, onChange, label, description, disabled }: CheckboxProps): React.ReactNode {
  return (
    <label
      className={`group flex cursor-pointer items-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700/50 ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
    >
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
      <span
        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border transition-all duration-150 ${
          checked
            ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white"
            : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 group-hover:border-zinc-900 dark:group-hover:border-zinc-300"
        }`}
      >
        <FiCheck className={`text-[11px] transition-opacity duration-100 ${checked ? "opacity-100 text-white dark:text-zinc-900" : "opacity-0"}`} />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
        {description ? <span className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{description}</span> : null}
      </span>
    </label>
  );
}