using System;
using System.Collections.Generic;
using System.Web.Http;

namespace smartlunch_web.Controllers
{
    public class MenuddController : ApiController
    {
        [HttpGet]
        [Route("api/menudd/filtrarPorTurno")]
        public IHttpActionResult FiltrarPorTurno(string planta, string centro, string jerarquia, string proyecto, string turno, string fecha)
        {
            try
            {
                // Datos de ejemplo para evitar el error 404
                var menuEjemplo = new List<object>
                {
                    new
                    {
                        id = 1,
                        descripcion = "Menú de " + turno,
                        fecha = fecha,
                        turno = turno,
                        planta = planta,
                        centro = centro,
                        jerarquia = jerarquia,
                        proyecto = proyecto,
                        activo = true
                    }
                };

                return Ok(menuEjemplo);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpGet]
        [Route("api/menudd/GetAll")]
        public IHttpActionResult GetAll()
        {
            try
            {
                var menuEjemplo = new List<object>
                {
                    new
                    {
                        id = 1,
                        descripcion = "Menú del día",
                        fecha = DateTime.Now.ToString("yyyy-MM-dd"),
                        turno = "Almuerzo",
                        activo = true
                    }
                };

                return Ok(menuEjemplo);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}