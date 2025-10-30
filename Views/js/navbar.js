var app = angular.module('AngujarJS', []);

// Controlador del navbar mejorado
app.controller('NavbarCtrl', function ($scope, $timeout) {
    // Inicializar variables
    $scope.user_Rol = '';
    $scope.user_Nombre = '';
    $scope.user_Apellido = '';
    
    // Función para cargar datos del usuario
    $scope.loadUserData = function() {
        $scope.user_Rol = localStorage.getItem('role') || '';
        $scope.user_Nombre = localStorage.getItem('nombre') || '';
        $scope.user_Apellido = localStorage.getItem('apellido') || '';
        
        // Debug: mostrar en consola el rol cargado
        console.log('NavbarCtrl - Rol cargado:', $scope.user_Rol);
        console.log('NavbarCtrl - Nombre:', $scope.user_Nombre);
        console.log('NavbarCtrl - Apellido:', $scope.user_Apellido);
        
        // Forzar actualización de la vista
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };
    
    // Cargar datos al inicializar
    $scope.loadUserData();
    
    // Fecha y hora en navbar, independiente del controlador de la página
    $scope.currentDateTime = new Date().toLocaleString('es-AR');
    setInterval(function() {
        $scope.currentDateTime = new Date().toLocaleString('es-AR');
        if (!$scope.$$phase) { $scope.$apply(); }
    }, 1000);

    // Recargar datos cada vez que se accede al navbar
    $scope.$on('$viewContentLoaded', function() {
        $scope.loadUserData();
    });
    
    // Función para verificar si el usuario tiene un rol específico
    $scope.hasRole = function(role) {
        return $scope.user_Rol === role;
    };
    
    // Función para verificar si el usuario tiene alguno de los roles especificados
    $scope.hasAnyRole = function(roles) {
        return roles.indexOf($scope.user_Rol) !== -1;
    };
    
    // Función para debug - mostrar información del usuario
    $scope.debugUser = function() {
        console.log('=== DEBUG USUARIO ===');
        console.log('- Rol:', $scope.user_Rol);
        console.log('- Nombre:', $scope.user_Nombre);
        console.log('- Apellido:', $scope.user_Apellido);
        console.log('- localStorage role:', localStorage.getItem('role'));
        console.log('- localStorage nombre:', localStorage.getItem('nombre'));
        console.log('- localStorage apellido:', localStorage.getItem('apellido'));
    };
    
    // Función para recargar datos (llamada externa)
    $scope.refreshUserData = function() {
        $scope.loadUserData();
    };
    
    // Hacer funciones disponibles globalmente
    window.refreshNavbar = function() {
        $scope.refreshUserData();
    };
});
