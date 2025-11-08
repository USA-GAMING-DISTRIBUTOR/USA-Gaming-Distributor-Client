import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch } from './hooks/redux';
import { initializeAuth } from './store/authSlice';
import { checkDatabaseSetup } from './utils/setupHelper';
import AppRouter from './routes/AppRouter';
import ErrorBoundary from './components/common/ErrorBoundary';
import DevEnvBanner from './components/common/DevEnvBanner';
import { useEnvDiagnostics } from './hooks/useEnvDiagnostics';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize the database and auth state
    const init = async () => {
      // Check database setup and initialize
      await checkDatabaseSetup();
      // Initialize auth state from localStorage
      dispatch(initializeAuth());
    };

    init();
  }, [dispatch]);

  return (
    <ErrorBoundary>
      {import.meta.env.DEV && <DevDiagnostics />}
      <AppRouter />
    </ErrorBoundary>
  );
};

// Small internal component to keep AppContent tidy
const DevDiagnostics: React.FC = () => {
  const { warnings } = useEnvDiagnostics();
  return <DevEnvBanner messages={warnings} />;
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
}

export default App;
