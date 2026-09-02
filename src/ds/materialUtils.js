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

// Usage (secondary) classification: user-defined groups organizing materials by intended
// use/context, independent of and mutually inclusive with the primary Class/Sub-Class
// hierarchy. Management/creation of these groups is assumed to happen elsewhere — this is
// just the current group structure and the materials assigned into it.
export const USAGE_CLASSIFICATION_TREE = [
  {
    id: "f150", label: "F-150", matHint: ["Metals", "Composites"],
    children: [
      { id: "f150-ext", label: "Exterior", matHint: ["Metals", "Composites", "Polymers"], children: [
        { id: "f150-ext-baseline", label: "Baseline" },
        { id: "f150-ext-platinum", label: "Platinum" },
        { id: "f150-ext-raptor", label: "Raptor" },
      ] },
      { id: "f150-chassis", label: "Chassis", matHint: ["Metals", "Composites"], children: [
        { id: "f150-chassis-base", label: "Base Model Chassis" },
        { id: "f150-chassis-offroad", label: "Off-Road Package" },
      ] },
      { id: "f150-int", label: "Interior", matHint: ["Polymers", "Composites"], children: [
        { id: "f150-int-baseline", label: "Baseline" },
        { id: "f150-int-platinum", label: "Platinum" },
      ] },
    ],
  },
  {
    id: "explorer", label: "Explorer", matHint: ["Metals", "Polymers", "Composites"],
    children: [
      { id: "explorer-ext", label: "Exterior", matHint: ["Metals", "Composites"], children: [
        { id: "explorer-ext-base", label: "Base" },
        { id: "explorer-ext-limited", label: "Limited" },
      ] },
      { id: "explorer-int", label: "Interior", matHint: ["Polymers", "Composites"], children: [
        { id: "explorer-int-base", label: "Base" },
        { id: "explorer-int-limited", label: "Limited" },
      ] },
    ],
  },
  {
    id: "mustang", label: "Mustang", matHint: ["Metals", "Ceramics"],
    children: [
      { id: "mustang-ext", label: "Exterior", matHint: ["Metals", "Composites"], children: [
        { id: "mustang-ext-ecoboost", label: "EcoBoost" },
        { id: "mustang-ext-gt", label: "GT" },
      ] },
      { id: "mustang-powertrain", label: "Powertrain", matHint: ["Metals", "Ceramics"], children: [
        { id: "mustang-powertrain-ecoboost", label: "EcoBoost" },
        { id: "mustang-powertrain-gt", label: "GT" },
      ] },
    ],
  },
  {
    id: "supplier-regions", label: "Supplier Regions",
    children: [
      { id: "supplier-na", label: "North America" },
      { id: "supplier-eu", label: "Europe" },
      { id: "supplier-apac", label: "Asia Pacific" },
    ],
  },
];

// Flattens the tree into leaf entries with their full "/"-joined path and inherited matHint.
export function flattenUsageLeaves(tree = USAGE_CLASSIFICATION_TREE, prefix = "", inheritedHint = null) {
  const out = [];
  for (const node of tree) {
    const fullPath = prefix ? `${prefix}/${node.label}` : node.label;
    const hint = node.matHint || inheritedHint;
    if (node.children && node.children.length) {
      out.push(...flattenUsageLeaves(node.children, fullPath, hint));
    } else {
      out.push({ id: node.id, label: node.label, fullPath, matHint: hint });
    }
  }
  return out;
}

// True if a material (given its assigned leaf paths) matches a selected filter path —
// either directly, or because the filter path is an ancestor of one of the material's paths.
export function usageMatches(materialPaths, filterPath) {
  if (!materialPaths || !materialPaths.length) return false;
  return materialPaths.some((p) => p === filterPath || p.startsWith(filterPath + "/"));
}

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

// Synthetic engineering stress-strain curve: a linear elastic region up to yield strength,
// then a smooth rise to ultimate tensile strength, followed by slight necking softening to
// fracture at the elongation-at-break strain. This is illustrative/generated data, not measured.
export function generateStressStrainCurve(material) {
  const E = findNumeric(material, "Young's Modulus"); // GPa
  const sy = findNumeric(material, "Yield Strength"); // MPa
  const su = findNumeric(material, "Tensile Strength"); // MPa
  const ef = findNumeric(material, "Elongation at Break"); // %
  if (E == null || sy == null || su == null || ef == null || ef <= 0) return null;
  const Empa = E * 1000; // GPa -> MPa
  const strainY = sy / Empa;
  const strainF = ef / 100;
  if (!(strainF > strainY)) return null;

  const points = [];
  const elasticSteps = 10;
  for (let i = 0; i <= elasticSteps; i++) {
    const strain = (strainY * i) / elasticSteps;
    points.push({ strain: strain * 100, stress: Empa * strain });
  }
  const peakStrain = strainY + (strainF - strainY) * 0.6;
  const plasticSteps = 24;
  for (let i = 1; i <= plasticSteps; i++) {
    const strain = strainY + ((strainF - strainY) * i) / plasticSteps;
    let stress;
    if (strain <= peakStrain) {
      const t = (strain - strainY) / (peakStrain - strainY || 1);
      stress = sy + (su - sy) * (1 - Math.pow(1 - t, 2));
    } else {
      const t = (strain - peakStrain) / (strainF - peakStrain || 1);
      stress = su - su * 0.08 * Math.pow(t, 1.5);
    }
    points.push({ strain: strain * 100, stress });
  }
  return points;
}

export const CURVE_DATASETS = [
  { id: "sn", label: "S-N Fatigue Curve", generate: generateSNCurve, xKey: "N", yKey: "sigmaA", xLabel: "Cycles to Failure, N (log scale)", yLabel: "Stress Amplitude (MPa)", logX: true },
  { id: "stress-strain", label: "Stress-Strain Curve", generate: generateStressStrainCurve, xKey: "strain", yKey: "stress", xLabel: "Strain (%)", yLabel: "Stress (MPa)", logX: false },
];
