import React from 'react';

const Buscador = ({ filtro, setFiltro, placeholder = 'Filtrar por nombre, apellido, legajo...' }) => {
  return (
    <div className="mb-3">
      <label htmlFor="buscar" className="mr-2" style={{ fontWeight: 'normal' }}>Buscar</label>
      <div className="input-group d-inline-flex" style={{ maxWidth: '500px' }}>
        <input
          type="text"
          id="buscar"
          className="form-control"
          placeholder={placeholder}
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        {filtro && (
          <div className="input-group-append">
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setFiltro('')}
              title="Limpiar búsqueda"
              style={{ backgroundColor: '#343a40', color: 'white', borderColor: '#343a40' }}
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

