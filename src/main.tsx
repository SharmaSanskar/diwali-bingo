import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { resumeIfNeeded, setPlayOnSilent, unlockAudio } from './lib/audio';
import { loadSettings } from './lib/storage';
import './styles/index.css';

// Apply the saved iOS silent-switch preference before the first sound.
setPlayOnSilent(loadSettings().playOnSilent);

// Browsers only allow audio after a user gesture: create/resume the AudioContext on any interaction.
// iOS Safari only counts touchend/click (not pointerdown/touchstart) as an audio-unlocking gesture.
const unlock = () => unlockAudio();
for (const ev of ['pointerdown', 'touchend', 'click', 'keydown'] as const) {
  window.addEventListener(ev, unlock, { passive: true, capture: true });
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') resumeIfNeeded();
});
window.addEventListener('pageshow', resumeIfNeeded);

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
