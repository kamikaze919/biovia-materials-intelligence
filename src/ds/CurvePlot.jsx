import { generateSNCurve, SERIES_COLORS } from "./materialUtils.js";

export default function CurvePlot({ materials }) {
  const series = materials.slice(0, 4).map((m, i) => ({
    material: m,
    color: SERIES_COLORS[i % SERIES_COLORS.length],
    points: generateSNCurve(m),
  })).filter((s) => s.points);

  if (series.length === 0) {
    return (
      <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", textAlign: "center", paddingTop: 40 }}>
        Add materials with a tensile strength value to plot an S-N fatigue comparison.
      </div>
    );
  }

  const W = 560, H = 380, PAD = 48;
  const allN = series.flatMap((s) => s.points.map((p) => Math.log10(p.N)));
  const allS = series.flatMap((s) => s.points.map((p) => p.sigmaA));
  const [nMin, nMax] = [Math.min(...allN), Math.max(...allN)];
  const [sMin, sMax] = [0, Math.max(...allS) * 1.05];

  const sx = (logN) => PAD + ((logN - nMin) / (nMax - nMin || 1)) * (W - PAD - 16);
  const sy = (s) => H - PAD - ((s - sMin) / (sMax - sMin || 1)) * (H - PAD - 16);

  const pathFor = (points) => points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(Math.log10(p.N))},${sy(p.sigmaA)}`).join(" ");

  return (
    <div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 10 }}>
        S-N fatigue curve (stress amplitude vs. cycles to failure), generated via Basquin's equation from each material's tensile strength — illustrative, not measured test data.
      </div>
      <div style={{ background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: 8, overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="S-N fatigue curve comparison">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line key={"gx" + f} x1={PAD + f * (W - PAD - 16)} y1={PAD} x2={PAD + f * (W - PAD - 16)} y2={H - PAD} stroke="var(--border-subtle)" />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line key={"gy" + f} x1={PAD} y1={H - PAD - f * (H - PAD - 16)} x2={W - 16} y2={H - PAD - f * (H - PAD - 16)} stroke="var(--border-subtle)" />
          ))}
          <line x1={PAD} y1={H - PAD} x2={W - 16} y2={H - PAD} stroke="var(--border-strong)" />
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border-strong)" />

          {[3, 4, 5, 6, 7].filter((n) => n >= nMin - 0.01 && n <= nMax + 0.01).map((n) => (
            <text key={n} x={sx(n)} y={H - PAD + 14} textAnchor="middle" fontSize={9} fill="var(--text-secondary)">10^{n}</text>
          ))}

          {series.map((s) => (
            <path key={s.material.id} d={pathFor(s.points)} fill="none" stroke={s.color} strokeWidth={2.5} />
          ))}
          {series.map((s) => s.points.filter((_, i) => i % 4 === 0).map((p, i) => (
            <circle key={s.material.id + i} cx={sx(Math.log10(p.N))} cy={sy(p.sigmaA)} r={2.5} fill={s.color} />
          )))}

          <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">Cycles to Failure, N (log scale)</text>
          <text x={12} y={H / 2} textAnchor="middle" fontSize={10} fill="var(--text-secondary)" transform={`rotate(-90 12 ${H / 2})`}>Stress Amplitude (MPa)</text>
        </svg>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10, justifyContent: "center" }}>
        {series.map((s) => (
          <span key={s.material.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
            <span style={{ width: 14, height: 2.5, background: s.color, display: "inline-block" }} />
            {s.material.name}
          </span>
        ))}
      </div>
    </div>
  );
}
