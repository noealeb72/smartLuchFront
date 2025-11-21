// === auth.helper.js ===

// Campos realmente críticos para que la app funcione
var CAMPOS_CRITICOS = [
    'id',
    'nombre',
    'apellido',
    'role',        // perfil
    'planta',
    'jerarquia',
    'proyecto',
    'centrodecosto',
    'plannutricional',
    'dni',
    'legajo',
];

// Campos deseables, pero no críticos (si faltan, solo avisamos por consola)
var CAMPOS_NO_CRITICOS = [   
   
    'cuil',
    'domicilio',
    'fechaingreso',
    'contrato',  
    'foto'
];

function obtenerDatosUsuarioLS() {
    var datos = {};
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        datos[key] = localStorage.getItem(key);
    }
    return datos;
}

// Valida datos mínimos para considerar la sesión "válida"
function validarSesionUsuario() {
    var usuario = obtenerDatosUsuarioLS();

    var faltantesCriticos = [];
    var faltantesNoCriticos = [];

    CAMPOS_CRITICOS.forEach(function (campo) {
        if (!usuario[campo]) {
            faltantesCriticos.push(campo);
        }
    });

    CAMPOS_NO_CRITICOS.forEach(function (campo) {
        if (!usuario[campo]) {
            faltantesNoCriticos.push(campo);
        }
    });

    // Log suave de los no críticos
    if (faltantesNoCriticos.length) {
        console.warn('Campos de usuario no críticos faltantes:', faltantesNoCriticos.join(', '));
    }

    // Si no falta nada crítico → OK
    if (!faltantesCriticos.length) {
        return { ok: true, usuario: usuario };
    }

    // Si falta algo crítico → mostramos SweetAlert y devolvemos error
    var msg = 'Faltan datos de usuario en el sistema. '
        + 'Por favor, inicie sesión nuevamente.\n\n'
        + 'Datos faltantes: ' + faltantesCriticos.join(', ');

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error de autenticación',
            text: 'Faltan datos de usuario en el sistema. Por favor, inicie sesión nuevamente. '
                + 'Datos faltantes: ' + faltantesCriticos.join(', '),
            confirmButtonText: 'Ir al Login'
        }).then(function () {
            irAlLogin();
        });
    } else {
        alert(msg);
        irAlLogin();
    }

    return { ok: false, usuario: null, faltantesCriticos: faltantesCriticos };
}

// Redirección centralizada al login
function irAlLogin() {
    try {
        localStorage.clear();
    } catch (e) { }

    // Ajustá esta ruta según tu estructura
    window.location.href = '/Views/login.html';
}
