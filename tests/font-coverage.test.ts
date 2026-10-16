import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Check actual bundled glyph maps, not just CSS fallback names.
function hasGlyph(file: string, code: number): boolean {
  const font = readFileSync(new URL(`../public/fonts/${file}`, import.meta.url));
  let cmap = 0;
  for (let i = 0; i < font.readUInt16BE(4); i++) {
    const table = 12 + i * 16;
    if (font.toString("ascii", table, table + 4) === "cmap") cmap = font.readUInt32BE(table + 8);
  }
  for (let i = 0; i < font.readUInt16BE(cmap + 2); i++) {
    const at = cmap + font.readUInt32BE(cmap + 4 + i * 8 + 4), format = font.readUInt16BE(at);
    if (format === 12) {
      for (let group = 0; group < font.readUInt32BE(at + 12); group++) {
        const p = at + 16 + group * 12;
        if (code >= font.readUInt32BE(p) && code <= font.readUInt32BE(p + 4)) return font.readUInt32BE(p + 8) + code - font.readUInt32BE(p) !== 0;
      }
    } else if (format === 4 && code <= 0xffff) {
      const count = font.readUInt16BE(at + 6) / 2;
      for (let segment = 0; segment < count; segment++) {
        const end = font.readUInt16BE(at + 14 + segment * 2), start = font.readUInt16BE(at + 16 + count * 2 + segment * 2);
        if (code < start || code > end) continue;
        const delta = font.readInt16BE(at + 16 + count * 4 + segment * 2), rangeAt = at + 16 + count * 6 + segment * 2, range = font.readUInt16BE(rangeAt);
        const glyph = range ? font.readUInt16BE(rangeAt + range + 2 * (code - start)) : code;
        if (glyph && ((glyph + delta) & 0xffff)) return true;
      }
    }
  }
  return false;
}
test("bundled fonts contain Japanese, Korean, Vietnamese and English glyphs for PNG embedding", () => {
  for (const [file,text] of [["EncoreJP.ttf", "東京音楽祭宇多田ヒカル"], ["EncoreKR.ttf", "서울음악축제잔나비"], ...["EncoreSans.ttf","EncoreDisplay.ttf","EncoreVietSerif.ttf"].map(file => [file,"ENCORE Lễ hội âm nhạc Việt Nam Những giấc mơ dài"])] ) {
    for (const character of new Set(text)) assert.ok(hasGlyph(file,character.codePointAt(0)!), `${file} missing ${character}`);
  }
});
