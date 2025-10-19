using System.Web.Http;

namespace smartlunch_web
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Configuración de rutas de Web API
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            // Configuración para JSON
            config.Formatters.JsonFormatter.SerializerSettings.ContractResolver = 
                new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
        }
    }
}
