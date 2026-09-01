import { useState, useEffect } from "react";
import { Button } from "./components.jsx";
import PlatformHeader from "./PlatformHeader.jsx";
import logoBiovia from "./assets/logo-biovia.png";

const MATERIALS = [
  { name: "Ti-6Al-4V (Grade 5)", swatch: "#9a9a9c", collection: "Approved Library", origin: "USA", id: "MAT-10234" },
  { name: "6061-T6 Aluminum", swatch: "#c9ccd1", collection: "Approved Library", origin: "USA", id: "MAT-10871" },
  { name: "316L Stainless Steel", swatch: "#8b8f94", collection: "Total Materia", origin: "Japan", id: "MAT-11042" },
  { name: "PEEK (Unfilled)", swatch: "#d8c9a3", collection: "Total Materia", origin: "China", id: "MAT-11390" },
  { name: "ABS (General Purpose)", swatch: "#e8e8e6", collection: "Approved Library", origin: "USA", id: "MAT-11655" },
];

const SAVED_SEARCHES = [
  { label: "High-temp polymers, Tg > 200°C", count: 42 },
  { label: "Aerospace alloys — RoHS compliant", count: 128 },
  { label: "Biocompatible metals", count: 19 },
];

export default function HomePage({ onOpenLibrary }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div style={{ height: "100vh", background: "#eef0f3", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <PlatformHeader />
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border-strong)", height: 34, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", fontFamily: "var(--font-body)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)" }}>
          <img src={logoBiovia} alt="BIOVIA" style={{ width: 16, height: 16, borderRadius: 3, display: "block" }} />
          BIOVIA - Materials Intelligence
        </div>
        <div style={{ display: "flex", gap: 12, color: "var(--gray-500)", fontSize: 13 }}>
          <span>⌕</span><span>？</span><span>⚙</span><span>↻</span><span>📌</span><span>✕</span>
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ width: 280, flexShrink: 0, background: "var(--blue-700)", color: "#fff", display: "flex", flexDirection: "column", padding: "24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <img src={logoBiovia} alt="BIOVIA" style={{ width: 34, height: 34, borderRadius: 7, display: "block" }} />
            <span style={{ fontSize: "var(--text-xl)", fontWeight: 700, fontFamily: "var(--font-ui)" }}>Materials Intelligence</span>
          </div>
          <div style={{ fontSize: "var(--text-md)", color: "rgba(255,255,255,0.85)", marginBottom: 16 }}>Simple, fast, precise materials searches</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--blue-800)", padding: "5px 10px", fontSize: "var(--text-xs)", marginBottom: 16, cursor: "pointer", borderRadius: "var(--radius-sm)", width: "fit-content" }}>
            📣 What's New
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "auto" }}>
            <Button variant="accent" size="lg" onClick={onOpenLibrary}>Material Library</Button>
            <Button variant="secondary" size="lg" onClick={() => setOpen((o) => !o)}>Recent Materials</Button>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <div style={{ flex: 1, padding: "8px 10px", fontSize: "var(--text-xs)", textAlign: "center", cursor: "pointer" }}>📘 Documentation</div>
            <div style={{ flex: 1, padding: "8px 10px", fontSize: "var(--text-xs)", textAlign: "center", cursor: "pointer" }}>⚒ User Community</div>
          </div>
        </div>
        <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "radial-gradient(circle at 30% 30%, #234a6e, #0a1e33 70%)" }}>
          {open && (
            <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(10,20,35,0.35)" }} />
          )}
          {open && (
            <div role="dialog" aria-label="Recent Materials" onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 40, left: 40, right: 40, background: "#fff", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-overlay)", padding: 16, fontFamily: "var(--font-ui)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>Recent Materials</span>
                <span onClick={() => setOpen(false)} style={{ cursor: "pointer", color: "var(--gray-500)", fontSize: 14 }}>✕</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                {MATERIALS.map((m) => (
                  <div key={m.id} style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: 10, cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: "var(--radius-sm)", background: m.swatch, flexShrink: 0 }} />
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.25 }}>{m.name}</span>
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", marginBottom: 2 }}>Collection: {m.collection}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", marginBottom: 2 }}>Origin: {m.origin}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{m.id}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6, borderTop: "1px solid var(--border-subtle)", paddingTop: 10 }}>
                Saved Searches
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {SAVED_SEARCHES.map((s) => (
                  <div key={s.label} style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: 10, cursor: "pointer" }}>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--link)", marginBottom: 6, lineHeight: 1.3 }}>{s.label}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{s.count} materials</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
