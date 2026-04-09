import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

// ─── Utilidades ───────────────────────────────────────────────────────────────

function extractVideoId(input) {
  if (!input) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatTime(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return "0:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(window.YT); return; }
    if (window._ytApiCallbacks) { window._ytApiCallbacks.push(resolve); return; }
    window._ytApiCallbacks = [resolve];
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
    window.onYouTubeIframeAPIReady = () => {
      window._ytApiCallbacks.forEach((cb) => cb(window.YT));
      window._ytApiCallbacks = null;
    };
  });
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function YouTubePreviewer({
  className = "",
  defaultUrl = "",
  maxDuration = null,
  keyToPayload = null,
  saveUrl = null,
  onSave = null,
  onVideoLoad,
}) {
  const [input, setInput]                     = useState(defaultUrl);
  const [videoId, setVideoId]                 = useState(null);
  const [title, setTitle]                     = useState("");
  const [rawUrl, setRawUrl]                   = useState("");
  const [error, setError]                     = useState("");
  const [videoDuration, setVideoDuration]     = useState(null);
  const [durationLoading, setDurationLoading] = useState(false);
  const [playing, setPlaying]                 = useState(false);
  const [thumbLoaded, setThumbLoaded]         = useState(false);
  const [thumbSrc, setThumbSrc]               = useState("");
  const [saving, setSaving]                   = useState(false);
  const [saveSuccess, setSaveSuccess]         = useState(false);
  const [saveError, setSaveError]             = useState("");

  // Ref del div donde se monta el YT.Player real (reemplaza al <iframe> manual)
  const playerDivRef = useRef(null);
  const playerRef    = useRef(null);

  // ── Función interna para cargar un video por ID ────────────────────────────
  const loadVideoById = useCallback((id, url) => {
    setError("");
    setPlaying(false);
    setThumbLoaded(false);
    setVideoDuration(null);
    setDurationLoading(true);
    setVideoId(id);
    setTitle("");
    setSaveSuccess(false);
    setSaveError("");
    setRawUrl(url.trim());
    setThumbSrc(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);

    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
      .then((r) => r.json())
      .then((d) => setTitle(d.title || ""))
      .catch(() => {});
  }, []);

  // ── Sincronizar cuando el padre actualiza defaultUrl ──────────────────────
  useEffect(() => {
    if (!defaultUrl) return;
    const id = extractVideoId(defaultUrl.trim());
    if (!id) return;
    setInput(defaultUrl);
    loadVideoById(id, defaultUrl);
  }, [defaultUrl]);

  // ── Cargar video manualmente ───────────────────────────────────────────────
  const handleLoad = useCallback(() => {
    const id = extractVideoId(input.trim());
    if (!id) { setError("URL o ID de video no válido."); return; }
    loadVideoById(id, input);
  }, [input, loadVideoById]);

  // ── Montar YT.Player cuando se hace click en reproducir ───────────────────
  // Un solo player sirve tanto para obtener la duración como para reproducir.
  // No hay player oculto — todo ocurre en el div visible.
  useEffect(() => {
    if (!playing || !videoId || !playerDivRef.current) return;

    let ytPlayer;

    loadYouTubeAPI().then((YT) => {
      // Si ya existe un player anterior, destruirlo limpiamente
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (_) {}
        playerRef.current = null;
      }

      ytPlayer = new YT.Player(playerDivRef.current, {
        videoId,
        playerVars: { autoplay: 1, rel: 0 },
        events: {
          onReady: (event) => {
            const duration = Math.floor(event.target.getDuration());
            setVideoDuration(duration);
            setDurationLoading(false);
            onVideoLoad?.(videoId, title, duration);
            // Iniciar reproducción
            event.target.playVideo();
          },
          onError: () => {
            setDurationLoading(false);
          },
        },
      });

      playerRef.current = ytPlayer;
    });

    return () => {
      // Al desmontar o cambiar video, destruir el player
      try { playerRef.current?.destroy(); } catch (_) {}
      playerRef.current = null;
    };
  }, [playing, videoId]);

  // ── Limpiar ────────────────────────────────────────────────────────────────
  const handleClear = async () => {
    try { playerRef.current?.destroy(); } catch (_) {}
    playerRef.current = null;

    if (videoId && saveUrl && localStorage.getItem('access')) {
    try {
      await axios.patch(
        process.env.REACT_APP_API_URL + saveUrl,
        { [keyToPayload]: null },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `JWT ${localStorage.getItem('access')}`,
            'Accept': 'application/json',
          }
        }
      );
    } catch (err) {
      console.error('Error al limpiar en BD la URL:', err);
    }
  }
    setVideoId(null); setInput(""); setPlaying(false);
    setTitle(""); setError(""); setVideoDuration(null);
    setDurationLoading(false); setSaveSuccess(false); setSaveError("");
  };

  // ── Validación ─────────────────────────────────────────────────────────────
  const exceedsLimit = maxDuration !== null && videoDuration !== null && videoDuration > maxDuration;
  const withinLimit  = videoDuration !== null && !durationLoading && (maxDuration === null || videoDuration <= maxDuration);

  // ── Guardar ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!withinLimit) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    const payload = { [keyToPayload]: rawUrl || defaultUrl };

    if (localStorage.getItem('access')) {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `JWT ${localStorage.getItem('access')}`,
          'Accept': 'application/json',
        }
      };
      try {
        if (saveUrl) {
          const res = await axios.patch(process.env.REACT_APP_API_URL + saveUrl, payload, config);
          if (!res.status || res.status >= 400) throw new Error(`Error del servidor (${res.status})`);
        } else if (onSave) {
          await onSave(payload);
        }
        setSaveSuccess(true);
      } catch (err) {
        setSaveError(err.message || "Error al guardar. Intenta de nuevo.");
      } finally {
        setSaving(false);
      }
    } else {
      console.error("Usuario no autenticado");
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={className}>
      {maxDuration !== null && (
              <span className="badge bg-light text-dark border">Límite: {formatTime(maxDuration)}</span>
      )}
      {/* Input de URL */}
      <div className="input-group mb-3">
        <input
          type="text"
          className={`form-control ${error ? "is-invalid" : ""}`}
          placeholder="https://youtube.com/watch?v=... o ID del video"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleLoad()}
        />
        <button className="btn btn-primary" onClick={handleLoad}>Cargar</button>
        {videoId && (
          <button className="btn btn-outline-secondary" onClick={handleClear} title="Limpiar">✕</button>
        )}
        {error && <div className="invalid-feedback">{error}</div>}
      </div>

      {/* Área de video */}
      {videoId && (
        <>
          <div className="ratio ratio-16x9 position-relative mb-3">

            {/* Thumbnail — visible mientras no se ha dado play */}
            {!playing && (
              <div onClick={() => setPlaying(true)} style={{ cursor: "pointer" }}>
                {!thumbLoaded && (
                  <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                    <div className="spinner-border text-secondary" role="status" />
                  </div>
                )}
                <img
                  src={thumbSrc}
                  onError={() => setThumbSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)}
                  onLoad={() => setThumbLoaded(true)}
                  alt={title || "thumbnail"}
                  className="w-100 h-100"
                  style={{ objectFit: "cover", display: thumbLoaded ? "block" : "none" }}
                />
                {thumbLoaded && (
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-2"
                    style={{ background: "rgba(0,0,0,0.38)" }}
                  >
                    <button
                      className="btn btn-danger rounded-circle p-0 d-flex align-items-center justify-content-center"
                      style={{ width: 64, height: 64 }}
                    >
                      <svg viewBox="0 0 24 24" width="26" height="26" fill="white">
                        <polygon points="8,5 20,12 8,19" />
                      </svg>
                    </button>
                    {title && (
                      <span
                        className="text-white fw-semibold text-center px-3 small"
                        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)", maxWidth: "80%" }}
                      >
                        {title}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/*
              Div donde YT.Player inyecta el iframe real.
              Siempre está en el DOM cuando videoId existe,
              pero solo se monta el player cuando playing=true.
              display:none mientras no se reproduzca para no ocupar espacio visual.
            */}
            <div
              ref={playerDivRef}
              style={{ display: playing ? "block" : "none", width: "100%", height: "100%" }}
            />
          </div>

          {/* Panel de duración + validación + guardar */}
          <div className="d-flex flex-wrap align-items-center gap-2">

            {durationLoading && (
              <span className="text-muted small d-flex align-items-center gap-1">
                <span className="spinner-border spinner-border-sm" role="status" />
                Haga click en el video para detectar duración...
              </span>
            )}

            {!durationLoading && videoDuration !== null && (
              <span className="badge bg-secondary">Duración: {formatTime(videoDuration)}</span>
            )}

            {exceedsLimit && (
              <span className="badge bg-danger">
                ⚠ El video supera el límite establecido, por favor cargue otro
              </span>
            )}

            {withinLimit && maxDuration !== null && (
              <span className="badge bg-success">✓ Dentro del límite</span>
            )}

            <div className="ms-auto d-flex align-items-center gap-2">
              {saveSuccess && <span className="badge bg-success">✓ Guardado</span>}
              {saveError && <span className="badge bg-danger" title={saveError}>✕ {saveError}</span>}

              <button
                className="btn btn-success btn-sm"
                onClick={handleSave}
                disabled={!withinLimit || saving || saveSuccess}
              >
                {saving ? (
                  <><span className="spinner-border spinner-border-sm me-1" role="status" />Guardando...</>
                ) : saveSuccess ? "Guardado ✓" : "Guardar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}