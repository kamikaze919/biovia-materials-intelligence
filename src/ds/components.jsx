import { useState } from "react";

export function Tag({ children, tone = "blue" }) {
  const tones = {
    blue: { color: "var(--blue-400)", background: "var(--blue-50)" },
    neutral: { color: "var(--gray-600)", background: "var(--gray-75)" },
    success: { color: "var(--success-600)", background: "var(--success-100)" },
    danger: { color: "var(--danger-600)", background: "var(--danger-100)" },
  };
  const t = tones[tone] || tones.blue;
  return (
    <span style={{ fontSize: "var(--text-xs)", color: t.color, background: t.background, padding: "1px 6px", display: "inline-block", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)" }}>
      {children}
    </span>
  );
}

export function MaterialRow({ name, id, classification, subclassification, secondaryPath, selected, onClick }) {
  return (
    <div onClick={onClick} style={{ display: "grid", gridTemplateColumns: "1fr 96px 130px", gap: 6, padding: "6px 10px", alignItems: "center", borderBottom: "1px solid var(--gray-75)", cursor: "pointer", background: selected ? "var(--surface-selected)" : "var(--white)", borderLeft: selected ? "3px solid var(--blue-400)" : "3px solid transparent", fontFamily: "var(--font-body)" }}
      onMouseOver={(e) => { if (!selected) e.currentTarget.style.background = "var(--surface-hover)"; }}
      onMouseOut={(e) => { if (!selected) e.currentTarget.style.background = "var(--white)"; }}>
      <div>
        <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)" }}>{name}</div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)" }}>{id}</div>
      </div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--gray-700)" }}>
        {classification}<br /><span style={{ color: "var(--gray-400)" }}>{subclassification}</span>
      </div>
      <div><Tag>{secondaryPath || "—"}</Tag></div>
    </div>
  );
}

export function Toast({ message, tone = "success", visible }) {
  const tones = { success: { background: "var(--success-500)", border: "#2ecc71" }, danger: { background: "var(--danger-600)", border: "#e05a50" } };
  const t = tones[tone] || tones.success;
  return (
    <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: t.background, color: "var(--white)", padding: "9px 22px", fontSize: "var(--text-base)", fontWeight: 700, border: `1px solid ${t.border}`, display: visible ? "block" : "none", zIndex: 50, fontFamily: "var(--font-ui)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-overlay)", whiteSpace: "nowrap" }}>
      {message}
    </div>
  );
}

export function Button({ variant = "primary", size = "md", disabled = false, children, onClick, icon }) {
  const sizes = { sm: { h: 26, pad: "0 10px", font: "var(--text-xs)" }, md: { h: 32, pad: "0 14px", font: "var(--text-base)" }, lg: { h: 36, pad: "0 18px", font: "var(--text-md)" } };
  const s = sizes[size] || sizes.md;
  const base = { height: s.h, padding: s.pad, fontFamily: "var(--font-ui)", fontSize: s.font, fontWeight: 700, border: "1px solid transparent", cursor: disabled ? "default" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: "var(--radius-sm)", transition: "background 120ms ease, border-color 120ms ease, color 120ms ease" };
  const variants = {
    primary: { background: disabled ? "var(--gray-200)" : "var(--success-500)", color: disabled ? "var(--gray-400)" : "var(--white)", borderColor: "transparent" },
    accent: { background: disabled ? "var(--gray-200)" : "var(--blue-400)", color: disabled ? "var(--gray-400)" : "var(--white)", borderColor: "transparent" },
    secondary: { background: "var(--white)", color: disabled ? "var(--gray-400)" : "var(--text-primary)", borderColor: "var(--border-default)" },
    ghost: { background: "transparent", color: disabled ? "var(--gray-400)" : "var(--blue-400)", borderColor: "transparent" },
    danger: { background: disabled ? "var(--gray-200)" : "var(--danger-600)", color: disabled ? "var(--gray-400)" : "var(--white)", borderColor: "transparent" },
  };
  const style = { ...base, ...(variants[variant] || variants.primary) };
  return (
    <button style={style} disabled={disabled} onClick={onClick}
      onMouseOver={(e) => { if (!disabled && variant === "secondary") e.currentTarget.style.background = "var(--surface-hover)"; if (!disabled && variant === "ghost") e.currentTarget.style.background = "var(--surface-hover)"; }}
      onMouseOut={(e) => { if (variant === "secondary" || variant === "ghost") e.currentTarget.style.background = variants[variant].background; }}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </button>
  );
}

export function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange && onChange(e.target.checked)} style={{ width: 14, height: 14, accentColor: "var(--blue-400)", cursor: "pointer" }} />
      {label ? <span>{label}</span> : null}
    </label>
  );
}

export function PropertyGroup({ title, rows, checkedKeys, onToggleRow, onToggleAll }) {
  const allChecked = rows.every((r) => checkedKeys.includes(r.key));
  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--blue-700)", padding: "8px 0 4px", borderBottom: "1px solid var(--border-subtle)", marginBottom: 4, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-ui)" }}>
        {title}
        <span onClick={() => onToggleAll && onToggleAll(!allChecked)} style={{ fontSize: "var(--text-xs)", color: "var(--blue-400)", cursor: "pointer", fontWeight: 400, textDecoration: "underline" }}>
          {allChecked ? "Deselect all" : "Select all"}
        </span>
      </div>
      {rows.map((r) => (
        <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid var(--gray-50)" }}>
          <Checkbox checked={checkedKeys.includes(r.key)} onChange={(c) => onToggleRow && onToggleRow(r.key, c)} />
          <span title={r.key} style={{ flex: 1, minWidth: 0, color: "var(--gray-700)", fontSize: "var(--text-base)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.key}</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 700, textAlign: "right", fontSize: "var(--text-base)", whiteSpace: "nowrap", flexShrink: 0 }}>{r.value ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}

export function CollapsibleSection({ title, count, defaultOpen = false, maxHeight = 180, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--white)", overflow: "hidden" }}>
      <div role="button" tabIndex={0} onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); } }}
        style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none", padding: "8px 10px", background: open ? "var(--gray-50)" : "transparent" }}>
        <span style={{ fontSize: 9, color: "var(--gray-400)", width: 8, flexShrink: 0 }}>{open ? "▾" : "▸"}</span>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "var(--tracking-label)", flex: 1 }}>{title}</span>
        {typeof count === "number" && count > 0 ? (
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--blue-400)", background: "var(--blue-50)", borderRadius: "var(--radius-sm)", padding: "0 5px" }}>{count}</span>
        ) : null}
      </div>
      {open && (
        <div style={{ maxHeight, overflowY: "auto", padding: "8px 10px 10px", borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 6 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function ToggleChips({ options, activeSet, onToggle }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((opt) => {
        const active = !!activeSet[opt];
        return (
          <span key={opt} role="button" tabIndex={0} onClick={() => onToggle(opt, !active)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(opt, !active); } }}
            style={{ fontSize: "var(--text-xs)", fontWeight: 600, padding: "5px 10px", borderRadius: "var(--radius-sm)", cursor: "pointer", userSelect: "none", border: `1px solid ${active ? "var(--blue-400)" : "var(--border-default)"}`, background: active ? "var(--blue-50)" : "var(--white)", color: active ? "var(--blue-400)" : "var(--gray-600)" }}>
            {opt}
          </span>
        );
      })}
    </div>
  );
}

export function RangeSlider({ min, max, value, unit = "", step, onChange }) {
  const [lo, hi] = value;
  const span = Math.max(max - min, 1e-9);
  const decimals = span < 5 ? 2 : span < 50 ? 1 : 0;
  const fmt = (v) => (Number.isInteger(v) ? v : v.toFixed(decimals));
  const sliderStep = step || Math.max(span / 100, 0.001);
  const pct = (v) => ((v - min) / span) * 100;
  return (
    <div style={{ padding: "2px 4px 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-2xs)", color: "var(--gray-500)", marginBottom: 4 }}>
        <span>{fmt(lo)}{unit ? ` ${unit}` : ""}</span>
        <span>{fmt(hi)}{unit ? ` ${unit}` : ""}</span>
      </div>
      <div style={{ position: "relative", height: 16 }}>
        <div style={{ position: "absolute", top: 7, left: 0, right: 0, height: 2, background: "var(--gray-150)", borderRadius: 1 }} />
        <div style={{ position: "absolute", top: 7, height: 2, background: "var(--blue-400)", borderRadius: 1, left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" min={min} max={max} step={sliderStep} value={lo}
          onChange={(e) => onChange([Math.min(parseFloat(e.target.value), hi), hi])}
          style={{ position: "absolute", width: "100%", top: 0, margin: 0, background: "transparent", pointerEvents: "none", WebkitAppearance: "none", appearance: "none", height: 16 }}
          className="range-thumb-only" />
        <input type="range" min={min} max={max} step={sliderStep} value={hi}
          onChange={(e) => onChange([lo, Math.max(parseFloat(e.target.value), lo)])}
          style={{ position: "absolute", width: "100%", top: 0, margin: 0, background: "transparent", pointerEvents: "none", WebkitAppearance: "none", appearance: "none", height: 16 }}
          className="range-thumb-only" />
      </div>
    </div>
  );
}

export function SearchField({ value, onChange, placeholder = "Search…", onClear }) {
  return (
    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-default)", background: "var(--white)", height: 28, padding: "0 8px", gap: 6, borderRadius: "var(--radius-sm)" }}>
      <span style={{ color: "var(--gray-300)", fontSize: 12 }} aria-hidden="true">⌕</span>
      <input type="text" value={value} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, border: 0, outline: "none", fontSize: "var(--text-base)", fontFamily: "var(--font-body)", color: "var(--text-primary)", background: "transparent" }} />
      {value ? <span onClick={onClear} style={{ color: "var(--gray-300)", cursor: "pointer", fontSize: 15, lineHeight: 1 }} aria-label="Clear">×</span> : null}
    </div>
  );
}

export function DialogHeader({ icon, title, actions = ["⌕", "？", "⚙", "↻", "📌", "✕"] }) {
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid var(--border-strong)", height: 34, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", fontFamily: "var(--font-ui)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)" }}>
        {icon}
        {title}
      </div>
      <div style={{ display: "flex", gap: 12, color: "var(--gray-500)", fontSize: 13 }}>
        {actions.map((a, i) => <span key={i}>{a}</span>)}
      </div>
    </div>
  );
}

export function PanelHeader({ title, subtitle, onClose, deep = false }) {
  return (
    <div style={{ background: deep ? "var(--surface-header-deep)" : "var(--surface-header)", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
      <div>
        <div style={{ color: "var(--text-on-blue)", fontSize: "var(--text-md)", fontWeight: 700, fontFamily: "var(--font-ui)", display: "flex", alignItems: "center", gap: 7 }}>{title}</div>
        {subtitle ? <div style={{ color: "var(--text-on-blue-muted)", fontSize: "var(--text-xs)", marginTop: 2 }}>{subtitle}</div> : null}
      </div>
      {onClose ? (
        <div onClick={onClose} style={{ color: "var(--text-on-blue-muted)", cursor: "pointer", fontSize: 18, lineHeight: 1, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-sm)" }}
          onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#fff"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-on-blue-muted)"; }}>
          ×
        </div>
      ) : null}
    </div>
  );
}

function Node({ node, depth, expanded, onToggle, activeLabel, onSelect }) {
  const isActive = activeLabel === node.label;
  const isOpen = expanded[node.id] !== false;
  const hasChildren = node.children && node.children.length > 0;
  return (
    <>
      <div role="treeitem" aria-selected={isActive} aria-expanded={hasChildren ? isOpen : undefined} tabIndex={0}
        onClick={() => onSelect && onSelect(node.label)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect && onSelect(node.label); }
          else if (e.key === "ArrowRight" && hasChildren && !isOpen) { onToggle && onToggle(node.id); }
          else if (e.key === "ArrowLeft" && hasChildren && isOpen) { onToggle && onToggle(node.id); }
        }}
        style={{ display: "flex", alignItems: "center", gap: 4, padding: `4px 6px 4px ${8 + depth * 12}px`, fontSize: depth === 0 ? "var(--text-base)" : "var(--text-sm)", color: isActive ? "var(--blue-400)" : "var(--gray-800)", fontWeight: depth === 0 ? 700 : 400, cursor: "pointer", borderBottom: "1px solid var(--gray-50)", background: isActive ? "var(--surface-selected)" : "var(--white)" }}
        onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = "var(--surface-hover)"; }}
        onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = "var(--white)"; }}>
        <span onClick={(e) => { e.stopPropagation(); hasChildren && onToggle && onToggle(node.id); }} style={{ color: "var(--gray-300)", width: 11, fontSize: "var(--text-sm)", flexShrink: 0 }} aria-hidden="true">
          {hasChildren ? (isOpen ? "▾" : "▸") : " "}
        </span>
        <span style={{ flex: 1 }}>{node.label}</span>
        {typeof node.count === "number" ? <span style={{ fontSize: "var(--text-2xs)", color: "var(--gray-300)" }}>{node.count}</span> : null}
      </div>
      {hasChildren && isOpen ? node.children.map((c) => (
        <Node key={c.id} node={c} depth={depth + 1} expanded={expanded} onToggle={onToggle} activeLabel={activeLabel} onSelect={onSelect} />
      )) : null}
    </>
  );
}

export function ClassificationTree({ sections }) {
  return (
    <div style={{ fontFamily: "var(--font-body)", background: "var(--gray-25)" }}>
      {sections.map((sec, i) => (
        <div key={sec.label || i}>
          {sec.label && (
            <div style={{ padding: "3px 8px 2px", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "var(--tracking-label)", background: "var(--gray-50)", borderBottom: "1px solid var(--border-subtle)" }}>
              {sec.label}
            </div>
          )}
          {sec.nodes.map((n) => (
            <Node key={n.id} node={n} depth={0} expanded={sec.expanded || {}} onToggle={sec.onToggle} activeLabel={sec.activeLabel} onSelect={sec.onSelect} />
          ))}
        </div>
      ))}
    </div>
  );
}

function UsageNode({ node, path, depth, expanded, onToggleExpand, selectedPaths, onToggleSelect, countByPath }) {
  const fullPath = path ? `${path}/${node.label}` : node.label;
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = expanded[fullPath] !== false;
  const checked = selectedPaths.has(fullPath);
  const count = countByPath[fullPath] || 0;
  return (
    <>
      <div role="treeitem" aria-selected={checked} aria-expanded={hasChildren ? isOpen : undefined}
        style={{ display: "flex", alignItems: "center", gap: 4, padding: `4px 6px 4px ${8 + depth * 12}px`, fontSize: depth === 0 ? "var(--text-base)" : "var(--text-sm)", color: "var(--gray-800)", fontWeight: depth === 0 ? 700 : 400, borderBottom: "1px solid var(--gray-50)", background: "var(--white)" }}>
        <span role="button" tabIndex={hasChildren ? 0 : -1} onClick={() => hasChildren && onToggleExpand(fullPath)}
          onKeyDown={(e) => { if (hasChildren && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onToggleExpand(fullPath); } }}
          style={{ color: "var(--gray-300)", width: 11, fontSize: "var(--text-sm)", flexShrink: 0, cursor: hasChildren ? "pointer" : "default" }} aria-hidden="true">
          {hasChildren ? (isOpen ? "▾" : "▸") : " "}
        </span>
        <Checkbox checked={checked} onChange={(v) => onToggleSelect(fullPath, v)} />
        <span style={{ flex: 1, cursor: "pointer" }} onClick={() => onToggleSelect(fullPath, !checked)}>{node.label}</span>
        {count > 0 ? <span style={{ fontSize: "var(--text-2xs)", color: "var(--gray-300)" }}>{count}</span> : null}
      </div>
      {hasChildren && isOpen ? node.children.map((c) => (
        <UsageNode key={c.id} node={c} path={fullPath} depth={depth + 1} expanded={expanded} onToggleExpand={onToggleExpand} selectedPaths={selectedPaths} onToggleSelect={onToggleSelect} countByPath={countByPath} />
      )) : null}
    </>
  );
}

export function UsageClassificationTree({ nodes, expanded, onToggleExpand, selectedPaths, onToggleSelect, countByPath }) {
  return (
    <div style={{ fontFamily: "var(--font-body)", background: "var(--gray-25)" }}>
      {nodes.map((n) => (
        <UsageNode key={n.id} node={n} path="" depth={0} expanded={expanded} onToggleExpand={onToggleExpand} selectedPaths={selectedPaths} onToggleSelect={onToggleSelect} countByPath={countByPath} />
      ))}
    </div>
  );
}

export function Tabs({ items, active, onChange }) {
  return (
    <div role="tablist" style={{ display: "flex", borderBottom: "1px solid var(--border-strong)", background: "var(--white)" }}>
      {items.map((it) => {
        const isActive = it === active;
        return (
          <div key={it} role="tab" aria-selected={isActive} tabIndex={0} onClick={() => onChange && onChange(it)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange && onChange(it); } }}
            style={{ padding: "8px 16px", fontSize: "var(--text-base)", fontWeight: 700, fontFamily: "var(--font-ui)", color: isActive ? "var(--blue-400)" : "var(--text-secondary)", cursor: "pointer", borderBottom: isActive ? "2px solid var(--blue-400)" : "2px solid transparent", marginBottom: -1 }}>
            {it}
          </div>
        );
      })}
    </div>
  );
}
