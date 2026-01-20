import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { IDEProvider } from './store/index.jsx';
import { IDELayoutV2 } from './ide/index.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { useAuthStore } from './store/useAuthStore.js';
import { Dashboard } from './pages/Dashboard.js';

function AppContent() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/editor" element={
        <IDEProvider>
          <IDELayoutV2 />
        </IDEProvider>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
