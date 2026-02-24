# CLAUDE.md - frontendGlobalPlus

## Proyecto

Dashboard de gestión empresarial (SST, incidencias, documentos, visitas, seguridad, etc.).

## Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Estilos**: Tailwind CSS 4, tw-animate-css
- **UI**: shadcn/ui (Radix primitives) en `@/components/ui/`
- **Iconos**: lucide-react, @tabler/icons-react
- **Forms**: react-hook-form + zod (aunque muchos módulos usan useState directo)
- **Charts**: recharts
- **Notificaciones**: sonner
- **Realtime**: socket.io-client

## Comandos

```bash
npm run dev     # Servidor de desarrollo
npm run build   # Build de producción
npm run lint    # ESLint
```

## Estructura del proyecto

```
src/
├── app/
│   ├── dashboard/           # Módulos principales (cada uno con su estructura)
│   │   ├── areas/           # Áreas (incidencias)
│   │   ├── documents/       # Control documental
│   │   ├── incidents/       # Incidencias
│   │   ├── work-areas/      # Áreas de trabajo (documentos)
│   │   ├── ordenes/         # Órdenes
│   │   ├── visitas/         # Visitas
│   │   ├── seguridad/       # Seguridad
│   │   ├── tasks/           # Tareas
│   │   ├── staff/           # Gestión de personal (multi-rol)
│   │   └── me/              # Perfil de usuario
│   └── ...
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── app-sidebar.tsx      # Sidebar principal (nav dinámica desde API)
│   └── nav-main.tsx         # Navegación con secciones colapsables
├── context/
│   └── AppContext.tsx        # Auth context (useWord)
└── lib/
    └── utils.ts             # cn() helper + hasRole()
```

## Estructura de cada módulo

Todos los módulos del dashboard siguen esta convención:

```
src/app/dashboard/<modulo>/
├── page.tsx              # "use client", página principal
├── _lib/
│   ├── types.ts          # Tipos TypeScript
│   ├── api.ts            # Llamadas a la API (apiFetch pattern)
│   └── utils.tsx         # Badges, formatters (opcional)
└── _components/          # Componentes del módulo
```

## Patrones clave

### API calls (`_lib/api.ts`)

Cada módulo define su propio `apiFetch<T>()` con:
- `credentials: "include"` (cookies de sesión)
- `cache: "no-store"` (sin cache)
- `Content-Type: application/json` por defecto
- Helper `full(path)` que prepend `NEXT_PUBLIC_API_URL`

Para uploads con FormData, usar `fetch` directo SIN Content-Type header (el browser lo pone automáticamente con boundary).

### Autenticación y roles (multi-rol)

El sistema soporta múltiples roles por usuario. Usar siempre `hasRole()` de `@/lib/utils`:

```tsx
import { hasRole } from "@/lib/utils"
const { user, loadingUser } = useWord(); // de @/context/AppContext

// ✅ Correcto — soporta multi-rol
const isAdmin = hasRole(user, "ADMIN")
const isSupervisor = hasRole(user, "SUPERVISOR")

// ❌ Evitar — solo funciona con rol único (legacy)
const roleKey = (user as any)?.role?.key
```

`hasRole` comprueba tanto `user.roles[].key` (multi-rol) como `user.role.key` (fallback legacy).

Roles disponibles: `"ADMIN" | "SUPERVISOR" | "TRABAJADOR" | "SEGURIDAD"`

### Permisos por acción (incidencias)

- **Crear incidencia**: ADMIN, SUPERVISOR, SEGURIDAD siempre. TRABAJADOR solo dentro de su turno.
- **Registrar correctivo**: ADMIN, SUPERVISOR, SEGURIDAD
- **Cerrar incidencia**: solo ADMIN y SEGURIDAD
- **Completar objetivos**: cualquier rol si la incidencia no está CLOSED

### Tablas con paginación client-side

```tsx
const [pageIndex, setPageIndex] = useState(0);
const [pageSize, setPageSize] = useState(10);
const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
const paginatedRows = useMemo(
  () => filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
  [filtered, pageIndex, pageSize]
);
```

### SearchSelect

Componente reutilizable en `incidents/_components/SearchSelect.tsx`.
El fetcher debe devolver `{ value: string; label: string }[]`.

### Dialogs (crear/editar)

- Resetear estado del form cuando se cierra: `useEffect(() => { if (!open) setForm(initial); }, [open])`
- Patrón `refreshKey` para refrescar tabla tras crear/editar

### Sheets (detalle)

`SheetContent` con header sticky + body scrollable:
```tsx
<SheetContent className="w-full sm:max-w-3xl p-0 h-dvh flex flex-col">
  <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">...</div>
  <div className="flex-1 overflow-y-auto">...</div>
</SheetContent>
```

### Charts (recharts)

- Usar siempre `<ResponsiveContainer>` con altura fija (no dinámica) para evitar overflow en grids
- En grids de 2 columnas, agregar `items-start` para que las columnas no se estiren: `grid lg:grid-cols-2 lg:items-start`
- `resolutionRate` del backend puede venir como decimal (0.38) o entero (38) — normalizar con: `stats.resolutionRate > 1 ? Math.round(stats.resolutionRate) : Math.round(stats.resolutionRate * 100)`

## Módulo de Incidencias — detalles importantes

- **Tipos válidos**: `HALLAZGO_ANORMAL | INCIDENTE | CONDICION_SUB_ESTANDAR | ACTO_SUB_ESTANDAR`
- **Observado**: usa `observedEmployeeId` (FK a Employee, no a User) — permite seleccionar cualquier empleado aunque no tenga cuenta
- **Búsqueda de observado**: `GET /api/staff/search` → devuelve `{ id: employeeId, label: "Nombre - DNI" }[]`, filtra por rol TRABAJADOR activo
- **Display del observado**: `observedEmployee: { id, nombres, apellidos, dni }` en el detalle
- **Objetivos (subtasks)**: se pueden completar desde `SubtaskSection` (en detalle) y desde `SubtasksReportView` (vista global)

## Módulo de Staff — detalles importantes

- Multi-rol: `StaffRow.roles: RoleDTO[]` y `StaffCreateInput.roleIds: string[]`
- `ROLES_WITH_ACCOUNT = ["ADMIN", "SUPERVISOR", "SEGURIDAD"]` — estos roles crean cuenta de usuario automáticamente. TRABAJADOR no crea cuenta.
- Roles para el select: `GET /api/roles?active=1` → `{ id, name, key }[]`

## Perfil de usuario (`/dashboard/me`)

- Soporta multi-rol: lee `user.roles[]` con fallback a `user.role` (singular)
- `roleKey` efectivo se deriva por prioridad: ADMIN > SUPERVISOR > SEGURIDAD > TRABAJADOR
- El endpoint `GET /api/users/me/profile` debe devolver `user.roles[]`

## Dashboard principal

- Enfocado en incidencias (sistema SST)
- Datos: `GET /api/incidents/stats` devuelve `{ total, byStatus, byType, byPriority, overdue, resolutionRate, avgCloseDays }`
- Incidencias recientes: `GET /api/incidents` (primeras 5)
- Banner de alerta si hay incidencias con status OPEN

## Navegación del sidebar

La navegación se carga dinámicamente desde el backend:
- Endpoint: `GET /api/navigation/sidebar`
- Respuesta: `{ data: NavSectionDTO[] }` con sections > items
- Agregar nuevas páginas al sidebar requiere cambios en el **backend**

## API base

Variable de entorno: `NEXT_PUBLIC_API_URL`

## Idioma

La UI está en **español**. Labels, placeholders, mensajes de error, todo en español.

## Convenciones de código

- Archivos de componentes: PascalCase (`WorkAreasTable.tsx`)
- Archivos de utilidades/tipos: camelCase (`types.ts`, `api.ts`)
- Funciones API: prefijo `api` (`apiListWorkAreas`, `apiCreateDocument`)
- Páginas: siempre `"use client"` en módulos del dashboard
- No usar `"use server"` - toda la comunicación es via fetch al backend externo
- Imports de UI siempre desde `@/components/ui/`
- Imports entre módulos: preferir rutas relativas dentro del módulo (`../_lib/api`)

## Patrón visual preferido (diseño UX)

### Card con sección — bloque base de UI

Usar este patrón para **cualquier sección de contenido** (formularios, detalles, listas):

```tsx
<div className="rounded-xl border bg-card shadow-sm overflow-hidden">
  {/* Header de sección */}
  <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
    {/* Badge numerado (en formularios de pasos) */}
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
      1
    </span>
    <div>
      <p className="text-sm font-semibold leading-none">Título de sección</p>
      <p className="text-xs text-muted-foreground mt-0.5">Descripción breve</p>
    </div>
    {/* Opcional: badge de estado o contador a la derecha */}
    <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      Info
    </span>
  </div>
  {/* Cuerpo */}
  <div className="p-5 space-y-4">
    {/* contenido */}
  </div>
</div>
```

### Cuándo usar badges numerados

En formularios de creación con múltiples secciones, numerar cada paso (①②③) para guiar al usuario.

### Formularios de creación

- Contenedor: `max-w-3xl mx-auto space-y-4 pb-10`
- Cada sección en su propia card con header
- Botón submit **dentro** del último paso, alineado a la derecha
- Labels con `space-y-1.5` entre label e input (no `space-y-1`)
- Inputs: `h-10` en móvil (área táctil), en desktop también `h-10` para consistencia

### Vistas de detalle / recibo

- Mismo patrón de cards por sección (datos, ítems, firma, etc.)
- Contenedor: `max-w-3xl mx-auto` con padding `px-4 py-5 sm:px-6 sm:py-6`
- Sheet para paneles de detalle: `!w-full !max-w-full` (full-screen, no panel lateral estrecho)

### Tablas

- Envolver en card: `rounded-xl border bg-card shadow-sm overflow-hidden`
- Filtros dentro del header de la card (`border-b bg-muted/30 px-5 py-4`)
- La tabla ocupa el cuerpo sin padding adicional
- Paginación fuera de la card, debajo

### Diseño responsive

- Mobile-first: inputs y botones `h-10` (44px área táctil mínima)
- `flex-col sm:flex-row` para barras de filtros
- Columnas de tabla: ocultar las menos importantes en móvil con `hidden sm:table-cell`, `hidden md:table-cell`
- Stats cards: `grid-cols-3` siempre (no colapsar a 1 columna en móvil)
