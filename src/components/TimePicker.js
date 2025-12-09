import React, { useState, useEffect, useRef } from 'react';
import './TimePicker.css';

const TimePicker = ({ value, onChange, placeholder, id, name, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('00');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [displayValue, setDisplayValue] = useState('');
  const timePickerRef = useRef(null);

  // Convertir hora de formato backend (00-23) a formato visual (01-23, 00)
  // El backend envía 00-23, y lo mostramos como 01-23, 00 (donde 00 es medianoche)
  const convertirHoraBackendAVisual = (horaBackend) => {
    const horaNum = parseInt(horaBackend);
    // 00 del backend se muestra como 00 (medianoche)
    // 01-23 del backend se muestran como 01-23
    return String(horaNum).padStart(2, '0');
  };

  // Convertir hora de formato visual (01-23, 00) a formato backend (00-23)
  // El selector muestra 01-23, 00 (donde 00 es medianoche)
  const convertirHoraVisualABackend = (horaVisual) => {
    const horaNum = parseInt(horaVisual);
    // 00 visual se envía como 00 al backend (medianoche)
    // 01-23 visual se envían como 01-23 al backend
    return String(horaNum).padStart(2, '0');
  };

  // Parsear el valor inicial (viene del backend en formato 00-23, lo mostramos como 01-23, 00)
  useEffect(() => {
    if (value) {
      const parts = value.split(':');
      if (parts.length >= 2) {
        const hourBackend = parts[0].padStart(2, '0');
        const minute = parts[1].padStart(2, '0');
        // Convertir de formato backend (00-23) a formato visual (01-23, 00)
        const hourVisual = convertirHoraBackendAVisual(hourBackend);
        setSelectedHour(hourVisual);
        setSelectedMinute(minute);
        setDisplayValue(`${hourVisual}:${minute}`);
      } else {
        setDisplayValue('');
      }
    } else {
      setSelectedHour('01'); // Valor por defecto: 01
      setSelectedMinute('00');
      setDisplayValue('');
    }
  }, [value]);

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Generar arrays de horas (01-23, 00) y minutos (00-59)
  // Mostrar 01-23 y luego 00 (donde 00 representa las 12 de la noche/medianoche)
  const hours = [
    ...Array.from({ length: 23 }, (_, i) => String(i + 1).padStart(2, '0')), // 01-23
    '00' // 00 al final (medianoche)
  ];
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const handleHourChange = (hourVisual) => {
    setSelectedHour(hourVisual);
    const newValueVisual = `${hourVisual}:${selectedMinute}`;
    setDisplayValue(newValueVisual);
    
    // Convertir de formato visual (01-23, 00) a formato backend (00-23) para enviar
    const hourBackend = convertirHoraVisualABackend(hourVisual);
    const newValueBackend = `${hourBackend}:${selectedMinute}`;
    
    if (onChange) {
      const syntheticEvent = {
        target: {
          name: name,
          value: newValueBackend, // Enviar en formato backend
        },
      };
      onChange(syntheticEvent);
    }
  };

  const handleMinuteChange = (minute) => {
    setSelectedMinute(minute);
    const newValueVisual = `${selectedHour}:${minute}`;
    setDisplayValue(newValueVisual);
    
    // Convertir de formato visual (01-23, 00) a formato backend (00-23) para enviar
    const hourBackend = convertirHoraVisualABackend(selectedHour);
    const newValueBackend = `${hourBackend}:${minute}`;
    
    if (onChange) {
      const syntheticEvent = {
        target: {
          name: name,
          value: newValueBackend, // Enviar en formato backend
        },
      };
      onChange(syntheticEvent);
    }
  };

  const handleInputClick = () => {
    setIsOpen(!isOpen);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    // Validar formato HH:mm (01-23, 00 para visualización)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]|00):[0-5][0-9]$/;
    if (timeRegex.test(inputValue)) {
      const parts = inputValue.split(':');
      let hourVisual = parts[0].padStart(2, '0');
      const minute = parts[1].padStart(2, '0');
      
      // Validar que la hora esté entre 00 y 23
      const hourNum = parseInt(hourVisual);
      if (hourNum >= 0 && hourNum <= 23) {
        // Si es 00, mantenerlo como 00 (medianoche)
        // Si es 01-23, mantenerlo igual
        setSelectedHour(hourVisual);
        setSelectedMinute(minute);
        
        // Convertir de formato visual (01-23, 00) a formato backend (00-23) para enviar
        const hourBackend = convertirHoraVisualABackend(hourVisual);
        const valueBackend = `${hourBackend}:${minute}`;
        
        if (onChange) {
          const syntheticEvent = {
            target: {
              name: name,
              value: valueBackend, // Enviar en formato backend
            },
          };
          onChange(syntheticEvent);
        }
      }
    }
  };

  const handleInputBlur = (e) => {
    // Si el valor no es válido, restaurar el último valor válido
    const timeRegex = /^([0-1]?[0-9]|2[0-3]|00):[0-5][0-9]$/;
    if (!timeRegex.test(e.target.value) && displayValue) {
      setDisplayValue(displayValue);
    }
  };

  return (
    <div className="time-picker-wrapper" ref={timePickerRef}>
      <div className="time-picker-input-container">
        <input
          type="text"
          className="form-control time-picker-input"
          id={id}
          name={name}
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onClick={handleInputClick}
          placeholder={placeholder || 'HH:mm'}
          required={required}
          style={{ fontSize: '0.875rem' }}
        />
        <i className="fa fa-clock time-picker-icon" onClick={handleInputClick}></i>
      </div>
      
      {isOpen && (
        <div className="time-picker-dropdown">
          <div className="time-picker-columns">
            <div className="time-picker-column">
              <div className="time-picker-column-header">Hora</div>
              <div className="time-picker-scrollable">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className={`time-picker-option ${
                      selectedHour === hour ? 'time-picker-option-selected' : ''
                    }`}
                    onClick={() => handleHourChange(hour)}
                  >
                    {hour}
                  </div>
                ))}
              </div>
            </div>
            <div className="time-picker-column">
              <div className="time-picker-column-header">Minutos</div>
              <div className="time-picker-scrollable">
                {minutes.map((minute) => (
                  <div
                    key={minute}
                    className={`time-picker-option ${
                      selectedMinute === minute ? 'time-picker-option-selected' : ''
                    }`}
                    onClick={() => handleMinuteChange(minute)}
                  >
                    {minute}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="time-picker-footer">
            <button
              type="button"
              className="time-picker-cancel-btn"
              onClick={handleCancel}
            >
              <i className="fa fa-times"></i> Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;

