/**
 * Utilidad para agregar el encabezado a exportaciones Excel (sin logo).
 * Estructura: smartLunch (izq) | Exportado el: [fecha] (der) | Título centrado abajo
 */

import * as XLSX from 'xlsx';

/**
 * Crea una hoja Excel con encabezado estándar (smartLunch + fecha + título) para uso con XLSX.
 * @param {Array<object>} datosExcel - Array de objetos con los datos a exportar
 * @param {string} titulo - Título del reporte
 * @returns {object} - Worksheet de XLSX con encabezado y datos
 */
export function createExcelSheetWithHeaderXLSX(datosExcel, titulo) {
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
