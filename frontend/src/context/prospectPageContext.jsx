import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const ProspectPageContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
// Envuelve tu <App /> o el Router con este Provider para que todas las páginas
// tengan acceso al contexto.

export function ProspectPageProvider({ userCode, children }) {
  const [prospectPageUrl, setProspectPageUrl] = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);

  useEffect(() => {
    if (!userCode) return;

    setLoading(true);
    setError(null);

    // const config = {
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `JWT ${localStorage.getItem("access")}`,
    //     Accept: "application/json",
    //   },
    // };

    axios
      .get(`${process.env.REACT_APP_API_URL}/dashboard/prospect-page-config/${userCode}`)
      .then((res) => {
        // Ajusta el campo según lo que devuelva tu endpoint
        setProspectPageUrl(res.data.url ?? null);
      })
      .catch((err) => {
        console.error("Error al obtener la URL de la página:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [userCode]);

  return (
    <ProspectPageContext.Provider value={{ prospectPageUrl, setProspectPageUrl, loading, error }}>
      {children}
    </ProspectPageContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
// Úsalo en cualquier componente: const { prospectPageUrl } = useProspectPage();

export function useProspectPage() {
  const ctx = useContext(ProspectPageContext);
  if (!ctx) throw new Error("useProspectPage debe usarse dentro de <ProspectPageProvider>");
  return ctx;
}