#!/usr/bin/env python3
"""
Script para aplicar estilos consistentes a todas las páginas HTML
"""

import os
import re

# Lista de archivos HTML a actualizar
html_files = [
    'datospersonales.html',
    'jerarquia.html', 
    'turno.html',
    'menudeldia.html',
    'plato.html',
    'reporteggestion.html',
    'reportegcomensales.html',
    'despacho.html',
    'calificacion.html'
]

# Estilos CSS a agregar
css_styles = """
    <style>
        /* Estilos para botones de acción */
        .btn-link[title="Editar"], .btn-link[title="Eliminar"] {
            min-height: 32px !important;
            min-width: 32px !important;
            padding: 6px 12px !important;
            font-size: 14px !important;
            line-height: 1.2 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        
        /* Íconos de los botones en color blanco */
        .btn-primary i.fa-save,
        .btn-cancelar i.fa-times,
        .btn-primary[ng-click="ViewCreate()"] i.fa-plus {
            color: white !important;
        }
        
        /* Estilos para SweetAlert2 - Botón Entendido */
        .swal2-confirm {
            background-color: #495057 !important;
            border-color: #495057 !important;
            color: white !important;
        }
        
        .swal2-confirm:hover {
            background-color: #495057 !important;
            border-color: #495057 !important;
            color: white !important;
        }
        
        .swal2-confirm:focus {
            background-color: #495057 !important;
            border-color: #495057 !important;
            color: white !important;
            box-shadow: none !important;
        }
        
        .swal2-confirm:active {
            background-color: #495057 !important;
            border-color: #495057 !important;
            color: white !important;
        }
        
        /* Estilos para SweetAlert2 - Botón Cancelar */
        .swal2-cancel {
            background-color: #F34949 !important;
            border-color: #F34949 !important;
            color: white !important;
        }
        
        .swal2-cancel:hover {
            background-color: #F34949 !important;
            border-color: #F34949 !important;
            color: white !important;
        }
        
        .swal2-cancel:focus {
            background-color: #F34949 !important;
            border-color: #F34949 !important;
            color: white !important;
            box-shadow: none !important;
        }
        
        .swal2-cancel:active {
            background-color: #F34949 !important;
            border-color: #F34949 !important;
            color: white !important;
        }
    </style>
"""

def apply_styles_to_file(filename):
    """Aplica estilos a un archivo HTML"""
    if not os.path.exists(filename):
        print(f"Archivo {filename} no encontrado")
        return False
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar donde insertar los estilos (después de smartstyle.css)
    pattern = r'(<link rel="stylesheet" href="css/smartstyle\.css"[^>]*>)'
    match = re.search(pattern, content)
    
    if match:
        # Insertar estilos después de smartstyle.css
        insert_pos = match.end()
        new_content = content[:insert_pos] + css_styles + content[insert_pos:]
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ Estilos aplicados a {filename}")
        return True
    else:
        print(f"❌ No se encontró smartstyle.css en {filename}")
        return False

def main():
    """Función principal"""
    print("Aplicando estilos consistentes a todas las páginas...")
    
    for filename in html_files:
        apply_styles_to_file(filename)
    
    print("\n✅ Proceso completado!")

if __name__ == "__main__":
    main()


