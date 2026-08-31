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
  billing_facturadores: {
    label: '🧑‍💼 Facturadores',
    perms: [
      { code: 'billing.facturadores.create', label: 'Crear perfil de facturador' },
      { code: 'billing.facturadores.edit',   label: 'Editar perfil de facturador' },
      { code: 'billing.facturadores.delete', label: 'Eliminar perfil de facturador' },
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
      { code: 'inventory.warehouses.users.view',   label: 'Ver empleados asignados a bodegas' },
      { code: 'inventory.warehouses.users.assign', label: 'Asignar empleado a una bodega' },
      { code: 'inventory.warehouses.users.remove', label: 'Quitar empleado de una bodega' },
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
  inventory_purchases: {
    label: '🛒 Compras',
    perms: [
      { code: 'inventory.purchases.create',  label: 'Crear compras' },
      { code: 'inventory.purchases.edit',    label: 'Editar compras' },
      { code: 'inventory.purchases.delete',  label: 'Eliminar compras' },
      { code: 'inventory.purchases.approve', label: 'Aprobar compras' },
      { code: 'inventory.purchases.receive', label: 'Recibir compras' },
    ],
  },
  // Catálogos Generales
  general: {
    label: '🗂️ Catálogos Generales',
    perms: [
      { code: 'general.access', label: 'Acceso al módulo' },
    ],
  },
  general_branches: {
    label: '🏬 Sucursales',
    perms: [
      { code: 'general.branches.create', label: 'Crear sucursales' },
      { code: 'general.branches.edit',   label: 'Editar sucursales' },
      { code: 'general.branches.delete', label: 'Eliminar sucursales' },
      { code: 'general.branches.users.view',   label: 'Ver empleados asignados a sucursales' },
      { code: 'general.branches.users.assign', label: 'Asignar empleado a una sucursal' },
      { code: 'general.branches.users.remove', label: 'Quitar empleado de una sucursal' },
    ],
  },
  general_departments: {
    label: '🏢 Departamentos',
    perms: [
      { code: 'general.departments.create', label: 'Crear departamentos' },
      { code: 'general.departments.edit',   label: 'Editar departamentos' },
      { code: 'general.departments.delete', label: 'Eliminar departamentos' },
      { code: 'general.departments.users.view',   label: 'Ver empleados asignados a departamentos' },
      { code: 'general.departments.users.assign', label: 'Asignar empleado a un departamento' },
      { code: 'general.departments.users.remove', label: 'Quitar empleado de un departamento' },
    ],
  },
  general_countries: {
    label: '🌎 Países',
    perms: [
      { code: 'general.countries.create', label: 'Crear países' },
      { code: 'general.countries.edit',   label: 'Editar países' },
      { code: 'general.countries.delete', label: 'Eliminar países' },
    ],
  },
  general_cost_centers: {
    label: '💰 Centros de Costo',
    perms: [
      { code: 'general.cost-centers.create', label: 'Crear centros de costo' },
      { code: 'general.cost-centers.edit',   label: 'Editar centros de costo' },
      { code: 'general.cost-centers.delete', label: 'Eliminar centros de costo' },
    ],
  },
  general_currencies: {
    label: '💵 Monedas',
    perms: [
      { code: 'general.currencies.create', label: 'Crear monedas' },
      { code: 'general.currencies.edit',   label: 'Editar monedas' },
      { code: 'general.currencies.delete', label: 'Eliminar monedas' },
    ],
  },
  general_languages: {
    label: '🌐 Idiomas',
    perms: [
      { code: 'general.languages.create', label: 'Crear idiomas' },
      { code: 'general.languages.edit',   label: 'Editar idiomas' },
      { code: 'general.languages.delete', label: 'Eliminar idiomas' },
    ],
  },
  general_zones: {
    label: '📍 Zonas',
    perms: [
      { code: 'general.zones.create', label: 'Crear zonas' },
      { code: 'general.zones.edit',   label: 'Editar zonas' },
      { code: 'general.zones.delete', label: 'Eliminar zonas' },
    ],
  },
  general_professions: {
    label: '🎓 Profesiones',
    perms: [
      { code: 'general.professions.create', label: 'Crear profesiones' },
      { code: 'general.professions.edit',   label: 'Editar profesiones' },
      { code: 'general.professions.delete', label: 'Eliminar profesiones' },
    ],
  },
  general_education_levels: {
    label: '📚 Niveles de Educación',
    perms: [
      { code: 'general.education-levels.create', label: 'Crear niveles de educación' },
      { code: 'general.education-levels.edit',   label: 'Editar niveles de educación' },
      { code: 'general.education-levels.delete', label: 'Eliminar niveles de educación' },
    ],
  },
  general_trades: {
    label: '🛠️ Oficios',
    perms: [
      { code: 'general.trades.create', label: 'Crear oficios' },
      { code: 'general.trades.edit',   label: 'Editar oficios' },
      { code: 'general.trades.delete', label: 'Eliminar oficios' },
    ],
  },
  general_socioeconomic_sectors: {
    label: '📊 Sectores Socioeconómicos',
    perms: [
      { code: 'general.socioeconomic-sectors.create', label: 'Crear sectores socioeconómicos' },
      { code: 'general.socioeconomic-sectors.edit',   label: 'Editar sectores socioeconómicos' },
      { code: 'general.socioeconomic-sectors.delete', label: 'Eliminar sectores socioeconómicos' },
    ],
  },
  general_brands: {
    label: '🏷️ Marcas y Modelos',
    perms: [
      { code: 'general.brands.create',        label: 'Crear marcas' },
      { code: 'general.brands.delete',        label: 'Eliminar marcas' },
      { code: 'general.brands.models.create', label: 'Crear modelos' },
      { code: 'general.brands.models.edit',   label: 'Editar (renombrar) modelos' },
      { code: 'general.brands.models.delete', label: 'Eliminar modelos' },
    ],
  },
  general_geo_locations: {
    label: '🗺️ Ubicación Geográfica',
    perms: [
      { code: 'general.geo-locations.create',       label: 'Crear departamentos/municipios/ciudades' },
      { code: 'general.geo-locations.edit',          label: 'Editar departamentos/municipios/ciudades' },
      { code: 'general.geo-locations.delete',        label: 'Eliminar departamentos/municipios/ciudades' },
      { code: 'general.geo-locations.labels.edit',   label: 'Cambiar nombre de los niveles de ubicación' },
    ],
  },
  general_comm_equipment_params: {
    label: '📡 Parámetros de Comunicación de Equipos',
    perms: [
      { code: 'general.comm-equipment-params.create', label: 'Crear parámetros de comunicación' },
      { code: 'general.comm-equipment-params.edit',   label: 'Editar parámetros de comunicación' },
      { code: 'general.comm-equipment-params.delete', label: 'Eliminar parámetros de comunicación' },
    ],
  },
  general_shipping_methods: {
    label: '🚢 Métodos de Embarque',
    perms: [
      { code: 'general.shipping-methods.create', label: 'Crear métodos de embarque' },
      { code: 'general.shipping-methods.edit',   label: 'Editar métodos de embarque' },
      { code: 'general.shipping-methods.delete', label: 'Eliminar métodos de embarque' },
    ],
  },
  general_calendars: {
    label: '📅 Calendarios',
    perms: [
      { code: 'general.calendars.create', label: 'Crear calendarios y sus fechas' },
      { code: 'general.calendars.edit',   label: 'Editar calendarios y sus fechas' },
      { code: 'general.calendars.delete', label: 'Eliminar calendarios y sus fechas' },
    ],
  },
  general_routes: {
    label: '🛣️ Rutas',
    perms: [
      { code: 'general.routes.create', label: 'Crear rutas' },
      { code: 'general.routes.edit',   label: 'Editar rutas' },
      { code: 'general.routes.delete', label: 'Eliminar rutas' },
    ],
  },
  general_cost_center_groups: {
    label: '🗂️ Grupos de Centro de Costo',
    perms: [
      { code: 'general.cost-center-groups.create', label: 'Crear grupos de centro de costo' },
      { code: 'general.cost-center-groups.edit',   label: 'Editar grupos de centro de costo' },
      { code: 'general.cost-center-groups.delete', label: 'Eliminar grupos de centro de costo' },
    ],
  },
  general_process_areas: {
    label: '🧭 Área de Proceso Empleado',
    perms: [
      { code: 'general.process-areas.create', label: 'Crear áreas de proceso' },
      { code: 'general.process-areas.edit',   label: 'Editar áreas de proceso' },
      { code: 'general.process-areas.delete', label: 'Eliminar áreas de proceso' },
    ],
  },
  general_destination_units: {
    label: '📦 Unidad de Destino',
    perms: [
      { code: 'general.destination-units.create', label: 'Crear unidades de destino' },
      { code: 'general.destination-units.edit',   label: 'Editar unidades de destino' },
      { code: 'general.destination-units.delete', label: 'Eliminar unidades de destino' },
    ],
  },
  general_expense_types: {
    label: '🧾 Tipos de Gasto',
    perms: [
      { code: 'general.expense-types.create', label: 'Crear tipos de gasto' },
      { code: 'general.expense-types.edit',   label: 'Editar tipos de gasto' },
      { code: 'general.expense-types.delete', label: 'Eliminar tipos de gasto' },
    ],
  },
  general_taxes: {
    label: '💰 Impuestos',
    perms: [
      { code: 'general.taxes.create', label: 'Crear impuestos' },
      { code: 'general.taxes.edit',   label: 'Editar impuestos' },
      { code: 'general.taxes.delete', label: 'Eliminar impuestos' },
    ],
  },
  general_tax_rates: {
    label: '📐 Tarifas de Impuestos',
    perms: [
      { code: 'general.tax-rates.create', label: 'Crear tarifas de impuestos' },
      { code: 'general.tax-rates.edit',   label: 'Editar tarifas de impuestos' },
      { code: 'general.tax-rates.delete', label: 'Eliminar tarifas de impuestos' },
    ],
  },
  general_tax_exemptions: {
    label: '📄 Exoneraciones de Impuesto',
    perms: [
      { code: 'general.tax-exemptions.create', label: 'Crear exoneraciones de impuesto' },
      { code: 'general.tax-exemptions.edit',   label: 'Editar exoneraciones de impuesto' },
      { code: 'general.tax-exemptions.delete', label: 'Eliminar exoneraciones de impuesto' },
    ],
  },
  // Logística y Despacho
  logistics: {
    label: '🚚 Logística y Despacho',
    perms: [
      { code: 'logistics.access', label: 'Acceso al módulo' },
    ],
  },
  logistics_freight: {
    label: '💰 Fletes',
    perms: [
      { code: 'logistics.freight.create', label: 'Crear fletes' },
      { code: 'logistics.freight.edit',   label: 'Editar fletes' },
      { code: 'logistics.freight.delete', label: 'Eliminar fletes' },
    ],
  },
  logistics_trucks: {
    label: '🚛 Camiones',
    perms: [
      { code: 'logistics.trucks.create', label: 'Crear camiones' },
      { code: 'logistics.trucks.edit',   label: 'Editar camiones' },
      { code: 'logistics.trucks.delete', label: 'Eliminar camiones' },
    ],
  },
  logistics_carriers: {
    label: '🧑‍✈️ Transportistas',
    perms: [
      { code: 'logistics.carriers.create', label: 'Crear transportistas' },
      { code: 'logistics.carriers.edit',   label: 'Editar transportistas' },
      { code: 'logistics.carriers.delete', label: 'Eliminar transportistas' },
    ],
  },
  logistics_origins: {
    label: '📍 Origen y Destinos',
    perms: [
      { code: 'logistics.origins.create', label: 'Crear orígenes y destinos' },
      { code: 'logistics.origins.edit',   label: 'Editar orígenes y destinos' },
      { code: 'logistics.origins.delete', label: 'Eliminar orígenes y destinos' },
    ],
  },
  logistics_carrier_price_lists: {
    label: '📋 Lista de Precios de Transportista',
    perms: [
      { code: 'logistics.carrier-price-lists.create', label: 'Crear listas de precios' },
      { code: 'logistics.carrier-price-lists.edit',   label: 'Editar listas de precios' },
      { code: 'logistics.carrier-price-lists.delete', label: 'Eliminar listas de precios' },
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
  // BIC -- Base de Información Central: identidad base (persona/entidad) de la que
  // luego se derivan Clientes, Vendedores, Cobradores, Cajeros, Proveedores, etc.
  bic: {
    label: '🪪 Base de Información Central',
    perms: [
      { code: 'bic.access', label: 'Acceso al módulo' },
      { code: 'bic.view',   label: 'Ver base de información central' },
      { code: 'bic.create', label: 'Crear BIC' },
      { code: 'bic.edit',   label: 'Editar BIC' },
    ],
  },
  // BIC -- Vendedores: extiende un BIC ya existente con el rol Vendedor (VENDEDOR_TABLA).
  bic_vendedores: {
    label: '🧑‍💼 BIC · Vendedores',
    perms: [
      { code: 'bic.vendedores.create', label: 'Registrar BIC como vendedor' },
      { code: 'bic.vendedores.edit',   label: 'Editar datos de vendedor' },
    ],
  },
  // BIC -- Cajeros: extiende un BIC ya existente con el rol Cajero (CAJERO_TABLA).
  bic_cajeros: {
    label: '🧾 BIC · Cajeros',
    perms: [
      { code: 'bic.cajeros.create', label: 'Registrar BIC como cajero' },
      { code: 'bic.cajeros.edit',   label: 'Editar datos de cajero' },
    ],
  },
  // BIC -- Cobradores: extiende un BIC ya existente con el rol Cobrador (COBRADOR_TABLA).
  bic_cobradores: {
    label: '💰 BIC · Cobradores',
    perms: [
      { code: 'bic.cobradores.create', label: 'Registrar BIC como cobrador' },
      { code: 'bic.cobradores.edit',   label: 'Editar datos de cobrador' },
    ],
  },
  // BIC -- Técnicos: extiende un BIC ya existente con el rol Técnico (TECNICO_TABLA).
  bic_tecnicos: {
    label: '🔧 BIC · Técnicos',
    perms: [
      { code: 'bic.tecnicos.create', label: 'Registrar BIC como técnico' },
      { code: 'bic.tecnicos.edit',   label: 'Editar datos de técnico' },
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
  { key: 'facturacion',   label: 'Facturación',         modules: ['billing', 'billing_facturadores', 'cai'] },
  { key: 'ventas',        label: 'Ventas y caja',       modules: ['pos_config', 'pos', 'cashbox_config', 'cashbox'] },
  { key: 'inventario',    label: 'Inventario', modules: [
    'inventory', 'inventory_warehouses', 'inventory_types', 'inventory_packages',
    'inventory_units', 'inventory_articles', 'inventory_groupings', 'inventory_transfers',
    'inventory_requisitions', 'inventory_purchases',
  ] },
  { key: 'contabilidad',  label: 'Contabilidad',         modules: ['accounting'] },
  { key: 'personal',      label: 'Personal y clientes', modules: ['staff', 'customers'] },
  { key: 'generales',     label: 'Catálogos Generales', modules: ['general', 'general_branches', 'general_departments', 'general_countries', 'general_cost_centers', 'general_currencies', 'general_languages', 'general_zones', 'general_professions', 'general_education_levels', 'general_trades', 'general_socioeconomic_sectors', 'general_brands', 'general_geo_locations', 'general_comm_equipment_params', 'general_shipping_methods', 'general_calendars', 'general_routes', 'general_expense_types', 'general_cost_center_groups', 'general_process_areas', 'general_destination_units', 'general_taxes', 'general_tax_rates', 'general_tax_exemptions', 'logistics', 'logistics_freight', 'logistics_trucks', 'logistics_carriers', 'logistics_origins', 'logistics_carrier_price_lists'] },
  { key: 'bic',           label: 'Base de Información Central', modules: ['bic', 'bic_vendedores', 'bic_cajeros', 'bic_cobradores', 'bic_tecnicos'] },
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
  bic:        ['bic'],
};
