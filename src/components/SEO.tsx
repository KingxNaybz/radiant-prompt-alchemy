import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "product";
}

const DEFAULTS = {
  title: "Velour Walls — Art That Moves The Soul",
  description:
    "Hyper-real fine art on canvas, glass, and acrylic. Each piece directed in our private atelier, signed, and limited. Starting from $119.",
  image: "/og-image.jpg",
  url: "https://velourwalls.art",
};

/**
 * Sets <title> and injects/updates <meta> tags for SEO + Open Graph + Twitter Cards.
 * Call once per page — it cleans up on unmount.
 */
export default function SEO({
  title,
  description,
  image,
  url,
  type = "website",
}: SEOProps) {
  const t = title ? `${title} — Velour Walls` : DEFAULTS.title;
  const d = description ?? DEFAULTS.description;
  const img = image ?? DEFAULTS.image;
  const u = url ?? DEFAULTS.url;

  useEffect(() => {
    document.title = t;

    const tags: Record<string, string> = {
      description: d,
      "og:title": t,
      "og:description": d,
      "og:image": img,
      "og:url": u,
      "og:type": type,
      "og:site_name": "Velour Walls",
      "twitter:card": "summary_large_image",
      "twitter:title": t,
      "twitter:description": d,
      "twitter:image": img,
    };

    const created: HTMLMetaElement[] = [];

    for (const [key, value] of Object.entries(tags)) {
      const isOg = key.startsWith("og:") || key.startsWith("twitter:");
      const attr = isOg ? "property" : "name";
      let el = document.querySelector<HTMLMetaElement>(
        `meta[${attr}="${key}"]`
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
        created.push(el);
      }
      el.setAttribute("content", value);
    }

    return () => {
      created.forEach((el) => el.remove());
    };
  }, [t, d, img, u, type]);

  return null;
}
