import React from 'react';

const AgregarButton = ({ onClick, texto = 'Agregar', icono = 'fa-plus' }) => {
  return (
    <div className="mb-3 d-flex justify-content-end">
      <button 
        className="btn btn-dark" 
        onClick={onClick} 
        style={{ backgroundColor: '#343a40', borderColor: '#343a40', color: 'white' }}
      >
        <i className={`fa ${icono} mr-2`}></i>{texto}
      </button>
    </div>
  );
};

export default AgregarButton;

