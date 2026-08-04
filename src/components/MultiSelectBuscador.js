import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Select múltiple con buscador: se ve y se comporta como un <select> (cerrado,
 * compacto), pero al hacer click abre un desplegable con un buscador y una
 * lista tildable. Sin selección = "cualquiera" (no filtra).
 *
 * @param {{id: string|number, label: string}[]} options
 * @param {(string|number)[]} selectedIds
 * @param {(ids: string[]) => void} onChange
 */
const MultiSelectBuscador = ({ options, selectedIds, onChange, placeholder, emptyLabel }) => {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const contenedorRef = useRef(null);
  const buscadorRef = useRef(null);

  const seleccionados = useMemo(() => new Set((selectedIds || []).map(String)), [selectedIds]);
  const opcionesPorId = useMemo(() => new Map(options.map((o) => [String(o.id), o.label])), [options]);

  const opcionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => (o.label || '').toLowerCase().includes(q));
  }, [options, busqueda]);

  // Cerrar al hacer click afuera o al presionar Escape
  useEffect(() => {
    if (!open) return;
    const handleClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickFuera);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickFuera);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (open && buscadorRef.current) buscadorRef.current.focus();
    if (!open) setBusqueda('');
  }, [open]);

  const toggleOpcion = (id) => {
    const idStr = String(id);
    const actuales = new Set(seleccionados);
    if (actuales.has(idStr)) actuales.delete(idStr);
    else actuales.add(idStr);
    onChange(Array.from(actuales));
  };

  const quitar = (id, e) => {
    e.stopPropagation();
    onChange(Array.from(seleccionados).filter((s) => s !== String(id)));
  };

  return (
    <div ref={contenedorRef} style={{ position: 'relative' }}>
      <div
        className="form-control"
        onClick={() => setOpen((o) => !o)}
        style={{
          cursor: 'pointer',
          minHeight: 'calc(1.5em + 0.75rem + 2px)',
          height: 'auto',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.3rem',
          paddingTop: '0.25rem',
          paddingBottom: '0.25rem',
        }}
      >
        {seleccionados.size === 0 ? (
          <span className="text-muted">{emptyLabel || 'Todos'}</span>
        ) : (
          Array.from(seleccionados).map((id) => (
            <span
              key={id}
              className="badge badge-dark"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.55rem', fontWeight: 'normal' }}
            >
              {opcionesPorId.get(id) || `#${id}`}
              <button
                type="button"
                onClick={(e) => quitar(id, e)}
                aria-label={`Quitar ${opcionesPorId.get(id) || id}`}
                style={{ background: 'none', border: 'none', color: 'white', padding: 0, lineHeight: 1, cursor: 'pointer' }}
              >
                &times;
              </button>
            </span>
          ))
        )}
        <i className="fa fa-chevron-down ml-auto text-muted" style={{ fontSize: '0.75rem' }} aria-hidden="true"></i>
      </div>

      {open && (
        <div
          className="shadow-sm"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #ced4da',
            borderRadius: '0.25rem',
          }}
        >
          <input
            ref={buscadorRef}
            type="text"
            className="form-control"
            placeholder={placeholder || 'Buscar...'}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
          />
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {opcionesFiltradas.length === 0 ? (
              <div className="text-muted p-2" style={{ fontSize: '0.9rem' }}>Sin resultados</div>
            ) : (
              opcionesFiltradas.map((o) => {
                const idStr = String(o.id);
                const checked = seleccionados.has(idStr);
                return (
                  <label
                    key={idStr}
                    className="d-flex align-items-center mb-0"
                    style={{ padding: '0.45rem 0.75rem', cursor: 'pointer', fontWeight: 'normal', fontSize: '0.9rem' }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={checked}
                      onChange={() => toggleOpcion(o.id)}
                    />
                    {o.label}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectBuscador;
