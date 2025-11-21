// === auth.service.js ===

var app;
try { app = angular.module('AngujarJS'); }
catch (e) { app = angular.module('AngujarJS', []); }

app.factory('AuthService', function ($http, $q, ConfigService) {

    function login(user, pass) {
        return ConfigService.load()
            .then(function (cfg) {
                return $http({
                    url: cfg.apiBaseUrl + '/api/login/Authorize',
                    method: 'GET',
                    params: { user: user, pass: pass },
                    timeout: 8000
                });
            })
            .then(function (resp) {
                return resp.data;
            });
    }

    return {
        login: login
    };
});
