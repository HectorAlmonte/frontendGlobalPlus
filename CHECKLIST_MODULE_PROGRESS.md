# Seguimiento — Módulo Checklist de Equipos

**Ruta del módulo:** `src/app/dashboard/(modulos)/checklist/`
**URL de acceso:** `/dashboard/checklist`
**Inicio:** 2026-03-03
**Estado general:** 🟡 En progreso (Fases 1–5 completas)

---

## Progreso por fase

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Base: tipos, API, utils | ✅ Completo |
| 2 | Vista principal + Tabs + Stats | ✅ Completo |
| 3 | Crear registros y templates | ✅ Completo |
| 4 | Detalle y llenado de ítems | ✅ Completo |
| 5 | Firmas (worker / security / supervisor) | ✅ Completo |
| 6 | Socket.IO + prueba de flujo completo | ⬜ Pendiente |

---

## Fase 1 — Base: tipos, API, utils

### `_lib/types.ts`
- [ ] Enum `ItemKind`: `BOOLEAN | NUMERIC | SELECT | TEXT`
- [ ] Enum `ChecklistStatus`: `ASSIGNED | FILLED | NO_CONFORME | WORKER_SIGNED | SECURITY_SIGNED | COMPLETED`
- [ ] Interface `ChecklistTemplateItem`
- [ ] Interface `ChecklistTemplate` (con `items[]` y `_count`)
- [ ] Interface `ChecklistRecordItem` (con `booleanValue`, `numericValue`, `selectedOption`, `textValue`, `result`)
- [ ] Interface `ChecklistRecord` (con `unit.product`, `operator`, `items[]`, firmas)
- [ ] Interface `ChecklistStats`
- [ ] Interface `PendingGroup` (para reporte `/pendientes`)
- [ ] `STATUS_CONFIG` con labels en español y colores

### `_lib/api.ts`
- [ ] `apiFetch<T>()` helper con `credentials: "include"`, `cache: "no-store"`, helper `full(path)`
- [ ] `apiListTemplates(filters?)` — GET `/api/checklist-templates`
- [ ] `apiGetTemplatesByProduct(productId)` — GET `/api/checklist-templates/by-product/:id`
- [ ] `apiGetTemplate(id)` — GET `/api/checklist-templates/:id`
- [ ] `apiCreateTemplate(data)` — POST `/api/checklist-templates`
- [ ] `apiUpdateTemplate(id, data)` — PATCH `/api/checklist-templates/:id`
- [ ] `apiUpdateTemplateItems(id, items)` — PUT `/api/checklist-templates/:id/items`
- [ ] `apiDeleteTemplate(id)` — DELETE `/api/checklist-templates/:id`
- [ ] `apiListRecords(filters)` — GET `/api/checklist-records`
- [ ] `apiGetPendingRecords()` — GET `/api/checklist-records/pending`
- [ ] `apiGetChecklistStats(filters?)` — GET `/api/checklist-records/stats`
- [ ] `apiGetRecord(id)` — GET `/api/checklist-records/:id`
- [ ] `apiCreateRecord(data)` — POST `/api/checklist-records`
- [ ] `apiFillRecord(id, data)` — POST `/api/checklist-records/:id/fill`
- [ ] `apiSignWorker(id, signature)` — POST `/api/checklist-records/:id/sign/worker`
- [ ] `apiSignSecurity(id, signature)` — POST `/api/checklist-records/:id/sign/security`
- [ ] `apiSignSupervisor(id, signature)` — POST `/api/checklist-records/:id/sign/supervisor`
- [ ] `apiUploadItemPhoto(id, itemId, file)` — POST FormData `/:id/items/:itemId/photo`
- [ ] `apiDeleteItemPhoto(id, itemId)` — DELETE `/:id/items/:itemId/photo`
- [ ] `apiGetPendingReport(productId?)` — GET `/api/reportes/checklists/pendientes`

### `_lib/utils.tsx`
- [ ] `statusBadge(status)` → `<Badge>` con color por `STATUS_CONFIG`
- [ ] `kindLabel(kind)` → "Sí/No", "Numérico", "Selección", "Texto"
- [ ] `resultBadge(result)` → OK (verde), NOK (rojo), NA (gris)
- [ ] `getSignatureUrl(base64)` → añade prefijo `data:image/png;base64,` si falta
- [ ] `canFill(status)` → `["ASSIGNED", "FILLED", "NO_CONFORME"].includes(status)`
- [ ] `canSignWorker(status)` → `["FILLED", "NO_CONFORME"].includes(status)`
- [ ] `canSignSecurity(role, status)` → ADMIN/SUPERVISOR/SEGURIDAD + `WORKER_SIGNED`
- [ ] `canSignSupervisor(role, status)` → ADMIN/SUPERVISOR + `SECURITY_SIGNED`

---

## Fase 2 — Vista principal + Tabs + Stats

### `page.tsx` (página principal)
- [ ] `"use client"` + imports base
- [ ] `useWord()` para obtener `user`
- [ ] `ChecklistStatsCards` en la parte superior
- [ ] Tabs: Pendientes | Todos | Templates
- [ ] `usePersistedState` para recordar tab activa
- [ ] Botón "Nuevo checklist" (roles: ADMIN/SUPERVISOR/SEGURIDAD) → abre `CreateRecordDialog`
- [ ] `useModuleShortcuts({ onNew })` con 'n'/'N'
- [ ] Socket.IO listeners:
  - [ ] `checklist:critical_issue` → toast rojo con nombre de equipo
  - [ ] `checklist:worker_signed` → toast info
  - [ ] `checklist:security_signed` → toast info
  - [ ] `checklist:completed` → toast verde (o warning si `hasCriticalIssues`)
- [ ] `refreshKey` compartido para refrescar tabs tras crear

### `_components/ChecklistStatsCards.tsx`
- [ ] Llama `apiGetChecklistStats()` en montaje
- [ ] 4 cards: Total | Completados | Con issues críticos | Pendientes firma
- [ ] Grid `grid-cols-2 sm:grid-cols-4`
- [ ] Skeleton loading state
- [ ] `completionRate` como porcentaje

### `_components/PendingTab.tsx`
- [ ] Llama `apiGetPendingRecords()` con `refreshKey`
- [ ] Tabla: Equipo + serial | Operador | Fecha | Estado (badge) | Acción pendiente | →
- [ ] Columna "Acción pendiente" derivada del status actual
- [ ] Click en fila → `router.push("/dashboard/checklist/:id")`
- [ ] Empty state si no hay pendientes
- [ ] Loading skeleton

### `_components/AllRecordsTab.tsx`
- [ ] Filtros: búsqueda texto, select de estado, `dateFrom`/`dateTo`
- [ ] `usePersistedState` para filtros texto y estado
- [ ] `data-search-input` en el input de búsqueda
- [ ] `hasActiveFilters` + botón "Limpiar" con icono `<X/>`
- [ ] Paginación server-side (`page`/`limit`)
- [ ] Columnas: Equipo | Template | Operador | Fecha | Estado | Issues críticos | →
- [ ] Columna "Issues críticos" solo visible si `hasCriticalIssues=true`
- [ ] Loading y empty state

### `_components/TemplatesTab.tsx`
- [ ] Llama `apiListTemplates()` con `refreshKey`
- [ ] Lista de templates: nombre, equipo, ítems count, registros count, activo/inactivo
- [ ] Botón "Configurar ítems" → abre `TemplateItemsEditor`
  - [ ] Deshabilitado si `_count.records > 0` con tooltip explicativo
- [ ] Switch para toggle activo (`apiUpdateTemplate`)
- [ ] Botón eliminar → `DestructiveDialog` → `apiDeleteTemplate`
  - [ ] Maneja error 409 (template con registros)
- [ ] Botón "Nuevo template" → `CreateTemplateDialog`
- [ ] Empty state si no hay templates

---

## Fase 3 — Crear registros y templates

### `_components/CreateRecordDialog.tsx`
- [ ] Dialog con stepper visual de 4 pasos
- [ ] **Paso 1 — Unidad de equipo:**
  - [ ] Combobox de búsqueda — `GET /api/storage/units?kind=EQUIPMENT`
  - [ ] Muestra: nombre del producto + serial/código de activo
- [ ] **Paso 2 — Template:**
  - [ ] Auto-carga `apiGetTemplatesByProduct(unit.product.id)`
  - [ ] Si 1 template → auto-selecciona y avanza
  - [ ] Si varios → RadioGroup para elegir
  - [ ] Si 0 templates → mensaje de error + botón "Crear template" deshabilitado en este paso
- [ ] **Paso 3 — Operador:**
  - [ ] Combobox/SearchSelect → `GET /api/staff/search` filtrando TRABAJADOR
  - [ ] Muestra nombre + DNI + cargo
- [ ] **Paso 4 — Fecha y área:**
  - [ ] Date input (default hoy)
  - [ ] SearchSelect opcional para área → `GET /api/areas/search`
  - [ ] Resumen visual de selecciones antes de confirmar
- [ ] Submit → `apiCreateRecord()`
  - [ ] Maneja error 409: "Ya existe un checklist para este equipo en esta fecha."
  - [ ] Maneja error 400 (sin ítems, template no coincide)
- [ ] Tras éxito → `router.push("/dashboard/checklist/:id")`
- [ ] Reset completo al cerrar dialog

### `_components/CreateTemplateDialog.tsx`
- [ ] Campos: nombre (requerido), descripción (opcional)
- [ ] Combobox de producto tipo EQUIPMENT → `GET /api/storage/products?type=EQUIPMENT`
- [ ] Validación con estado local
- [ ] Submit → `apiCreateTemplate(data)`
- [ ] Tras éxito → cierra dialog + abre `TemplateItemsEditor` con el nuevo template

### `_components/TemplateItemsEditor.tsx`
- [ ] Sheet o Dialog grande para editar ítems
- [ ] Lista de ítems con campos por fila:
  - [ ] `label` (Input, requerido)
  - [ ] `description` (Input, opcional)
  - [ ] `kind` (Select: BOOLEAN/NUMERIC/SELECT/TEXT)
  - [ ] `options` (Input tags/textarea, solo visible si `kind === "SELECT"`)
  - [ ] `isCritical` (Switch con label "Crítico")
  - [ ] `isRequired` (Switch con label "Requerido")
  - [ ] `order` (número, o botones ↑↓)
- [ ] Botón "Agregar ítem" añade fila vacía
- [ ] Botón eliminar por fila
- [ ] Validación: al menos 1 ítem antes de guardar
- [ ] Validación: ítems SELECT deben tener al menos 2 opciones
- [ ] Submit → `apiUpdateTemplateItems(id, items)`
- [ ] Feedback de éxito + cierre

---

## Fase 4 — Detalle y llenado del checklist

### `[id]/page.tsx`
- [ ] `"use client"` + `useParams()` para obtener `id`
- [ ] `apiGetRecord(id)` en montaje y tras cada acción (`refreshKey`)
- [ ] Loading skeleton y error state (404)
- [ ] Layout: `ChecklistDetailHeader` → `ChecklistFillForm` → `SignatureSection`
- [ ] Pasar `onRefresh` a sub-componentes para refrescar tras acciones

### `_components/ChecklistDetailHeader.tsx`
- [ ] Card con: equipo (nombre + serial/código), template, operador (nombre + DNI), fecha, área
- [ ] Status badge prominente
- [ ] Banner rojo si `hasCriticalIssues=true` (persiste aunque llegue a COMPLETED)
- [ ] Link "Ver log de mantenimiento" si `equipmentLogId` presente
- [ ] Stepper visual de 6 estados (horizontal en desktop, compacto en mobile)
- [ ] Botón "Volver" → `router.back()` o `/dashboard/checklist`

### `_components/ChecklistFillForm.tsx`
- [ ] Solo activo si `canFill(record.status)` y rol ADMIN/SUPERVISOR/SEGURIDAD
- [ ] Si `status === "WORKER_SIGNED"` o posterior → modo lectura (no editable)
- [ ] Lista de `ChecklistItemRow` ordenados por `order`
- [ ] Textarea de observaciones generales al final
- [ ] Botón "Guardar llenado" → `apiFillRecord(id, { observations, items })`
  - [ ] Validación: ítems `isRequired=true` deben tener `result` definido
  - [ ] Loading state en botón
  - [ ] Toast de éxito/error
  - [ ] Llama `onRefresh()` tras éxito
- [ ] Inicializa valores de ítems desde `record.items` si ya existen

### `_components/ChecklistItemRow.tsx`
- [ ] Label + descripción (muted)
- [ ] Badge "Crítico" en rojo si `isCritical=true`
- [ ] Badge "Requerido" si `isRequired=true`
- [ ] Botones toggle **OK / NOK / NA** — highlight por color (verde/rojo/gris)
- [ ] Render por `kind`:
  - [ ] `BOOLEAN`: Switch "Sí/No" + los botones OK/NOK/NA
  - [ ] `NUMERIC`: `<Input type="number" className="h-10 max-w-[160px]">`
  - [ ] `SELECT`: `RadioGroup` horizontal con opciones de `JSON.parse(item.options)`
  - [ ] `TEXT`: `<Textarea rows={2}>`
- [ ] Input de observación por ítem (colapsable, se expande al click en ícono)
- [ ] Si `result === "NOK"` → mostrar botón de cámara:
  - [ ] Si no hay foto → `<input type="file" accept="image/*">` → `apiUploadItemPhoto()`
  - [ ] Si hay `photoUrl` → miniatura `<img>` + botón eliminar → `apiDeleteItemPhoto()`
- [ ] Highlight de fondo rojo/amber si `isCritical && result === "NOK"`
- [ ] Estado local sincronizado con el formulario padre (via callback o estado compartido)

---

## Fase 5 — Firmas

### `_components/SignatureSection.tsx`
- [ ] 3 bloques en columna (o grid en desktop): Trabajador | Seguridad | Supervisor
- [ ] Cada bloque muestra:
  - [ ] Si firmado: `<img src={getSignatureUrl(firma)}>` + nombre del firmante + fecha/hora
  - [ ] Si es el turno: botón "Firmar ahora" → abre `SignatureDialog`
  - [ ] Si no es el turno aún: indicador "Pendiente" con icono de candado
- [ ] Lógica de visibilidad del botón por rol + estado:
  - [ ] Trabajador: cualquier usuario autenticado, estado `FILLED` o `NO_CONFORME`
  - [ ] Seguridad: ADMIN/SUPERVISOR/SEGURIDAD, estado `WORKER_SIGNED`
  - [ ] Supervisor: ADMIN/SUPERVISOR, estado `SECURITY_SIGNED`
- [ ] Llama `onRefresh()` tras firma exitosa

### `_components/SignatureDialog.tsx`
- [ ] Reutiliza patrón de EPP: `signature_pad` con dynamic import en `useEffect`
- [ ] `SignaturePadCanvas` via `forwardRef` con métodos `getDataURL()`, `clear()`, `isEmpty()`
- [ ] Resize del canvas resetea el pad
- [ ] Canvas full-width, `height: 280px`
- [ ] Instrucción: "Firma con el dedo o el mouse en el área de abajo"
- [ ] Botones: "Limpiar" y "Confirmar firma"
- [ ] `isEmpty()` check → toast de advertencia si vacío
- [ ] Envía `getDataURL()` al endpoint según `type: "worker" | "security" | "supervisor"`
- [ ] Loading state en botón confirmar
- [ ] Cierra dialog + `onRefresh()` tras éxito

---

## Fase 6 — Socket.IO + prueba de flujo completo

### Socket.IO (en `page.tsx`)
- [ ] Conectar socket de la app existente (mismo cliente que otros módulos)
- [ ] `checklist:critical_issue` → `toast.error("Ítem crítico NOK — {unitLabel}", { description: message })`
- [ ] `checklist:worker_signed` → `toast.info(message)` + `refreshKey++`
- [ ] `checklist:security_signed` → `toast.info(message)` + `refreshKey++`
- [ ] `checklist:completed` → `toast.success/warning` según `hasCriticalIssues`
- [ ] Cleanup de listeners en `useEffect` return

### Prueba de flujo completo
- [ ] Flujo 1: SUPERVISOR crea checklist → llena ítems (todos OK) → firma trabajador → firma seguridad → firma supervisor → COMPLETED
- [ ] Flujo 2: SEGURIDAD crea → llena con ítem crítico NOK → verifica `NO_CONFORME` + EquipmentLog link → firma trabajador → firma seguridad → firma supervisor
- [ ] Flujo 3: Intento de crear duplicado (misma unidad, misma fecha) → error 409 visible
- [ ] Flujo 4: Template con registros → "Configurar ítems" deshabilitado con tooltip
- [ ] Verificar persistencia de filtros (recargar página)
- [ ] Verificar shortcuts: 'n' abre CreateRecordDialog, '/' enfoca búsqueda

---

## Dependencias shadcn a verificar antes de iniciar

- [ ] `toggle-group` — para botones OK/NOK/NA (`npx shadcn@latest add toggle-group`)
- [ ] `tabs` — para las tabs principales (verificar si ya instalado)
- [ ] `radio-group` — para SELECT items y paso 2 del wizard (ya instalado ✓)
- [ ] `progress` — para stepper visual (ya instalado ✓)

---

## Notas y decisiones de diseño

| Decisión | Detalle |
|----------|---------|
| Detalle como página, no Sheet | Volumen alto de contenido (ítems + firmas + fotos) |
| Llenado en un solo submit | Estado local en `ChecklistFillForm`; múltiple llamadas permitidas mientras sin firma |
| Firma trabajador sin login propio | El JWT pertenece al supervisor/seguridad; el trabajador firma con el dedo en la tablet |
| Fotos solo sugeridas en NOK | Sin restricción técnica, pero botón aparece destacado solo si `result === "NOK"` |
| `hasCriticalIssues` persiste | Siempre mostrar banner de advertencia aunque el status llegue a COMPLETED |
| Template bloqueado con registros | Mensaje claro: "Crea un nuevo template para modificar criterios" |
| Paginación AllRecords: server-side | El endpoint soporta `page`/`limit`; PendingTab carga todo (pocos registros) |
| `TemplateItemsEditor` como Sheet | Mantiene contexto de TemplatesTab al editar |

---

## Log de cambios

| Fecha | Acción |
|-------|--------|
| 2026-03-03 | Plan creado |
| 2026-03-03 | Fases 1–5 implementadas — 0 errores TypeScript |
