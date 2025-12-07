/**
 * Exportación centralizada de todos los servicios
 * Permite importar todos los servicios desde un solo lugar
 */

// Cliente base de API
export { default as apiClient, clearApiCache } from './apiClient';

// Servicios por módulo
export { authService } from './authService';
export { usuariosService } from './usuariosService';
export { platosService } from './platosService';
export { turnosService } from './turnosService';
export { comandasService } from './comandasService';
export { dashboardService } from './dashboardService';
export { menuService } from './menuService';
export { catalogosService } from './catalogosService';
export { plantasService } from './plantasService';
export { centrosDeCostoService } from './centrosDeCostoService';
export { proyectosService } from './proyectosService';
export { planesNutricionalesService } from './planesNutricionalesService';
export { jerarquiasService } from './jerarquiasService';
export { configApiService } from './configApiService';

// Servicio de configuración (local)
export * from './configService';

