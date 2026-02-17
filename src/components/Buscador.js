import React from 'react';

const Buscador = ({ filtro, setFiltro, placeholder = 'Filtrar por nombre, apellido, legajo...', onBlur }) => {
  return (
    <div className="mb-3">
      <label htmlFor="buscar" className="mr-2" style={{ fontWeight: 'normal' }}>Buscar</label>
      <div className="input-group" style={{ maxWidth: '650px', overflow: 'visible', display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'stretch' }}>
        <input
          type="text"
          id="buscar"
          className="form-control"
          placeholder={placeholder}
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          onBlur={onBlur}
          style={{
            border: '1px solid #ced4da',
            borderRight: filtro ? 'none' : '1px solid #ced4da',
            borderTopLeftRadius: '0.25rem',
            borderBottomLeftRadius: '0.25rem',
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            boxSizing: 'border-box',
            overflow: 'visible',
            minWidth: 0,
            flex: '1 1 auto',
            minHeight: 'calc(1.5em + 1rem + 2px)',
            height: 'calc(1.5em + 1rem + 2px)',
            padding: '0.5rem 0.75rem',
            fontSize: '0.9rem',
            lineHeight: '1.5',
          }}
        />
        {filtro && (
          <div className="input-group-append" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'stretch', marginLeft: 0, height: '100%' }}>
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setFiltro('')}
              title="Limpiar búsqueda"
              style={{
                backgroundColor: '#343a40',
                color: 'white',
                border: '1px solid #343a40',
                borderLeft: 'none',
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                height: '100%',
                minHeight: 'calc(1.5em + 1rem + 2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 0.75rem',
                marginLeft: 0,
                flexShrink: 0,
                boxSizing: 'border-box',
              }}
            >
              <i className="fa fa-times"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Buscador;

