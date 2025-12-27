/**
 * Wrapper de compatibilidad - Exporta todos los servicios
 * Este archivo mantiene la compatibilidad con el código existente
 * 
 * @deprecated Se recomienda usar los servicios individuales:
 * - authService, usuariosService, platosService, etc.
 * 
 * Para migrar:
 * Antes: import { apiService } from './services/apiService';
 * Después: import { usuariosService } from './services/usuariosService';
 */

import { authService } from './authService';
import { usuariosService } from './usuariosService';
import { platosService } from './platosService';
import { turnosService } from './turnosService';
import { comandasService } from './comandasService';
import { dashboardService } from './dashboardService';
import { inicioService } from './inicioService';
import { menuService } from './menuService';
import { catalogosService } from './catalogosService';
import { plantasService } from './plantasService';
import { centrosDeCostoService } from './centrosDeCostoService';
import { proyectosService } from './proyectosService';
import { planesNutricionalesService } from './planesNutricionalesService';
import { jerarquiasService } from './jerarquiasService';
import { configApiService } from './configApiService';
import { getApiBaseUrl } from './configService';
import api from './apiClient';

/**
 * Servicio unificado de API (wrapper para compatibilidad)
 * Agrupa todos los servicios en un solo objeto
 */
export const apiService = {
  // Auth
  login: authService.login,

  // Dashboard (deprecated - usar inicioService.getInicioWeb)
  getMenuDelDia: dashboardService.getMenuDelDia,

  // Inicio
  getInicioWeb: inicioService.getInicioWeb,

  // Menú
  getMenuByTurno: menuService.getMenuByTurno,
  getMenuByTurnoId: menuService.getMenuByTurnoId,

  // Turnos
  getTurnosDisponibles: turnosService.getTurnosDisponibles,
  getTurnosLista: turnosService.getTurnosLista,
  crearTurno: turnosService.crearTurno,
  actualizarTurno: turnosService.actualizarTurno,
  eliminarTurno: turnosService.eliminarTurno,
  activarTurno: turnosService.activarTurno,

  // Comandas/Pedidos
  getPedidosVigentes: comandasService.getPedidosVigentes,
  getPedidosPendientes: comandasService.getPedidosPendientes,
  crearPedido: comandasService.crearPedido,
  actualizarPedido: comandasService.actualizarPedido,
  despacharPedido: comandasService.despacharPedido,

  // Configuración
  getConfig: configApiService.getConfig,

  // Usuarios
  getUsuarios: usuariosService.getUsuarios,
  getUsuarioPorId: usuariosService.getUsuarioPorId,
  crearUsuario: usuariosService.crearUsuario,
  actualizarUsuario: usuariosService.actualizarUsuario,
  eliminarUsuario: usuariosService.eliminarUsuario,
  activarUsuario: usuariosService.activarUsuario,

  // Catálogos
  getJerarquias: catalogosService.getJerarquias,
  getPlantas: catalogosService.getPlantas,
  getCentrosDeCosto: catalogosService.getCentrosDeCosto,
  getProyectos: catalogosService.getProyectos,
  getPlanesNutricionales: catalogosService.getPlanesNutricionales,

  // Plantas
      getPlantasLista: plantasService.getPlantasLista,
      getPlantaPorId: plantasService.getPlantaPorId,
      buscarPlantas: plantasService.buscarPlantas,
      crearPlanta: plantasService.crearPlanta,
      actualizarPlanta: plantasService.actualizarPlanta,
      eliminarPlanta: plantasService.eliminarPlanta,
      activarPlanta: plantasService.activarPlanta,

  // Centros de Costo
      getCentrosDeCostoLista: centrosDeCostoService.getCentrosDeCostoLista,
      crearCentroDeCosto: centrosDeCostoService.crearCentroDeCosto,
      actualizarCentroDeCosto: centrosDeCostoService.actualizarCentroDeCosto,
      eliminarCentroDeCosto: centrosDeCostoService.eliminarCentroDeCosto,
      activarCentroDeCosto: centrosDeCostoService.activarCentroDeCosto,

  // Proyectos
  getProyectosLista: proyectosService.getProyectosLista,
  getProyectoPorId: proyectosService.getProyectoPorId,
  getProyectosActivosCombo: proyectosService.getProyectosActivosCombo,
  crearProyecto: proyectosService.crearProyecto,
  actualizarProyecto: proyectosService.actualizarProyecto,
  eliminarProyecto: proyectosService.eliminarProyecto,
  activarProyecto: proyectosService.activarProyecto,

  // Planes Nutricionales
      getPlanesNutricionalesLista: planesNutricionalesService.getPlanesNutricionalesLista,
      getPlanNutricionalPorId: planesNutricionalesService.getPlanNutricionalPorId,
      crearPlanNutricional: planesNutricionalesService.crearPlanNutricional,
      actualizarPlanNutricional: planesNutricionalesService.actualizarPlanNutricional,
      eliminarPlanNutricional: planesNutricionalesService.eliminarPlanNutricional,
      activarPlanNutricional: planesNutricionalesService.activarPlanNutricional,

  // Jerarquías
  getJerarquiasLista: jerarquiasService.getJerarquiasLista,
  getJerarquiaPorId: jerarquiasService.getJerarquiaPorId,
  crearJerarquia: jerarquiasService.crearJerarquia,
  actualizarJerarquia: jerarquiasService.actualizarJerarquia,
  eliminarJerarquia: jerarquiasService.eliminarJerarquia,
  activarJerarquia: jerarquiasService.activarJerarquia,

  // Platos
  getPlatosLista: platosService.getPlatosLista,
  getPlatoPorId: platosService.getPlatoPorId,
  buscarPlatos: platosService.buscarPlatos,
  crearPlato: platosService.crearPlato,
  actualizarPlato: platosService.actualizarPlato,
  eliminarPlato: platosService.eliminarPlato,
  activarPlato: platosService.activarPlato,
};

// Re-exportar getApiBaseUrl para compatibilidad
export { getApiBaseUrl };

// Exportar la instancia de axios para compatibilidad
export default api;
