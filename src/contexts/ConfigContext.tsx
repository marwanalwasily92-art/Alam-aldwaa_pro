import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserConfig } from '../types';
import { encryptData, decryptData } from '../lib/encryption';

interface ConfigContextType {
  config: UserConfig | null;
  saveConfig: (config: UserConfig) => void;
  showApiKeyModal: boolean;
  setShowApiKeyModal: (show: boolean) => void;
  showInstructionsModal: boolean;
  setShowInstructionsModal: (show: boolean) => void;
}

const ConfigContext = createContext<ConfigContextType>({
  config: null,
  saveConfig: () => {},
  showApiKeyModal: false,
  setShowApiKeyModal: () => {},
  showInstructionsModal: false,
  setShowInstructionsModal: () => {},
});

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const showApiKeyModal = searchParams.get('modal') === 'apiKey';
  const showInstructionsModal = searchParams.get('modal') === 'instructions';

  const setShowApiKeyModal = (show: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (show) {
      newParams.set('modal', 'apiKey');
    } else {
      newParams.delete('modal');
    }
    setSearchParams(newParams);
  };

  const setShowInstructionsModal = (show: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (show) {
      newParams.set('modal', 'instructions');
    } else {
      newParams.delete('modal');
    }
    setSearchParams(newParams);
  };

  useEffect(() => {
    const savedConfig = localStorage.getItem('pharma_world_config');
    if (savedConfig) {
      try {
        const decrypted = decryptData(savedConfig);
        const parsed = JSON.parse(decrypted);
        if (parsed.model === 'gemini-3-flash-preview' || parsed.model === 'gemini-1.5-flash' || parsed.model === 'gemini-2.0-flash' || parsed.model === 'gemini-2.0-flash-exp') parsed.model = 'gemini-3.0-flash';
        if (parsed.model === 'gemini-3.1-pro-preview' || parsed.model === 'gemini-1.5-pro' || parsed.model === 'gemini-3.0-pro' || parsed.model === 'gemini-2.0-pro-exp-02-05') parsed.model = 'gemini-3.1-pro';
        
        const validModels = ['gemini-3.0-flash', 'gemini-3.1-pro'];
        if (!validModels.includes(parsed.model)) {
          parsed.model = 'gemini-3.0-flash';
        }
        
        setConfig(parsed);
        localStorage.setItem('pharma_world_config', encryptData(JSON.stringify(parsed)));
      } catch (e) {
        console.error("Failed to parse config", e);
      }
    } else {
      // Set default config if none exists
      const defaultConfig: UserConfig = {
        apiKey: '',
        model: 'gemini-3.0-flash'
      };
      setConfig(defaultConfig);
      localStorage.setItem('pharma_world_config', encryptData(JSON.stringify(defaultConfig)));
    }
  }, []);

  const saveConfig = (newConfig: UserConfig) => {
    setConfig(newConfig);
    localStorage.setItem('pharma_world_config', encryptData(JSON.stringify(newConfig)));
    setShowApiKeyModal(false);
  };

  return (
    <ConfigContext.Provider value={{
      config,
      saveConfig,
      showApiKeyModal,
      setShowApiKeyModal,
      showInstructionsModal,
      setShowInstructionsModal
    }}>
      {children}
    </ConfigContext.Provider>
  );
};
