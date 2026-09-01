import { useState } from "react";
import { CURVE_DATASETS, SERIES_COLORS } from "./materialUtils.js";
import { niceTicks, fmtAxisValue, logTicks } from "./chartUtils.js";

function CurveSvg({ dataset, points }) {
  const [hover, setHover] = useState(null);
  const W = 520, H = 340, PAD = 50;
  const color = SERIES_COLORS[0];

  const xVals = points.map((p) => (dataset.logX ? Math.log10(p[dataset.xKey]) : p[dataset.xKey]));
  const yVals = points.map((p) => p[dataset.yKey]);
  const [rawXMin, rawXMax] = [Math.min(...xVals), Math.max(...xVals)];
  const [rawYMin, rawYMax] = [Math.min(0, ...yVals), Math.max(...yVals)];
  const xPad = (rawXMax - rawXMin) * 0.08 || (dataset.logX ? 0.3 : 1);
  const yPad = (rawYMax - rawYMin) * 0.08 || 1;
  const paddedXRange = [rawXMin - xPad, rawXMax + xPad];
  const xNice = dataset.logX ? null : niceTicks(paddedXRange[0], paddedXRange[1]);
  const yNice = niceTicks(rawYMin - yPad, rawYMax + yPad);

  const [xMin, xMax] = dataset.logX ? paddedXRange : [xNice.min, xNice.max];
  const [yMin, yMax] = [yNice.min, yNice.max];
  const xTicks = dataset.logX ? logTicks(paddedXRange[0], paddedXRange[1]).filter((n) => n >= xMin && n <= xMax) : xNice.ticks.filter((v) => v >= xMin - 1e-9 && v <= xMax + 1e-9);
  const yTicks = yNice.ticks.filter((v) => v >= yMin - 1e-9 && v <= yMax + 1e-9);

  const sx = (v) => PAD + ((v - xMin) / (xMax - xMin || 1)) * (W - PAD * 2);
  const sy = (v) => H - PAD - ((v - yMin) / (yMax - yMin || 1)) * (H - PAD * 2);

  const scaledPoints = points.map((p) => ({
    raw: p,
    x: sx(dataset.logX ? Math.log10(p[dataset.xKey]) : p[dataset.xKey]),
    y: sy(p[dataset.yKey]),
  }));
  const path = scaledPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${dataset.label} chart`}
      onMouseLeave={() => setHover(null)}>
      {xTicks.map((v) => (
        <line key={"gx" + v} x1={sx(v)} y1={PAD} x2={sx(v)} y2={H - PAD} stroke="var(--border-subtle)" />
      ))}
      {yTicks.map((v) => (
        <line key={"gy" + v} x1={PAD} y1={sy(v)} x2={W - PAD} y2={sy(v)} stroke="var(--border-subtle)" />
      ))}
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border-strong)" />
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border-strong)" />

      {xTicks.map((v) => (
        <text key={"tx" + v} x={sx(v)} y={H - PAD + 16} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
          {dataset.logX ? `10^${v}` : fmtAxisValue(v)}
        </text>
      ))}
      {yTicks.map((v) => (
        <text key={"ty" + v} x={PAD - 6} y={sy(v) + 3} textAnchor="end" fontSize={9} fill="var(--text-muted)">
          {fmtAxisValue(v)}
        </text>
      ))}

      <path d={path} fill="none" stroke={color} strokeWidth={2.5} />
      {scaledPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={hover === i ? 5 : 2.5} fill={color}
          stroke={hover === i ? "var(--blue-700)" : "none"} strokeWidth={hover === i ? 2 : 0}
          style={{ cursor: "pointer" }}
          onMouseEnter={() => setHover(i)} />
      ))}
      {hover != null && hover < scaledPoints.length && (() => {
        const p = scaledPoints[hover];
        const xText = `${dataset.xKey === "N" ? "N" : "Strain"}: ${dataset.logX ? p.raw[dataset.xKey].toExponential(2) : fmtAxisValue(p.raw[dataset.xKey]) + "%"}`;
        const yText = `${dataset.yKey === "sigmaA" ? "Stress amplitude" : "Stress"}: ${fmtAxisValue(p.raw[dataset.yKey])} MPa`;
        const boxW = 148, boxH = 34;
        const bx = Math.min(Math.max(p.x - boxW / 2, 2), W - boxW - 2);
        const by = p.y - boxH - 10 < 0 ? p.y + 10 : p.y - boxH - 10;
        return (
          <g pointerEvents="none">
            <rect x={bx} y={by} width={boxW} height={boxH} rx={4} fill="var(--surface-header-deep)" opacity={0.94} />
            <text x={bx + 8} y={by + 14} fontSize={9} fill="#fff">{xText}</text>
            <text x={bx + 8} y={by + 27} fontSize={9} fill="#fff">{yText}</text>
          </g>
        );
      })()}

      <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">{dataset.xLabel}</text>
      <text x={12} y={H / 2} textAnchor="middle" fontSize={10} fill="var(--text-secondary)" transform={`rotate(-90 12 ${H / 2})`}>{dataset.yLabel}</text>
    </svg>
  );
}

export default function CurveExplorer({ material }) {
  const [selectedId, setSelectedId] = useState(null);
  const available = CURVE_DATASETS.map((d) => ({ ...d, points: d.generate(material) })).filter((d) => d.points);
  const selected = available.find((d) => d.id === selectedId);

  if (available.length === 0) {
    return (
      <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", textAlign: "center", paddingTop: 40 }}>
        No curve datasets are available for this material — it's missing the properties needed to generate one (e.g. tensile strength, or a full stress-strain property set).
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "var(--tracking-label)", marginBottom: 8 }}>
        Available Datasets
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {available.map((d) => (
          <span key={d.id} role="button" tabIndex={0} onClick={() => setSelectedId(d.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(d.id); } }}
            style={{ fontSize: "var(--text-xs)", fontWeight: 600, padding: "6px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer",
              border: `1px solid ${selectedId === d.id ? "var(--blue-400)" : "var(--border-default)"}`,
              background: selectedId === d.id ? "var(--blue-50)" : "#fff",
              color: selectedId === d.id ? "var(--blue-400)" : "var(--text-primary)" }}>
            {d.label}
          </span>
        ))}
      </div>

      {!selected && (
        <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", textAlign: "center", padding: "40px 0", border: "1px dashed var(--border-default)", borderRadius: "var(--radius-md)" }}>
          Select a dataset above to view its curve.
        </div>
      )}

      {selected && (
        <div>
          {selected.id === "sn" && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 10 }}>
              Generated via Basquin's equation from tensile strength — illustrative, not measured test data. Hover a point for exact values.
            </div>
          )}
          {selected.id === "stress-strain" && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 10 }}>
              Generated from yield strength, tensile strength, elongation at break, and Young's modulus — illustrative, not measured test data. Hover a point for exact values.
            </div>
          )}
          <div style={{ background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: 8 }}>
            <CurveSvg key={selected.id} dataset={selected} points={selected.points} />
          </div>
        </div>
      )}
    </div>
  );
}
