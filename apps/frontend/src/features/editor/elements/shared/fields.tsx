const LABEL_CLASS = "text-xs font-medium text-zinc-700 dark:text-zinc-300";
const INPUT_CLASS = "rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) outline-none focus:border-zinc-900 dark:focus:border-zinc-400";
const HEX_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

interface ColorFieldProps {
  /** Field caption */
  label: string;
  /** Current color as hex */
  value: string;
  /** Change handler receiving a hex color */
  onChange: (value: string) => void;
}

/**
 * Color picker paired with a hex text input.
 * @param label - Field caption
 * @param value - Current hex color
 * @param onChange - Change handler
 * @returns Color field
 */
export function ColorField({ label, value, onChange }: ColorFieldProps): React.ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <span className={LABEL_CLASS}>{label}</span>
      <div className="flex gap-1">
        <input type="color" value={HEX_PATTERN.test(value) && value.length === 7 ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1" />
        <input
          value={value}
          onChange={(e) => {
            const raw = e.target.value.trim();
            const hex = raw.startsWith("#") ? raw : `#${raw}`;
            if (HEX_PATTERN.test(hex)) onChange(hex);
            else if (raw === "" || raw === "#") onChange(raw);
          }}
          placeholder="#000000"
          className={`min-w-0 flex-1 px-2 py-1.5 text-xs ${INPUT_CLASS}`}
        />
      </div>
    </div>
  );
}

interface NumberFieldProps {
  /** Field caption */
  label: string;
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Increment step */
  step?: number;
}

/**
 * Labeled numeric input clamped to its range.
 * @param label - Field caption
 * @param value - Current value
 * @param onChange - Change handler
 * @param min - Minimum value
 * @param max - Maximum value
 * @param step - Increment step
 * @returns Number field
 */
export function NumberField({ label, value, onChange, min, max, step }: NumberFieldProps): React.ReactNode {
  return (
    <label className={`flex flex-col gap-1 ${LABEL_CLASS}`}>
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isFinite(next)) return;
          onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next)));
        }}
        className={`px-3 py-2 text-sm ${INPUT_CLASS}`}
      />
    </label>
  );
}
