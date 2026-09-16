/**
 * Available font families for text elements loaded via Google Fonts.
 */
export interface FontOption {
  /** CSS fontFamily value */
  value: string;
  /** Display label */
  label: string;
  /** Category for grouping */
  category: "Sans" | "Serif" | "Mono" | "Display";
}

/**
 * Curated list of Google Fonts with good contrast for presentations.
 */
export const FONT_OPTIONS: FontOption[] = [
  { value: "Inter", label: "Inter", category: "Sans" },
  { value: "Poppins", label: "Poppins", category: "Sans" },
  { value: "Roboto", label: "Roboto", category: "Sans" },
  { value: "Montserrat", label: "Montserrat", category: "Sans" },
  { value: "DM Sans", label: "DM Sans", category: "Sans" },
  { value: "Space Grotesk", label: "Space Grotesk", category: "Sans" },
  { value: "Playfair Display", label: "Playfair Display", category: "Serif" },
  { value: "Lora", label: "Lora", category: "Serif" },
  { value: "Merriweather", label: "Merriweather", category: "Serif" },
  { value: "JetBrains Mono", label: "JetBrains Mono", category: "Mono" },
  { value: "Oswald", label: "Oswald", category: "Display" },
  { value: "Bebas Neue", label: "Bebas Neue", category: "Display" },
];

/**
 * Text alignment options.
 */
export const ALIGN_OPTIONS = [
  { value: "left", label: "Izquierda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Derecha" },
  { value: "justify", label: "Justificado" },
] as const;
