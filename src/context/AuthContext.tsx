/**
 * Eidos Language OS - User Identity & Progress Persistence Context
 * Single Source of Truth for learning achievements and sync.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { OverallProgressData } from '../types';
import { apiRequest } from '../services/apiClient';

interface AuthContextType {
  progress: OverallProgressData | null;
  vocabStatusMap: Record<string, 'learning' | 'mastered'>;
  isLoading: boolean;
  isSyncing: boolean;
  refreshProgress: () => Promise<void>;
  saveUnitProgress: (unitNumber: number, completed: boolean, lastPositionMs: number, deltaListenedMs?: number) => Promise<void>;
  saveWordMastery: (wordId: string, status: 'learning' | 'mastered', unitNumber: number, germanText: string, turkishText: string, englishText: string) => Promise<void>;
  getWordStatus: (wordId: string) => 'learning' | 'mastered' | 'unseen';
  resetProgress: () => Promise<void>;
  exportProgressBackup: () => Promise<any>;
  importProgressBackup: (backupData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<OverallProgressData | null>(null);
  const [vocabStatusMap, setVocabStatusMap] = useState<Record<string, 'learning' | 'mastered'>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const fetchProgress = useCallback(async () => {
    try {
      const [progressData, vocabData] = await Promise.all([
        apiRequest<OverallProgressData>('/api/v1/user/progress'),
        apiRequest<{ statusMap: Record<string, 'learning' | 'mastered'> }>('/api/v1/user/progress/vocabulary').catch(() => null),
      ]);
      if (progressData) {
        setProgress(progressData);
      }
      if (vocabData && vocabData.statusMap) {
        setVocabStatusMap(vocabData.statusMap);
      }
    } catch (err) {
      console.warn('[PROGRESS_FETCH_WARN]', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const saveUnitProgress = useCallback(async (
    unitNumber: number,
    completed: boolean,
    lastPositionMs: number,
    deltaListenedMs: number = 0
  ) => {
    setIsSyncing(true);
    try {
      await apiRequest('/api/v1/user/progress', {
        method: 'POST',
        body: JSON.stringify({
          unitNumber,
          completed,
          lastPositionMs,
          deltaListenedMs,
        }),
      });
      await fetchProgress();
    } catch (err) {
      console.error('[SAVE_PROGRESS_FAIL]', err);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchProgress]);

  const saveWordMastery = useCallback(async (
    wordId: string,
    status: 'learning' | 'mastered',
    unitNumber: number,
    germanText: string,
    turkishText: string,
    englishText: string
  ) => {
    // Optimistic local state update for zero-latency UI reaction
    setVocabStatusMap((prev) => ({
      ...prev,
      [wordId]: status,
    }));

    try {
      await apiRequest('/api/v1/user/progress/vocabulary', {
        method: 'POST',
        body: JSON.stringify({
          wordId,
          status,
          unitNumber,
          germanText,
          turkishText,
          englishText,
        }),
      });
      await fetchProgress();
    } catch (err) {
      console.error('[SAVE_WORD_MASTERY_FAIL]', err);
    }
  }, [fetchProgress]);

  const getWordStatus = useCallback((wordId: string): 'learning' | 'mastered' | 'unseen' => {
    return vocabStatusMap[wordId] || 'unseen';
  }, [vocabStatusMap]);

  const resetProgress = useCallback(async () => {
    setIsSyncing(true);
    try {
      await apiRequest('/api/v1/user/progress/reset', {
        method: 'POST',
      });
      setVocabStatusMap({});
      await fetchProgress();
    } catch (err) {
      console.error('[RESET_PROGRESS_FAIL]', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [fetchProgress]);

  const exportProgressBackup = useCallback(async () => {
    try {
      const exportRes = await apiRequest<{
        app: string;
        version: string;
        exportedAt: string;
        userId: string;
        userProgress: any[];
        userVocabulary: any[];
        bookmarks: any[];
      }>('/api/v1/user/progress/export');
      return exportRes;
    } catch (err) {
      console.error('[EXPORT_BACKUP_FAIL]', err);
      throw err;
    }
  }, []);

  const importProgressBackup = useCallback(async (backupData: any) => {
    setIsSyncing(true);
    try {
      await apiRequest('/api/v1/user/progress/import', {
        method: 'POST',
        body: JSON.stringify(backupData),
      });
      await fetchProgress();
    } catch (err) {
      console.error('[IMPORT_BACKUP_FAIL]', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [fetchProgress]);

  return (
    <AuthContext.Provider
      value={{
        progress,
        vocabStatusMap,
        isLoading,
        isSyncing,
        refreshProgress: fetchProgress,
        saveUnitProgress,
        saveWordMastery,
        getWordStatus,
        resetProgress,
        exportProgressBackup,
        importProgressBackup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
