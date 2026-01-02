import { useEffect } from 'react';
import { testData } from './test-data.js';

function App() {
  useEffect(() => {
    // 執行數據測試
    testData().catch(console.error);
  }, []);

  return (
    <div>
      <h1>slot-ide</h1>
      <p>請查看 Console 查看測試結果</p>
    </div>
  );
}

export default App;

