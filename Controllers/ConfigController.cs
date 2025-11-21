using System;
using System.Configuration;
using System.Web.Http;

namespace smartlunch_web.Controllers
{
    [RoutePrefix("api/config")]
    public class ConfigController : ApiController
    {
        [HttpGet]
        [Route("get")]
        public IHttpActionResult GetConfig()
        {
            try
            {
                // 1) API_BASE_URL
                var apiBaseUrl = ConfigurationManager.AppSettings["API_BASE_URL"];
                if (string.IsNullOrWhiteSpace(apiBaseUrl))
                {
                    return BadRequest("No está definido 'API_BASE_URL' en el Web.config de smartlunch-web.");
                }

                // 2) URL_HOME
                var urlHome = ConfigurationManager.AppSettings["URL_HOME"];
                if (string.IsNullOrWhiteSpace(urlHome))
                {
                    return BadRequest("No está definido 'URL_HOME' en el Web.config de smartlunch-web.");
                }

                // Normalizamos: sin / al final para API, con / al final para HOME
                apiBaseUrl = apiBaseUrl.TrimEnd('/');
                urlHome = urlHome.TrimEnd('/') + "/";

                // 3) Bloqueos
                var bloqueos = new
                {
                    Admin = GetBool("BLOQUEO_USUARIOS_Admin"),
                    Cocina = GetBool("BLOQUEO_USUARIOS_Cocina"),
                    Comensal = GetBool("BLOQUEO_USUARIOS_Comensal"),
                    Gerencia = GetBool("BLOQUEO_USUARIOS_Gerencia")
                };

                var response = new
                {
                    API_BASE_URL = apiBaseUrl,
                    URL_HOME = urlHome,
                    BLOQUEO_USUARIOS = bloqueos
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        private bool GetBool(string key)
        {
            var val = ConfigurationManager.AppSettings[key];
            return string.Equals(val, "true", StringComparison.OrdinalIgnoreCase)
                || string.Equals(val, "1", StringComparison.OrdinalIgnoreCase);
        }
    }
}
