var app = angular.module('AngujarJS', []);

app.controller('HomeController', function ($scope, $sce, $http, $window) {

    $scope.dataset = [];

    $http.get('http://localhost:8000/api/test/get')
        .success(function (data) {
            $scope.dataset = data;
        })
        .error(function (data, status) {
            alert(' API presente: ' + data);
        });

});
