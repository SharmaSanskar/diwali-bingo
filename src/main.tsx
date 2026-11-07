import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { unlockAudio } from './lib/audio';
import './styles/index.css';

// Browsers only allow audio after a user gesture: create/resume the AudioContext on any interaction.
const unlock = () => unlockAudio();
window.addEventListener('pointerdown', unlock, { passive: true });
window.addEventListener('keydown', unlock);

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
