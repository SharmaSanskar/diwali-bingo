import { useCallback, useEffect, useState } from 'react';
import { setMuted, setPlayOnSilent, setVolume } from '../lib/audio';
import { loadSettings, saveSettings, type Settings } from '../lib/storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
    setMuted(settings.muted);
    setVolume(settings.volume);
    setPlayOnSilent(settings.playOnSilent);
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  return { settings, update };
}
