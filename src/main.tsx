import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { checkUsersTableExists } from './services/databaseService';
import { logger } from './lib/logger';

// Minimal startup diagnostics (can be expanded or silenced in production)
checkUsersTableExists().then((exists) => {
  if (exists) {
    logger.info('Users table verified.');
  } else {
    logger.warn('Users table missing - manual creation required.');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
