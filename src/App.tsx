import { IDEProvider } from './store/index.jsx';
import { IDELayoutV2 } from './ide/index.js';

function App() {
  return (
    <IDEProvider>
      <IDELayoutV2 />
    </IDEProvider>
  );
}

export default App;

