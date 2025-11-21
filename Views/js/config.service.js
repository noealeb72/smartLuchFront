// === config.service.js ===

var app;
try { app = angular.module('AngujarJS'); }
catch (e) { app = angular.module('AngujarJS', []); }

app.factory('ConfigService', function ($http, $q) {
    var CONFIG_URL = '/Views/config.json';

    var config = null;
    var loadingPromise = null;

    function load() {
        if (config) return $q.resolve(config);
        if (loadingPromise) return loadingPromise;

        loadingPromise = $http.get(CONFIG_URL, { cache: false })
            .then(function (resp) {
                var raw = resp.data;

                if (!raw.API_BASE_URL || !raw.URL_HOME) {
                    throw new Error("Config incompleta: faltan API_BASE_URL o URL_HOME");
                }

                config = {
                    apiBaseUrl: raw.API_BASE_URL.replace(/\/+$/, ''),
                    urlHome: raw.URL_HOME.replace(/\/+$/, '') + '/',
                    bloqueos: raw.BLOQUEO_USUARIOS || {}
                };

                return config;
            })
            .catch(function (err) {
                console.error("❌ Error cargando config.json:", err);
                return $q.reject(err);
            })
            .finally(function () {
                loadingPromise = null;
            });

        return loadingPromise;
    }

    return {
        load: load,
        getConfig: function () { return config; }
    };
});
