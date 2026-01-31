import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook personalizado para manejar llamadas a API con caché y estado de carga
 * Optimizado para evitar llamadas duplicadas y mejorar performance
 */
export const useApi = (apiFunction, dependencies = [], options = {}) => {
  const { immediate = true, cache = true, cacheKey = null } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());

  const execute = useCallback(async (...args) => {
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();

    // Verificar caché
    const cacheKeyToUse = cacheKey || JSON.stringify(args);
    if (cache && cacheRef.current.has(cacheKeyToUse)) {
      setData(cacheRef.current.get(cacheKeyToUse));
      setLoading(false);
      setError(null);
      return cacheRef.current.get(cacheKeyToUse);
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiFunction(...args);

      // Guardar en caché
      if (cache) {
        cacheRef.current.set(cacheKeyToUse, result);
        // Limpiar caché antiguo si tiene más de 50 entradas
        if (cacheRef.current.size > 50) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }
      }

      setData(result);
      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, [apiFunction, cache, cacheKey]);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      // Limpiar al desmontar
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, execute, ...dependencies]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    if (cacheKey && cacheRef.current.has(cacheKey)) {
      cacheRef.current.delete(cacheKey);
    }
  }, [cacheKey]);

  return { data, loading, error, execute, reset };
};

export default useApi;

