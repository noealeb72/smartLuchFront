/**
 * Utilidad para agregar el encabezado estándar de SmartLunch a los reportes PDF.
 * Estructura: logo (izq) | Exportado el: [fecha] (der) | Título centrado abajo
 */

import { loadLogoAsBase64 } from './logoLoader';

const LOGO_SIZE = 6; // mm - tamaño compacto para el logo
const PAGE_WIDTH = 210; // mm - A4
const MARGIN_RIGHT = 14;

/**
 * Agrega el encabezado estándar de SmartLunch al documento PDF.
 * @param {object} doc - Instancia de jsPDF
 * @param {string} titulo - Título del reporte
 * @param {number} marginLeft - Margen izquierdo (default 14)
 * @returns {Promise<number>} - startY para el contenido siguiente
 */
export async function addPdfReportHeader(doc, titulo, marginLeft = 14) {
  const x = marginLeft;
  let y = 10;

  const logoBase64 = await loadLogoAsBase64();
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', x, y, LOGO_SIZE, LOGO_SIZE);
    } catch {
      // Si falla la imagen, se muestra solo el texto
    }
  }

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('smartLunch', x + LOGO_SIZE + 2, y + LOGO_SIZE / 2 + 1);

  const fecha = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Exportado el: ${fecha}`, PAGE_WIDTH - MARGIN_RIGHT, y + 5, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  y += LOGO_SIZE + 8;
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(titulo, PAGE_WIDTH / 2, y, { align: 'center' });

  return y + 8;
}
