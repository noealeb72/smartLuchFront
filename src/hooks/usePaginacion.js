import { useState, useMemo, useEffect } from 'react';

const OPCIONES_BASE = [5, 10, 25, 50];

// Estado y lógica de paginación (registros por página + navegación) usada en todos los listados
export const usePaginacion = (pageSizeInicial = 5) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeInicial);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const opcionesPageSize = useMemo(() => {
    if (totalItems <= 0) return [pageSizeInicial];
    const filtradas = OPCIONES_BASE.filter((n) => n <= totalItems);
    if (!filtradas.includes(totalItems) && totalItems > 5) {
      filtradas.push(totalItems);
      filtradas.sort((a, b) => a - b);
    }
    return filtradas.length > 0 ? filtradas : [totalItems];
  }, [totalItems, pageSizeInicial]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (totalItems <= 0) return;
    if (!opcionesPageSize.includes(pageSize) || pageSize > totalItems) {
      setPageSize(opcionesPageSize[0] ?? pageSizeInicial);
    }
  }, [totalItems, pageSize, opcionesPageSize, pageSizeInicial]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  return {
    currentPage, setCurrentPage,
    pageSize, setPageSize,
    totalPages, setTotalPages,
    totalItems, setTotalItems,
    opcionesPageSize,
    handlePageChange,
  };
};

export default usePaginacion;
