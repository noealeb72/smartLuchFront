/**
 * Utilidad para agregar el encabezado a exportaciones Excel (sin logo).
 * Estructura: smartLunch (izq) | Exportado el: [fecha] (der) | Título centrado abajo
 * Usa window.XLSX (cargado desde public/xlsx.full.min.js) para evitar problemas con Webpack.
 */

const getXLSX = () => {
  const XLSX = typeof window !== 'undefined' ? window.XLSX : null;
  if (!XLSX || !XLSX.utils) {
    throw new Error('XLSX no está disponible. Verifica que xlsx.full.min.js esté en public/ y cargado en index.html');
  }
  return XLSX;
};

/**
 * Crea una hoja Excel con encabezado estándar (smartLunch + fecha + título) para uso con XLSX.
 * @param {Array<object>} datosExcel - Array de objetos con los datos a exportar
 * @param {string} titulo - Título del reporte
 * @returns {object} - Worksheet de XLSX con encabezado y datos
 */
export function createExcelSheetWithHeaderXLSX(datosExcel, titulo) {
  const XLSX = getXLSX();
  const fecha = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const keys = datosExcel.length > 0 ? Object.keys(datosExcel[0]) : [];
  const headerRows = [
    ['smartLunch', '', '', '', '', '', '', '', '', `Exportado el: ${fecha}`],
    [titulo],
  ];
  const dataRows = [keys, ...datosExcel.map((obj) => keys.map((k) => obj[k] ?? ''))];
  const aoa = [...headerRows, [], ...dataRows];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = ws['!merges'] || [];
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 9 } });
  return ws;
}

/**
 * Crea una hoja Excel desde array de arrays (aoa) con encabezado estándar y descarga el archivo.
 * @param {Array<Array>} aoa - Array de arrays con los datos
 * @param {string} titulo - Título del reporte
 * @param {string} nombreArchivo - Nombre del archivo a descargar
 */
export function exportAoaToExcel(aoa, titulo, nombreArchivo) {
  const XLSX = getXLSX();
  const fecha = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const headerRows = [
    ['smartLunch', '', '', '', '', '', '', '', '', `Exportado el: ${fecha}`],
    [titulo],
  ];
  const fullAoa = [...headerRows, [], ...aoa];
  const ws = XLSX.utils.aoa_to_sheet(fullAoa);
  ws['!merges'] = ws['!merges'] || [];
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 9 } });
  // Orientación horizontal para que todo quepa en la hoja
  ws['!pageSetup'] = ws['!pageSetup'] || {};
  ws['!pageSetup'].orientation = 'landscape';
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, titulo.substring(0, 31));
  XLSX.writeFile(wb, nombreArchivo);
}

/**
 * Agrega el encabezado (smartLunch + fecha + título centrado) a una hoja Excel.
 * @param {object} workbook - Workbook de exceljs
 * @param {object} worksheet - Worksheet de exceljs
 * @param {string} titulo - Título del reporte
 * @returns {Promise<number>} - Número de fila donde debe comenzar el contenido (1-based)
 */
export async function addExcelReportHeader(workbook, worksheet, titulo) {
  const fecha = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  worksheet.getCell(1, 1).value = 'smartLunch';
  worksheet.getCell(1, 1).font = { bold: true, size: 11, color: { argb: 'FF000000' } };

  const fechaCell = worksheet.getCell(1, 10);
  fechaCell.value = `Exportado el: ${fecha}`;
  fechaCell.font = { size: 8, color: { argb: 'FF666666' } };
  fechaCell.alignment = { horizontal: 'right' };

  worksheet.mergeCells(2, 1, 2, 10);
  const titleCell = worksheet.getCell(2, 1);
  titleCell.value = titulo;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };

  return 4;
}
