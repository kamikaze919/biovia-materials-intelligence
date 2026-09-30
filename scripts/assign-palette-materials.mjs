import { readFileSync, writeFileSync } from "fs";
import { PALETTE_DEFS } from "../src/ds/paletteData.js";

const materialsPath = "C:\\Users\\ssl22\\Downloads\\Claude Code\\src\\ds\\materials.json";
const outPath = "C:\\Users\\ssl22\\Downloads\\Claude Code\\src\\ds\\paletteMaterials.json";
const materials = JSON.parse(readFileSync(materialsPath, "utf8"));

let seed = 71920260930;
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

const result = {};
for (const palette of PALETTE_DEFS) {
  const weighted = materials.map((m) => ({
    id: m.id,
    weight: !palette.matHint || palette.matHint.includes(m.matClass) ? 3 : 1,
  }));
  const totalWeight = weighted.reduce((a, w) => a + w.weight, 0);
  // Each palette gets a plausible-sized slice of the library, not every material.
  const targetCount = 60 + Math.floor(rand() * 60); // 60-120 materials per palette
  const picked = new Set();
  let attempts = 0;
  while (picked.size < targetCount && attempts < targetCount * 6) {
    let r = rand() * totalWeight;
    for (const w of weighted) {
      r -= w.weight;
      if (r <= 0) { picked.add(w.id); break; }
    }
    attempts++;
  }
  result[palette.id] = [...picked];
}

writeFileSync(outPath, JSON.stringify(result), "utf8");
const counts = Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.length]));
console.log("done:", JSON.stringify(counts, null, 2));
