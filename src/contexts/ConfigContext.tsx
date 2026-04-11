import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserConfig } from '../types';
import { encryptData, decryptData } from '../lib/encryption';

interface ConfigContextType {
  config: UserConfig | null;
  saveConfig: (config: UserConfig) => void;
}

const ConfigContext = createContext<ConfigContextType>({
  config: null,
  saveConfig: () => {},
});

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const savedConfig = localStorage.getItem('pharma_world_config');
    if (savedConfig) {
      try {
        const decrypted = decryptData(savedConfig);
        const parsed = JSON.parse(decrypted);
        if (parsed.model === 'gemini-2.0-flash' || parsed.model === 'gemini-2.0-flash-exp') parsed.model = 'gemini-3-flash-preview';
        if (parsed.model === 'gemini-1.5-pro' || parsed.model === 'gemini-3.0-pro' || parsed.model === 'gemini-2.0-pro-exp-02-05') parsed.model = 'gemini-3-flash-preview';
        
        const validModels = ['gemini-3-flash-preview'];
        if (!validModels.includes(parsed.model)) {
          parsed.model = 'gemini-3-flash-preview';
        }
        
        setConfig(parsed);
        localStorage.setItem('pharma_world_config', encryptData(JSON.stringify(parsed)));
      } catch (e) {
        console.error("Failed to parse config", e);
      }
    } else {
      // Set default config if none exists
      const defaultConfig: UserConfig = {
        model: 'gemini-3-flash-preview'
      };
      setConfig(defaultConfig);
      localStorage.setItem('pharma_world_config', encryptData(JSON.stringify(defaultConfig)));
    }
  }, []);

  const saveConfig = (newConfig: UserConfig) => {
    setConfig(newConfig);
    localStorage.setItem('pharma_world_config', encryptData(JSON.stringify(newConfig)));
  };

  return (
    <ConfigContext.Provider value={{
      config,
      saveConfig
    }}>
      {children}
    </ConfigContext.Provider>
  );
};
