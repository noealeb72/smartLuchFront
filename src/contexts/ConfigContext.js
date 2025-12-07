import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadConfig, reloadConfig as reloadConfigService } from '../services/configService';

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig debe usarse dentro de ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      // Siempre cargar desde el archivo, forzar recarga
      const loadedConfig = await loadConfig(false);
      setConfig(loadedConfig);
      setError(null);
      console.log('✅ ConfigContext: Configuración cargada desde public/config.json');
    } catch (err) {
      console.error('❌ Error cargando configuración en ConfigContext:', err);
      setError(err.message);
      // Configuración por defecto solo si hay un error crítico
      // loadConfig() ya maneja los valores por defecto, así que esto no debería ejecutarse normalmente
      setConfig({
        apiBaseUrl: 'http://localhost:8000',
        totemId: 'T001',
        bloqueos: {
          Admin: false,
          Cocina: false,
          Comensal: false,
          Gerencia: false
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const reloadConfig = async () => {
    try {
      setLoading(true);
      const loadedConfig = await reloadConfigService();
      setConfig(loadedConfig);
      setError(null);
      return loadedConfig;
    } catch (err) {
      console.error('Error recargando configuración:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Al iniciar la aplicación, SIEMPRE cargar desde public/config.json
    // No usar caché, forzar lectura del archivo
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, error, reloadConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

