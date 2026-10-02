'use client';

/**
 * Diseñador visual (GrapesJS) de plantillas de factura RECOMENDADAS -- el equivalente, en
 * mvp_admin, de `PlantillaFacturaEditor` de mvp_app (app/empresa/[slug]/facturas/plantillas).
 *
 * ⚠️ Es una copia independiente a propósito (mismo criterio que `PermisosGrid`, que también
 * vive duplicado en admin y app: los dos repos usan stacks de UI distintos). Todo lo que NO es
 * UI -- `BLOCKS`, `construirCssEncabezadoFijo`, la config de `grapesjs.init`, el manejo de
 * imágenes -- debe mantenerse en sincronía con el de mvp_app: si cambias un bloque o el
 * encabezado fijo allá, replícalo acá (y viceversa), o las plantillas Recomendadas se
 * diseñarán con un catálogo distinto al que ve la empresa al editar su copia.
 */

import { useEffect, useRef, useState } from 'react';
import grapesjs, { type Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { ChevronLeft, Eye, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { adminFetch, adminFetchBlob, ApiError } from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  plantillaId: number;
  onVolver: () => void;
}

interface PlantillaRecomendada {
  id: number;
  nombre: string;
  anchoMm: number;
  altoMm: number;
  contenidoProyectoJson: string | null;
  contenidoHtml: string | null;
}

const API_BASE = '/portal/plantillas-factura-recomendadas';

/** 1mm ≈ 3.78px a 96dpi (el estándar CSS) -- solo para que el lienzo del editor se vea
 *  físicamente angosto al diseñar un ticket, no afecta el tamaño real del PDF (eso lo
 *  decide el backend con el ancho/alto en mm, ver FacturaPdfService). */
const MM_A_PX = 96 / 25.4;

/** Placeholder de imagen (SVG embebido, sin red) -- se reemplaza al subir un logo/imagen real. */
const PLACEHOLDER_IMG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="90"><rect width="220" height="90" fill="#f3f4f6" stroke="#9ca3af" stroke-width="2" stroke-dasharray="6,4"/><text x="110" y="49" font-family="Arial" font-size="13" fill="#6b7280" text-anchor="middle">Doble clic para subir</text></svg>',
)}`;

/** Alto fijo (px) del mockup del encabezado legal -- una constante de diseño, no depende
 *  de `altoMm` (que es el alto de PÁGINA completo, no el de este bloque). */
const ALTO_ENCABEZADO_FIJO_PX = 100;

/** Encabezado legal fijo (CAI, FACTURA+correlativo, fecha) -- el backend SIEMPRE lo
 *  antepone al HTML editable al generar el PDF real (ver `construirHtmlLegal`/
 *  `generarVistaPrevia` en factura-pdf.service.ts) y nunca es parte de lo que este editor
 *  guarda. Mismo texto/valores de ejemplo exactos que usa `generarVistaPrevia` -- si no se
 *  muestra acá, el lienzo y "Vista previa" quedan con una proporción distinta (el bloque
 *  real ocupa un espacio considerable arriba), dando la sensación de que "sigue viéndose
 *  diferente" aunque la tipografía/anchos ya coincidan.
 *
 *  Se renderiza como una IMAGEN de fondo (SVG data-URI) en `body::before`, inyectada vía
 *  `canvas.styles` -- la MISMA hoja externa que ya usa el fix de `font-family` de más abajo.
 *  Es la única vía confirmada en vivo que sobrevive: GrapesJS reescribe el documento del
 *  iframe de forma asíncrona después del montaje inicial (confirmado insertando nodos reales
 *  al DOM del body -- un `MutationObserver` nunca vio la mutación, prueba de que el iframe
 *  entero se reconstruye con un documento nuevo, no que se editan sus hijos), así que
 *  cualquier nodo agregado a mano al `<body>` (sea cuando sea: síncrono, `canvas:frame:load`,
 *  `canvas:frame:load:body`, o el evento nativo `load` del iframe) se pierde. Una hoja de
 *  estilos externa vía `canvas.styles`, en cambio, la vuelve a aplicar GrapesJS por su cuenta
 *  en cada reconstrucción del iframe, porque es GrapesJS quien la re-agrega al `<head>`. */
function construirCssEncabezadoFijo(anchoPx: number): string {
  const x = anchoPx - 8; // right padding de 8px, igual que el real (ver construirHtmlLegal)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${anchoPx}" height="${ALTO_ENCABEZADO_FIJO_PX}">
    <text x="${x}" y="22" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-weight="bold" fill="#0c3a5b"><tspan font-size="20">FACTURA</tspan> <tspan font-size="15">001-01-00000001</tspan></text>
    <text x="${x}" y="38" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="9" fill="#6b7280">01/01/2026</text>
    <text x="${x}" y="51" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="9" fill="#6b7280">Año 2026   Periodo 1</text>
    <text x="${x}" y="66" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="8" fill="#6b7280">CAI: XXXXXX-XXXXXX-XXXXXX-XXXXXX-XX (vista previa)</text>
    <text x="${x}" y="77" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="8" fill="#6b7280">Rango autorizado: 00000001 al 00001000</text>
    <text x="${x}" y="88" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="8" fill="#6b7280">Fecha límite de emisión: 31/12/2026</text>
  </svg>`;
  const svgDataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  // `url('${svgDataUri}')` ya viene percent-encoded -- si esta hoja de estilos se
  // codificara otra vez con `encodeURIComponent` (como la de `font-family`, vía
  // `data:text/css,...`), el `%` de esa codificación se codificaría de nuevo (`%25`),
  // corrompiendo la URI anidada. Con base64 (`;base64,`) el texto viaja tal cual, sin
  // volver a escapar sus propios caracteres `%`.
  const css = `body::before{content:"";display:block;width:100%;height:${ALTO_ENCABEZADO_FIJO_PX}px;background-image:url('${svgDataUri}');background-repeat:no-repeat;background-size:100% ${ALTO_ENCABEZADO_FIJO_PX}px;border-bottom:1px dashed #cbd5e1;}`;
  return `data:text/css;base64,${btoa(css)}`;
}

/** Catálogo curado de bloques -- el usuario arrastra estos, no HTML libre (ver plan). */
const BLOCKS: { id: string; label: string; category: string; content: string }[] = [
  // ── Datos de la empresa ──────────────────────────────────────────────────
  // razonSocial/dirección/teléfono/correo/RTN son hardcodeados en el backend por
  // mientras (no existe todavía infraestructura para el perfil fiscal de la empresa
  // emisora) -- ver EMPRESA_HARDCODEADA en factura-pdf.service.ts.
  {
    id: "empresa", label: "Datos de la Empresa", category: "Datos de la empresa",
    content: `<table width="100%" cellpadding="1" cellspacing="0" style="font-size:10px;">
      <tr><td width="60%" style="border:none;"><b style="color:#0c3a5b;font-size:13px;">{{empresa.razonSocial}}</b></td><td width="40%" style="border:none;"></td></tr>
      <tr><td style="border:none;"><b>Dirección de Facturación:</b> {{empresa.direccion}}</td><td style="border:none;"><b>RTN:</b> {{empresa.rtn}}</td></tr>
      <tr><td style="border:none;"><b>Teléfono:</b> {{empresa.telefono}}</td><td style="border:none;"></td></tr>
      <tr><td style="border:none;"><b>Correo:</b> {{empresa.correo}}</td><td style="border:none;"></td></tr>
    </table>`,
  },
  // ── Datos del cliente ─────────────────────────────────────────────────────
  {
    id: "cliente", label: "Cliente", category: "Datos del cliente",
    content: '<div style="padding:4px;"><b>Cliente:</b> {{cliente.nombre}}</div>',
  },
  {
    id: "cliente-codigo", label: "Código de Cliente", category: "Datos del cliente",
    content: '<div style="padding:4px;"><b>Código:</b> {{cliente.codigo}}</div>',
  },
  {
    // No existe un campo "RTN" propiamente en BASE_INFO_CENTRAL -- se usa el documento
    // de identificación general (ver factura-pdf.service.ts).
    id: "cliente-rtn", label: "RTN de Cliente", category: "Datos del cliente",
    content: '<div style="padding:4px;"><b>RTN:</b> {{cliente.documento}}</div>',
  },
  {
    id: "cliente-direccion", label: "Dirección de Cliente", category: "Datos del cliente",
    content: '<div style="padding:4px;"><b>Dirección:</b> {{cliente.direccion}}</div>',
  },
  {
    id: "cliente-correo", label: "Correo de Cliente", category: "Datos del cliente",
    content: '<div style="padding:4px;"><b>Correo:</b> {{cliente.correo}}</div>',
  },
  {
    id: "cliente-pais", label: "País de Cliente", category: "Datos del cliente",
    content: '<div style="padding:4px;"><b>País:</b> {{cliente.pais}}</div>',
  },
  // ── Datos de la factura ───────────────────────────────────────────────────
  {
    id: "fecha", label: "Fecha", category: "Datos de la factura",
    content: '<div style="padding:4px;"><b>Fecha:</b> {{factura.fecha}}</div>',
  },
  {
    id: "vendedor", label: "Vendedor", category: "Datos de la factura",
    content: '<div style="padding:4px;"><b>Vendedor:</b> {{factura.vendedor}}</div>',
  },
  {
    id: "condicion-cobro", label: "Condición de Cobro", category: "Datos de la factura",
    content: '<div style="padding:4px;"><b>Condición de Cobro:</b> {{factura.condicionCobro}}</div>',
  },
  {
    id: "orden-compra", label: "Orden de Compra / Trabajo / Observaciones", category: "Datos de la factura",
    content: `<div style="padding:4px;">
      <div style="margin:2px 0;"><b>Orden de compra No.:</b> {{factura.ordenCompra}}</div>
      <div style="margin:2px 0;"><b>Orden de Trabajo No.:</b> {{factura.ordenTrabajo}}</div>
      <div style="margin:2px 0;"><b>Observaciones:</b> {{factura.observaciones}}</div>
    </div>`,
  },
  {
    id: "fecha-pago-elaborada", label: "Fecha de Pago / Elaborada Por", category: "Datos de la factura",
    content: `<div style="padding:4px;">
      <div style="margin:2px 0;"><b>Fecha de Pago:</b> {{factura.fechaPago}}</div>
      <div style="margin:2px 0;"><b>Elaborada Por:</b> {{factura.elaboradaPor}}</div>
    </div>`,
  },
  {
    // {{#each}}/{{/each}} van en comentarios HTML -- un <tbody> no admite texto suelto como
    // hijo directo (el navegador lo reubica fuera de la tabla al parsearlo), pero sí admite
    // comentarios, y Handlebars los sigue reconociendo igual (ver factura-plantilla.service.ts).
    id: "tabla-lineas", label: "Tabla de Líneas", category: "Datos de la factura",
    // Anchos en "%" en cada <th> -- default razonable, no solo decorativo: el backend
    // (aplicarAnchosDeColumna en factura-pdf.service.ts) exige que TODAS las celdas de la
    // primera fila declaren un ancho en "%" para aplicar cualquiera -- si el usuario borra
    // el ancho de una sola columna en el editor, el PDF vuelve a auto-dimensionar la tabla
    // completa (silencioso, sin error). Selecciona una celda y ajusta su "%" en la sección
    // "Dimensiones" del panel de estilos si quieres otra proporción.
    content: `<table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr style="background:#eaf5fb;color:#0c3a5b;">
          <th style="border:none;border-bottom:1px solid #c3e4f5;width:6%;">Línea</th>
          <th style="border:none;border-bottom:1px solid #c3e4f5;width:28%;">Artículo</th>
          <th style="border:none;border-bottom:1px solid #c3e4f5;width:8%;">Cant.</th>
          <th style="border:none;border-bottom:1px solid #c3e4f5;width:14%;">Precio</th>
          <th style="border:none;border-bottom:1px solid #c3e4f5;width:12%;">ISV</th>
          <th style="border:none;border-bottom:1px solid #c3e4f5;width:12%;">Desc.</th>
          <th style="border:none;border-bottom:1px solid #c3e4f5;width:20%;">Total</th>
        </tr>
      </thead>
      <tbody>
        <!--{{#each detalle}}-->
        <tr>
          <td style="border:none;border-bottom:1px solid #e5e7eb;">{{linea}}</td>
          <td style="border:none;border-bottom:1px solid #e5e7eb;">{{nombre}}</td>
          <td style="border:none;border-bottom:1px solid #e5e7eb;">{{cantidad}}</td>
          <td style="border:none;border-bottom:1px solid #e5e7eb;">{{precio}}</td>
          <td style="border:none;border-bottom:1px solid #e5e7eb;">{{isv}}</td>
          <td style="border:none;border-bottom:1px solid #e5e7eb;">{{descuento}}</td>
          <td style="border:none;border-bottom:1px solid #e5e7eb;">{{total}}</td>
        </tr>
        <!--{{/each}}-->
      </tbody>
    </table>`,
  },
  // ── Totales y desglose fiscal ─────────────────────────────────────────────
  {
    id: "totales", label: "Totales", category: "Totales y fiscal",
    content: `<table width="100%" cellpadding="4" cellspacing="0">
      <tr><td width="70%" style="border:none;"></td><td width="30%" style="border:none;"><b>Sub Total:</b> {{factura.subtotal}}</td></tr>
      <tr><td width="70%" style="border:none;"></td><td width="30%" style="border:none;"><b>Rebajas y Descuentos:</b> {{factura.rebajasDescuentos}}</td></tr>
      <tr><td width="70%" style="border:none;"></td><td width="30%" style="border:none;"><b>Impuesto:</b> {{factura.impuesto}}</td></tr>
      <tr><td width="70%" style="border:none;"></td><td width="30%" style="border:none;"><b>Total a Pagar:</b> {{factura.total}}</td></tr>
    </table>`,
  },
  {
    id: "cantidad-letras", label: "Cantidad en Letras", category: "Totales y fiscal",
    content: '<div style="padding:4px;"><b>{{factura.totalEnLetras}}</b></div>',
  },
  {
    // "Exonerado" no tiene señal propia en el modelo actual -- ver factura-pdf.service.ts.
    id: "desglose-fiscal", label: "Desglose Fiscal", category: "Totales y fiscal",
    content: `<table width="100%" cellpadding="2" cellspacing="0" style="font-size:10px;">
      <tr><td width="50%" style="border:none;">Importe Exonerado:</td><td width="50%" style="border:none;text-align:right;">{{factura.importeExonerado}}</td></tr>
      <tr><td style="border:none;">Importe Exento:</td><td style="border:none;text-align:right;">{{factura.importeExento}}</td></tr>
      <tr><td style="border:none;">Importe Gravado 15%:</td><td style="border:none;text-align:right;">{{factura.importeGravado15}}</td></tr>
      <tr><td style="border:none;">Importe Gravado 18%:</td><td style="border:none;text-align:right;">{{factura.importeGravado18}}</td></tr>
      <tr><td style="border:none;">I.S.V. 15%:</td><td style="border:none;text-align:right;">{{factura.impuesto15}}</td></tr>
      <tr><td style="border:none;">I.S.V. 18%:</td><td style="border:none;text-align:right;">{{factura.impuesto18}}</td></tr>
    </table>`,
  },
  {
    id: "tasa-cambio-usd", label: "Tasa de Cambio / Total USD", category: "Totales y fiscal",
    content: `<div style="padding:4px;">
      <div style="margin:2px 0;"><b>Tasa de cambio:</b> L. {{factura.tasaCambio}}</div>
      <div style="margin:2px 0;"><b>Total (USD):</b> {{factura.totalUSD}}</div>
    </div>`,
  },
  {
    id: "referencias-exoneracion", label: "Referencias de Exoneración", category: "Totales y fiscal",
    content: `<div style="padding:4px;font-size:10px;color:#666666;">
      <div style="margin:2px 0;">N° Correlativo de la Orden de Compra Exenta: {{factura.ordenCompraExenta}}</div>
      <div style="margin:2px 0;">N° Correlativo de la Constancia de Registro de Exonerado: {{factura.constanciaRegistroExonerado}}</div>
      <div style="margin:2px 0;">N° Identificativo del Registro de la SAG: {{factura.registroSAG}}</div>
    </div>`,
  },
  {
    // Texto legal obligatorio (SAR/DEI) -- ver la nota en factura-plantilla.service.ts
    // (DEFAULT_HTML) sobre la redacción exacta requerida.
    id: "original-copia", label: "Original / Copia", category: "Totales y fiscal",
    content: `<table width="100%" cellpadding="4" cellspacing="0" style="font-size:9px;">
      <tr>
        <td width="50%" style="border:none;"><b>Original:</b> Obligado Tributario</td>
        <td width="50%" style="border:none;"><b>Copia:</b> Contribuyente Emisor</td>
      </tr>
    </table>`,
  },
  // ── Elementos ─────────────────────────────────────────────────────────────
  {
    id: "logo", label: "Logo", category: "Elementos",
    content: `<img src="${PLACEHOLDER_IMG}" style="max-width:150px;max-height:80px;display:block;" alt="Logo" />`,
  },
  {
    id: "texto-libre", label: "Texto Libre", category: "Elementos",
    content: '<p style="padding:4px;">Escribe aquí...</p>',
  },
  {
    id: "imagen-libre", label: "Imagen Libre", category: "Elementos",
    content: `<img src="${PLACEHOLDER_IMG}" style="max-width:200px;display:block;" alt="Imagen" />`,
  },
];

/** Convierte un archivo elegido por el usuario a data-URI (ver decisión de diseño: base64
 *  embebido hasta que exista un sistema de contenedor de imágenes). */
function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PlantillaFacturaRecomendadaEditor({ plantillaId, onVolver }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const blocksPanelRef = useRef<HTMLDivElement>(null);
  const stylesPanelRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);

  const [loading, setLoading] = useState(true);
  const [plantilla, setPlantilla] = useState<PlantillaRecomendada | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Carga la plantilla guardada una sola vez.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const data = await adminFetch<PlantillaRecomendada>(`${API_BASE}/${plantillaId}`);
        if (!cancelado) setPlantilla(data);
      } catch {
        if (!cancelado) toast.error('No se pudo cargar la plantilla de factura.');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => { cancelado = true; };
  }, [plantillaId]);

  // Inicializa GrapesJS una sola vez, cuando ya tenemos la plantilla a cargar.
  useEffect(() => {
    if (loading || !plantilla || !canvasRef.current || editorRef.current) return;

    const editor = grapesjs.init({
      container: canvasRef.current,
      height: '100%',
      width: 'auto',
      fromElement: false,
      storageManager: false,
      undoManager: { trackSelection: false },
      blockManager: { appendTo: blocksPanelRef.current ?? undefined, blocks: BLOCKS },
      layerManager: { appendTo: undefined },
      selectorManager: { componentFirst: true, custom: true },
      styleManager: {
        appendTo: stylesPanelRef.current ?? undefined,
        sectors: [
          { name: 'Tipografía', open: true, buildProps: ['color', 'font-size', 'font-weight', 'text-align'] },
          { name: 'Fondo y bordes', open: false, buildProps: ['background-color', 'border', 'border-radius'] },
          { name: 'Espaciado', open: false, buildProps: ['padding', 'margin'] },
          // Ancho por columna de tabla -- en "%" (no "px"): el backend solo respeta anchos de
          // columna declarados en porcentaje (ver `aplicarAnchosDeColumna` en factura-pdf.service.ts).
          { name: 'Dimensiones', open: false, buildProps: ['width'] },
        ],
      },
      panels: { defaults: [] },
      // Un solo device con width:'' -- NUNCA un ancho custom acá: GrapesJS envolvería todo el CSS
      // en `@media (max-width: ...)` y el guardado (`inlineCss`/juice) ignora esas reglas.
      deviceManager: { devices: [{ name: 'Página', width: '' }] },
      // Helvetica en el PDF final -> Arial en el lienzo (misma métrica), en vez del Times del iframe.
      canvas: {
        styles: [
          `data:text/css,${encodeURIComponent('body { font-family: Helvetica, Arial, sans-serif; }')}`,
          construirCssEncabezadoFijo(Math.round(plantilla.anchoMm * MM_A_PX)),
        ],
      },
    });
    editorRef.current = editor;

    // Ancho del lienzo = ancho real de la página configurada (mm -> px a 96dpi). GrapesJS vuelve
    // a pisar el `style.width` del iframe al terminar de montarlo y al cambiar de device, así
    // que se reaplica en cada uno de esos eventos (ver el mismo bloque en mvp_app).
    const aplicarAnchoLienzo = () => {
      const frame = editor.Canvas.getFrameEl();
      if (!frame) return;
      frame.style.width = `${Math.round(plantilla.anchoMm * MM_A_PX)}px`;
      frame.style.margin = '0 auto';
      frame.style.display = 'block';
    };
    aplicarAnchoLienzo();
    editor.on('load', aplicarAnchoLienzo);
    editor.on('canvas:frame:load', aplicarAnchoLienzo);
    editor.on('change:device', aplicarAnchoLienzo);

    // Doble clic en cualquier imagen (Logo/Imagen Libre) -- sube un archivo local y lo
    // embebe como data-URI, en vez de abrir el Asset Manager por defecto de GrapesJS.
    editor.DomComponents.addType('image', {
      view: {
        events() {
          return { dblclick: 'onFacturaImagenDblClick' };
        },
        onFacturaImagenDblClick(this: { model: { addAttributes: (attrs: Record<string, string>) => void } }) {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
              const dataUri = await fileToDataUri(file);
              this.model.addAttributes({ src: dataUri });
            } catch {
              toast.error('No se pudo leer la imagen seleccionada.');
            }
          };
          input.click();
        },
      },
    });

    if (plantilla.contenidoProyectoJson) {
      try {
        editor.loadProjectData(JSON.parse(plantilla.contenidoProyectoJson));
      } catch {
        editor.setComponents(plantilla.contenidoHtml ?? '');
      }
    } else {
      editor.setComponents(plantilla.contenidoHtml ?? '');
    }

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, [loading, plantilla]);

  async function handleGuardar() {
    const editor = editorRef.current;
    if (!editor) return;
    setSaving(true);
    try {
      await adminFetch(`${API_BASE}/${plantillaId}`, {
        method: 'PUT',
        body: JSON.stringify({
          contenidoProyectoJson: JSON.stringify(editor.getProjectData()),
          contenidoHtml: editor.getHtml(),
          contenidoCss: editor.getCss() ?? '',
        }),
      });
      toast.success('Plantilla guardada correctamente.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo guardar la plantilla.');
    } finally {
      setSaving(false);
    }
  }

  async function handleVistaPrevia() {
    const editor = editorRef.current;
    if (!editor) return;
    setPreviewing(true);
    try {
      const blob = await adminFetchBlob(`${API_BASE}/preview`, {
        method: 'POST',
        body: JSON.stringify({
          contenidoHtml: editor.getHtml(),
          contenidoCss: editor.getCss() ?? '',
          anchoMm: plantilla?.anchoMm,
          altoMm: plantilla?.altoMm,
        }),
      });
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      toast.error('No se pudo generar la vista previa.');
    } finally {
      setPreviewing(false);
    }
  }

  function cerrarVistaPrevia() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border bg-muted/30">
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon-sm" title="Volver" onClick={onVolver}>
            <ChevronLeft className="size-5" />
          </Button>
          <h2 className="text-base font-semibold truncate">
            Diseñador{plantilla?.nombre ? ` — ${plantilla.nombre}` : ''}
            {plantilla && <span className="ml-2 text-xs font-normal text-muted-foreground">{plantilla.anchoMm} × {plantilla.altoMm} mm</span>}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={handleVistaPrevia} disabled={previewing || loading}>
            {previewing ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
            {previewing ? 'Generando…' : 'Vista previa'}
          </Button>
          <Button onClick={handleGuardar} disabled={saving || loading}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Cargando plantilla…
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div ref={blocksPanelRef} className="w-56 shrink-0 overflow-y-auto border-r bg-background" />
          <div ref={canvasRef} className="flex-1 overflow-hidden" />
          <div ref={stylesPanelRef} className="w-64 shrink-0 overflow-y-auto border-l bg-background" />
        </div>
      )}

      <Dialog open={previewUrl !== null} onOpenChange={(open) => { if (!open) cerrarVistaPrevia(); }}>
        <DialogContent className="sm:max-w-4xl h-[90vh] grid-rows-[auto_1fr] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle>Vista previa (datos de ejemplo)</DialogTitle>
          </DialogHeader>
          {previewUrl && <iframe src={previewUrl} title="Vista previa de la plantilla" className="h-full w-full" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
