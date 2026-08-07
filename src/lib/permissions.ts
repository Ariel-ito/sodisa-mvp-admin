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
  // Cajas -- operación diaria del cajero (abrir/cerrar SU caja), no el catálogo de cajas
  // que existen ni quién puede usarlas (ver cashbox_config).
  cashbox: {
    label: '🧾 Cajas (Cajero)',
    perms: [
      { code: 'cashbox.access', label: 'Acceso al módulo' },
      { code: 'cashbox.open',   label: 'Abrir caja' },
      { code: 'cashbox.close',  label: 'Cerrar caja' },
      { code: 'cashbox.audit',  label: 'Auditar cierre' },
    ],
  },
  // Cajas -- administración: qué cajas existen y qué empleados pueden operarlas.
  // Es la contraparte de "Cajas (Cajero)" -- alguien de administración configura esto,
  // el cajero solo abre/cierra la caja que ya le asignaron aquí.
  cashbox_config: {
    label: '⚙️ Cajas (Configuración)',
    perms: [
      { code: 'cashbox.catalog.view',   label: 'Ver catálogo de cajas' },
      { code: 'cashbox.catalog.create', label: 'Crear caja' },
      { code: 'cashbox.catalog.edit',   label: 'Editar caja' },
      { code: 'cashbox.catalog.delete', label: 'Eliminar caja' },
      { code: 'cashbox.users.view',    label: 'Ver empleados asignados a cajas' },
      { code: 'cashbox.users.assign',  label: 'Asignar empleado a una caja' },
      { code: 'cashbox.users.remove',  label: 'Quitar empleado de una caja' },
    ],
  },
  // Punto de Venta -- operación diaria del cajero/vendedor (vender, usar el PDV que
  // ya le asignaron), no el catálogo de puntos de venta (ver pos_config).
  pos: {
    label: '🖥️ Punto de Venta (Cajero)',
    perms: [
      { code: 'pos.access',    label: 'Acceso al módulo' },
      { code: 'pos.sell',      label: 'Realizar ventas' },
      { code: 'pos.configure', label: 'Configurar PDV' },
    ],
  },
  // Punto de Venta -- administración: qué puntos de venta existen y qué empleados
  // pueden facturar/vender desde cada uno.
  pos_config: {
    label: '⚙️ Punto de Venta (Configuración)',
    perms: [
      { code: 'pos.catalog.view',   label: 'Ver catálogo de puntos de venta' },
      { code: 'pos.catalog.create', label: 'Crear punto de venta' },
      { code: 'pos.catalog.edit',   label: 'Editar punto de venta' },
      { code: 'pos.catalog.delete', label: 'Eliminar punto de venta' },
      { code: 'pos.users.view',    label: 'Ver empleados asignados a puntos de venta' },
      { code: 'pos.users.assign',  label: 'Asignar empleado a un punto de venta' },
      { code: 'pos.users.remove',  label: 'Quitar empleado de un punto de venta' },
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
  // Inventario
  inventory: {
    label: '📦 Inventario',
    perms: [
      { code: 'inventory.access', label: 'Acceso al módulo' },
    ],
  },
  inventory_warehouses: {
    label: '🏢 Bodegas',
    perms: [
      { code: 'inventory.warehouses.create', label: 'Crear bodegas' },
      { code: 'inventory.warehouses.edit',   label: 'Editar bodegas' },
      { code: 'inventory.warehouses.delete', label: 'Eliminar bodegas' },
    ],
  },
  inventory_types: {
    label: '📋 Tipos de inventario',
    perms: [
      { code: 'inventory.types.create', label: 'Crear tipos de inventario' },
      { code: 'inventory.types.edit',   label: 'Editar tipos de inventario' },
      { code: 'inventory.types.delete', label: 'Eliminar tipos de inventario' },
    ],
  },
  inventory_packages: {
    label: '📦 Empaques',
    perms: [
      { code: 'inventory.packages.create', label: 'Crear empaques' },
      { code: 'inventory.packages.edit',   label: 'Editar empaques' },
      { code: 'inventory.packages.delete', label: 'Eliminar empaques' },
    ],
  },
  inventory_units: {
    label: '📐 Unidades de medida',
    perms: [
      { code: 'inventory.units.create', label: 'Crear unidades de medida' },
      { code: 'inventory.units.edit',   label: 'Editar unidades de medida' },
      { code: 'inventory.units.delete', label: 'Eliminar unidades de medida' },
    ],
  },
  inventory_articles: {
    label: '🗂️ Artículos de inventario',
    perms: [
      { code: 'inventory.articles.create', label: 'Crear artículos' },
      { code: 'inventory.articles.edit',   label: 'Editar artículos' },
      { code: 'inventory.articles.delete', label: 'Desactivar artículos' },
    ],
  },
  inventory_groupings: {
    label: '🏷️ Agrupaciones de artículo',
    perms: [
      { code: 'inventory.groupings.create', label: 'Crear agrupaciones y opciones' },
      { code: 'inventory.groupings.edit',   label: 'Editar agrupaciones y opciones' },
      { code: 'inventory.groupings.delete', label: 'Eliminar agrupaciones y opciones' },
    ],
  },
  inventory_transfers: {
    label: '🔄 Transferencias de Inventario',
    perms: [
      { code: 'inventory.transfers.create',  label: 'Crear transferencias' },
      { code: 'inventory.transfers.edit',    label: 'Editar transferencias' },
      { code: 'inventory.transfers.delete',  label: 'Eliminar transferencias' },
      { code: 'inventory.transfers.approve', label: 'Aprobar transferencias' },
      { code: 'inventory.transfers.receive', label: 'Recibir transferencias' },
    ],
  },
  inventory_requisitions: {
    label: '📝 Requisiciones de Inventario',
    perms: [
      { code: 'inventory.requisitions.create',  label: 'Crear requisiciones' },
      { code: 'inventory.requisitions.edit',    label: 'Editar requisiciones' },
      { code: 'inventory.requisitions.delete',  label: 'Eliminar requisiciones' },
      { code: 'inventory.requisitions.approve', label: 'Aprobar requisiciones' },
      { code: 'inventory.requisitions.receive', label: 'Recibir requisiciones' },
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
  // CAI -- códigos de permiso siguen bajo el prefijo "accounting." (no se tocan), pero
  // visualmente vive con Facturación (ver PERMISSION_CATEGORIES): es configuración fiscal
  // de facturación, no contabilidad del día a día.
  cai: {
    label: '🧾 CAI',
    perms: [
      { code: 'accounting.cai.view',   label: 'Ver declaraciones CAI' },
      { code: 'accounting.cai.create', label: 'Crear declaración/establecimiento/punto/documento CAI' },
      { code: 'accounting.cai.edit',   label: 'Editar CAI y activar rangos' },
      { code: 'accounting.cai.delete', label: 'Eliminar CAI' },
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

/** [clave, módulo] para poder ir de categoría → módulo sin perder la clave del objeto */
export const PERMISSION_MODULE_ENTRIES = Object.entries(PERMISSIONS);

/**
 * Agrupación puramente visual de los módulos en categorías, para no mostrar las
 * ~17 tarjetas de módulo todas a la vez (ver PermisosGrid). No afecta los permission
 * codes ni cómo se guardan -- solo cómo se organizan en la UI de asignación.
 */
export const PERMISSION_CATEGORIES = [
  { key: 'facturacion',   label: 'Facturación',         modules: ['billing', 'cai'] },
  { key: 'ventas',        label: 'Ventas y caja',       modules: ['pos_config', 'pos', 'cashbox_config', 'cashbox'] },
  { key: 'inventario',    label: 'Inventario', modules: [
    'inventory', 'inventory_warehouses', 'inventory_types', 'inventory_packages',
    'inventory_units', 'inventory_articles', 'inventory_groupings', 'inventory_transfers',
    'inventory_requisitions',
  ] },
  { key: 'contabilidad',  label: 'Contabilidad',         modules: ['accounting'] },
  { key: 'personal',      label: 'Personal y clientes', modules: ['staff', 'customers'] },
  { key: 'reportes',      label: 'Reportes',             modules: ['statistics'] },
  { key: 'escuela',       label: 'Horarios escolares',   modules: ['scheduling'] },
] as const;

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
  inventory:  ['inventory'],
};
