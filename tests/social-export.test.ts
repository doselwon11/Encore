import { test } from "node:test";
import assert from "node:assert/strict";
import { fitsPoster, pngFilename, socialFormat, socialFormats } from "../src/lib/social-export.ts";

test("social formats have exact output sizes and Story interface-safe margins", () => {
  assert.deepEqual(socialFormats.map(({width,height}) => [width,height]), [[1000,1500],[1080,1080],[1080,1350],[1080,1920]]);
  const story = socialFormat("story");
  assert.equal(story.top,250); assert.equal(story.bottom,250); assert.equal(story.side,60);
});
test("filenames retain multilingual titles and safely include dimensions", () => {
  assert.equal(pngFilename("東京 서울 Lễ hội.png",socialFormat("square")), "東京 서울 Lễ hội-square-1080x1080.png");
  assert.equal(pngFilename('a/b\\c:foo?.png',socialFormat("story")), "a-b-c-foo--story-1080x1920.png");
  assert.equal(pngFilename("...   ",socialFormat("poster")), "encore-poster-1000x1500.png");
  assert.ok(new TextEncoder().encode(pngFilename("東京서울".repeat(100), socialFormat("story"))).length < 255);
  assert.ok(!pngFilename("a".repeat(300), socialFormat("portrait")).includes("a".repeat(121)));
});
test("fitting rejects content that would crop on either axis", () => {
  assert.ok(fitsPoster({width:900,height:1400},{width:900,height:1400}));
  assert.ok(!fitsPoster({width:901,height:1400},{width:900,height:1400}));
  assert.ok(!fitsPoster({width:900,height:1401},{width:900,height:1400}));
});
