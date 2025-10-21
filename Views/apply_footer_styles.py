#!/usr/bin/env python3
"""
Script para aplicar estilos de footer sticky a todas las páginas HTML
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

# Estilos CSS para footer sticky
footer_css = """
        /* Estilos para mantener el footer en la parte inferior */
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
        }
        
        .footer-sticky {
            position: sticky;
            bottom: 0;
            width: 100%;
            z-index: 1000;
        }
"""

def apply_footer_styles_to_file(filename):
    """Aplica estilos de footer sticky a un archivo HTML"""
    if not os.path.exists(filename):
        print(f"Archivo {filename} no encontrado")
        return False
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar donde insertar los estilos (después de smartstyle.css)
    pattern = r'(<link rel="stylesheet" href="css/smartstyle\.css"[^>]*>)'
    match = re.search(pattern, content)
    
    if match:
        # Verificar si ya tiene los estilos
        if 'footer-sticky' in content:
            print(f"✅ {filename} ya tiene estilos de footer")
            return True
            
        # Insertar estilos después de smartstyle.css
        insert_pos = match.end()
        new_content = content[:insert_pos] + '\n    \n    <style>' + footer_css + '    </style>' + content[insert_pos:]
        
        # Actualizar el footer para usar la clase sticky
        new_content = re.sub(
            r'<div ng-include="\'footer\.html\'"></div>',
            '<div ng-include="\'footer.html\'" class="footer-sticky" style="margin-top: auto;"></div>',
            new_content
        )
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ Estilos de footer aplicados a {filename}")
        return True
    else:
        print(f"❌ No se encontró smartstyle.css en {filename}")
        return False

def main():
    """Función principal"""
    print("Aplicando estilos de footer sticky a todas las páginas...")
    
    for filename in html_files:
        apply_footer_styles_to_file(filename)
    
    print("\n✅ Proceso completado!")

if __name__ == "__main__":
    main()


