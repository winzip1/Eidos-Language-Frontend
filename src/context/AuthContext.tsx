/**
 * Eidos Language OS - User Identity, Authentication & Progress Persistence Context
 * Single Source of Truth for Session, RBAC, and Cross-User Isolated Progress.
 * Zero Hardcode, Fail-Loud Error Handling, Strictly Light Mode.
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { OverallProgressData, AuthUser, AuthResponse } from '../types';
import {
  apiRequest,
  getStoredAuthToken,
  setStoredAuthToken,
  clearStoredAuthToken,
  getCachedAuthUser,
  setCachedAuthUser,
  clearCachedAuthUser,
  setOnUnauthorizedHandler,
  AUTH_TOKEN_KEY,
  LEGACY_AUTH_TOKEN_KEY,
} from '../services/apiClient';
import { useDictionary } from './DictionaryContext';
import { toast } from 'sonner';

export interface AuthContextType {
  // Session & Identity State
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAuthChecking: boolean;

  // Auth Modal State (Prepared for Phase 7 Auth Dialogs)
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;

  // Session Operations
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, email: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;

  // Progress & Learning State (100% Backwards Compatible)
  progress: OverallProgressData | null;
  vocabStatusMap: Record<string, 'learning' | 'mastered'>;
  isLoading: boolean;
  isSyncing: boolean;
  refreshProgress: (courseId?: string) => Promise<void>;
  saveUnitProgress: (
    unitNumber: number,
    completed: boolean,
    lastPositionMs: number,
    deltaListenedMs?: number,
    courseId?: string
  ) => Promise<void>;
  saveWordMastery: (
    wordId: string,
    status: 'learning' | 'mastered',
    unitNumber: number,
    germanText: string,
    turkishText: string,
    englishText: string
  ) => Promise<void>;
  getWordStatus: (wordId: string) => 'learning' | 'mastered' | 'unseen';
  resetProgress: (courseId?: string) => Promise<void>;
  exportProgressBackup: () => Promise<any>;
  importProgressBackup: (backupData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dict } = useDictionary();

  // User & Session State (Instant synchronous hydration from cache to prevent UI flicker)
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = getStoredAuthToken();
    return stored ? getCachedAuthUser() : null;
  });
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Progress State
  const [progress, setProgress] = useState<OverallProgressData | null>(null);
  const [vocabStatusMap, setVocabStatusMap] = useState<Record<string, 'learning' | 'mastered'>>({});
  const [isProgressLoading, setIsProgressLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const lastQueriedCourseIdRef = useRef<string | undefined>(undefined);
  const fetchRequestIdRef = useRef<number>(0);

  // Derived Auth Values
  const isAuthenticated = Boolean(user && token);
  const isAdmin = Boolean(user?.role === 'admin');
  const isLoading = isAuthChecking || isProgressLoading;

  // 1. Fetch User Progress (Isolated per User/Session with Stale-Request Guard)
  const fetchProgress = useCallback(async (courseId?: string) => {
    const currentRequestId = ++fetchRequestIdRef.current;
    try {
      const effectiveCourseId = courseId !== undefined ? courseId : lastQueriedCourseIdRef.current;
      if (courseId !== undefined) {
        lastQueriedCourseIdRef.current = courseId;
      }
      const queryParam = effectiveCourseId ? `?courseId=${encodeURIComponent(effectiveCourseId)}` : '';
      const [progressData, vocabData] = await Promise.all([
        apiRequest<OverallProgressData>(`/api/v1/user/progress${queryParam}`),
        apiRequest<{ statusMap: Record<string, 'learning' | 'mastered'> }>('/api/v1/user/progress/vocabulary').catch(() => null),
      ]);

      // Drop stale responses if a newer request was initiated in the meantime
      if (currentRequestId !== fetchRequestIdRef.current) {
        return;
      }

      if (progressData) {
        setProgress(progressData);
      }
      if (vocabData && vocabData.statusMap) {
        setVocabStatusMap(vocabData.statusMap);
      }
    } catch (err: any) {
      if (currentRequestId !== fetchRequestIdRef.current) return;
      console.warn('[PROGRESS_FETCH_WARN]', err);
      const msg = err?.message || 'İlerleme verileri sunucudan yüklenemedi.';
      const code = err?.statusCode ? `HTTP ${err.statusCode}` : 'Ağ / Senkronizasyon Hatası';
      toast.error(msg, { description: code });
    } finally {
      if (currentRequestId === fetchRequestIdRef.current) {
        setIsProgressLoading(false);
      }
    }
  }, []);

  // 2. Initial Session Bootstrap & Hydration on Mount (Safe against network drops)
  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      setIsAuthChecking(true);
      const storedToken = getStoredAuthToken();

      if (storedToken) {
        try {
          const res = await apiRequest<{ user: AuthUser }>('/api/v1/auth/me');
          if (isMounted && res?.user) {
            setUser(res.user);
            setToken(storedToken);
            setCachedAuthUser(res.user);
          }
        } catch (err: any) {
          console.warn('[AUTH_BOOTSTRAP_WARN]', err);
          if (isMounted) {
            // Only invalidate token if server explicitly rejected credentials (401 or 403 Suspended)
            const isAuthRejection =
              err?.statusCode === 401 ||
              (err?.statusCode === 403 && err?.code === 'ACCOUNT_SUSPENDED');

            if (isAuthRejection) {
              clearStoredAuthToken();
              clearCachedAuthUser();
              setUser(null);
              setToken(null);
            } else {
              // Network error or server glitch: preserve token and fall back to cached user profile
              const cached = getCachedAuthUser();
              if (cached) {
                setUser(cached);
                setToken(storedToken);
              }
            }
          }
        }
      } else {
        if (isMounted) {
          clearCachedAuthUser();
          setUser(null);
          setToken(null);
        }
      }

      if (isMounted) {
        setIsAuthChecking(false);
        try {
          const savedCourseId = localStorage.getItem('eidos_active_course_id');
          await fetchProgress(savedCourseId || undefined);
        } catch {
          await fetchProgress();
        }
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [fetchProgress]);

  // 3. Multi-Tab Session Synchronization via Storage Event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_TOKEN_KEY || e.key === LEGACY_AUTH_TOKEN_KEY) {
        const latestToken = getStoredAuthToken();
        if (!latestToken && token) {
          // Logged out in another tab
          setUser(null);
          setToken(null);
          clearCachedAuthUser();
          setProgress(null);
          setVocabStatusMap({});
          fetchProgress();
        } else if (latestToken && latestToken !== token) {
          // Logged in as a different user in another tab
          setToken(latestToken);
          const cached = getCachedAuthUser();
          if (cached) setUser(cached);
          setProgress(null);
          setVocabStatusMap({});
          fetchProgress();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [token, fetchProgress]);

  // 4. 401 & 403 Session Invalidation Interceptor Subscription
  useEffect(() => {
    const unsubscribe = setOnUnauthorizedHandler((err) => {
      setUser(null);
      setToken(null);
      clearStoredAuthToken();
      clearCachedAuthUser();

      // Wipe state memory to prevent cross-user contamination
      setProgress(null);
      setVocabStatusMap({});
      fetchProgress();

      if (err.code === 'ACCOUNT_SUSPENDED') {
        toast.error(dict.auth.accountSuspended, {
          description: dict.auth.accountSuspendedDesc,
        });
      } else {
        toast.error(dict.auth.sessionExpired, {
          description: dict.auth.sessionExpiredDesc,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dict, fetchProgress]);

  // Modal Controls
  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // 5. Login Action
  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await apiRequest<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!res?.user || !res?.token) {
        throw new Error('Geçersiz sunucu oturum yanıtı.');
      }

      setStoredAuthToken(res.token);
      setCachedAuthUser(res.user);
      setToken(res.token);
      setUser(res.user);
      setIsAuthModalOpen(false);

      // Wipe current in-memory progress to guarantee zero cross-user pollution
      setProgress(null);
      setVocabStatusMap({});

      // Freshly load new user's progress
      await fetchProgress();

      toast.success(dict.auth.loginSuccess, {
        description: res.user.displayName,
      });
    } catch (err: any) {
      if (err?.code === 'ACCOUNT_SUSPENDED') {
        toast.error(dict.auth.accountSuspended, {
          description: dict.auth.accountSuspendedDesc,
        });
      } else {
        const errorDesc = err?.statusCode ? `HTTP ${err.statusCode} (${err.code})` : undefined;
        toast.error(err?.message || dict.auth.loginTitle, {
          description: errorDesc,
        });
      }
      throw err;
    }
  }, [dict, fetchProgress]);

  // 6. Register Action
  const register = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const res = await apiRequest<AuthResponse>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName }),
      });

      if (!res?.user || !res?.token) {
        throw new Error('Geçersiz sunucu kayıt yanıtı.');
      }

      setStoredAuthToken(res.token);
      setCachedAuthUser(res.user);
      setToken(res.token);
      setUser(res.user);
      setIsAuthModalOpen(false);

      // Clean in-memory progress and load fresh user profile data
      setProgress(null);
      setVocabStatusMap({});
      await fetchProgress();

      toast.success(dict.auth.registerSuccess, {
        description: res.user.displayName,
      });
    } catch (err: any) {
      if (err?.code === 'REGISTRATION_DISABLED') {
        toast.error(dict.auth.registrationDisabled, {
          description: dict.auth.registrationDisabledDesc,
        });
      } else {
        const errorDesc = err?.statusCode ? `HTTP ${err.statusCode} (${err.code})` : undefined;
        toast.error(err?.message || dict.auth.registerTitle, {
          description: errorDesc,
        });
      }
      throw err;
    }
  }, [dict, fetchProgress]);

  // 7. Logout Action
  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      clearStoredAuthToken();
      clearCachedAuthUser();
      setToken(null);
      setUser(null);

      // Reset state and re-fetch guest progress
      setProgress(null);
      setVocabStatusMap({});
      await fetchProgress();

      toast.success(dict.auth.loggedOutSuccess);
    }
  }, [dict, fetchProgress]);

  // 8. Update Profile Action
  const updateProfile = useCallback(async (displayName: string, email: string) => {
    try {
      const res = await apiRequest<{ user: AuthUser; token?: string }>('/api/v1/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ displayName, email }),
      });

      if (res?.token) {
        setStoredAuthToken(res.token);
        setToken(res.token);
      }
      if (res?.user) {
        setUser(res.user);
        setCachedAuthUser(res.user);
      }

      toast.success(dict.accountSettings.profileUpdatedSuccess);
    } catch (err: any) {
      const errorDesc = err?.statusCode ? `HTTP ${err.statusCode} (${err.code})` : undefined;
      toast.error(err?.message || dict.accountSettings.title, {
        description: errorDesc,
      });
      throw err;
    }
  }, [dict]);

  // 9. Change Password Action
  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    try {
      const res = await apiRequest<{ message: string; token?: string }>('/api/v1/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
      });

      if (res?.token) {
        setStoredAuthToken(res.token);
        setToken(res.token);
      }

      toast.success(dict.accountSettings.passwordChangedSuccess);
    } catch (err: any) {
      const errorDesc = err?.statusCode ? `HTTP ${err.statusCode} (${err.code})` : undefined;
      toast.error(err?.message || dict.accountSettings.changePasswordTitle, {
        description: errorDesc,
      });
      throw err;
    }
  }, [dict]);

  // 10. Preserved Unit Progress Persistence
  const saveUnitProgress = useCallback(async (
    unitNumber: number,
    completed: boolean,
    lastPositionMs: number,
    deltaListenedMs: number = 0,
    courseId?: string
  ) => {
    setIsSyncing(true);
    try {
      const effectiveCourseId = courseId || lastQueriedCourseIdRef.current;
      await apiRequest('/api/v1/user/progress', {
        method: 'POST',
        body: JSON.stringify({
          unitNumber,
          completed,
          lastPositionMs,
          deltaListenedMs,
          ...(effectiveCourseId ? { courseId: effectiveCourseId } : {}),
        }),
      });
      await fetchProgress(effectiveCourseId);
    } catch (err) {
      console.error('[SAVE_PROGRESS_FAIL]', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [fetchProgress]);

  // 11. Preserved Word Mastery Persistence
  const saveWordMastery = useCallback(async (
    wordId: string,
    status: 'learning' | 'mastered',
    unitNumber: number,
    germanText: string,
    turkishText: string,
    englishText: string
  ) => {
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
      throw err;
    }
  }, [fetchProgress]);

  const getWordStatus = useCallback((wordId: string): 'learning' | 'mastered' | 'unseen' => {
    return vocabStatusMap[wordId] || 'unseen';
  }, [vocabStatusMap]);

  // 12. Preserved Reset Progress Action
  const resetProgress = useCallback(async (courseId?: string) => {
    setIsSyncing(true);
    try {
      const effectiveCourseId = courseId || lastQueriedCourseIdRef.current;
      const url = effectiveCourseId
        ? `/api/v1/user/progress/reset?courseId=${encodeURIComponent(effectiveCourseId)}`
        : '/api/v1/user/progress/reset';
      await apiRequest(url, {
        method: 'POST',
      });
      setVocabStatusMap({});
      await fetchProgress(effectiveCourseId);
    } catch (err) {
      console.error('[RESET_PROGRESS_FAIL]', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [fetchProgress]);

  // 13. Preserved Export Backup Action
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

  // 14. Preserved Import Backup Action
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
        user,
        token,
        isAuthenticated,
        isAdmin,
        isAuthChecking,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
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
