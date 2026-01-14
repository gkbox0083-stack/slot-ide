import { IDEProvider } from './store/index.jsx';
import { IDELayoutV2 } from './ide/index.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';

function App() {
  return (
    <ErrorBoundary>
      <IDEProvider>
        <IDELayoutV2 />
      </IDEProvider>
    </ErrorBoundary>
  );
}

export default App;

