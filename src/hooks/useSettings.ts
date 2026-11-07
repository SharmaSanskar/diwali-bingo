import { useCallback, useEffect, useState } from 'react';
import { setMuted, setVolume } from '../lib/audio';
import { loadSettings, saveSettings, type Settings } from '../lib/storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
    setMuted(settings.muted);
    setVolume(settings.volume);
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  return { settings, update };
}
