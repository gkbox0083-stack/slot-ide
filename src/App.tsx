import { IDEProvider } from './store/index.jsx';
import { IDELayout } from './ide/index.js';

function App() {
  return (
    <IDEProvider>
      <IDELayout />
    </IDEProvider>
  );
}

export default App;

