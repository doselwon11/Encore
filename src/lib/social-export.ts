export const socialFormats = [
  { id: "poster", name: "Standard poster", width: 1000, height: 1500, top: 50, bottom: 50, side: 50, description: "The full festival bill" },
  { id: "square", name: "Square", width: 1080, height: 1080, top: 54, bottom: 54, side: 54, description: "A balanced feed post" },
  { id: "portrait", name: "Portrait", width: 1080, height: 1350, top: 54, bottom: 54, side: 54, description: "More room in the feed" },
  { id: "story", name: "Story", width: 1080, height: 1920, top: 250, bottom: 250, side: 60, description: "Clear of interface overlays" },
] as const;
export type SocialFormatId = typeof socialFormats[number]["id"];
export type SocialFormat = typeof socialFormats[number];
export function socialFormat(id: SocialFormatId): SocialFormat { return socialFormats.find(format => format.id === id) || socialFormats[0]; }
export function pngFilename(value: string, format: SocialFormat): string {
  const cleaned = value.normalize("NFKC").replace(/\.png$/i, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/[.\s]+$/g, "").trim();
  let base = "";
  const encoder = new TextEncoder();
  for (const character of Array.from(cleaned).slice(0, 120)) {
    if (encoder.encode(base + character).length > 180) break;
    base += character;
  }
  base = base.replace(/[.\s]+$/g, "") || "encore";
  return `${base}-${format.id}-${format.width}x${format.height}.png`;
}
export function fitsPoster(content: { width: number; height: number }, available: { width: number; height: number }): boolean {
  return content.width <= available.width + .5 && content.height <= available.height + .5;
}
