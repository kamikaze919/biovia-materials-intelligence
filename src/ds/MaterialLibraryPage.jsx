import { useState, useMemo, useRef, useEffect } from "react";
import { Button, Checkbox, Tabs, ClassificationTree, Tag, PropertyGroup, CollapsibleSection, RangeSlider, ToggleChips, Toast } from "./components.jsx";
import PlatformHeader from "./PlatformHeader.jsx";
import AnalysisPanel from "./AnalysisPanel.jsx";
import CurveExplorer from "./CurveExplorer.jsx";
import rawMaterials from "./materials.json";
import logoBiovia from "./assets/logo-biovia.png";
import { PROPERTY_GROUP_DEFS, detailToRows, classColor, CLASS_COLORS, findSimilar, findNumeric, FILTERABLE_PROPERTY_GROUPS, DATA_SOURCES, MATERIAL_STATUSES, propertyRange } from "./materialUtils.js";

const MATERIALS = rawMaterials;

function buildTree(materials) {
  const byClass = new Map();
  for (const m of materials) {
    if (!byClass.has(m.matClass)) byClass.set(m.matClass, new Map());
    const subMap = byClass.get(m.matClass);
    subMap.set(m.subClass, (subMap.get(m.subClass) || 0) + 1);
  }
  return [...byClass.entries()].map(([label, subMap]) => ({
    id: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    count: [...subMap.values()].reduce((a, b) => a + b, 0),
    children: [...subMap.entries()].map(([sub, count]) => ({
      id: (label + "-" + sub).toLowerCase().replace(/\s+/g, "-"),
      label: sub,
      count,
    })),
  }));
}

const MI_TREE = buildTree(MATERIALS);

const COUNTRIES = [...new Set(MATERIALS.map((m) => m.origin))];

function passesFilters(m, s, q) {
  if (s.activeClass && m.matClass !== s.activeClass && m.subClass !== s.activeClass) return false;
  const countries = Object.keys(s.countryChecks).filter((k) => s.countryChecks[k]);
  if (countries.length && !countries.every((c) => m.origin === c)) return false;
  if (s.complianceChecks["RoHS Compliant"] && !m.rohs) return false;
  if (s.complianceChecks["Conflict Minerals Free"] && !m.conflictFree) return false;
  const sources = Object.keys(s.dataSourceChecks).filter((k) => s.dataSourceChecks[k]);
  if (sources.length && !sources.includes(m.dataSource)) return false;
  const statuses = Object.keys(s.statusChecks).filter((k) => s.statusChecks[k]);
  if (statuses.length && !statuses.includes(m.materialStatus)) return false;
  for (const [key, range] of Object.entries(s.propertyFilters)) {
    const v = findNumeric(m, key);
    if (v == null || v < range[0] || v > range[1]) return false;
  }
  if (q) {
    const s2 = q.toLowerCase();
    if (!m.name.toLowerCase().includes(s2) && !m.id.toLowerCase().includes(s2) && !m.matClass.toLowerCase().includes(s2) && !m.subClass.toLowerCase().includes(s2)) return false;
  }
  return true;
}

const INITIAL_FILTERS = { activeClass: null, countryChecks: {}, complianceChecks: {}, dataSourceChecks: {}, propertyFilters: {}, statusChecks: {} };

function SortHeader({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field;
  return (
    <span role="button" tabIndex={0} onClick={() => onSort(field)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSort(field); } }}
      style={{ display: "inline-flex", alignItems: "center", gap: 3, cursor: "pointer", color: active ? "var(--blue-400)" : "inherit", userSelect: "none" }}>
      {label}
      <span style={{ fontSize: 9, opacity: active ? 1 : 0.35 }}>{active && sortDir === "desc" ? "▾" : "▴"}</span>
    </span>
  );
}

export default function MaterialLibraryPage({ onGoHome }) {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Classification");
  const [view, setView] = useState("list");
  const [expandedNodes, setExpandedNodes] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [panelMode, setPanelMode] = useState("detail");
  const [lastPanelMode, setLastPanelMode] = useState("detail");
  useEffect(() => {
    if (panelMode !== "analysis") setLastPanelMode(panelMode);
  }, [panelMode]);
  const [compareIds, setCompareIds] = useState([]);
  const [checkedProps, setCheckedProps] = useState({});
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [panelFullscreen, setPanelFullscreen] = useState(false);
  useEffect(() => {
    if (panelFullscreen) setLeftCollapsed(true);
  }, [panelFullscreen]);
  const [similarTo, setSimilarTo] = useState(null);
  const [recentIds, setRecentIds] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestIndex, setSuggestIndex] = useState(-1);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 1800);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const propRanges = useMemo(() => {
    const map = {};
    FILTERABLE_PROPERTY_GROUPS.forEach(([, keys]) => keys.forEach((key) => { map[key] = propertyRange(MATERIALS, key); }));
    return map;
  }, []);

  const openMaterial = (id) => {
    setSelectedId(id);
    setDetailOpen(true);
    setPanelMode("detail");
    setRecentIds((r) => [id, ...r.filter((x) => x !== id)].slice(0, 8));
  };

  const handleQueryChange = (v) => {
    setQuery(v);
    setSuggestIndex(-1);
    if (v) setSimilarTo(null);
  };

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const starts = [];
    const contains = [];
    for (const m of MATERIALS) {
      const name = m.name.toLowerCase();
      const id = m.id.toLowerCase();
      if (name.startsWith(q) || id.startsWith(q)) starts.push(m);
      else if (name.includes(q) || id.includes(q)) contains.push(m);
    }
    return [...starts, ...contains].slice(0, 8);
  }, [query]);

  const selectSuggestion = (m) => {
    openMaterial(m.id);
    setQuery("");
    setSuggestIndex(-1);
    searchInputRef.current?.blur();
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && panelFullscreen) {
        setPanelFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panelFullscreen]);

  const toggleSort = (field) => {
    if (sortField !== field) { setSortField(field); setSortDir("asc"); }
    else if (sortDir === "asc") { setSortDir("desc"); }
    else { setSortField(null); setSortDir("asc"); }
  };

  const [filterHistory, setFilterHistory] = useState({ stack: [INITIAL_FILTERS], index: 0 });
  const filters = filterHistory.stack[filterHistory.index];
  const { activeClass, countryChecks, complianceChecks, dataSourceChecks, propertyFilters, statusChecks } = filters;
  const canUndoFilters = filterHistory.index > 0;
  const canRedoFilters = filterHistory.index < filterHistory.stack.length - 1;

  const pushFilters = (next) => {
    setSimilarTo(null);
    setFilterHistory((fh) => {
      const trimmed = fh.stack.slice(0, fh.index + 1);
      return { stack: [...trimmed, next], index: trimmed.length };
    });
  };
  const undoFilters = () => setFilterHistory((fh) => ({ ...fh, index: Math.max(0, fh.index - 1) }));
  const redoFilters = () => setFilterHistory((fh) => ({ ...fh, index: Math.min(fh.stack.length - 1, fh.index + 1) }));

  const setActiveClass = (label) => pushFilters({ ...filters, activeClass: label });
  const setCountryChecks = (updater) => {
    const next = typeof updater === "function" ? updater(filters.countryChecks) : updater;
    pushFilters({ ...filters, countryChecks: next });
  };
  const setComplianceChecks = (updater) => {
    const next = typeof updater === "function" ? updater(filters.complianceChecks) : updater;
    pushFilters({ ...filters, complianceChecks: next });
  };
  const setDataSourceChecks = (updater) => {
    const next = typeof updater === "function" ? updater(filters.dataSourceChecks) : updater;
    pushFilters({ ...filters, dataSourceChecks: next });
  };
  const setStatusChecks = (updater) => {
    const next = typeof updater === "function" ? updater(filters.statusChecks) : updater;
    pushFilters({ ...filters, statusChecks: next });
  };
  const togglePropertyFilter = (key, on) => {
    const next = { ...filters.propertyFilters };
    if (on) { const r = propRanges[key]; next[key] = [r.min, r.max]; }
    else { delete next[key]; }
    pushFilters({ ...filters, propertyFilters: next });
  };
  const setPropertyFilterRange = (key, range) => {
    pushFilters({ ...filters, propertyFilters: { ...filters.propertyFilters, [key]: range } });
  };

  const toggleCompare = (id) => setCompareIds((c) => {
    const adding = !c.includes(id);
    if (adding) setToastMsg("Added to compare cart");
    return adding ? [...c, id] : c.filter((x) => x !== id);
  });

  const s = { activeClass, countryChecks, complianceChecks, dataSourceChecks, propertyFilters, statusChecks };
  const similarResults = useMemo(() => {
    if (!similarTo) return null;
    const target = MATERIALS.find((m) => m.id === similarTo);
    if (!target) return null;
    return findSimilar(target, MATERIALS, 12);
  }, [similarTo]);

  const filtered = useMemo(() => {
    if (similarResults) return similarResults.map((r) => r.material);
    const list = MATERIALS.filter((m) => passesFilters(m, s, query));
    if (!sortField) return list;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = String(a[sortField] ?? "");
      const bv = String(b[sortField] ?? "");
      return av.localeCompare(bv) * dir;
    });
  }, [activeClass, countryChecks, complianceChecks, dataSourceChecks, propertyFilters, statusChecks, query, sortField, sortDir, similarResults]);

  const buildRow = (m) => {
    const isSelected = selectedId === m.id;
    const isCompared = compareIds.includes(m.id);
    return { ...m, isSelected, isCompared,
      rowBg: isSelected ? "var(--surface-selected)" : "#fff",
      rowBorder: isSelected ? "3px solid var(--blue-400)" : "3px solid transparent",
      onRowClick: () => openMaterial(m.id),
      onCheckClick: (e) => { e.stopPropagation(); toggleCompare(m.id); },
    };
  };
  const rows = filtered.map(buildRow);

  const ROW_HEIGHT = 37;
  const listScrollRef = useRef(null);
  const [listScrollTop, setListScrollTop] = useState(0);
  const [listHeight, setListHeight] = useState(600);
  useEffect(() => {
    const el = listScrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => setListHeight(entries[0].contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const overscan = 8;
  const startIndex = Math.max(0, Math.floor(listScrollTop / ROW_HEIGHT) - overscan);
  const endIndex = Math.min(rows.length, Math.ceil((listScrollTop + listHeight) / ROW_HEIGHT) + overscan);
  const visibleRows = rows.slice(startIndex, endIndex);

  const selectedMaterial = MATERIALS.find((m) => m.id === selectedId) || null;
  const checked = (selectedId && checkedProps[selectedId]) || [];

  const propertyGroups = !selectedMaterial ? [] : PROPERTY_GROUP_DEFS.map(([title, key]) => {
    const groupRows = detailToRows(selectedMaterial.detail, key);
    return {
      title, rows: groupRows, checkedKeys: checked,
      onToggleRow: (k, on) => setCheckedProps((cp) => {
        const cur = cp[selectedId] || [];
        const next = on ? [...cur, k] : cur.filter((x) => x !== k);
        return { ...cp, [selectedId]: next };
      }),
      onToggleAll: (on) => setCheckedProps((cp) => {
        const cur = cp[selectedId] || [];
        const keys = groupRows.map((r) => r.key);
        const next = on ? [...new Set([...cur, ...keys])] : cur.filter((x) => !keys.includes(x));
        return { ...cp, [selectedId]: next };
      }),
    };
  });

  const compareMaterials = compareIds.map((id) => MATERIALS.find((m) => m.id === id)).filter(Boolean);

  const filterChips = [];
  if (similarTo) {
    const target = MATERIALS.find((m) => m.id === similarTo);
    filterChips.push({ label: `Similar to ${target ? target.name : similarTo}`, onRemove: () => setSimilarTo(null) });
  }
  if (activeClass) filterChips.push({ label: activeClass, onRemove: () => setActiveClass(null) });
  Object.entries(countryChecks).filter(([, v]) => v).forEach(([k]) => filterChips.push({ label: k, onRemove: () => setCountryChecks((c) => ({ ...c, [k]: false })) }));
  Object.entries(complianceChecks).filter(([, v]) => v).forEach(([k]) => filterChips.push({ label: k, onRemove: () => setComplianceChecks((c) => ({ ...c, [k]: false })) }));
  Object.entries(dataSourceChecks).filter(([, v]) => v).forEach(([k]) => filterChips.push({ label: k, onRemove: () => setDataSourceChecks((c) => ({ ...c, [k]: false })) }));
  Object.entries(statusChecks).filter(([, v]) => v).forEach(([k]) => filterChips.push({ label: k, onRemove: () => setStatusChecks((c) => ({ ...c, [k]: false })) }));
  Object.entries(propertyFilters).forEach(([key, range]) => {
    const r = propRanges[key] || { unit: "" };
    const fmt = (v) => (Number.isInteger(v) ? v : v.toFixed(1));
    filterChips.push({ label: `${key}: ${fmt(range[0])}–${fmt(range[1])}${r.unit ? ` ${r.unit}` : ""}`, onRemove: () => togglePropertyFilter(key, false) });
  });

  const clearFilters = () => { pushFilters(INITIAL_FILTERS); setQuery(""); setSimilarTo(null); };
  const clearCompare = () => setCompareIds([]);
  const leftWidth = leftCollapsed ? 0 : "20%";

  return (
    <div style={{ height: "100vh", background: "#eef0f3", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
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
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Materials Library</span>
        <span style={{ marginLeft: "auto", color: "var(--gray-400)", fontSize: "var(--text-xs)" }}>{MATERIALS.length.toLocaleString()} materials · Metals, Ceramics, Polymers, Composites</span>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ width: leftWidth, flexShrink: 0, minHeight: 0, overflowX: "hidden", overflowY: "auto", transition: "width 150ms ease", background: "var(--gray-25)", display: "flex", flexDirection: "column" }}>
          <div style={{ width: "100%", minWidth: 260 }}>
            <Tabs items={["Filters", "Classification"]} active={activeTab} onChange={setActiveTab} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", padding: "8px 12px", borderBottom: "1px solid var(--border-subtle)", background: "var(--gray-50)" }}>
              {Object.entries(CLASS_COLORS).map(([cls, color]) => (
                <span key={cls} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--text-2xs)", color: "var(--gray-600)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
                  {cls}
                </span>
              ))}
            </div>
            {activeTab === "Classification" && (
              <ClassificationTree sections={[{ label: "Classifications", nodes: MI_TREE, expanded: expandedNodes, activeLabel: activeClass,
                onToggle: (id) => setExpandedNodes((e) => ({ ...e, [id]: e[id] === false ? true : false })),
                onSelect: (label) => setActiveClass(label) }]} />
            )}
            {activeTab === "Filters" && (
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
                <CollapsibleSection title="Country of Origin" count={Object.values(countryChecks).filter(Boolean).length}>
                  {COUNTRIES.map((c) => (
                    <Checkbox key={c} checked={!!countryChecks[c]} onChange={(v) => setCountryChecks((cc) => ({ ...cc, [c]: v }))} label={c} />
                  ))}
                </CollapsibleSection>
                <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--white)", padding: "8px 10px" }}>
                  <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "var(--tracking-label)", marginBottom: 8 }}>Material Status</div>
                  <ToggleChips options={MATERIAL_STATUSES} activeSet={statusChecks} onToggle={(opt, v) => setStatusChecks((cc) => ({ ...cc, [opt]: v }))} />
                </div>
                <CollapsibleSection title="Data Source" count={Object.values(dataSourceChecks).filter(Boolean).length}>
                  {DATA_SOURCES.map((src) => (
                    <Checkbox key={src} checked={!!dataSourceChecks[src]} onChange={(v) => setDataSourceChecks((cc) => ({ ...cc, [src]: v }))} label={src} />
                  ))}
                </CollapsibleSection>
                <CollapsibleSection title="Properties" count={Object.keys(propertyFilters).length + Object.values(complianceChecks).filter(Boolean).length} maxHeight={400}>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--blue-400)", textTransform: "uppercase", letterSpacing: "var(--tracking-label)", marginBottom: 4 }}>Compliance</div>
                    {["RoHS Compliant", "Conflict Minerals Free"].map((c) => (
                      <Checkbox key={c} checked={!!complianceChecks[c]} onChange={(v) => setComplianceChecks((cc) => ({ ...cc, [c]: v }))} label={c} />
                    ))}
                  </div>
                  {FILTERABLE_PROPERTY_GROUPS.map(([groupTitle, keys]) => (
                    <div key={groupTitle} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--blue-400)", textTransform: "uppercase", letterSpacing: "var(--tracking-label)", marginBottom: 4 }}>{groupTitle}</div>
                      {keys.map((key) => {
                        const range = propertyFilters[key];
                        const r = propRanges[key];
                        return (
                          <div key={key} style={{ marginBottom: 4 }}>
                            <Checkbox checked={!!range} onChange={(v) => togglePropertyFilter(key, v)} label={key} />
                            {range && r && (
                              <RangeSlider min={r.min} max={r.max} unit={r.unit} value={range} onChange={(v) => setPropertyFilterRange(key, v)} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </CollapsibleSection>
              </div>
            )}
          </div>
        </div>

        <div onClick={() => setLeftCollapsed((c) => !c)} style={{ width: 16, flexShrink: 0, background: "var(--gray-100)", borderRight: "1px solid var(--border-strong)", borderLeft: "1px solid var(--border-strong)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gray-500)", fontSize: 11 }}
          title={leftWidth === 0 ? "Show filters" : "Hide filters"}>
          {leftWidth === 0 ? "▸" : "◂"}
        </div>

        <div style={panelFullscreen
          ? { flex: "3 1 0%", display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, background: "#fff", borderRight: "1px solid var(--border-strong)" }
          : detailOpen
          ? { flex: "3 1 0%", display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, background: "#fff", borderRight: "1px solid var(--border-strong)" }
          : { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, background: "#fff" }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, maxWidth: panelFullscreen ? "none" : 480, position: "relative" }}
              onFocus={() => setSearchFocused(true)}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setSearchFocused(false); setSuggestIndex(-1); } }}>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-default)", background: "var(--white)", height: 28, padding: "0 8px", gap: 6, borderRadius: "var(--radius-sm)" }}>
                <span style={{ color: "var(--gray-300)", fontSize: 12 }} aria-hidden="true">⌕</span>
                <input ref={searchInputRef} type="text" value={query} onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search materials by formula, ID, or classification… ( / )"
                  onKeyDown={(e) => {
                    if (!suggestions.length) return;
                    if (e.key === "ArrowDown") { e.preventDefault(); setSuggestIndex((i) => (i + 1) % suggestions.length); }
                    else if (e.key === "ArrowUp") { e.preventDefault(); setSuggestIndex((i) => (i - 1 + suggestions.length) % suggestions.length); }
                    else if (e.key === "Enter" && suggestIndex >= 0) { e.preventDefault(); selectSuggestion(suggestions[suggestIndex]); }
                    else if (e.key === "Escape") { e.currentTarget.blur(); }
                  }}
                  style={{ flex: 1, border: 0, outline: "none", fontSize: "var(--text-base)", fontFamily: "var(--font-body)", color: "var(--text-primary)", background: "transparent" }} />
                {query ? <span onClick={() => handleQueryChange("")} style={{ color: "var(--gray-300)", cursor: "pointer", fontSize: 15, lineHeight: 1 }} aria-label="Clear">×</span> : null}
              </div>
              {searchFocused && suggestions.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-overlay)", zIndex: 5, overflow: "hidden" }}>
                  {suggestions.map((m, i) => (
                    <div key={m.id} onMouseDown={(e) => { e.preventDefault(); selectSuggestion(m); }}
                      style={{ padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: i === suggestIndex ? "var(--surface-selected)" : "#fff", borderBottom: i < suggestions.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: classColor(m.matClass), flexShrink: 0 }} />
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                      <span style={{ fontSize: "var(--text-2xs)", color: "var(--gray-400)", fontFamily: "var(--font-mono)" }}>{m.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: "relative" }} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHistoryOpen(false); }}>
              <div role="button" tabIndex={0} onClick={() => setHistoryOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 5, height: 28, padding: "0 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "var(--text-xs)", color: "var(--gray-600)", whiteSpace: "nowrap", background: historyOpen ? "var(--surface-selected)" : "#fff" }} title="Recently viewed materials">
                🕘 History
              </div>
              {historyOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 240, background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-overlay)", zIndex: 5, overflow: "hidden" }}>
                  {recentIds.length === 0 && (
                    <div style={{ padding: "10px 12px", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>No recently viewed materials.</div>
                  )}
                  {recentIds.slice(0, 5).map((id, i, arr) => {
                    const m = MATERIALS.find((mm) => mm.id === id);
                    if (!m) return null;
                    return (
                      <div key={id} onMouseDown={(e) => { e.preventDefault(); openMaterial(id); setHistoryOpen(false); }}
                        style={{ padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: "#fff", borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: classColor(m.matClass), flexShrink: 0 }} />
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                        <span style={{ fontSize: "var(--text-2xs)", color: "var(--gray-400)", fontFamily: "var(--font-mono)" }}>{m.id}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {!panelFullscreen && (<>
              <div style={{ display: "flex", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "hidden" }} title="Undo / redo filter changes">
                <div onClick={() => canUndoFilters && undoFilters()} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: canUndoFilters ? "pointer" : "default", fontSize: 14, background: "#fff", color: canUndoFilters ? "var(--gray-600)" : "var(--gray-300)" }} title="Undo filter change">↺</div>
                <div onClick={() => canRedoFilters && redoFilters()} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: canRedoFilters ? "pointer" : "default", fontSize: 14, borderLeft: "1px solid var(--border-default)", background: "#fff", color: canRedoFilters ? "var(--gray-600)" : "var(--gray-300)" }} title="Redo filter change">↻</div>
              </div>
              <div style={{ display: "flex", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                <div onClick={() => setView("list")} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, background: view === "list" ? "var(--surface-selected)" : "#fff", color: view === "list" ? "var(--blue-400)" : "var(--gray-500)" }}>▤</div>
                <div onClick={() => setView("tile")} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, borderLeft: "1px solid var(--border-default)", background: view === "tile" ? "var(--surface-selected)" : "#fff", color: view === "tile" ? "var(--blue-400)" : "var(--gray-500)" }}>⊞</div>
              </div>
            </>)}
          </div>

          {filterChips.length > 0 && (
            <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Filtered by:</span>
              {filterChips.map((chip) => (
                <span key={chip.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface-selected)", color: "var(--blue-400)", padding: "3px 6px 3px 10px", borderRadius: "var(--radius-sm)", fontSize: "var(--text-xs)", fontWeight: 600 }}>
                  {chip.label}<span onClick={chip.onRemove} style={{ cursor: "pointer", color: "var(--blue-300)", fontWeight: 400 }}>×</span>
                </span>
              ))}
              <span onClick={clearFilters} style={{ fontSize: "var(--text-xs)", color: "var(--link)", cursor: "pointer", marginLeft: 4 }}>Clear all</span>
            </div>
          )}

          <div style={{ padding: "8px 16px", fontSize: "var(--text-sm)", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-subtle)", background: "var(--gray-25)" }}>
            {similarTo ? `Most Similar (${filtered.length})` : `Material Search Results (${filtered.length.toLocaleString()})`}
          </div>

          {filtered.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
              <span>No materials match these filters.</span>
              <Button variant="secondary" size="sm" onClick={clearFilters}>Clear Filters</Button>
            </div>
          )}

          {filtered.length > 0 && (view === "list" || panelFullscreen) && (
            <>
              <div style={{ position: "sticky", top: 0, zIndex: 1, display: "grid", gridTemplateColumns: detailOpen ? "28px 100px 1fr 90px" : "28px 100px 1.2fr 0.9fr 90px 90px", gap: 8, padding: "8px 16px", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-label)", borderBottom: "1px solid var(--border-strong)", background: "#fff" }}>
                <span></span>
                <SortHeader label="MAT ID" field="id" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Formula" field="name" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                {detailOpen ? (
                  <SortHeader label="Class" field="matClass" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                ) : (<>
                  <SortHeader label="Class / Sub-Class" field="matClass" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Origin" field="origin" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Modified" field="dateModified" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                </>)}
              </div>
              <div ref={listScrollRef} onScroll={(e) => setListScrollTop(e.currentTarget.scrollTop)}
                style={{ flex: 1, minHeight: 0, overflowY: "auto", position: "relative" }} role="listbox" aria-label="Material search results">
                <div style={{ height: rows.length * ROW_HEIGHT, position: "relative" }}>
                  {visibleRows.map((m, i) => (
                    <div key={m.id} role="option" aria-selected={m.isSelected} tabIndex={0} onClick={m.onRowClick}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); m.onRowClick(); } }}
                      style={{ position: "absolute", top: (startIndex + i) * ROW_HEIGHT, left: 0, right: 0, height: ROW_HEIGHT, boxSizing: "border-box", display: "grid", gridTemplateColumns: detailOpen ? "28px 100px 1fr 90px" : "28px 100px 1.2fr 0.9fr 90px 90px", gap: 8, padding: "8px 16px", alignItems: "center", cursor: "pointer", borderBottom: "1px solid var(--gray-75)", background: m.rowBg, borderLeft: m.rowBorder, outlineOffset: -2 }}>
                      <span onClick={m.onCheckClick}><Checkbox checked={m.isCompared} onChange={() => {}} /></span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-500)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.id}</span>
                      <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                      {detailOpen ? (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.matClass}</span>
                      ) : (<>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-700)" }}>{m.matClass}<br /><span style={{ color: "var(--gray-400)" }}>{m.subClass}</span></span>
                        <span><Tag>{m.origin}</Tag></span>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-500)" }}>{m.dateModified}</span>
                      </>)}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {filtered.length > 0 && !panelFullscreen && view === "tile" && (
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {rows.map((m) => (
                  <div key={m.id} onClick={m.onRowClick} style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: 12, cursor: "pointer", position: "relative", background: m.rowBg, borderLeft: m.rowBorder }}>
                    <span onClick={m.onCheckClick} style={{ position: "absolute", top: 8, right: 8 }}><Checkbox checked={m.isCompared} onChange={() => {}} /></span>
                    <span style={{ width: 26, height: 26, borderRadius: "var(--radius-sm)", background: classColor(m.matClass), display: "block", marginBottom: 10 }} title={m.matClass} />
                    <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, lineHeight: 1.25 }}>{m.name}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--gray-500)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>{m.id}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--gray-700)", marginBottom: 8 }}>{m.matClass} / {m.subClass}</div>
                    <Tag>{m.origin}</Tag>
                    <div style={{ fontSize: "var(--text-2xs)", color: "var(--gray-400)", marginTop: 8 }}>Modified {m.dateModified}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {detailOpen ? (
          <div style={panelFullscreen
            ? { flex: "7 1 0%", minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", borderLeft: "1px solid var(--border-strong)", background: "var(--gray-25)" }
            : { flex: "5 1 0%", minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", borderLeft: "1px solid var(--border-strong)", background: "var(--gray-25)" }}>
            <div style={{ background: "var(--surface-header-deep)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 0" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {panelMode === "analysis" ? (
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, fontFamily: "var(--font-ui)", padding: "6px 12px", borderRadius: "var(--radius-sm) var(--radius-sm) 0 0", background: "var(--gray-25)", color: "var(--blue-700)" }}>
                      Compare{compareIds.length > 0 ? ` (${compareIds.length})` : ""}
                    </span>
                  ) : (<>
                    <span role="button" tabIndex={0} onClick={() => setPanelMode("detail")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPanelMode("detail"); }}
                      style={{ cursor: "pointer", fontSize: "var(--text-sm)", fontWeight: 700, fontFamily: "var(--font-ui)", padding: "6px 12px", borderRadius: "var(--radius-sm) var(--radius-sm) 0 0", background: panelMode === "detail" ? "var(--gray-25)" : "transparent", color: panelMode === "detail" ? "var(--blue-700)" : "var(--text-on-blue-muted)" }}>
                      Detail
                    </span>
                    <span role="button" tabIndex={0} onClick={() => setPanelMode("curves")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPanelMode("curves"); }}
                      style={{ cursor: "pointer", fontSize: "var(--text-sm)", fontWeight: 700, fontFamily: "var(--font-ui)", padding: "6px 12px", borderRadius: "var(--radius-sm) var(--radius-sm) 0 0", background: panelMode === "curves" ? "var(--gray-25)" : "transparent", color: panelMode === "curves" ? "var(--blue-700)" : "var(--text-on-blue-muted)" }}>
                      Curves
                    </span>
                  </>)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div onClick={() => setPanelFullscreen((f) => !f)} style={{ color: "var(--text-on-blue-muted)", cursor: "pointer", fontSize: 15, lineHeight: 1, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6, borderRadius: "var(--radius-sm)" }}
                    onMouseOver={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-on-blue-muted)"; e.currentTarget.style.background = "transparent"; }}
                    title={panelFullscreen ? "Exit full screen" : "Full screen"}>
                    {panelFullscreen ? "⤡" : "⤢"}
                  </div>
                  <div onClick={() => { if (panelMode === "analysis") { setPanelMode(lastPanelMode); } else { setDetailOpen(false); setPanelFullscreen(false); } }}
                    title={panelMode === "analysis" ? "Back to " + lastPanelMode : "Close"}
                    style={{ color: "var(--text-on-blue-muted)", cursor: "pointer", fontSize: 18, lineHeight: 1, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6, borderRadius: "var(--radius-sm)" }}
                    onMouseOver={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-on-blue-muted)"; e.currentTarget.style.background = "transparent"; }}>×</div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 18px", background: "var(--gray-25)" }}>
              {panelMode === "detail" && !selectedMaterial && (
                <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", textAlign: "center", paddingTop: 40 }}>
                  Select a material from the list to view its properties.
                </div>
              )}
              {panelMode === "detail" && selectedMaterial && (
                <div style={{ maxWidth: panelFullscreen ? 560 : "none" }}>
                  <div style={{ background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: 16, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: classColor(selectedMaterial.matClass), flexShrink: 0 }} title={selectedMaterial.matClass} />
                        <div>
                          <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.25 }}>{selectedMaterial.name}</div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--gray-500)", fontFamily: "var(--font-mono)" }}>{selectedMaterial.id} · {selectedMaterial.matClass} / {selectedMaterial.subClass}</div>
                          <div style={{ fontSize: "var(--text-2xs)", color: "var(--gray-400)", marginTop: 3 }}>Source: {selectedMaterial.dataSource} · Created {selectedMaterial.dateCreated} · Modified {selectedMaterial.dateModified}</div>
                        </div>
                      </div>
                      <span onClick={() => setSimilarTo(selectedMaterial.id)} style={{ fontSize: "var(--text-xs)", color: "var(--link)", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 600 }}>More like this →</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: panelFullscreen ? "1fr" : "repeat(2, 1fr)", gap: panelFullscreen ? 10 : 14 }}>
                    {propertyGroups.map((g) => (
                      <div key={g.title} style={{ background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: panelFullscreen ? "8px 14px" : "12px 14px" }}>
                        <PropertyGroup {...g} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, padding: "12px 14px", background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{checked.length} properties selected</span>
                    <Button variant={compareIds.includes(selectedId) ? "secondary" : "accent"} size="sm" onClick={() => toggleCompare(selectedId)}>
                      {compareIds.includes(selectedId) ? "Remove from Compare" : "Add to Compare"}
                    </Button>
                  </div>
                </div>
              )}
              {panelMode === "curves" && !selectedMaterial && (
                <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", textAlign: "center", paddingTop: 40 }}>
                  Select a material from the list to explore its curve datasets.
                </div>
              )}
              {panelMode === "curves" && selectedMaterial && (
                <div style={{ maxWidth: panelFullscreen ? 560 : "none" }}>
                  <CurveExplorer key={selectedMaterial.id} material={selectedMaterial} />
                </div>
              )}
              {panelMode === "analysis" && (
                <AnalysisPanel compareMaterials={compareMaterials} allFiltered={filtered} compareIds={compareIds} onRemove={toggleCompare} />
              )}
            </div>
          </div>
        ) : null}
      </div>

      <Toast message={toastMsg} visible={!!toastMsg} tone="success" />

      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 60 }}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setCartOpen(false); }}>
        {cartOpen && (
          <div style={{ position: "absolute", bottom: "calc(100% + 12px)", right: 0, width: 320, maxHeight: 440, background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-overlay)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-ui)" }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-primary)" }}>Compare Cart ({compareIds.length})</span>
              <span onClick={() => setCartOpen(false)} style={{ cursor: "pointer", color: "var(--gray-400)", fontSize: 16 }}>×</span>
            </div>
            {compareMaterials.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                Your cart is empty. Check materials in the list to add them here.
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                {compareMaterials.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: classColor(m.matClass), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                      <div style={{ fontSize: "var(--text-2xs)", color: "var(--gray-400)", fontFamily: "var(--font-mono)" }}>{m.id}</div>
                    </div>
                    <span onClick={() => toggleCompare(m.id)} style={{ cursor: "pointer", color: "var(--gray-300)", fontSize: 15 }} aria-label={`Remove ${m.name}`}>×</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 8 }}>
              <Button variant="secondary" size="sm" disabled={compareMaterials.length === 0} onClick={clearCompare}>Clear cart</Button>
              <div style={{ flex: 1 }} />
              <Button variant="accent" size="sm" disabled={compareMaterials.length < 2}
                onClick={() => { setDetailOpen(true); setPanelMode("analysis"); setCartOpen(false); }}>
                Compare Now
              </Button>
            </div>
            {compareMaterials.length === 1 && (
              <div style={{ padding: "0 14px 10px", fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>Add at least one more material to compare.</div>
            )}
          </div>
        )}
        <div role="button" tabIndex={0} onClick={() => setCartOpen((o) => !o)}
          style={{ display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 18px", borderRadius: 999, background: "var(--blue-400)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: "var(--text-base)", boxShadow: "var(--shadow-overlay)" }}>
          <span aria-hidden="true">⚖</span> Compare
          {compareIds.length > 0 && (
            <span style={{ background: "#fff", color: "var(--blue-400)", borderRadius: 999, fontSize: "var(--text-xs)", fontWeight: 700, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{compareIds.length}</span>
          )}
        </div>
      </div>
    </div>
  );
}
