@AGENTS.md

# mvp_admin — Lineamientos para agentes IA

Panel administrativo (Next.js App Router + shadcn/ui). Antes de generar código nuevo, sigue los patrones **reales** de este repo — no introduzcas librerías o abstracciones que no estén ya en uso, aunque estén instaladas.

## Stack

Next.js App Router · React 19 · Tailwind CSS v4 · shadcn/ui · SWR · Sonner (toasts) · Lucide icons.

`react-hook-form` y `zod` están en `package.json` pero **no se usan** — todos los formularios son `useState` plano. No los introduzcas en código nuevo sin discutirlo primero; mezclar dos patrones de formularios en el mismo repo es peor que no tener validación de esquema.

## Estructura

- `src/app/(dashboard)/<feature>/` — `page.tsx` (listado), `nuevo/page.tsx` (crear), `[id]/page.tsx` (editar). Sub-recursos anidados: `empresas/[id]/usuarios/`.
- `src/app/(auth)/` — login.
- `src/components/<feature>/` — componentes de esa sección (`UsuarioForm.tsx`, `EmpresaForm.tsx`, etc.), PascalCase.
- `src/components/ui/` — primitivas shadcn (lowercase: `button.tsx`, `table.tsx`) + custom compartidos (`Banner.tsx`, `LockButton.tsx`, PascalCase).
- `src/lib/` — `api.ts` (cliente HTTP), `auth.ts` (sesión), `permissions.ts` (catálogo de permisos), `notify.ts` (wrapper de Sonner), `utils.ts` (`cn()`).
- No hay `/types` ni `/hooks` — los tipos van co-ubicados como `interface` en el mismo archivo del componente que los usa.

## Patrón canónico: tabla/listado

Referencia: [`src/app/(dashboard)/usuarios/page.tsx`](src/app/(dashboard)/usuarios/page.tsx) y [`src/app/(dashboard)/empresas/page.tsx`](src/app/(dashboard)/empresas/page.tsx). Toda tabla nueva debe replicar esta estructura:

```tsx
<div className="flex flex-col gap-6">
  {/* Header */}
  <div className="flex items-center justify-between gap-3">
    <div>
      <h1 className="text-xl md:text-2xl font-semibold">Título</h1>
      <p className="text-sm text-muted-foreground mt-0.5">Subtítulo</p>
    </div>
    {/* botón de acción principal, si aplica */}
  </div>

  {/* Filtros (opcional), en card */}
  <div className="rounded-xl border bg-card p-4 flex flex-wrap gap-3 items-end">...</div>

  {isLoading ? (
    <div>Cargando…</div>
  ) : (
    <>
      {/* Desktop: shadcn Table */}
      <Table className="hidden md:block">...</Table>
      {/* Mobile: cards, md:hidden */}
      <div className="md:hidden">...</div>
      {/* Paginación, si aplica */}
    </>
  )}
</div>
```

Reglas fijas:
- Fetch con `useSWR(url, swrFetcher)` de `lib/api.ts`. No uses `fetch()` directo ni introduzcas TanStack Query.
- Toda tabla necesita **vista dual**: tabla en desktop (`hidden md:block`) + cards en mobile (`md:hidden`). No dejes una tabla solo-desktop sin la alternativa mobile.
- Empty state: `<TableCell colSpan={N}>` centrado con mensaje, dentro del `<TableBody>` — no un `<div>` separado fuera de la tabla.
- Loading: texto simple `"Cargando…"`, no skeletons.
- Paginación manual con `useState` de página + botones prev/next (ver `empresas/page.tsx`), no libs de paginación.
- Breadcrumbs en páginas de detalle/edición: `Link` + `ChevronRight` (lucide) + texto actual.

## Patrón canónico: formularios

Referencia: [`src/components/usuarios/UsuarioForm.tsx`](src/components/usuarios/UsuarioForm.tsx) y [`src/components/empresas/EmpresaForm.tsx`](src/components/empresas/EmpresaForm.tsx).

- `useState` por campo (o un objeto de formulario), **no** `react-hook-form`.
- Validación: atributo HTML `required` + validación de servidor. Errores de servidor (409, etc.) se mapean a `fieldErrors: Record<string, string>` mostrados debajo del campo con `className={fieldErrors.x ? 'border-destructive focus-visible:ring-destructive' : ''}`.
- Error general del formulario: banner `<Banner variant="error">` arriba, no alert().
- Estado `saving` booleano que deshabilita todos los botones durante el submit.
- Éxito: `toast.success(...)` (via `notify.ts`) + `router.push(...)`. Cancelar: `router.back()`.
- Secciones dentro de un form largo: `<section className="flex flex-col gap-4">` con `<h2 className="font-medium text-base border-b pb-2">`.
- Formularios son **páginas completas** (`nuevo/page.tsx`, `[id]/page.tsx`), no diálogos modales, salvo para acciones puntuales (ver `BicSearchModal` como ejemplo de modal aceptable para búsquedas auxiliares).

## Cliente API

Todo fetch pasa por [`src/lib/api.ts`](src/lib/api.ts):
- `adminFetch<T>(path, init?)` — agrega `Authorization: Bearer` desde `getToken()`, maneja refresh automático en 401 (dedupe con `_inflightRefresh`), lanza `ApiError(status, message, data?)`.
- `swrFetcher = (path) => adminFetch(path)` para usar con `useSWR`.
- Captura errores con `catch (err) { err instanceof ApiError ? err.message : 'Error desconocido' }`.

No crear un segundo cliente HTTP ni usar `axios`.

## Componentes compartidos existentes

Antes de crear un componente nuevo, revisa si ya existe:
- `Banner` — alertas inline (error/warning/info, dismissible).
- `LockButton` — bloqueo/desbloqueo de usuario con estado.
- `Sparkline` (`components/empresas/`) — mini gráfico de línea.
- `StatCard` (`components/ui/StatCard.tsx`) — icono + número + label, variantes de color vía `COLOR_MAP`.
- `PingStatus` (`components/ui/PingStatus.tsx`) — indicador de estado de conexión (icono + texto + "hace X").

Antes de declarar una función de presentación local dentro de un `page.tsx` (como se hacía antes con `StatCard`/`PingStatus`), revisa si ya existe en `components/ui/` o en la carpeta de la feature correspondiente.

## Naming

- Componentes: PascalCase (`UsuarioForm.tsx`). Shadcn primitives: lowercase (`button.tsx`).
- Handlers: `handle<Acción>` (`handleSave`, `handleToggleLock`). Setters: `set<Campo>`.
- Interfaces PascalCase, nombradas como la entidad (`CompanyData`, `PortalUserData`).

## Estilo

Tailwind v4 puro + variables CSS de shadcn (`bg-primary`, `text-muted-foreground`, `ring-destructive`). No uses `style={{ }}` con colores hardcodeados — para eso están las variables de tema. Breakpoint estándar `md:` para el cambio tabla↔cards.

## Flujo de ramas / Deployment

Cuatro ramas de larga vida, cada una desplegada a su propio Azure App Service (mismo esquema en `mvp_api`, `mvp_app` y `mvp_admin`):

- **`develop`** — rama de integración. Todo trabajo nuevo (feature branches, fixes) se mergea aquí primero. No dispara un deploy a un ambiente compartido — es donde se prueba localmente (levantar el server, click-through real de la feature) antes de pasar a QA.
- **`qa`** — ambiente de QA. Se llega solo vía PR desde `develop`, después de haber probado el merge localmente.
- **`staging`** — ambiente de staging. Se promueve desde `qa` una vez validado ahí.
- **`main`** — producción.

Flujo esperado: rama de feature → merge a `develop` → probar localmente → PR de `develop` a `qa` → validar en QA → promover a `staging` → promover a `main`.

No mergees directo a `qa`/`staging`/`main` sin pasar por `develop` primero, salvo un fix puntual ya validado que toca un solo archivo aislado (y aun así, refléjalo también en `develop` para que no diverja).
