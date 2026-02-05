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
│   │   └── me/              # Perfil de usuario
│   └── ...
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── app-sidebar.tsx      # Sidebar principal (nav dinámica desde API)
│   └── nav-main.tsx         # Navegación con secciones colapsables
├── context/
│   └── AppContext.tsx        # Auth context (useWord)
└── lib/
    └── utils.ts             # cn() helper
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

### Autenticación y roles

```tsx
const { user, loadingUser } = useWord(); // de @/context/AppContext
const roleKey = (user as any)?.role?.key ?? "";
// Roles: "ADMIN" | "SUPERVISOR" | "TRABAJADOR" | "SEGURIDAD"
const isAdmin = !loadingUser && roleKey === "ADMIN";
```

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
