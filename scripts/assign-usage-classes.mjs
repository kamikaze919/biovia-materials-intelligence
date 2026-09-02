import { readFileSync, writeFileSync } from "fs";
import { USAGE_CLASSIFICATION_TREE, flattenUsageLeaves } from "../src/ds/materialUtils.js";

const path = "C:\\Users\\ssl22\\Downloads\\Claude Code\\src\\ds\\materials.json";
const materials = JSON.parse(readFileSync(path, "utf8"));
const leaves = flattenUsageLeaves(USAGE_CLASSIFICATION_TREE);

// Deterministic PRNG so the assignment is reproducible.
let seed = 20260511;
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

let taggedCount = 0;
for (const m of materials) {
  // ~65% of materials get 1-3 usage tags; the rest are left unclassified.
  if (rand() >= 0.65) {
    m.secondaryClasses = [];
    continue;
  }
  const weighted = leaves.map((l) => ({ leaf: l, weight: !l.matHint || l.matHint.includes(m.matClass) ? 3 : 1 }));
  const totalWeight = weighted.reduce((a, w) => a + w.weight, 0);
  const pickOne = () => {
    let r = rand() * totalWeight;
    for (const w of weighted) {
      r -= w.weight;
      if (r <= 0) return w.leaf.fullPath;
    }
    return weighted[weighted.length - 1].leaf.fullPath;
  };
  const count = 1 + Math.floor(rand() * 3); // 1-3
  const picked = new Set();
  let attempts = 0;
  while (picked.size < count && attempts < 10) { picked.add(pickOne()); attempts++; }
  m.secondaryClasses = [...picked];
  taggedCount++;
}

writeFileSync(path, JSON.stringify(materials), "utf8");
console.log(`done: ${materials.length} materials, ${taggedCount} tagged with usage classes, ${leaves.length} leaf groups available`);
