import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'donext-mode';

export default function useMode() {
  const [mode, setModeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'life' ? 'life' : 'work';
  });

  // Apply CSS custom properties when mode changes
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'life') {
      root.setAttribute('data-mode', 'life');
    } else {
      root.setAttribute('data-mode', 'work');
    }
  }, [mode]);

  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'work' ? 'life' : 'work');
  }, [mode, setMode]);

  return { mode, setMode, toggleMode };
}
