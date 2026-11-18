import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely suppress unhandled media source errors from unplayable/empty audio or video elements
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      const msg = event?.message || '';
      if (
        typeof msg === 'string' &&
        (msg.includes('has no supported sources') ||
          msg.includes('MEDIA_ELEMENT_ERROR') ||
          msg.includes('HTMLMediaElement'))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

