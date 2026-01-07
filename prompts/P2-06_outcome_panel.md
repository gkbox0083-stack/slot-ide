# P2-06 OutcomePanel 擴展（NG/FG 切換）

## 目標 (Objective)

擴展 OutcomePanel 支援 NG/FG 切換功能，包括：
- 頂部切換器 [Base Game | Free Game]
- 分別管理 NG Outcomes 和 FG Outcomes
- CRUD 操作

---

## 範圍 (Scope)

需要修改的檔案：
- `src/ide/panels/OutcomePanel.tsx`

依賴：
- P1-01（型別定義擴展）
- P2-02（左側 Control Panel）

---

## 實作細節 (Implementation Details)

### OutcomePanel.tsx 完整重構

```tsx
import React, { useState } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore';
import type { Outcome, GamePhase } from '../../types/outcome';

export function OutcomePanel() {
  const [activePhase, setActivePhase] = useState<GamePhase>('ng');
  const { 
    outcomeConfig, 
    addOutcome, 
    updateOutcome, 
    removeOutcome 
  } = useGameConfigStore();

  const outcomes = activePhase === 'ng' 
    ? outcomeConfig.ngOutcomes 
    : outcomeConfig.fgOutcomes;

  return (
    <div className="outcome-panel">
      {/* 切換器 */}
      <div className="phase-switcher">
        <button
          className={`phase-btn ${activePhase === 'ng' ? 'active' : ''}`}
          onClick={() => setActivePhase('ng')}
        >
          Base Game
        </button>
        <button
          className={`phase-btn ${activePhase === 'fg' ? 'active' : ''}`}
          onClick={() => setActivePhase('fg')}
        >
          Free Game
        </button>
      </div>

      {/* Outcome 列表 */}
      <div className="outcome-list">
        {outcomes.map((outcome) => (
          <OutcomeItem
            key={outcome.id}
            outcome={outcome}
            onUpdate={updateOutcome}
            onDelete={() => removeOutcome(outcome.id)}
          />
        ))}
      </div>

      {/* 新增 Outcome */}
      <AddOutcomeButton phase={activePhase} onAdd={addOutcome} />
    </div>
  );
}

interface OutcomeItemProps {
  outcome: Outcome;
  onUpdate: (outcome: Outcome) => void;
  onDelete: () => void;
}

function OutcomeItem({ outcome, onUpdate, onDelete }: OutcomeItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState(outcome);

  if (!isEditing) {
    return (
      <div className="outcome-item">
        <div className="outcome-header">
          <span className="outcome-name">{outcome.name}</span>
        </div>
        <div className="outcome-details">
          <span>倍率: {outcome.multiplierRange.min}x - {outcome.multiplierRange.max}x</span>
          <span>權重: {outcome.weight}</span>
        </div>
        <div className="outcome-actions">
          <button onClick={() => setIsEditing(true)}>編輯</button>
          <button onClick={onDelete} className="delete">刪除</button>
        </div>
      </div>
    );
  }

  return (
    <div className="outcome-item editing">
      <div className="form-row">
        <label>名稱</label>
        <input
          value={edited.name}
          onChange={(e) => setEdited({ ...edited, name: e.target.value })}
        />
      </div>
      <div className="form-row">
        <label>最小倍率</label>
        <input
          type="number"
          value={edited.multiplierRange.min}
          onChange={(e) => setEdited({
            ...edited,
            multiplierRange: { ...edited.multiplierRange, min: Number(e.target.value) }
          })}
        />
      </div>
      <div className="form-row">
        <label>最大倍率</label>
        <input
          type="number"
          value={edited.multiplierRange.max}
          onChange={(e) => setEdited({
            ...edited,
            multiplierRange: { ...edited.multiplierRange, max: Number(e.target.value) }
          })}
        />
      </div>
      <div className="form-row">
        <label>權重</label>
        <input
          type="number"
          value={edited.weight}
          onChange={(e) => setEdited({ ...edited, weight: Number(e.target.value) })}
        />
      </div>
      <div className="form-actions">
        <button onClick={() => { onUpdate(edited); setIsEditing(false); }}>儲存</button>
        <button onClick={() => setIsEditing(false)} className="cancel">取消</button>
      </div>
    </div>
  );
}

interface AddOutcomeButtonProps {
  phase: GamePhase;
  onAdd: (outcome: Omit<Outcome, 'id'>) => void;
}

function AddOutcomeButton({ phase, onAdd }: AddOutcomeButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [newOutcome, setNewOutcome] = useState({
    name: '',
    multiplierRange: { min: 0, max: 0 },
    weight: 100,
  });

  const handleAdd = () => {
    if (!newOutcome.name) return;
    onAdd({ ...newOutcome, phase });
    setShowForm(false);
    setNewOutcome({ name: '', multiplierRange: { min: 0, max: 0 }, weight: 100 });
  };

  if (!showForm) {
    return (
      <button className="add-outcome-btn" onClick={() => setShowForm(true)}>
        + 新增 Outcome
      </button>
    );
  }

  return (
    <div className="add-outcome-form">
      <div className="form-row">
        <label>名稱</label>
        <input
          value={newOutcome.name}
          onChange={(e) => setNewOutcome({ ...newOutcome, name: e.target.value })}
        />
      </div>
      <div className="form-row">
        <label>倍率範圍</label>
        <div className="range-inputs">
          <input
            type="number"
            value={newOutcome.multiplierRange.min}
            onChange={(e) => setNewOutcome({
              ...newOutcome,
              multiplierRange: { ...newOutcome.multiplierRange, min: Number(e.target.value) }
            })}
          />
          <span>-</span>
          <input
            type="number"
            value={newOutcome.multiplierRange.max}
            onChange={(e) => setNewOutcome({
              ...newOutcome,
              multiplierRange: { ...newOutcome.multiplierRange, max: Number(e.target.value) }
            })}
          />
        </div>
      </div>
      <div className="form-row">
        <label>權重</label>
        <input
          type="number"
          value={newOutcome.weight}
          onChange={(e) => setNewOutcome({ ...newOutcome, weight: Number(e.target.value) })}
        />
      </div>
      <div className="form-actions">
        <button onClick={handleAdd}>新增</button>
        <button onClick={() => setShowForm(false)} className="cancel">取消</button>
      </div>
    </div>
  );
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 頂部切換器 [Base Game | Free Game] 正常顯示
- [ ] 切換後顯示對應的 Outcomes 列表
- [ ] CRUD 操作正確存取對應的 phase
- [ ] `npm run build` 成功

