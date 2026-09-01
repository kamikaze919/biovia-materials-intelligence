import { useState } from "react";
import "./ds/tokens.css";
import HomePage from "./ds/HomePage.jsx";
import MaterialLibraryPage from "./ds/MaterialLibraryPage.jsx";

function App() {
  const [page, setPage] = useState("home");

  if (page === "library") {
    return <MaterialLibraryPage onGoHome={() => setPage("home")} />;
  }
  return <HomePage onOpenLibrary={() => setPage("library")} />;
}

export default App;
