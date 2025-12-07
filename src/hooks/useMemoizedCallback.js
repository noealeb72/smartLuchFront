import { useCallback, useRef } from 'react';

/**
 * Hook para memoizar callbacks con dependencias personalizadas
 * Útil cuando necesitas comparar objetos complejos
 */
export const useMemoizedCallback = (callback, deps) => {
  const ref = useRef();

  if (!ref.current || !areDepsEqual(ref.current.deps, deps)) {
    ref.current = { deps, callback };
  }

  return useCallback((...args) => {
    return ref.current.callback(...args);
  }, []);
};

const areDepsEqual = (prevDeps, nextDeps) => {
  if (prevDeps === nextDeps) return true;
  if (!prevDeps || !nextDeps) return false;
  if (prevDeps.length !== nextDeps.length) return false;

  for (let i = 0; i < prevDeps.length; i++) {
    if (prevDeps[i] !== nextDeps[i]) return false;
  }

  return true;
};

export default useMemoizedCallback;

