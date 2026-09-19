import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Extra classes merged after variant */
  className?: string;
  /** Content */
  children: ReactNode;
}

/**
 * Reusable button with consistent cursor, dark theme and variant styles.
 * Always uses `cursor-pointer` and Tailwind variables.
 * @param variant - Style preset
 * @param size - Size preset
 * @param className - Additional classes
 * @param children - Button content
 * @param disabled - Disabled state
 */
export function Button({ variant = "secondary", size = "md", className = "", children, disabled, type = "button", ...props }: ButtonProps): React.ReactNode {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white";

  const variants: Record<ButtonVariant, string> = {
    primary: "border-transparent bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100",
    secondary: "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700",
    ghost: "border-transparent bg-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
    danger: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900",
    outline: "border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2 text-sm",
    icon: "h-9 w-9 p-0 text-sm",
  };

  return (
    <button type={type} disabled={disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}