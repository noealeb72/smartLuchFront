import React, { useState, useMemo } from 'react';
import './DataTable.css';

const DataTable = ({ 
  columns, 
  data, 
  isLoading, 
  emptyMessage = 'No hay datos disponibles',
  onEdit,
  onDelete,
  renderActions,
  pageSize = 10,
  enablePagination = true,
  canDelete = null, // Función opcional para determinar si se puede eliminar una fila
  canEdit = null, // Función opcional para determinar si se puede editar una fila
  // Props para paginación del servidor
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
  onPageChange: externalOnPageChange,
  totalItems: externalTotalItems
}) => {
  // Si se pasan props de paginación externa, usar paginación del servidor
  const isServerSidePagination = externalCurrentPage !== undefined && externalTotalPages !== undefined && externalOnPageChange !== undefined;
  
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  
  // Usar página externa si está disponible, sino usar la interna
  const currentPage = isServerSidePagination ? externalCurrentPage : internalCurrentPage;
  const totalPages = isServerSidePagination ? externalTotalPages : (() => {
    if (!enablePagination || !data || data.length <= pageSize) {
      return 1;
    }
    return Math.ceil(data.length / pageSize);
  })();

  // Calcular datos paginados (solo para paginación del cliente)
  const paginatedData = useMemo(() => {
    if (isServerSidePagination) {
      // En paginación del servidor, usar los datos tal cual vienen
      return data || [];
    }
    // Paginación del cliente: hacer slice de los datos
    if (!enablePagination || !data || data.length <= pageSize) {
      return data || [];
    }
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize, enablePagination, isServerSidePagination]);

  const shouldShowPagination = enablePagination && (
    isServerSidePagination 
      ? (externalTotalPages > 1)
      : (data && data.length > pageSize)
  );

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    // Detectar si es un mensaje de búsqueda sin resultados
    const isSearchMessage = emptyMessage && (
      emptyMessage.includes('No se encontraron') || 
      emptyMessage.includes('coincidan con la búsqueda')
    );
    
    // Detectar si es un mensaje de "no hay registros"
    const isNoRecordsMessage = emptyMessage && (
      emptyMessage.includes('No hay') && 
      emptyMessage.includes('registrados')
    );
    
    // Detectar si es el mensaje de "No hay pedidos pendientes" (color rojo del navbar)
    const isNoPedidosPendientes = emptyMessage && (
      emptyMessage.includes('No hay pedidos pendientes')
    );
    
    return (
      <div 
        className={isSearchMessage || isNoRecordsMessage || isNoPedidosPendientes ? "alert" : "alert alert-info"}
        style={isNoPedidosPendientes ? {
          backgroundColor: 'rgba(243, 73, 73, 0.1)',
          borderColor: '#F34949',
          borderWidth: '1px',
          borderStyle: 'solid',
          color: '#F34949',
          padding: '0.75rem 1.25rem',
          marginBottom: '1rem',
          borderRadius: '0.25rem',
          fontWeight: '500'
        } : (isSearchMessage || isNoRecordsMessage ? {
          backgroundColor: 'var(--smart-primary-bg)',
          borderColor: 'var(--smart-primary)',
          borderWidth: '1px',
          borderStyle: 'solid',
          color: 'var(--smart-primary)',
          padding: '0.75rem 1.25rem',
          marginBottom: '1rem',
          borderRadius: '0.25rem'
        } : {})}
      >
        {emptyMessage}
      </div>
    );
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      if (isServerSidePagination) {
        // Llamar al handler externo para paginación del servidor
        externalOnPageChange(page);
      } else {
        // Usar estado interno para paginación del cliente
        setInternalCurrentPage(page);
      }
      // Scroll al inicio de la tabla
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover" style={{ marginBottom: 0 }}>
          <thead className="thead-dark">
            <tr>
              {columns.map((col) => (
                <th 
                  key={col.key || col.field}
                  style={col.align ? { textAlign: col.align } : {}}
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete || renderActions) && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={row.id || index}>
                {columns.map((col) => {
                  // Buscar el valor en múltiples campos posibles (case-insensitive)
                  let value = null;
                  
                  if (col.render) {
                    // Si hay función render, usarla
                    value = col.render(row[col.field], row);
                  } else {
                    // Buscar el campo exacto
                    value = row[col.field];
                    
                    // Si no se encuentra, buscar variaciones (mayúsculas/minúsculas)
                    if (value === undefined || value === null || value === '') {
                      const fieldLower = col.field.toLowerCase();
                      const fieldUpper = col.field.toUpperCase();
                      const fieldCapitalized = col.field.charAt(0).toUpperCase() + col.field.slice(1).toLowerCase();
                      
                      // Buscar en todas las keys del row
                      const rowKeys = Object.keys(row);
                      const matchingKey = rowKeys.find(key => 
                        key.toLowerCase() === fieldLower || 
                        key === fieldUpper || 
                        key === fieldCapitalized
                      );
                      
                      if (matchingKey) {
                        value = row[matchingKey];
                      }
                    }
                    
                    // Si el valor es un objeto, intentar extraer propiedades comunes o mostrar un mensaje
                    if (value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)) {
                      // Intentar obtener propiedades comunes de objetos
                      value = value.nombre || value.Nombre || value.descripcion || value.Descripcion || value.id || value.Id || '[Objeto]';
                    }
                    
                    // Si aún no hay valor, mostrar '-'
                    if (value === undefined || value === null || value === '') {
                      value = '-';
                    }
                  }
                  
                  return (
                    <td 
                      key={col.key || col.field}
                      style={col.align ? { textAlign: col.align } : {}}
                    >
                      {value}
                    </td>
                  );
                })}
              {(onEdit || onDelete || renderActions) && (
                <td style={{ 
                  whiteSpace: 'nowrap',
                  minWidth: '120px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    flexWrap: 'nowrap'
                  }}>
                    {onEdit && (canEdit ? canEdit(row) : true) && (
                      <button
                        className="btn btn-sm btn-dark"
                        onClick={() => onEdit(row)}
                        title="Editar"
                        style={{ 
                          backgroundColor: '#343a40', 
                          borderColor: '#343a40',
                          flexShrink: 0
                        }}
                      >
                        <i className="fa fa-edit"></i>
                      </button>
                    )}
                    {onDelete && (canDelete ? canDelete(row) : true) && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onDelete(row)}
                        title="Eliminar"
                        style={{ 
                          flexShrink: 0
                        }}
                      >
                        <i className="fa fa-trash"></i>
                      </button>
                    )}
                    {renderActions && (
                      <div style={{ flexShrink: 0 }}>
                        {renderActions(row)}
                      </div>
                    )}
                  </div>
                </td>
              )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {shouldShowPagination && (
        <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
          <div>
            <span className="text-muted">
              {isServerSidePagination ? (
                <>Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, externalTotalItems || 0)} de {externalTotalItems || 0} registros</>
              ) : (
                <>Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, data.length)} de {data.length} registros</>
              )}
            </span>
          </div>
          <nav>
            <ul className="pagination mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>
              </li>
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                // Mostrar solo algunas páginas alrededor de la actual
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <li key={page} className="page-item disabled">
                      <span className="page-link">...</span>
                    </li>
                  );
                }
                return null;
              })}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
};

export default DataTable;

