export const fontPresets = {
  sans: { label: "Modern sans · Geist", family: '"Encore Sans", sans-serif' },
  display: { label: "Condensed display · Barlow", family: '"Encore Display", sans-serif' },
  serif: { label: "Elegant serif · DM Serif", family: '"Encore Serif", serif' },
  japanese: { label: "Japanese / CJK · Noto Sans JP", family: '"Encore JP", "Hiragino Sans", "Yu Gothic", sans-serif' },
};
export type FontPreset = keyof typeof fontPresets;
export type TextGroup = "title" | "artists" | "tagline" | "details";
export type TypographyStyle = { font: FontPreset; size: number; spacing: number; lineHeight: number; align: "left" | "center" | "right" };
export type TemplateId = "neon-waves" | "tokyo-nights" | "golden-hour" | "minimalist" | "retro-festival";
export type BackgroundDesign = { start: string; end: string; accent: string; text: string; angle: number; pattern: "waves" | "grid" | "dots" | "none"; patternOpacity: number; lineOpacity: number; glow: number; grain: number; decorations: boolean };
export type PosterDesign = { template: TemplateId; typography: Record<TextGroup, TypographyStyle>; background: BackgroundDesign };
export const templateGallery: { id: TemplateId; name: string; description: string }[] = [
  { id: "neon-waves", name: "Neon Waves", description: "Orbital motion. Electric energy." },
  { id: "tokyo-nights", name: "Tokyo Nights", description: "Neon skyline & city-pop rhythm." },
  { id: "golden-hour", name: "Golden Hour", description: "A sun-soaked desert horizon." },
  { id: "minimalist", name: "Minimalist", description: "Monochrome editorial. Pure type." },
  { id: "retro-festival", name: "Retro Festival", description: "Warm paper & a vintage sunburst." },
];
export const colorPalettes = {
  ultraviolet: { name: "Ultraviolet", start: "#402084", end: "#100a20", accent: "#c67aef", text: "#f2dcff" },
  sunset: { name: "Desert sunset", start: "#792e5e", end: "#27101c", accent: "#ffad78", text: "#ffe5ce" },
  afterhours: { name: "After hours", start: "#193c80", end: "#091b28", accent: "#72d9e6", text: "#d9f7fa" },
};
export const textGroups: { id: TextGroup; label: string }[] = [
  { id: "title", label: "Festival title" }, { id: "artists", label: "Artist names" },
  { id: "tagline", label: "Tagline" }, { id: "details", label: "Event details" },
];
export function defaultDesign(palette: keyof typeof colorPalettes = "ultraviolet"): PosterDesign {
  const colors = colorPalettes[palette] || colorPalettes.ultraviolet;
  return { template: "neon-waves", background: { start: colors.start, end: colors.end, accent: colors.accent, text: colors.text, angle: 160, pattern: "waves", patternOpacity: .25, lineOpacity: .75, glow: .8, grain: .09, decorations: true }, typography: {
    title: { font: "display", size: 1, spacing: -.025, lineHeight: 1, align: "center" },
    artists: { font: "sans", size: 1, spacing: 0, lineHeight: 1.25, align: "center" },
    tagline: { font: "serif", size: 1, spacing: 0, lineHeight: 1.5, align: "center" },
    details: { font: "sans", size: 1, spacing: .12, lineHeight: 1.5, align: "center" },
  } };
}
export function bounded(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
export function resolveDesign(value?: unknown, palette: keyof typeof colorPalettes = "ultraviolet"): PosterDesign {
  const defaults = defaultDesign(palette);
  const data = record(value), typography = record(data.typography), rawBackground = record(data.background);
  if (templateGallery.some(template => template.id === data.template)) defaults.template = data.template as TemplateId;
  for (const key of ["start", "end", "accent", "text"] as const) {
    if (typeof rawBackground[key] === "string" && /^#[0-9a-f]{6}$/i.test(rawBackground[key])) defaults.background[key] = rawBackground[key];
  }
  for (const key of ["patternOpacity", "lineOpacity", "glow", "grain"] as const) defaults.background[key] = bounded(rawBackground[key], defaults.background[key], 0, 1);
  defaults.background.angle = bounded(rawBackground.angle, defaults.background.angle, 0, 360);
  if (["waves", "grid", "dots", "none"].includes(String(rawBackground.pattern))) defaults.background.pattern = rawBackground.pattern as BackgroundDesign["pattern"];
  if (typeof rawBackground.decorations === "boolean") defaults.background.decorations = rawBackground.decorations;
  for (const { id } of textGroups) {
    const raw = record(typography[id]), fallback = defaults.typography[id];
    defaults.typography[id] = {
      font: typeof raw.font === "string" && Object.hasOwn(fontPresets, raw.font) ? raw.font as FontPreset : fallback.font,
      size: bounded(raw.size, fallback.size, .6, 1.6), spacing: bounded(raw.spacing, fallback.spacing, -.06, .25),
      lineHeight: bounded(raw.lineHeight, fallback.lineHeight, 1, 2),
      align: ["left", "center", "right"].includes(String(raw.align)) ? raw.align as TypographyStyle["align"] : fallback.align,
    };
  }
  return defaults;
}
export function fontFamily(font: FontPreset, text: string): string {
  const family = fontPresets[font].family;
  // Embed the bundled Japanese fallback when text needs it, without bloating Latin-only exports.
  return font !== "japanese" && /[\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\u3040-\u30ff]/u.test(text) ? family.replace(/, (?:sans-serif|serif)$/, ', "Encore JP", sans-serif') : family;
}
export function titleSize(text: string): number {
  const units = Array.from(text).reduce((sum, character) => sum + (/[^\u0000-\u024f]/u.test(character) ? 1 : .55), 0);
  return Math.max(6.4, Math.min(12.5, 82 / Math.max(1, units)));
}

export function templateDesign(id: TemplateId): PosterDesign {
  const design = defaultDesign();
  design.template = id;
  if (id === "tokyo-nights") {
    design.background = { ...design.background, start: "#061342", end: "#170b29", accent: "#fc4aaf", text: "#def9ff", angle: 195, pattern: "grid", patternOpacity: .22, glow: .85 };
    design.typography.title = { ...design.typography.title, font: "japanese", align: "left", size: .9, spacing: -.04 };
    design.typography.artists.align = "left"; design.typography.details.align = "left";
  } else if (id === "golden-hour") {
    design.background = { ...design.background, start: "#eb9c57", end: "#6d3445", accent: "#ffd782", text: "#472d2f", angle: 175, pattern: "none", lineOpacity: .45, glow: .7 };
    design.typography.title = { ...design.typography.title, font: "serif", size: .9, spacing: -.04 };
    design.typography.artists.font = "display";
  } else if (id === "minimalist") {
    design.background = { ...design.background, start: "#f4f2eb", end: "#e8e5dd", accent: "#282828", text: "#161616", angle: 0, pattern: "none", glow: 0, grain: .03, lineOpacity: .3 };
    design.typography.title = { ...design.typography.title, font: "serif", align: "left", size: .85, spacing: -.05 };
    design.typography.artists = { ...design.typography.artists, align: "left", size: .9 };
    design.typography.tagline.align = "left"; design.typography.details.align = "left";
  } else if (id === "retro-festival") {
    design.background = { ...design.background, start: "#f0d5a0", end: "#d9b57c", accent: "#ad4c35", text: "#422c27", angle: 140, pattern: "dots", patternOpacity: .13, glow: .25, grain: .2, lineOpacity: .55 };
    design.typography.title = { ...design.typography.title, font: "serif", size: 1.1, spacing: -.045 };
    design.typography.artists.font = "display"; design.typography.tagline.font = "serif";
  }
  return design;
}
