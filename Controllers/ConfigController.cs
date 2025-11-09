using System;
using System.Collections.Generic;
using System.Configuration;
using System.Web.Http;
using System.Web.Http.Cors;

namespace smartlunch_web.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    public class ConfigController : ApiController
    {
        [HttpGet]
        [Route("api/config/get")]
        public IHttpActionResult GetConfig()
        {
            try
            {
                // IMPORTANTE: ConfigurationManager.AppSettings lee del Web.config del proyecto
                // donde está corriendo la aplicación (raíz del proyecto)
                
                // Obtener la URL base del servidor actual
                var request = Request;
                var baseUrl = request.RequestUri.GetLeftPart(System.UriPartial.Authority);
                
                // Leer API_BASE_URL desde Web.config del proyecto
                // Si está configurado en Web.config, usarlo; si no, usar la URL actual
                var apiBaseUrl = ConfigurationManager.AppSettings["API_BASE_URL"];
                if (string.IsNullOrWhiteSpace(apiBaseUrl))
                {
                    // Usar la URL del servidor actual (puerto 80 en producción, 8000 en desarrollo)
                    apiBaseUrl = baseUrl;
                }

                // Obtener configuración de bloqueo de usuarios desde Web.config del proyecto
                var bloqueoUsuarios = new Dictionary<string, bool>
                {
                    { "Admin", GetBoolConfig("BLOQUEO_USUARIOS_Admin", false) },
                    { "Cocina", GetBoolConfig("BLOQUEO_USUARIOS_Cocina", false) },
                    { "Comensal", GetBoolConfig("BLOQUEO_USUARIOS_Comensal", false) },
                    { "Gerencia", GetBoolConfig("BLOQUEO_USUARIOS_Gerencia", false) }
                };

                var config = new
                {
                    API_BASE_URL = apiBaseUrl,
                    API_BASE = apiBaseUrl + "/api/",
                    BLOQUEO_USUARIOS = bloqueoUsuarios
                };

                return Ok(config);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        /// <summary>
        /// Lee un valor booleano desde Web.config del proyecto
        /// </summary>
        private bool GetBoolConfig(string key, bool defaultValue)
        {
            try
            {
                // ConfigurationManager.AppSettings lee del Web.config del proyecto
                var value = ConfigurationManager.AppSettings[key];
                if (string.IsNullOrWhiteSpace(value))
                    return defaultValue;
                
                return value.ToLower() == "true" || value == "1";
            }
            catch
            {
                return defaultValue;
            }
        }
    }
}

