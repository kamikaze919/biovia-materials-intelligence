import { findValue, parseNumeric, SERIES_COLORS } from "./materialUtils.js";

export default function RadarChart({ materials, keys }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const R = 92;
  const n = keys.length;
  const angleFor = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pointAt = (i, frac) => {
    const a = angleFor(i);
    return [cx + R * frac * Math.cos(a), cy + R * frac * Math.sin(a)];
  };

  // Axes are scaled to 115% of the largest value so the max-value material sits inside the
  // outer ring rather than flush against it.
  const HEADROOM = 1.15;
  const maxByKey = keys.map((k) => {
    const vals = materials.map((m) => parseNumeric(findValue(m, k))).filter((v) => v != null && !isNaN(v));
    const max = Math.max(0, ...vals);
    return (max > 0 ? max : 1) * HEADROOM;
  });

  const seriesPolygons = materials.map((m, mi) => {
    const points = keys.map((k, i) => {
      const raw = parseNumeric(findValue(m, k));
      const frac = raw == null || isNaN(raw) ? 0 : Math.min(1, Math.abs(raw) / maxByKey[i]);
      return pointAt(i, frac);
    });
    return { material: m, color: SERIES_COLORS[mi % SERIES_COLORS.length], points };
  });

  if (n === 0) {
    return <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", textAlign: "center", paddingTop: 40 }}>Select at least one property to plot.</div>;
  }

  return (
    <div>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: 320, display: "block", margin: "12px auto" }} role="img" aria-label="Radar comparison chart">
        {[0.33, 0.66, 1].map((level) => (
          <polygon key={level} points={keys.map((_, i) => pointAt(i, level).join(",")).join(" ")}
            fill="none" stroke="var(--border-default)" strokeWidth={1} />
        ))}
        {keys.map((k, i) => {
          const [x, y] = pointAt(i, 1);
          return <line key={k} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border-subtle)" strokeWidth={1} />;
        })}
        {seriesPolygons.map((s) => (
          <polygon key={s.material.id} points={s.points.map((p) => p.join(",")).join(" ")}
            fill={s.color} fillOpacity={0.18} stroke={s.color} strokeWidth={2} />
        ))}
        {seriesPolygons.map((s) => s.points.map((p, i) => (
          <circle key={s.material.id + i} cx={p[0]} cy={p[1]} r={2.5} fill={s.color} />
        )))}
        {keys.map((k, i) => {
          const [x, y] = pointAt(i, 1.18);
          return (
            <text key={k} x={x} y={y} fontSize={8} fill="var(--text-muted)" textAnchor="middle" dominantBaseline="middle">
              {k.length > 14 ? k.slice(0, 13) + "…" : k}
            </text>
          );
        })}
        {[0.33, 0.66, 1].map((level) => (
          <text key={"scale" + level} x={cx + 4} y={cy - R * level} fontSize={7} fill="var(--gray-400)" textAnchor="start">
            {Math.round((level / HEADROOM) * 100)}%
          </text>
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
        {seriesPolygons.map((s) => (
          <span key={s.material.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.color, display: "inline-block" }} />
            {s.material.name}
          </span>
        ))}
      </div>
      <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)", textAlign: "center", marginTop: 6 }}>
        Each axis normalized to the largest value among the compared materials
      </div>
    </div>
  );
}
