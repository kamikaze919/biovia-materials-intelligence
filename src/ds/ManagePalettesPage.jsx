import { useState, useMemo } from "react";
import { Button, Checkbox, Tabs, Tag } from "./components.jsx";
import PlatformHeader from "./PlatformHeader.jsx";
import rawMaterials from "./materials.json";
import logoBiovia from "./assets/logo-biovia.png";
import { classColor } from "./materialUtils.js";
import { USERS, PALETTE_ROLES } from "./paletteData.js";

const MATERIALS = rawMaterials;
const MATERIALS_BY_ID = new Map(MATERIALS.map((m) => [m.id, m]));
const USERS_BY_ID = new Map(USERS.map((u) => [u.id, u]));
const ROLE_RANK = Object.fromEntries(PALETTE_ROLES.map((r, i) => [r, i]));
const ROLE_TONE = { Owner: "blue", Leader: "success", Author: "neutral", Contributor: "neutral", Reader: "neutral" };

export default function ManagePalettesPage({ onGoHome, palettes, onToggleMaterialInPalette, onToggleDeployed }) {
  const [selectedId, setSelectedId] = useState(palettes[0]?.id || null);
  const [tab, setTab] = useState("Materials");
  const [materialSearch, setMaterialSearch] = useState("");
  const [addMode, setAddMode] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  const selected = palettes.find((p) => p.id === selectedId) || null;
  const owner = selected?.members.find((m) => m.role === "Owner");
  const ownerUser = owner ? USERS_BY_ID.get(owner.userId) : null;

  const paletteMaterials = useMemo(() => {
    if (!selected) return [];
    const q = materialSearch.trim().toLowerCase();
    return selected.materialIds
      .map((id) => MATERIALS_BY_ID.get(id))
      .filter(Boolean)
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
  }, [selected, materialSearch]);

  const addCandidates = useMemo(() => {
    if (!selected || !addMode) return [];
    const q = addSearch.trim().toLowerCase();
    if (!q) return [];
    const inPalette = new Set(selected.materialIds);
    return MATERIALS.filter((m) => !inPalette.has(m.id) && (m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))).slice(0, 30);
  }, [selected, addMode, addSearch]);

  const sortedMembers = selected ? [...selected.members].sort((a, b) => ROLE_RANK[b.role] - ROLE_RANK[a.role]) : [];

  return (
    <div style={{ height: "100vh", background: "#eef0f3", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PlatformHeader />
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border-strong)", height: 34, display: "flex", alignItems: "center", padding: "0 12px", fontFamily: "var(--font-body)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)" }}>
          <img src={logoBiovia} alt="BIOVIA" style={{ width: 16, height: 16, borderRadius: 3, display: "block" }} />
          BIOVIA - Materials Intelligence
        </div>
      </div>
      <div style={{ height: 30, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: "var(--gray-50)", borderBottom: "1px solid var(--border-strong)", fontSize: "var(--text-sm)", color: "var(--text-secondary)", fontFamily: "var(--font-ui)" }}>
        <span onClick={onGoHome} style={{ color: "var(--text-secondary)", textDecoration: "none", cursor: "pointer" }}>⌂ Home</span>
        <span style={{ color: "var(--gray-300)" }}>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Manage Palettes</span>
        <span style={{ marginLeft: "auto", color: "var(--gray-400)", fontSize: "var(--text-xs)" }}>{palettes.length} collabspaces</span>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--border-strong)", background: "var(--gray-25)", overflowY: "auto" }}>
          {palettes.map((p) => {
            const isActive = p.id === selectedId;
            return (
              <div key={p.id} role="button" tabIndex={0} aria-selected={isActive}
                onClick={() => { setSelectedId(p.id); setTab("Materials"); setMaterialSearch(""); setAddMode(false); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(p.id); setTab("Materials"); setMaterialSearch(""); setAddMode(false); } }}
                style={{ padding: "12px 14px", cursor: "pointer", borderBottom: "1px solid var(--border-subtle)", background: isActive ? "var(--surface-selected)" : "#fff", borderLeft: isActive ? "3px solid var(--blue-400)" : "3px solid transparent" }}>
                <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 3, lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--blue-400)", marginBottom: 7 }}>
                  <span aria-hidden="true">📁</span>{p.collabspace}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                  <Tag tone="neutral">{p.visibility}</Tag>
                  <Tag tone={p.deployed ? "success" : "danger"}>{p.deployed ? "Deployed" : "Not Deployed"}</Tag>
                </div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>{p.materialIds.length} materials · {p.members.length} members</div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", background: "#fff" }}>
          {!selected && (
            <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", textAlign: "center", paddingTop: 60 }}>
              Select a palette from the list to manage it.
            </div>
          )}
          {selected && (
            <>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>{selected.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--blue-400)", marginTop: 4 }}>
                      <span aria-hidden="true">📁</span> Collabspace: {selected.collabspace}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Tag tone="neutral">{selected.visibility}</Tag>
                      <Tag tone={selected.deployed ? "success" : "danger"}>{selected.deployed ? "Deployed" : "Not Deployed"}</Tag>
                    </div>
                    <Button variant={selected.deployed ? "secondary" : "accent"} size="sm" onClick={() => onToggleDeployed && onToggleDeployed(selected.id)}>
                      {selected.deployed ? "Retract" : "Deploy"}
                    </Button>
                  </div>
                </div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginBottom: 8, marginTop: 8 }}>{selected.description}</div>
                {ownerUser && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Owner: <strong style={{ color: "var(--text-secondary)" }}>{ownerUser.name}</strong> · {ownerUser.title}</div>
                )}
              </div>

              <Tabs items={["Materials", "Access"]} active={tab} onChange={setTab} />

              {tab === "Materials" && (
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "14px 20px" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input type="text" value={materialSearch} onChange={(e) => setMaterialSearch(e.target.value)}
                      placeholder={`Search ${selected.materialIds.length} materials in this palette…`}
                      style={{ flex: 1, border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "6px 10px", fontSize: "var(--text-sm)", fontFamily: "var(--font-body)" }} />
                    <Button variant={addMode ? "secondary" : "accent"} size="sm" onClick={() => { setAddMode((v) => !v); setAddSearch(""); }}>
                      {addMode ? "Done" : "+ Add Materials"}
                    </Button>
                  </div>

                  {addMode && (
                    <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: 10, marginBottom: 14, background: "var(--gray-25)" }}>
                      <input type="text" value={addSearch} onChange={(e) => setAddSearch(e.target.value)}
                        placeholder="Search all materials by name or ID to add…"
                        style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "6px 10px", fontSize: "var(--text-sm)", fontFamily: "var(--font-body)", marginBottom: addCandidates.length ? 8 : 0 }} />
                      {addCandidates.map((m) => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", borderBottom: "1px solid var(--border-subtle)" }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: classColor(m.matClass), flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                          <span style={{ fontSize: "var(--text-2xs)", color: "var(--gray-400)", fontFamily: "var(--font-mono)" }}>{m.id}</span>
                          <Button variant="accent" size="sm" onClick={() => onToggleMaterialInPalette(selected.id, m.id, true)}>+ Add</Button>
                        </div>
                      ))}
                      {addSearch && addCandidates.length === 0 && (
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", padding: "4px 2px" }}>No matches outside this palette.</div>
                      )}
                    </div>
                  )}

                  <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                    {paletteMaterials.length === 0 && (
                      <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", textAlign: "center", paddingTop: 30 }}>
                        {materialSearch ? "No materials match your search." : "No materials in this palette yet."}
                      </div>
                    )}
                    {paletteMaterials.map((m) => (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderBottom: "1px solid var(--border-subtle)" }}>
                        <span style={{ width: 24, height: 24, borderRadius: "var(--radius-sm)", background: classColor(m.matClass), flexShrink: 0 }} title={m.matClass} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>{m.name}</div>
                          <div style={{ fontSize: "var(--text-2xs)", color: "var(--gray-400)", fontFamily: "var(--font-mono)" }}>{m.id} · {m.matClass} / {m.subClass}</div>
                        </div>
                        <span role="button" tabIndex={0} aria-label={`Remove ${m.name} from palette`}
                          onClick={() => onToggleMaterialInPalette(selected.id, m.id, false)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggleMaterialInPalette(selected.id, m.id, false); } }}
                          title="Remove from palette"
                          style={{ cursor: "pointer", color: "var(--gray-300)", fontSize: 18, padding: "0 6px" }}
                          onMouseOver={(e) => { e.currentTarget.style.color = "var(--danger-600)"; }}
                          onMouseOut={(e) => { e.currentTarget.style.color = "var(--gray-300)"; }}>×</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "Access" && (
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 20px" }}>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 12 }}>
                    Members of this collabspace's user group. Management of membership happens outside this app.
                  </div>
                  {sortedMembers.map((m) => {
                    const user = USERS_BY_ID.get(m.userId);
                    if (!user) return null;
                    return (
                      <div key={m.userId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderBottom: "1px solid var(--border-subtle)" }}>
                        <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--blue-100)", color: "var(--blue-700)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xs)", fontWeight: 700, flexShrink: 0 }}>
                          {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</div>
                          <div style={{ fontSize: "var(--text-2xs)", color: "var(--gray-400)" }}>{user.title}</div>
                        </div>
                        <Tag tone={ROLE_TONE[m.role]}>{m.role}</Tag>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
