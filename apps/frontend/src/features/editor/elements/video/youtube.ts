/**
 * Extract YouTube video ID from various URL formats.
 * Supports youtube.com/watch?v=, youtu.be/, youtube.com/embed/, youtube-nocookie.com/embed/.
 * @param url - URL string
 * @returns Video ID or null
 */
export function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0] ?? "";
      return id.length >= 6 ? id : null;
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1] as string;
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx !== -1 && parts[shortsIdx + 1]) return parts[shortsIdx + 1] as string;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Check if URL is a YouTube link.
 * @param url - URL string
 * @returns True if YouTube
 */
export function isYouTubeUrl(url: string): boolean {
  return parseYouTubeId(url) !== null;
}

/**
 * Build privacy-enhanced embed URL without tracking cookies.
 * @param id - YouTube video ID
 * @param autoplay - Whether to autoplay (muted required for browsers)
 * @returns Embed URL
 */
export function buildYouTubeEmbedUrl(id: string, autoplay = false): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "0",
  });
  if (autoplay) {
    params.set("autoplay", "1");
    params.set("mute", "1");
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
