import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { DEFAULT_GRAPHICS_SETTINGS, type GraphicsNotice, type GraphicsSettings, type GraphicsSettingsPatch, settingsEqual } from './graphicsTypes';
import { loadGraphicsSettings, updateGraphicsSettings } from './graphicsStore';

export type GraphicsSettingsContextValue = {
  settings: GraphicsSettings;
  notices: GraphicsNotice[];
  update: (patch: GraphicsSettingsPatch) => void;
  pushNotice: (notice: Omit<GraphicsNotice, 'ts'>) => void;
};

const GraphicsSettingsContext = createContext<GraphicsSettingsContextValue | undefined>(undefined);

function reducer(state: { settings: GraphicsSettings; notices: GraphicsNotice[] }, action: any) {
  switch (action.type) {
    case 'init':
      return { ...state, settings: action.payload };
    case 'update':
      return { ...state, settings: action.payload };
    case 'notice':
      return { ...state, notices: [...state.notices, { ...action.payload, ts: Date.now() }].slice(-6) };
    default:
      return state;
  }
}

export function GraphicsSettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { settings: DEFAULT_GRAPHICS_SETTINGS, notices: [] });
  const settingsRef = useRef(state.settings);

  useEffect(() => {
    const initial = loadGraphicsSettings();
    settingsRef.current = initial;
    dispatch({ type: 'init', payload: initial });
  }, []);

  const update = useCallback((patch: GraphicsSettingsPatch) => {
    const next = updateGraphicsSettings(settingsRef.current, patch);
    if (!settingsEqual(next, settingsRef.current)) {
      settingsRef.current = next;
      dispatch({ type: 'update', payload: next });
    }
  }, []);

  const pushNotice = useCallback((notice: Omit<GraphicsNotice, 'ts'>) => {
    dispatch({ type: 'notice', payload: notice });
  }, []);

  const value = useMemo<GraphicsSettingsContextValue>(() => ({
    settings: state.settings,
    notices: state.notices,
    update,
    pushNotice,
  }), [state.settings, state.notices, update, pushNotice]);

  return <GraphicsSettingsContext.Provider value={value}>{children}</GraphicsSettingsContext.Provider>;
}

export function useGraphicsSettings(): GraphicsSettingsContextValue {
  const ctx = useContext(GraphicsSettingsContext);
  if (!ctx) throw new Error('useGraphicsSettings must be used inside GraphicsSettingsProvider');
  return ctx;
}
