export const PROPERTY_GROUP_DEFS = [
  ["General", "general"],
  ["Physical", "physical"],
  ["Mechanical", "mechanical"],
  ["Thermal", "thermal"],
  ["Electrical", "electrical"],
  ["Magnetic", "magnetic"],
];

export const ALL_PROPERTY_KEYS = [
  "Density", "Melting / Softening Point",
  "Tensile Strength", "Yield Strength", "Elongation at Break", "Young's Modulus",
  "Thermal Conductivity", "CTE", "Max Service Temp",
  "Electrical Resistivity", "Dielectric Constant",
];

// Numeric, filterable properties grouped by the same property sets used in the detail view.
export const FILTERABLE_PROPERTY_GROUPS = [
  ["Physical", ["Density", "Melting / Softening Point"]],
  ["Mechanical", ["Tensile Strength", "Yield Strength", "Elongation at Break", "Young's Modulus"]],
  ["Thermal", ["Thermal Conductivity", "CTE", "Max Service Temp"]],
  ["Electrical", ["Electrical Resistivity", "Dielectric Constant"]],
];

export const DATA_SOURCES = ["Material Library", "Total Materia", "MatWeb", "Granta MI", "CES EduPack"];

export const MATERIAL_STATUSES = ["Approved", "Prototype", "Obsolete"];

export const CLASS_COLORS = {
  Metals: "#8b8f94",
  Ceramics: "#c9b896",
  Polymers: "#4a90c4",
  Composites: "#2e7d4f",
};
export const classColor = (matClass) => CLASS_COLORS[matClass] || "var(--gray-400)";

export function parseNumeric(str) {
  if (typeof str !== "string") return null;
  const m = str.match(/-?\d+(\.\d+)?(e-?\d+)?/i);
  return m ? parseFloat(m[0]) : null;
}

export function findValue(material, key) {
  for (const [, catKey] of PROPERTY_GROUP_DEFS) {
    const rows = material.detail[catKey] || [];
    const hit = rows.find(([k]) => k === key);
    if (hit) return hit[1];
  }
  return "—";
}

export function findNumeric(material, key) {
  return parseNumeric(findValue(material, key));
}

export function findUnit(material, key) {
  const raw = findValue(material, key);
  if (typeof raw !== "string") return "";
  return raw.replace(/-?\d+(\.\d+)?(e-?\d+)?/i, "").trim();
}

// Global [min, max] and a representative unit for a property, across a material set.
export function propertyRange(materials, key) {
  let min = Infinity, max = -Infinity, unit = "";
  for (const m of materials) {
    const v = findNumeric(m, key);
    if (v == null || isNaN(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
    if (!unit) unit = findUnit(m, key);
  }
  if (!isFinite(min) || !isFinite(max)) return { min: 0, max: 0, unit: "" };
  return { min, max, unit };
}

export function detailToRows(detail, key) {
  return (detail[key] || []).map(([k, v]) => ({ key: k, value: v }));
}

export const SERIES_COLORS = ["#1e6fa8", "#2e7d4f", "#b06a00", "#8a4fbf"];

const SIMILARITY_KEYS = ["Density", "Tensile Strength", "Young's Modulus", "Thermal Conductivity"];

// Nearest neighbors by normalized Euclidean distance over a shared set of numeric
// properties. Each axis is scaled by the max absolute value seen across `materials`,
// so no single property (e.g. density in the thousands) dominates the distance.
export function findSimilar(target, materials, n = 12) {
  const maxByKey = SIMILARITY_KEYS.map((k) => {
    const vals = materials.map((m) => findNumeric(m, k)).filter((v) => v != null && !isNaN(v));
    const max = Math.max(0, ...vals.map(Math.abs));
    return max > 0 ? max : 1;
  });
  const targetVec = SIMILARITY_KEYS.map((k) => findNumeric(target, k));

  const scored = [];
  for (const m of materials) {
    if (m.id === target.id) continue;
    let sumSq = 0;
    let comparable = 0;
    SIMILARITY_KEYS.forEach((k, i) => {
      const tv = targetVec[i];
      const mv = findNumeric(m, k);
      if (tv == null || mv == null) return;
      const diff = (tv - mv) / maxByKey[i];
      sumSq += diff * diff;
      comparable += 1;
    });
    if (comparable === 0) continue;
    scored.push({ material: m, distance: Math.sqrt(sumSq / comparable) });
  }
  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, n);
}

// Synthetic S-N fatigue curve via Basquin's equation: stress amplitude = sigma_f' * (2N)^b
// sigma_f' approximated from tensile strength (typical metals/polymers correlation), b is a
// representative fatigue-strength exponent. This is illustrative/generated data, not measured.
export function generateSNCurve(material) {
  const tensile = findNumeric(material, "Tensile Strength");
  if (tensile == null) return null;
  const sigmaF = tensile * 1.5; // typical true fracture strength ~1.5x UTS for many metals
  const b = -0.09; // typical fatigue strength exponent for metals/engineering polymers
  const points = [];
  for (let logN = 3; logN <= 7; logN += 0.2) {
    const N = Math.pow(10, logN);
    const sigmaA = sigmaF * Math.pow(2 * N, b);
    points.push({ N, sigmaA });
  }
  return points;
}
