import { useState } from "react";
import "./ds/tokens.css";
import HomePage from "./ds/HomePage.jsx";
import MaterialLibraryPage from "./ds/MaterialLibraryPage.jsx";
import ManagePalettesPage from "./ds/ManagePalettesPage.jsx";
import { PALETTE_DEFS } from "./ds/paletteData.js";
import paletteMaterialsMap from "./ds/paletteMaterials.json";

const INITIAL_PALETTES = PALETTE_DEFS.map((p) => ({ ...p, materialIds: paletteMaterialsMap[p.id] || [] }));

function App() {
  const [page, setPage] = useState("home");
  const [palettes, setPalettes] = useState(INITIAL_PALETTES);

  const toggleMaterialInPalette = (paletteId, materialId, checked) => {
    setPalettes((prev) => prev.map((p) => {
      if (p.id !== paletteId) return p;
      const has = p.materialIds.includes(materialId);
      if (checked === has) return p;
      return { ...p, materialIds: checked ? [...p.materialIds, materialId] : p.materialIds.filter((id) => id !== materialId) };
    }));
  };

  const toggleDeployed = (paletteId) => {
    setPalettes((prev) => prev.map((p) => (p.id === paletteId ? { ...p, deployed: !p.deployed } : p)));
  };

  if (page === "library") {
    return <MaterialLibraryPage onGoHome={() => setPage("home")} palettes={palettes} onToggleMaterialInPalette={toggleMaterialInPalette} />;
  }
  if (page === "manage") {
    return <ManagePalettesPage onGoHome={() => setPage("home")} palettes={palettes} onToggleMaterialInPalette={toggleMaterialInPalette} onToggleDeployed={toggleDeployed} />;
  }
  return <HomePage onOpenLibrary={() => setPage("library")} onOpenManage={() => setPage("manage")} />;
}

export default App;
