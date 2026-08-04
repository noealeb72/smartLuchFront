import React from 'react';

const SelectorRegistros = ({ pageSize, opciones, onChange, className = 'd-flex align-items-center mb-2' }) => {
  return (
    <div className={className} style={{ gap: '0.5rem' }}>
      <label className="d-flex align-items-center gap-2 mb-0" style={{ whiteSpace: 'nowrap' }}>
        <span className="text-muted" style={{ fontSize: '0.9rem' }}>Registros a mostrar:</span>
        <select
          className="form-control form-control-sm"
          value={pageSize}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: 'auto', minWidth: '70px' }}
        >
          {opciones.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default SelectorRegistros;
