import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para sincronizar estado con localStorage
 * Optimizado para evitar lecturas/escrituras innecesarias
 */
export const useLocalStorage = (key, initialValue) => {
  // Estado para almacenar el valor
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error leyendo localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Función para actualizar el valor
  const setValue = useCallback(
    (value) => {
      try {
        // Permitir que value sea una función para tener la misma API que useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Guardar estado
        setStoredValue(valueToStore);
        
        // Guardar en localStorage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error guardando en localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Sincronizar con cambios en otras pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parseando localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
};

export default useLocalStorage;

