import { Slider, FileUpload } from '../../components/form/index.js';
import { useGameConfigStore } from '../../store/index.js';

/**
 * Step 5: 視覺動畫與素材
 */
export function VisualStep() {
  const {
    visualConfig,
    updateAnimationConfig,
    updateLayoutConfig,
    assets,
    symbols,
    setSymbolImage,
    removeSymbolImage,
    setOtherAsset,
    removeOtherAsset,
  } = useGameConfigStore();

  const { animation, layout } = visualConfig;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
          視覺動畫與素材
        </h2>
        <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
          調整動畫參數與上傳遊戲素材
        </p>
      </div>

      {/* 動畫參數 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 pb-2 border-b border-surface-200 dark:border-surface-700">
          動畫參數
        </h3>

        <div className="space-y-6">
          <Slider
            label="滾輪轉速"
            min={1}
            max={50}
            step={1}
            value={animation.spinSpeed}
            onChange={(e) => updateAnimationConfig({ spinSpeed: Number(e.target.value) })}
            hint="控制滾輪旋轉的速度"
          />

          <Slider
            label="旋轉時長"
            min={500}
            max={5000}
            step={100}
            value={animation.spinDuration}
            unit="ms"
            onChange={(e) => updateAnimationConfig({ spinDuration: Number(e.target.value) })}
            hint="從開始到第一輪停止的總時長"
          />

          <Slider
            label="停輪間隔"
            min={50}
            max={500}
            step={10}
            value={animation.reelStopDelay}
            unit="ms"
            onChange={(e) => updateAnimationConfig({ reelStopDelay: Number(e.target.value) })}
            hint="每輪之間的停止延遲"
          />

          <Slider
            label="緩停力度"
            min={0}
            max={1}
            step={0.1}
            value={animation.easeStrength}
            onChange={(e) => updateAnimationConfig({ easeStrength: Number(e.target.value) })}
            hint="停輪時的減速曲線強度"
          />

          <Slider
            label="回彈力度"
            min={0}
            max={1}
            step={0.1}
            value={animation.bounceStrength}
            onChange={(e) => updateAnimationConfig({ bounceStrength: Number(e.target.value) })}
            hint="停輪時的回彈效果強度"
          />
        </div>
      </div>

      {/* 盤面佈局 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 pb-2 border-b border-surface-200 dark:border-surface-700">
          盤面佈局
        </h3>

        <div className="space-y-6">
          <Slider
            label="卷軸間距"
            min={0}
            max={50}
            step={1}
            value={layout.reelGap}
            unit="px"
            onChange={(e) => updateLayoutConfig({ reelGap: Number(e.target.value) })}
            hint="各卷軸之間的間距"
          />

          <Slider
            label="符號縮放"
            min={0.5}
            max={2}
            step={0.1}
            value={layout.symbolScale}
            onChange={(e) => updateLayoutConfig({ symbolScale: Number(e.target.value) })}
            hint="符號圖示的縮放比例"
          />

          <Slider
            label="盤面縮放"
            min={0.5}
            max={2}
            step={0.1}
            value={layout.boardScale}
            onChange={(e) => updateLayoutConfig({ boardScale: Number(e.target.value) })}
            hint="整體盤面的縮放比例"
          />
        </div>
      </div>

      {/* 符號素材 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 pb-2 border-b border-surface-200 dark:border-surface-700">
          符號素材
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {symbols.map((symbol) => (
            <div key={symbol.id} className="text-center">
              <FileUpload
                label={`${symbol.id} - ${symbol.name}`}
                accept="image/*"
                maxSize={2 * 1024 * 1024}
                preview={assets.symbols?.[symbol.id] || null}
                onFileSelect={(_, dataUrl) => {
                  if (dataUrl) {
                    setSymbolImage(symbol.id, dataUrl);
                  }
                }}
                onClear={() => removeSymbolImage(symbol.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 其他素材 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 pb-2 border-b border-surface-200 dark:border-surface-700">
          其他素材
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <FileUpload
            label="盤面底圖"
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            preview={assets.board || null}
            onFileSelect={(_, dataUrl) => {
              if (dataUrl) {
                setOtherAsset('board', dataUrl);
              }
            }}
            onClear={() => removeOtherAsset('board')}
          />

          <FileUpload
            label="盤面框"
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            preview={assets.frame || null}
            onFileSelect={(_, dataUrl) => {
              if (dataUrl) {
                setOtherAsset('frame', dataUrl);
              }
            }}
            onClear={() => removeOtherAsset('frame')}
          />

          <FileUpload
            label="背景圖"
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            preview={assets.background || null}
            onFileSelect={(_, dataUrl) => {
              if (dataUrl) {
                setOtherAsset('background', dataUrl);
              }
            }}
            onClear={() => removeOtherAsset('background')}
          />

          <FileUpload
            label="人物圖"
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            preview={assets.character || null}
            onFileSelect={(_, dataUrl) => {
              if (dataUrl) {
                setOtherAsset('character', dataUrl);
              }
            }}
            onClear={() => removeOtherAsset('character')}
          />
        </div>
      </div>

      {/* 提示 */}
      <div className="p-4 bg-accent-success/10 border border-accent-success/30 rounded-lg">
        <p className="text-sm text-green-800 dark:text-green-200">
          ✨ 調整後即時生效 — 下次 Spin 時會套用新的設定
        </p>
      </div>
    </div>
  );
}

