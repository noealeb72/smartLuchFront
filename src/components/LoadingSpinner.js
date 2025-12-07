import React from 'react';

const LoadingSpinner = ({ message = 'Cargando...' }) => {
  return (
    <div className="se-pre-con">
      <span className="sr-only">{message}</span>
    </div>
  );
};

export default React.memo(LoadingSpinner);

