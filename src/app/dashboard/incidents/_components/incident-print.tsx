"use client";

import * as React from "react";
import { createRoot } from "react-dom/client";

import { IncidentDetail, IncidentSubtask } from "../_lib/types";
import { normalizeCauses, statusBadge } from "../_lib/utils";

/* =========================
   Helpers
========================= */
function pickFullName(u: any) {
  const emp = u?.employee;
  const nombres = emp?.nombres ?? "";
  const apellidos = emp?.apellidos ?? "";
  const full = `${nombres} ${apellidos}`.trim();
  return full || u?.username || u?.id || "—";
}

function fmtDate(d?: any) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isImageFile(f: any) {
  const imgExt = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;
  return (
    imgExt.test(String(f?.originalName || "")) ||
    imgExt.test(String(f?.filename || "")) ||
    imgExt.test(String(f?.url || "")) ||
    String(f?.mime || "").startsWith("image/") ||
    String(f?.mimeType || "").startsWith("image/")
  );
}

function fileNameOf(f: any) {
  return f?.originalName || f?.filename || "archivo";
}
function fileMimeOf(f: any) {
  return f?.mime || f?.mimeType || f?.contentType || "—";
}
function fileStageOf(f: any) {
  return f?.stage || f?.fileStage || f?.type || "—";
}
function fileUrlOf(f: any) {
  return (f?.url || f?.publicUrl || f?.path || "") as string;
}

function stageEs(stage: any) {
  const s = String(stage || "").toUpperCase().trim();
  if (s === "REPORT") return "Reporte";
  if (s === "CORRECTIVE") return "Correctivo";
  if (s === "CLOSURE") return "Cierre";
  return s ? s : "Adjunto";
}

/* =========================
   CABECERA SST (solo header)
   - 3 bloques: Logo / Título / Tabla
   - Logo ocupa todo su bloque
========================= */
function SstHeader(props: {
  codigo?: string;
  version?: string;
  fechaVigencia?: string;
  pagina?: string;
  titulo?: string;
  subtitulo?: string;

  // ✅ logo (solo cambiar src)
  logoSrc?: string;
}) {
  const {
    codigo = "SST-REG-045",
    version = "01",
    fechaVigencia = "08/10/2024",
    pagina = "1 de 1",
    titulo = "SEGURIDAD Y SALUD EN EL TRABAJO",
    subtitulo =
      "REPORTE DE INCIDENTES, ACTO SUBESTÁNDAR,\nCONDICIÓN SUBESTÁNDAR",
    logoSrc = "/logo/logo-texto-negro.png",
  } = props;

  return (
    <div className="sst-header">
      {/* Bloque Logo (solo imagen, ocupa todo el bloque) */}
      <div className="sst-logo-cell">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="Logo" className="sst-logo-img" />
      </div>

      {/* Bloque Título */}
      <div className="sst-center">
        <div className="sst-title">{titulo}</div>
        <div className="sst-subtitle" style={{ whiteSpace: "pre-line" }}>
          {subtitulo}
        </div>
      </div>

      {/* Bloque Tabla (Código/Versión/Fecha/Página) */}
      <div className="sst-meta">
        <div className="sst-meta-row">
          <div className="sst-meta-k">Código</div>
          <div className="sst-meta-v">{codigo}</div>
        </div>
        <div className="sst-meta-row">
          <div className="sst-meta-k">Versión</div>
          <div className="sst-meta-v">{version}</div>
        </div>
        <div className="sst-meta-row">
          <div className="sst-meta-k">Fecha</div>
          <div className="sst-meta-v">{fechaVigencia}</div>
        </div>
        <div className="sst-meta-row">
          <div className="sst-meta-k">Página</div>
          <div className="sst-meta-v">{pagina}</div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   DOCUMENTO SOLO IMPRESIÓN
========================= */
function PrintOnlyDocument(props: {
  detail: IncidentDetail;
  incidentIdLabel: string;
  incidentDateLabel: string;
  reportedLabel: string;
  observedLabel: string;
  causes: string[];
  filesAll: any[];
  corrective: any;
  closure: any;
  subtasks: IncidentSubtask[];
  header?: {
    codigo?: string;
    version?: string;
    fechaVigencia?: string;
    pagina?: string;
    logoSrc?: string;
  };
}) {
  const {
    detail,
    incidentIdLabel,
    incidentDateLabel,
    reportedLabel,
    observedLabel,
    causes,
    filesAll,
    corrective,
    closure,
    subtasks,
    header,
  } = props;

  return (
    <div data-print-root>
      {/* ✅ CABECERA (solo si hay documento configurado) */}
      {header && (
        <SstHeader
          codigo={header.codigo}
          version={header.version}
          fechaVigencia={header.fechaVigencia}
          pagina={header.pagina}
          logoSrc={header.logoSrc}
        />
      )}

      {/* ===== Incidencia ===== */}
      <div className="print-section print-card">
        <div className="print-section-title">Incidencia</div>

        <div className="grid grid-cols-2 gap-2 print-text">
          <div>
            <div className="print-label">Estado</div>
            <div className="mt-0.5">{statusBadge((detail as any).status)}</div>
          </div>

          <div className="text-right">
            <div className="print-label">Tipo</div>
            <div className="print-strong">{(detail as any).type ?? "—"}</div>
          </div>

          <div className="col-span-2">
            <div className="print-label">Título</div>
            <div className="print-strong">{(detail as any).title ?? "—"}</div>
          </div>

          <div>
            <div className="print-label">Folio</div>
            <div className="print-strong">
              {(detail as any).number != null
                ? `#${String((detail as any).number).padStart(3, "0")}`
                : incidentIdLabel}
            </div>
          </div>
          <div className="text-right">
            <div className="print-label">Fecha de reporte</div>
            <div className="print-strong">{incidentDateLabel}</div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 print-text">
          {(detail as any).locationLabel ? (
            <div>
              <div className="print-label">Zona / Lugar</div>
              <div className="print-strong">
                {String((detail as any).locationLabel)}
              </div>
            </div>
          ) : (
            <div />
          )}

          <div>
            <div className="print-label">Área</div>
            <div className="print-strong">
              {(detail as any).area?.name ??
                (detail as any).areaNameSnapshot ??
                (detail as any).observedArea?.name ??
                "—"}
            </div>
          </div>

          <div>
            <div className="print-label">Reportado por</div>
            <div className="print-strong">{reportedLabel}</div>
          </div>

          <div>
            <div className="print-label">Observado</div>
            <div className="print-strong">{observedLabel}</div>
          </div>
        </div>
      </div>

      {/* ===== Detalle ===== */}
      <div className="print-section print-card">
        <div className="print-section-title">Detalle</div>
        <div className="print-text whitespace-pre-wrap">
          {String((detail as any).detail || "—")}
        </div>
      </div>

      {/* ===== Causas ===== */}
      {causes.length > 0 ? (
        <div className="print-section print-card">
          <div className="print-section-title">Posibles causas</div>
          <div>
            {causes.slice(0, 10).map((c, idx) => (
              <span key={`${c}-${idx}`} className="print-badge">
                {c}
              </span>
            ))}
            {causes.length > 10 ? (
              <span className="print-badge">+{causes.length - 10} más</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ===== Correctivo ===== */}
      {corrective?.hasCorrective && (
        <div className="print-section print-card">
          <div className="print-section-title">Correctivo</div>

          <div className="grid grid-cols-2 gap-2 print-text">
            <div>
              <div className="print-label">Fecha tentativa</div>
              <div className="print-strong">
                {corrective.correctiveDueAt
                  ? fmtDate(corrective.correctiveDueAt)
                  : "—"}
              </div>
            </div>

            <div>
              <div className="print-label">Registrado</div>
              <div className="print-strong">
                {corrective.correctiveSetAt
                  ? fmtDate(corrective.correctiveSetAt)
                  : "—"}
              </div>
            </div>

            <div className="col-span-2">
              <div className="print-label">Registrado por</div>
              <div className="print-strong">{corrective.correctiveByLabel}</div>
            </div>

            {corrective.priority ? (
              <div className="col-span-2">
                <div className="print-label">Prioridad</div>
                <div className="print-strong">{String(corrective.priority)}</div>
              </div>
            ) : null}

            <div className="col-span-2">
              <div className="print-label">Acción correctiva</div>
              <div className="whitespace-pre-wrap">
                {corrective.correctiveAction
                  ? String(corrective.correctiveAction)
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Cierre ===== */}
      {closure?.hasClosure && (
        <div className="print-section print-card">
          <div className="print-section-title">Cierre de incidencia</div>

          <div className="grid grid-cols-2 gap-2 print-text">
            <div>
              <div className="print-label">Fecha de cierre</div>
              <div className="print-strong">
                {closure.closedAt ? fmtDate(closure.closedAt) : "—"}
              </div>
            </div>

            <div>
              <div className="print-label">Cerrado por</div>
              <div className="print-strong">{closure.closedByLabel}</div>
            </div>

            <div className="col-span-2">
              <div className="print-label">Detalle de cierre</div>
              <div className="whitespace-pre-wrap">
                {closure.closureDetail ? String(closure.closureDetail) : "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Objetivos ===== */}
      {subtasks.length > 0 && (
        <div className="print-section print-card">
          <div className="print-section-title">
            Objetivos ({subtasks.filter((s) => s.isCompleted).length}/{subtasks.length} completados)
          </div>
          <div className="print-subtask-list">
            {subtasks.map((st) => (
              <div key={st.id} className="print-subtask-row">
                <span className={`print-subtask-check ${st.isCompleted ? "done" : ""}`}>
                  {st.isCompleted ? "✓" : "○"}
                </span>
                <div className="print-subtask-body">
                  <span className={`print-subtask-title ${st.isCompleted ? "done" : ""}`}>
                    {st.title}
                  </span>
                  {st.detail && (
                    <span className="print-subtask-detail">{st.detail}</span>
                  )}
                  {st.assignedTo && (
                    <span className="print-subtask-assigned">
                      Asignado: {pickFullName(st.assignedTo)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Evidencias ===== */}
      <div className="print-section print-card">
        <div className="print-section-title">Evidencias</div>

        {filesAll.length === 0 ? (
          <div className="print-text print-muted">Sin evidencias adjuntas.</div>
        ) : (
          <div className="print-evidence-list">
            {filesAll.map((f: any) => (
              <div
                key={String(f.id || f.__url || f.__name)}
                className="print-evidence-item"
              >
                {f.__isImg && f.__url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.__url} alt="Evidencia" className="print-evidence-img" />
                ) : (
                  <div className="print-evidence-placeholder" />
                )}
                <div className="print-evidence-caption">
                  <span className="print-fname">{String(f.__name)}</span>
                  <span className="print-fmeta">
                    {String(f.__stageEs)} • {String(f.__mime)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="print-footer">
        Documento generado desde Global Plus •{" "}
        {new Date().toLocaleString("es-PE")}
      </div>
    </div>
  );
}

/* =========================
   Build data for print
========================= */
function buildPrintPayload(detail: IncidentDetail, selectedId?: string | null) {
  const d: any = detail || {};
  const causes = normalizeCauses(d.causes);

  const reportedLabel = (() => {
    if (!d?.reportedBy) return "—";
    const full = pickFullName(d.reportedBy);
    const dni = d.reportedBy?.username;
    if (dni && full !== dni) return `${full} (DNI ${dni})`;
    return full;
  })();

  const observedLabel = (() => {
    if (!detail) return "—";
    const snap = d.observedLabelSnapshot ?? null;

    if (d.observedKind === "USER") {
      const u = d.observedUser;
      if (!u) return snap ?? "—";
      const full = pickFullName(u);
      const dni = u?.username;
      if (dni && full !== dni) return `${full} (DNI ${dni})`;
      return full || snap || "—";
    }
    if (d.observedKind === "AREA") {
      return d.observedArea?.name ?? snap ?? "—";
    }
    return snap ?? "—";
  })();

  const incidentIdLabel = selectedId || d?.id || "—";
  const incidentDateLabel = fmtDate(d?.reportedAt || d?.createdAt) || "—";

  const filesAll = (((d?.files || []) as any[]) ?? []).map((f) => {
    const st = fileStageOf(f);
    return {
      ...f,
      __name: fileNameOf(f),
      __mime: fileMimeOf(f),
      __stage: st,
      __stageEs: stageEs(st),
      __url: fileUrlOf(f),
      __isImg: isImageFile(f),
    };
  });

  const corr: any = d.corrective || null;
  const correctiveAction = d.correctiveAction ?? corr?.detail ?? null;
  const correctiveDueAt = d.correctiveDueAt ?? corr?.dueDate ?? null;
  const correctiveSetAt =
    d.correctiveSetAt ?? corr?.createdAt ?? corr?.updatedAt ?? null;
  const correctiveSetBy = d.correctiveSetBy ?? corr?.createdBy ?? null;

  const correctiveByLabel = correctiveSetBy
    ? (() => {
        const full = pickFullName(correctiveSetBy);
        const dni = correctiveSetBy?.username;
        if (dni && full !== dni) return `${full} (DNI ${dni})`;
        return full;
      })()
    : "—";

  const hasCorrective =
    d.status === "IN_PROGRESS" || // ✅ antes: CORRECTIVE_SET
    !!corr ||
    !!correctiveAction ||
    !!correctiveDueAt ||
    !!correctiveSetAt ||
    !!correctiveSetBy;

  const clo: any = d.closure || null;
  const closureDetail = d.closureDetail ?? clo?.detail ?? null;
  const closedAt = d.closedAt ?? clo?.createdAt ?? null;
  const closedBy = d.closedBy ?? clo?.closedBy ?? null;

  const closedByLabel = closedBy
    ? (() => {
        const full = pickFullName(closedBy);
        const dni = closedBy?.username;
        if (dni && full !== dni) return `${full} (DNI ${dni})`;
        return full;
      })()
    : "—";

  const hasClosure =
    d.status === "CLOSED" || !!clo || !!closureDetail || !!closedAt || !!closedBy;

  const subtasks: IncidentSubtask[] = Array.isArray(d.subtasks) ? d.subtasks : [];

  return {
    incidentIdLabel,
    incidentDateLabel,
    reportedLabel,
    observedLabel,
    causes,
    filesAll,
    subtasks,
    corrective: {
      hasCorrective,
      correctiveAction,
      correctiveDueAt,
      correctiveSetAt,
      correctiveByLabel,
      priority: corr?.priority ?? null,
    },
    closure: {
      hasClosure,
      closureDetail,
      closedAt,
      closedByLabel,
    },
  };
}

/* =========================
   Print CSS (paleta coherente)
========================= */
function getPrintCss() {
  return `
@media print {
  @page { size: A4; margin: 5mm; }

  html, body { height: auto !important; }
  body {
    margin: 0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    color: #0f172a;
  }

  body > *:not(#__incident_print_portal) { display: none !important; }
  #__incident_print_portal { display: block !important; background: white !important; }

  :root{
    --ink: #0f172a;         /* slate-900 */
    --muted: #64748b;       /* slate-500 */
    --line: #cbd5e1;        /* slate-300 */
    --line-strong: #334155; /* slate-700 */
    --soft: #f8fafc;        /* slate-50 */
  }

  /* ===== CABECERA SST (3 bloques) ===== */
  .sst-header{
    display:grid;
    grid-template-columns: 0.85fr 1.6fr 0.75fr;
    gap: 6px;
    border: 1.4px solid var(--line-strong);
    padding: 6px;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .sst-logo-cell{
    border: 1.2px solid var(--line-strong);
    border-radius: 7px;
    overflow: hidden;
    background: #fff;
    height: 72px;
  }
  .sst-logo-img{
    width: 100%;
    height: 100%;
    display:block;
    object-fit: contain;
    background: #fff;
  }

  .sst-center{
    border: 1.2px solid var(--line-strong);
    border-radius: 7px;
    padding: 6px;
    display:flex;
    flex-direction:column;
    justify-content:center;
    text-align:center;
    background: #fff;
  }
  .sst-title{
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .2px;
    color: var(--ink);
  }
  .sst-subtitle{
    margin-top: 2px;
    font-size: 7.8px;
    color: var(--ink);
  }

  .sst-meta{
    border: 1.2px solid var(--line-strong);
    border-radius: 7px;
    overflow:hidden;
    background:#fff;
  }
  .sst-meta-row{
    display:grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--line-strong);
  }
  .sst-meta-row:last-child{ border-bottom: none; }

  .sst-meta-k{
    font-size: 8px;
    padding: 4px 5px;
    border-right: 1px solid var(--line-strong);
    font-weight: 900;
    background: var(--soft);
    color: var(--ink);
  }
  .sst-meta-v{
    font-size: 8px;
    padding: 4px 5px;
    text-align:center;
    font-weight: 800;
    color: var(--ink);
  }

  .print-section {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 6px;
    margin-top: 6px;
    background: #ffffff;
  }

  .print-section-title {
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .2px;
    margin-bottom: 5px;
    padding-bottom: 5px;
    border-bottom: 1px solid var(--line);
    color: var(--ink);
  }

  .print-card { break-inside: avoid; page-break-inside: avoid; }

  .print-text { font-size: 8.8px !important; line-height: 1.25 !important; color: var(--ink); }
  .print-label { font-size: 7.8px; color: var(--muted); }
  .print-strong { font-weight: 800; color: var(--ink); }

  .print-muted { color: var(--muted) !important; }

  .print-badge {
    display:inline-block;
    padding: 1px 6px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--soft);
    font-size: 8px;
    margin: 2px 4px 0 0;
    color: var(--ink);
  }

  .print-evidence-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .print-evidence-item {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 5px;
    background: #fff;
    break-inside: avoid;
    page-break-inside: avoid;
    flex: 1 1 0;
    min-width: 0;
    max-width: 50%;
  }

  .print-evidence-img {
    display: block;
    width: 100%;
    max-height: 180px;
    object-fit: contain;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: var(--soft);
  }

  .print-evidence-placeholder {
    width: 100%;
    height: 40px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: var(--soft);
  }

  .print-evidence-caption {
    margin-top: 3px;
  }

  .print-fname {
    font-size: 8px;
    font-weight: 900;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
    color: var(--ink);
  }

  .print-fmeta {
    font-size: 7.6px;
    color: var(--muted) !important;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
    flex-shrink: 0;
  }

  /* ===== SUBTASKS / OBJETIVOS ===== */
  .print-subtask-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .print-subtask-row {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 3px 0;
    border-bottom: 1px solid var(--soft);
  }
  .print-subtask-row:last-child { border-bottom: none; }
  .print-subtask-check {
    font-size: 10px;
    font-weight: 900;
    color: var(--muted);
    margin-top: 1px;
    flex-shrink: 0;
  }
  .print-subtask-check.done { color: #16a34a; }
  .print-subtask-body {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .print-subtask-title {
    font-size: 8.8px;
    font-weight: 800;
    color: var(--ink);
  }
  .print-subtask-title.done {
    text-decoration: line-through;
    color: var(--muted);
  }
  .print-subtask-detail {
    font-size: 8px;
    color: var(--muted);
  }
  .print-subtask-assigned {
    font-size: 7.6px;
    color: var(--muted);
    font-style: italic;
  }

  .print-footer{
    margin-top: 6px;
    font-size: 8px;
    color: var(--muted);
  }
}
`;
}

/* =========================
   Helpers: preload image as data-URL
========================= */
async function preloadImageAsDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src, { cache: "force-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function waitForImages(container: HTMLElement, timeoutMs = 4000): Promise<void> {
  const imgs = Array.from(container.querySelectorAll("img"));
  if (imgs.length === 0) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const timer = setTimeout(done, timeoutMs);

    let pending = imgs.filter((img) => !img.complete).length;
    if (pending === 0) {
      clearTimeout(timer);
      done();
      return;
    }

    for (const img of imgs) {
      if (img.complete) continue;
      const onDone = () => {
        pending--;
        if (pending <= 0) {
          clearTimeout(timer);
          done();
        }
      };
      img.addEventListener("load", onDone, { once: true });
      img.addEventListener("error", onDone, { once: true });
    }
  });
}

/* =========================
   Public API: Print to PDF
========================= */
export async function printIncidentToPdf(args: {
  detail: IncidentDetail;
  selectedId?: string | null;
  header?: {
    codigo?: string;
    version?: string;
    fechaVigencia?: string;
    pagina?: string;
    logoSrc?: string;
  };
}) {
  const { detail, selectedId, header } = args;
  if (!detail) return;

  const payload = buildPrintPayload(detail, selectedId);

  // Pre-load logo as base64 so it always shows in print
  const logoSrc = header?.logoSrc ?? "/logo/logo-texto-negro.png";
  const logoDataUrl = await preloadImageAsDataUrl(logoSrc);

  const resolvedHeader = header
    ? { ...header, logoSrc: logoDataUrl ?? logoSrc }
    : undefined;

  // Pre-load evidence images as data URLs so they render in print
  for (const f of payload.filesAll) {
    if (f.__isImg && f.__url) {
      const dataUrl = await preloadImageAsDataUrl(f.__url);
      if (dataUrl) f.__url = dataUrl;
    }
  }

  const portal = document.createElement("div");
  portal.id = "__incident_print_portal";
  document.body.appendChild(portal);

  const style = document.createElement("style");
  style.setAttribute("data-incident-print", "true");
  style.innerHTML = getPrintCss();
  document.head.appendChild(style);

  const root = createRoot(portal);
  root.render(
    <PrintOnlyDocument
      detail={detail}
      incidentIdLabel={payload.incidentIdLabel}
      incidentDateLabel={payload.incidentDateLabel}
      reportedLabel={payload.reportedLabel}
      observedLabel={payload.observedLabel}
      causes={payload.causes}
      filesAll={payload.filesAll}
      corrective={payload.corrective}
      closure={payload.closure}
      subtasks={payload.subtasks}
      header={resolvedHeader}
    />
  );

  // Wait for React to flush + all images to load
  await new Promise((r) => setTimeout(r, 100));
  await waitForImages(portal);

  // Cleanup after print (works on mobile & desktop)
  const cleanup = () => {
    try { root.unmount(); } catch {}
    document.querySelector('style[data-incident-print="true"]')?.remove();
    document.getElementById("__incident_print_portal")?.remove();
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup, { once: true });
  // Fallback cleanup for browsers that don't fire afterprint (some mobile)
  const fallbackTimer = setTimeout(cleanup, 15000);
  const origCleanup = cleanup;
  window.addEventListener("afterprint", () => clearTimeout(fallbackTimer), { once: true });

  window.print();
}
