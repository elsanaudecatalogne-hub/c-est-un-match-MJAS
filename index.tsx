import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

function FatalScreen({ error }: { error: unknown }) {
  const msg =
    error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ""}` : String(error);

  return (
    <div style={{ minHeight: "100vh", background: "#FDC800", padding: 24, fontFamily: "system-ui" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 16, maxWidth: 900 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Crash au démarrage</div>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.4 }}>{msg}</pre>
      </div>
    </div>
  );
}

const rootEl = document.getElementById("root");

if (!rootEl) {
  document.body.innerHTML = "<pre>❌ #root introuvable dans index.html</pre>";
} else {
  try {
    createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (e) {
    createRoot(rootEl).render(<FatalScreen error={e} />);
  }
}