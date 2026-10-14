/**
 * Formatting helpers for the profile feature.
 */

/**
 * Format a byte count as a human readable string.
 * @param bytes - Byte count
 * @returns Formatted size with unit
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, index);
  return `${value >= 100 ? Math.round(value) : value.toFixed(value >= 10 ? 1 : 2)} ${units[index]}`;
}

/**
 * Format an ISO date string for display.
 * @param isoDate - ISO date string or null
 * @returns Localized date string or placeholder
 */
export function formatProfileDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "Sin registro";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Sin registro";
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get the fallback initial for an avatar.
 * @param email - User email
 * @param displayName - Optional display name
 * @returns Uppercase initial
 */
export function getAvatarInitial(email: string, displayName: string | null | undefined): string {
  const source = (displayName || "").trim() || email;
  return (source.charAt(0) || "?").toUpperCase();
}
