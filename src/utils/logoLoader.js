/**
 * Carga el logo de SmartLunch como base64 para usar en PDF y Excel.
 * Busca en /Views/img/logo.png (public folder).
 * Si no existe, genera un icono de tenedor como fallback.
 */

const LOGO_URL = `${process.env.PUBLIC_URL || ''}/Views/img/logo-reporte.png`;

let logoBase64Cache = null;

/** Genera icono tenedor/cuchillo como PNG base64 (fallback) */
function createForkIconFallback() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#F34949';
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.lineTo(8, 28);
  ctx.lineTo(10, 28);
  ctx.lineTo(10, 14);
  ctx.lineTo(14, 14);
  ctx.lineTo(14, 28);
  ctx.lineTo(16, 28);
  ctx.lineTo(16, 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, 4);
  ctx.lineTo(18, 24);
  ctx.lineTo(20, 24);
  ctx.lineTo(20, 4);
  ctx.closePath();
  ctx.fill();
  return canvas.toDataURL('image/png');
}

/**
 * Carga el logo como base64. Usa caché para no volver a cargar.
 * @returns {Promise<string>} Base64 data URL (data:image/png;base64,...)
 */
export async function loadLogoAsBase64() {
  if (logoBase64Cache) return logoBase64Cache;

  try {
    const response = await fetch(LOGO_URL);
    if (!response.ok) throw new Error('Logo no encontrado');
    const blob = await response.blob();
    logoBase64Cache = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    logoBase64Cache = createForkIconFallback();
  }
  return logoBase64Cache;
}
