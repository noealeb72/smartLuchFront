#!/usr/bin/env python3
# Script para agregar navbar-direct.js a todas las páginas que usan navbar.html

import os
import re

# Páginas que usan navbar.html
pages = [
    'usuarios.html',
    'proyecto.html', 
    'centrodecosto.html',
    'turno.html',
    'planta.html',
    'plan-nutricional.html',
    'reportegcomensales.html',
    'despacho.html',
    'reporteggestion.html',
    'plato.html',
    'menudeldia.html',
    'index.html'
]

def add_navbar_script(file_path):
    """Agregar navbar-direct.js a una página si no lo tiene"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Verificar si ya tiene navbar-direct.js
        if 'navbar-direct.js' in content:
            print(f"OK {file_path} ya tiene navbar-direct.js")
            return
        
        # Buscar el patrón de scripts antes del cierre de body
        pattern = r'(<script src="js/[^"]+\.js"></script>\s*</body>)'
        match = re.search(pattern, content)
        
        if match:
            # Insertar navbar-direct.js antes del último script
            new_content = content.replace(
                match.group(1),
                f'    <script src="js/navbar-direct.js"></script>\n    {match.group(1)}'
            )
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"OK Agregado navbar-direct.js a {file_path}")
        else:
            print(f"ERROR No se pudo encontrar patron en {file_path}")
            
    except Exception as e:
        print(f"ERROR procesando {file_path}: {e}")

def main():
    print("Agregando navbar-direct.js a todas las paginas...")
    
    for page in pages:
        file_path = f"{page}"
        if os.path.exists(file_path):
            add_navbar_script(file_path)
        else:
            print(f"Archivo no encontrado: {file_path}")
    
    print("Proceso completado!")

if __name__ == "__main__":
    main()
