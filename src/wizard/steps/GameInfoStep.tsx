import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextInput, NumberInput } from '../../components/form/index.js';
import { useGameConfigStore } from '../../store/index.js';
import { gameInfoSchema, type GameInfoFormData } from '../schemas/index.js';

/**
 * Step 1: 遊戲基本資料
 */
export function GameInfoStep() {
  const { gameName, baseBet, setGameName, setBaseBet } = useGameConfigStore();

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<GameInfoFormData>({
    resolver: zodResolver(gameInfoSchema),
    defaultValues: {
      gameName,
      baseBet,
    },
  });

  // 監聽表單變化並即時更新 store
  const watchedGameName = watch('gameName');
  const watchedBaseBet = watch('baseBet');

  useEffect(() => {
    if (watchedGameName && watchedGameName !== gameName) {
      setGameName(watchedGameName);
    }
  }, [watchedGameName, gameName, setGameName]);

  useEffect(() => {
    if (watchedBaseBet && watchedBaseBet !== baseBet) {
      setBaseBet(watchedBaseBet);
    }
  }, [watchedBaseBet, baseBet, setBaseBet]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
          遊戲基本資料
        </h2>
        <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
          設定您的老虎機遊戲基本參數
        </p>
      </div>

      <form className="space-y-6">
        <TextInput
          label="遊戲名稱"
          placeholder="請輸入遊戲名稱"
          error={errors.gameName?.message}
          hint="為您的老虎機取一個獨特的名稱"
          registration={register('gameName')}
        />

        <NumberInput
          label="基礎投注 (Base Bet)"
          placeholder="1"
          min={0.01}
          max={10000}
          step={0.01}
          error={errors.baseBet?.message}
          hint="每次旋轉的基礎投注金額"
          registration={register('baseBet', { valueAsNumber: true })}
        />
      </form>

      <div className="panel p-4 mt-6">
        <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
          目前設定
        </h3>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-surface-500 dark:text-surface-400">遊戲名稱</dt>
            <dd className="font-semibold text-surface-900 dark:text-surface-100">
              {gameName || '未設定'}
            </dd>
          </div>
          <div>
            <dt className="text-surface-500 dark:text-surface-400">基礎投注</dt>
            <dd className="font-semibold text-surface-900 dark:text-surface-100">
              {baseBet}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

