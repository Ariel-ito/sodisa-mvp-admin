/** Catálogo completo de permission codes del sistema */
export const PERMISSIONS = {
  // Facturación
  billing: {
    label: '📄 Facturación',
    perms: [
      { code: 'billing.access',  label: 'Acceso al módulo' },
      { code: 'billing.view',    label: 'Ver lista de facturas' },
      { code: 'billing.create',  label: 'Crear facturas' },
      { code: 'billing.edit',    label: 'Editar facturas' },
      { code: 'billing.apply',   label: 'Aplicar facturas' },
      { code: 'billing.print',   label: 'Imprimir facturas' },
      { code: 'billing.cancel',  label: 'Anular facturas' },
      { code: 'billing.reverse', label: 'Reversar facturas' },
    ],
  },
  // Insights
  statistics: {
    label: '📊 Insights',
    perms: [
      { code: 'statistics.access',    label: 'Acceso al módulo' },
      { code: 'statistics.summary',   label: 'Ver resumen general' },
      { code: 'statistics.sales',     label: 'Ver por ventas' },
      { code: 'statistics.customers', label: 'Ver por clientes' },
      { code: 'statistics.articles',  label: 'Ver por artículos' },
    ],
  },
  // Cajas
  cashbox: {
    label: '🧾 Cajas',
    perms: [
      { code: 'cashbox.access', label: 'Acceso al módulo' },
      { code: 'cashbox.open',   label: 'Abrir caja' },
      { code: 'cashbox.close',  label: 'Cerrar caja' },
      { code: 'cashbox.audit',  label: 'Auditar cierre' },
    ],
  },
  // Punto de Venta
  pos: {
    label: '🖥️ Punto de Venta',
    perms: [
      { code: 'pos.access',    label: 'Acceso al módulo' },
      { code: 'pos.sell',      label: 'Realizar ventas' },
      { code: 'pos.configure', label: 'Configurar PDV' },
    ],
  },
  // Artículos
  articles: {
    label: '📦 Artículos',
    perms: [
      { code: 'articles.access', label: 'Acceso al módulo' },
      { code: 'articles.view',   label: 'Ver artículos' },
      { code: 'articles.create', label: 'Crear artículos' },
      { code: 'articles.edit',   label: 'Editar artículos' },
      { code: 'articles.delete', label: 'Eliminar artículos' },
    ],
  },
  // Clientes
  customers: {
    label: '👥 Clientes',
    perms: [
      { code: 'customers.access', label: 'Acceso al módulo' },
      { code: 'customers.view',   label: 'Ver clientes' },
      { code: 'customers.create', label: 'Crear clientes' },
      { code: 'customers.edit',   label: 'Editar clientes' },
    ],
  },
  // Bodegas
  warehouses: {
    label: '🏢 Bodegas',
    perms: [
      { code: 'warehouses.access', label: 'Acceso al módulo' },
      { code: 'warehouses.view',   label: 'Ver bodegas' },
      { code: 'warehouses.manage', label: 'Gestionar bodegas' },
    ],
  },
  // Personal
  staff: {
    label: '👔 Personal',
    perms: [
      { code: 'staff.access', label: 'Acceso al módulo' },
      { code: 'staff.view',   label: 'Ver personal' },
      { code: 'staff.manage', label: 'Gestionar personal' },
    ],
  },
  // Contabilidad
  accounting: {
    label: '📒 Contabilidad',
    perms: [
      { code: 'accounting.periods',        label: 'Ver periodos contables' },
      { code: 'accounting.periods.create', label: 'Crear periodo' },
      { code: 'accounting.periods.edit',   label: 'Editar periodo' },
      { code: 'accounting.periods.delete', label: 'Eliminar periodo' },
    ],
  },
  // Horarios Escolares
  scheduling: {
    label: '🏫 Horarios Escolares',
    perms: [
      { code: 'scheduling.access',    label: 'Acceso al módulo' },
      { code: 'scheduling.configure', label: 'Configurar jornadas y maestros' },
      { code: 'scheduling.view',      label: 'Ver horarios' },
      { code: 'scheduling.generate',  label: 'Generar horarios' },
      { code: 'scheduling.edit',      label: 'Editar borradores' },
      { code: 'scheduling.approve',   label: 'Aprobar borradores' },
      { code: 'scheduling.publish',   label: 'Publicar horario oficial' },
    ],
  },
} as const;

export type PermissionCode = string;

/** Array plano de todos los módulos para iterar en el grid */
export const PERMISSION_MODULES = Object.values(PERMISSIONS);

/** Roles legacy del sistema */
export const LEGACY_ROLES = [
  { name: 'vendedor',  label: 'Vendedor' },
  { name: 'cajero',    label: 'Cajero' },
  { name: 'gerente',   label: 'Gerente' },
  { name: 'cobrador',  label: 'Cobrador' },
  { name: 'soporte',   label: 'Soporte' },
  { name: 'viewer',    label: 'Visualizador' },
] as const;

/** Mapa plano de code → label para lookup rápido */
export const PERMISSION_LABEL_MAP: Record<string, string> = Object.fromEntries(
  Object.values(PERMISSIONS).flatMap(m => m.perms.map(p => [p.code, p.label]))
);

/**
 * Mapeo de módulos de empresa (company_modules) → prefijos de módulos de permisos.
 * Si una empresa tiene un módulo activo, se muestran solo los grupos de permisos
 * correspondientes en el grid de edición de usuario.
 * Si la empresa no tiene módulos configurados → se muestran todos.
 */
export const COMPANY_MODULE_MAP: Record<string, string[]> = {
  billing:    ['billing'],
  pos:        ['pos', 'cashbox'],
  stats:      ['statistics'],
  scheduling: ['scheduling'],
  accounting: ['accounting'],
};
