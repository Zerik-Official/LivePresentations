import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Public origin of the site, used for canonical URLs. */
const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://livepresentations.coderhivex.com").replace(/\/$/, "");

/** Pages search engines may index; keep in sync with public/sitemap.xml. */
const INDEXABLE_PATHS = ["/", "/register", "/login", "/terms", "/privacy"];

/**
 * Find or create a tag in the document head.
 * @param selector - CSS selector of the tag
 * @param create - Factory for a missing tag
 * @returns Tag in the head
 */
function headTag<T extends HTMLElement>(selector: string, create: () => T): T {
  const existing = document.head.querySelector<T>(selector);
  if (existing) return existing;
  const tag = create();
  document.head.appendChild(tag);
  return tag;
}

/**
 * Keep the canonical URL and the robots directive in line with the current
 * route: public pages point to their own address, private ones are noindex.
 * The HTML shell is the same for every route, so these tags are set here.
 * @returns Nothing visible
 */
export function SeoTags(): null {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : "/";
    const indexable = INDEXABLE_PATHS.includes(path);
    const robots = headTag('meta[name="robots"]', () => Object.assign(document.createElement("meta"), { name: "robots" }));
    robots.content = indexable ? "index, follow" : "noindex, nofollow";
    const canonical = headTag('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" }));
    if (indexable) canonical.href = `${SITE_URL}${path === "/" ? "/" : path}`;
    else canonical.remove();
  }, [pathname]);

  return null;
}
