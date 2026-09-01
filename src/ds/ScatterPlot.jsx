import { useState, useMemo, useRef } from "react";
import { ALL_PROPERTY_KEYS, CLASS_COLORS, findNumeric } from "./materialUtils.js";
import { RangeSlider } from "./components.jsx";
import { niceTicks, fmtAxisValue, logTicks } from "./chartUtils.js";

const PRESETS = [
  { label: "Density vs Melting Point", x: { a: "Density", op: null, b: null, log: false }, y: { a: "Melting / Softening Point", op: null, b: null, log: false } },
  { label: "Strength vs Modulus", x: { a: "Young's Modulus", op: null, b: null, log: false }, y: { a: "Tensile Strength", op: null, b: null, log: false } },
  { label: "Density vs Thermal Conductivity", x: { a: "Density", op: null, b: null, log: false }, y: { a: "Thermal Conductivity", op: null, b: null, log: true } },
  { label: "Resistivity vs CTE", x: { a: "CTE", op: null, b: null, log: false }, y: { a: "Electrical Resistivity", op: null, b: null, log: true } },
];

const OPS = { "+": (a, b) => a + b, "−": (a, b) => a - b, "×": (a, b) => a * b, "÷": (a, b) => (b === 0 ? null : a / b) };

function axisValue(material, cfg) {
  const va = findNumeric(material, cfg.a);
  if (va == null) return null;
  let v = va;
  if (cfg.op && cfg.b) {
    const vb = findNumeric(material, cfg.b);
    if (vb == null) return null;
    v = OPS[cfg.op](va, vb);
    if (v == null) return null;
  }
  if (cfg.log) {
    if (v <= 0) return null;
    return Math.log10(v);
  }
  return v;
}

function axisLabel(cfg) {
  const base = cfg.op && cfg.b ? `${cfg.a} ${cfg.op} ${cfg.b}` : cfg.a;
  return cfg.log ? `log₁₀(${base})` : base;
}


function FormulaBuilder({ title, initial, onApply, onCancel }) {
  const [a, setA] = useState(initial.a);
  const [op, setOp] = useState(initial.op);
  const [b, setB] = useState(initial.b);
  const [awaiting, setAwaiting] = useState("a");

  const pick = (key) => {
    if (awaiting === "a") { setA(key); setAwaiting(op ? "b" : "a"); }
    else { setB(key); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,35,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onCancel}>
      <div role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "var(--radius-lg)", padding: 20, width: 420, maxHeight: "80vh", overflowY: "auto", boxShadow: "var(--shadow-overlay)", fontFamily: "var(--font-ui)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
          <span onClick={onCancel} style={{ cursor: "pointer", color: "var(--gray-500)", fontSize: 16 }}>×</span>
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 12 }}>Click a property, optionally an operator, then a second property.</div>
        <div style={{ background: "var(--gray-50)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "8px 10px", marginBottom: 12, fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
          {a || "—"} {op || ""} {b || ""}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {Object.keys(OPS).map((o) => (
            <span key={o} onClick={() => { setOp(o); setAwaiting("b"); }}
              style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${op === o ? "var(--blue-400)" : "var(--border-default)"}`, borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 700, background: op === o ? "var(--surface-selected)" : "#fff" }}>
              {o}
            </span>
          ))}
          <span onClick={() => { setOp(null); setB(null); setAwaiting("a"); }} style={{ padding: "0 10px", height: 30, display: "flex", alignItems: "center", cursor: "pointer", fontSize: "var(--text-xs)", color: "var(--link)" }}>Clear</span>
        </div>
        <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "var(--tracking-label)", marginBottom: 6 }}>
          Selecting property {awaiting === "a" ? "A" : "B"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {ALL_PROPERTY_KEYS.map((k) => (
            <span key={k} onClick={() => pick(k)}
              style={{ padding: "5px 9px", border: `1px solid ${(awaiting === "a" ? a : b) === k ? "var(--blue-400)" : "var(--border-default)"}`, borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "var(--text-xs)", background: (awaiting === "a" ? a : b) === k ? "var(--surface-selected)" : "#fff", color: "var(--text-primary)" }}>
              {k}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <span onClick={onCancel} style={{ padding: "6px 14px", cursor: "pointer", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>Cancel</span>
          <span onClick={() => a && onApply({ a, op: b ? op : null, b: b || null, log: initial.log })}
            style={{ padding: "6px 16px", cursor: "pointer", fontSize: "var(--text-sm)", fontWeight: 700, color: "#fff", background: "var(--blue-400)", borderRadius: "var(--radius-sm)" }}>
            Apply
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ScatterPlot({ materials, compareIds }) {
  const [x, setX] = useState(PRESETS[0].x);
  const [y, setY] = useState(PRESETS[0].y);
  const [editing, setEditing] = useState(null);
  const [classFilter, setClassFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [xRange, setXRange] = useState(null);
  const [yRange, setYRange] = useState(null);
  const [showClusters, setShowClusters] = useState(false);
  const svgRef = useRef(null);

  const classCounts = useMemo(() => {
    const counts = {};
    materials.forEach((m) => { counts[m.matClass] = (counts[m.matClass] || 0) + 1; });
    return counts;
  }, [materials]);

  const points = useMemo(() => {
    return materials.map((m) => ({ material: m, x: axisValue(m, x), y: axisValue(m, y) }))
      .filter((p) => p.x != null && p.y != null);
  }, [materials, x, y]);

  const xBounds = useMemo(() => {
    if (!points.length) return [0, 1];
    const vals = points.map((p) => p.x);
    return [Math.min(...vals), Math.max(...vals)];
  }, [points]);
  const yBounds = useMemo(() => {
    if (!points.length) return [0, 1];
    const vals = points.map((p) => p.y);
    return [Math.min(...vals), Math.max(...vals)];
  }, [points]);

  const effXRange = xRange || xBounds;
  const effYRange = yRange || yBounds;

  const visiblePoints = points.filter((p) => {
    if (classFilter !== "All" && p.material.matClass !== classFilter) return false;
    if (search && !p.material.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (p.x < effXRange[0] || p.x > effXRange[1]) return false;
    if (p.y < effYRange[0] || p.y > effYRange[1]) return false;
    return true;
  });

  // Pad the visual plot range beyond the filter range so edge points aren't flush against the axes.
  const xPad = (effXRange[1] - effXRange[0]) * 0.08 || (x.log ? 0.3 : 1);
  const yPad = (effYRange[1] - effYRange[0]) * 0.08 || (y.log ? 0.3 : 1);
  const paddedXRange = [effXRange[0] - xPad, effXRange[1] + xPad];
  const paddedYRange = [effYRange[0] - yPad, effYRange[1] + yPad];

  // Non-log axes snap their domain and gridlines to "nice" round numbers (1/2/5 × 10^n).
  // Log axes keep a continuous domain but tick at integer powers of ten.
  const xNice = x.log ? null : niceTicks(paddedXRange[0], paddedXRange[1]);
  const yNice = y.log ? null : niceTicks(paddedYRange[0], paddedYRange[1]);
  const plotXRange = x.log ? paddedXRange : [xNice.min, xNice.max];
  const plotYRange = y.log ? paddedYRange : [yNice.min, yNice.max];
  const xTicks = x.log ? logTicks(paddedXRange[0], paddedXRange[1]).filter((n) => n >= plotXRange[0] && n <= plotXRange[1]) : xNice.ticks.filter((v) => v >= plotXRange[0] - 1e-9 && v <= plotXRange[1] + 1e-9);
  const yTicks = y.log ? logTicks(paddedYRange[0], paddedYRange[1]).filter((n) => n >= plotYRange[0] && n <= plotYRange[1]) : yNice.ticks.filter((v) => v >= plotYRange[0] - 1e-9 && v <= plotYRange[1] + 1e-9);
  const fmtXTick = (v) => (x.log ? fmtAxisValue(Math.pow(10, v)) : fmtAxisValue(v));
  const fmtYTick = (v) => (y.log ? fmtAxisValue(Math.pow(10, v)) : fmtAxisValue(v));

  const W = 560, H = 420, PAD = 50;
  const sx = (v) => PAD + ((v - plotXRange[0]) / (plotXRange[1] - plotXRange[0] || 1)) * (W - PAD * 2);
  const sy = (v) => H - PAD - ((v - plotYRange[0]) / (plotYRange[1] - plotYRange[0] || 1)) * (H - PAD * 2);

  const byClass = useMemo(() => {
    const map = new Map();
    visiblePoints.forEach((p) => {
      if (!map.has(p.material.matClass)) map.set(p.material.matClass, []);
      map.get(p.material.matClass).push(p);
    });
    return map;
  }, [visiblePoints]);

  const ellipses = [...byClass.entries()].map(([cls, pts]) => {
    if (pts.length < 3) return null;
    const px = pts.map((p) => sx(p.x));
    const py = pts.map((p) => sy(p.y));
    const mx = px.reduce((a, b) => a + b, 0) / px.length;
    const my = py.reduce((a, b) => a + b, 0) / py.length;
    const sdx = Math.sqrt(px.reduce((a, b) => a + (b - mx) ** 2, 0) / px.length) * 1.6 + 4;
    const sdy = Math.sqrt(py.reduce((a, b) => a + (b - my) ** 2, 0) / py.length) * 1.6 + 4;
    return { cls, mx, my, sdx, sdy };
  }).filter(Boolean);

  const exportCsv = () => {
    const header = `id,name,class,${axisLabel(x)},${axisLabel(y)}\n`;
    const rows = visiblePoints.map((p) => `${p.material.id},"${p.material.name}",${p.material.matClass},${p.x},${p.y}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "material-scatter-export.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {["All", ...Object.keys(classCounts)].map((c) => (
          <span key={c} onClick={() => setClassFilter(c)}
            style={{ padding: "3px 10px", borderRadius: 12, fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer",
              background: classFilter === c ? (CLASS_COLORS[c] || "var(--blue-400)") : "var(--gray-100)",
              color: classFilter === c ? "#fff" : "var(--text-secondary)" }}>
            {c}{c !== "All" ? ` (${classCounts[c] || 0})` : ` (${materials.length})`}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span onClick={() => setEditing("y")} style={{ fontSize: "var(--text-xs)", padding: "4px 8px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", cursor: "pointer", background: "#fff" }}>
          Y: <b>{axisLabel(y)}</b> ✎
        </span>
        <label style={{ fontSize: "var(--text-2xs)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 3 }}>
          <input type="checkbox" checked={y.log} onChange={(e) => setY({ ...y, log: e.target.checked })} /> Log Y
        </label>
        <span style={{ color: "var(--gray-300)" }}>×</span>
        <span onClick={() => setEditing("x")} style={{ fontSize: "var(--text-xs)", padding: "4px 8px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", cursor: "pointer", background: "#fff" }}>
          X: <b>{axisLabel(x)}</b> ✎
        </span>
        <label style={{ fontSize: "var(--text-2xs)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 3 }}>
          <input type="checkbox" checked={x.log} onChange={(e) => setX({ ...x, log: e.target.checked })} /> Log X
        </label>
        <label style={{ fontSize: "var(--text-2xs)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 3, marginLeft: 6, paddingLeft: 10, borderLeft: "1px solid var(--border-default)" }}>
          <input type="checkbox" checked={showClusters} onChange={(e) => setShowClusters(e.target.checked)} /> Show clusters
        </label>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {PRESETS.map((p) => (
          <span key={p.label} onClick={() => { setX(p.x); setY(p.y); setXRange(null); setYRange(null); }}
            style={{ fontSize: "var(--text-2xs)", padding: "3px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", cursor: "pointer", color: "var(--text-secondary)", background: "#fff" }}>
            {p.label}
          </span>
        ))}
      </div>

      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name to highlight…"
        style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "6px 8px", fontSize: "var(--text-sm)", marginBottom: 10, fontFamily: "var(--font-body)" }} />

      <div style={{ background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: 8, overflowX: "auto" }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Scatter plot of filtered materials">
          <defs>
            <clipPath id="scatter-plot-area">
              <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} />
            </clipPath>
          </defs>
          {xTicks.map((v) => (
            <line key={"gx" + v} x1={sx(v)} y1={PAD} x2={sx(v)} y2={H - PAD} stroke="var(--border-subtle)" />
          ))}
          {yTicks.map((v) => (
            <line key={"gy" + v} x1={PAD} y1={sy(v)} x2={W - PAD} y2={sy(v)} stroke="var(--border-subtle)" />
          ))}
          {xTicks.map((v) => (
            <text key={"tx" + v} x={sx(v)} y={H - PAD + 16} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
              {fmtXTick(v)}
            </text>
          ))}
          {yTicks.map((v) => (
            <text key={"ty" + v} x={PAD - 6} y={sy(v) + 3} textAnchor="end" fontSize={9} fill="var(--text-muted)">
              {fmtYTick(v)}
            </text>
          ))}

          <g clipPath="url(#scatter-plot-area)">
            {showClusters && ellipses.map((e) => (
              <ellipse key={e.cls} cx={e.mx} cy={e.my} rx={e.sdx} ry={e.sdy} fill={CLASS_COLORS[e.cls]} fillOpacity={0.1} stroke={CLASS_COLORS[e.cls]} strokeOpacity={0.5} />
            ))}

            {visiblePoints.map((p) => {
              const highlighted = compareIds.includes(p.material.id);
              const dimmed = search && !p.material.name.toLowerCase().includes(search.toLowerCase());
              return (
                <circle key={p.material.id} cx={sx(p.x)} cy={sy(p.y)} r={highlighted ? 5 : 3}
                  fill={CLASS_COLORS[p.material.matClass] || "var(--gray-400)"}
                  stroke={highlighted ? "var(--blue-700)" : "none"} strokeWidth={highlighted ? 2 : 0}
                  fillOpacity={dimmed ? 0.15 : 0.75}>
                  <title>{p.material.name} ({p.material.id})\n{axisLabel(x)}: {p.x.toFixed(3)}\n{axisLabel(y)}: {p.y.toFixed(3)}</title>
                </circle>
              );
            })}
          </g>

          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border-strong)" />
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border-strong)" />

          <text x={(W) / 2} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">{axisLabel(x)}</text>
          <text x={12} y={H / 2} textAnchor="middle" fontSize={10} fill="var(--text-secondary)" transform={`rotate(-90 12 ${H / 2})`}>{axisLabel(y)}</text>
        </svg>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)", marginBottom: 4 }}>X range: {axisLabel(x)}</div>
          <RangeSlider min={xBounds[0]} max={xBounds[1]} value={effXRange} onChange={setXRange} />
        </div>
        <div>
          <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)", marginBottom: 4 }}>Y range: {axisLabel(y)}</div>
          <RangeSlider min={yBounds[0]} max={yBounds[1]} value={effYRange} onChange={setYRange} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{visiblePoints.length.toLocaleString()} of {materials.length.toLocaleString()} plotted</span>
        <span onClick={exportCsv} style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--blue-400)", cursor: "pointer" }}>⬇ Export CSV</span>
      </div>

      {editing && (
        <FormulaBuilder title={editing === "x" ? "X Axis Formula" : "Y Axis Formula"} initial={editing === "x" ? x : y}
          onApply={(cfg) => { editing === "x" ? setX(cfg) : setY(cfg); setEditing(null); }}
          onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}
