import { useState } from "react";
import { Tabs } from "./components.jsx";
import RadarChart from "./RadarChart.jsx";
import ScatterPlot from "./ScatterPlot.jsx";
import CurvePlot from "./CurvePlot.jsx";
import { ALL_PROPERTY_KEYS, findValue } from "./materialUtils.js";

const DEFAULT_PROPS = ["Density", "Tensile Strength", "Yield Strength", "Young's Modulus", "Thermal Conductivity", "Electrical Resistivity"];

function CompareChips({ materials, onRemove }) {
  if (materials.length === 0) {
    return (
      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", marginBottom: 10 }}>
        No materials added to compare yet — check the box next to a material in the list.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", marginBottom: 10 }}>
      {materials.map((m) => (
        <span key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface-selected)", color: "var(--blue-400)", padding: "3px 6px 3px 10px", borderRadius: "var(--radius-sm)", fontSize: "var(--text-xs)", fontWeight: 600 }}>
          {m.name}
          <span onClick={() => onRemove(m.id)} style={{ cursor: "pointer", color: "var(--blue-300)", fontWeight: 400 }}>×</span>
        </span>
      ))}
    </div>
  );
}

function PropertyPicker({ selected, onToggle }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
      {ALL_PROPERTY_KEYS.map((k) => {
        const active = selected.includes(k);
        return (
          <span key={k} onClick={() => onToggle(k)}
            style={{ padding: "3px 8px", borderRadius: "var(--radius-sm)", fontSize: "var(--text-2xs)", cursor: "pointer", border: `1px solid ${active ? "var(--blue-400)" : "var(--border-default)"}`, background: active ? "var(--surface-selected)" : "#fff", color: active ? "var(--blue-400)" : "var(--text-secondary)" }}>
            {k}
          </span>
        );
      })}
    </div>
  );
}

export default function AnalysisPanel({ compareMaterials, allFiltered, compareIds, onRemove }) {
  const [tab, setTab] = useState("Side by Side");
  const [props, setProps] = useState(DEFAULT_PROPS);
  const toggleProp = (k) => setProps((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const capped = compareMaterials.slice(0, 4);

  return (
    <div>
      <CompareChips materials={compareMaterials} onRemove={onRemove} />
      <Tabs items={["Side by Side", "Radar Plot", "Scatter Plot", "Curve"]} active={tab} onChange={setTab} />
      <div style={{ paddingTop: 12 }}>
        {tab === "Side by Side" && (
          <>
            <PropertyPicker selected={props} onToggle={toggleProp} />
            {capped.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", textAlign: "center", paddingTop: 20 }}>Add materials to compare.</div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: `1.3fr repeat(${capped.length}, 1fr)`, gap: 6, padding: "10px 0", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-label)", borderBottom: "2px solid var(--border-strong)" }}>
                  <span>Property</span>
                  {capped.map((m) => <span key={m.id}>{m.name.length > 14 ? m.name.slice(0, 13) + "…" : m.name}</span>)}
                </div>
                {props.map((prop) => (
                  <div key={prop} style={{ display: "grid", gridTemplateColumns: `1.3fr repeat(${capped.length}, 1fr)`, gap: 6, padding: "8px 0", fontSize: "var(--text-sm)", color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span>{prop}</span>
                    {capped.map((m) => <span key={m.id}>{findValue(m, prop)}</span>)}
                  </div>
                ))}
              </>
            )}
          </>
        )}
        {tab === "Radar Plot" && (
          <>
            <PropertyPicker selected={props} onToggle={toggleProp} />
            {capped.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", textAlign: "center", paddingTop: 20 }}>Add materials to compare.</div>
            ) : (
              <RadarChart materials={capped} keys={props} />
            )}
          </>
        )}
        {tab === "Scatter Plot" && (
          <ScatterPlot materials={allFiltered} compareIds={compareIds} />
        )}
        {tab === "Curve" && (
          <CurvePlot materials={capped} />
        )}
      </div>
    </div>
  );
}
