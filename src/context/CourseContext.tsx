/**
 * Eidos Language OS - Central Course & Multi-Language State Context
 * Single Source of Truth for active study language, available courses catalog, and level selection.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { LanguageCourseMeta, ActiveLanguageState } from '../types';
import { useDictionary } from './DictionaryContext';
import { apiRequest } from '../services/apiClient';
import { toast } from 'sonner';

interface CourseContextType {
  activeCourse: ActiveLanguageState;
  availableCourses: LanguageCourseMeta[];
  setActiveCourse: (courseId: string, levelId: string) => boolean;
  isLoadingCourses: boolean;
  refreshCourses: () => Promise<void>;
}

const CourseContext = createContext<CourseContextType | null>(null);

const STORAGE_KEYS = {
  COURSE_ID: 'eidos_active_course_id',
  LANG_ID: 'eidos_active_lang_id',
  LEVEL_ID: 'eidos_active_level_id',
} as const;

export const CourseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dict } = useDictionary();
  const [remoteCourses, setRemoteCourses] = useState<LanguageCourseMeta[] | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(true);

  // Dynamic fallback courses list built from dictionary (Single Source of Truth)
  const fallbackCourses = useMemo<LanguageCourseMeta[]>(() => {
    return [
      {
        id: 'german_pimsleur',
        languageId: 'german',
        languageName: 'Deutsch',
        nativeLanguageName: 'Deutsch',
        flag: '🇩🇪',
        description: dict.languageHub.germanCourseDesc,
        isAvailable: true,
        levels: [
          {
            id: 'level1',
            name: dict.activeCourse.germanLevel1,
            cefrLevel: 'A1',
            totalUnits: 30,
            totalSegments: 8839,
            totalAudioDurationMs: 54000000,
            isAvailable: true,
          },
          {
            id: 'level2',
            name: dict.activeCourse.germanLevel2,
            cefrLevel: 'A2',
            totalUnits: 30,
            totalSegments: 0,
            totalAudioDurationMs: 0,
            isAvailable: false,
          },
        ],
      },
      {
        id: 'english_advanced',
        languageId: 'english',
        languageName: 'English',
        nativeLanguageName: 'English',
        flag: '🇬🇧',
        description: dict.languageHub.englishCourseDesc,
        isAvailable: false,
        levels: [
          {
            id: 'level_b1',
            name: dict.activeCourse.englishB1,
            cefrLevel: 'B1',
            totalUnits: 25,
            totalSegments: 0,
            totalAudioDurationMs: 0,
            isAvailable: false,
          },
        ],
      },
      {
        id: 'spanish_travel',
        languageId: 'spanish',
        languageName: 'Español',
        nativeLanguageName: 'Español',
        flag: '🇪🇸',
        description: dict.languageHub.spanishCourseDesc,
        isAvailable: false,
        levels: [
          {
            id: 'level_a1',
            name: dict.activeCourse.spanishA1,
            cefrLevel: 'A1',
            totalUnits: 30,
            totalSegments: 0,
            totalAudioDurationMs: 0,
            isAvailable: false,
          },
        ],
      },
      {
        id: 'french_essentials',
        languageId: 'french',
        languageName: 'Français',
        nativeLanguageName: 'Français',
        flag: '🇫🇷',
        description: dict.languageHub.frenchCourseDesc,
        isAvailable: false,
        levels: [
          {
            id: 'level_a1',
            name: 'Français A1',
            cefrLevel: 'A1',
            totalUnits: 30,
            totalSegments: 0,
            totalAudioDurationMs: 0,
            isAvailable: false,
          },
        ],
      },
    ];
  }, [dict]);

  // Combine remote courses with fallback dictionary labels
  const availableCourses = useMemo<LanguageCourseMeta[]>(() => {
    if (!remoteCourses || remoteCourses.length === 0) return fallbackCourses;
    return remoteCourses.map((rc) => {
      const fb = fallbackCourses.find((f) => f.id === rc.id || f.languageId === rc.languageId);
      return {
        ...rc,
        description: fb?.description || rc.description,
        levels: rc.levels.map((lvl) => {
          const fbLvl = fb?.levels.find((fl) => fl.id === lvl.id);
          return {
            ...lvl,
            name: fbLvl?.name || lvl.name,
          };
        }),
      };
    });
  }, [remoteCourses, fallbackCourses]);

  // Fetch courses from backend
  const fetchCourses = useCallback(async () => {
    setIsLoadingCourses(true);
    try {
      const res = await apiRequest<{ courses: LanguageCourseMeta[] }>('/api/v1/courses');
      if (res && Array.isArray(res.courses) && res.courses.length > 0) {
        setRemoteCourses(res.courses);
      }
    } catch (err: any) {
      console.warn('[COURSES_FETCH_WARN] Using fallback course catalog:', err?.message || err);
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Initial State from LocalStorage or default to German Level 1
  const [activeCourseState, setActiveCourseState] = useState<{ courseId: string; levelId: string }>(() => {
    try {
      const savedCourseId = localStorage.getItem(STORAGE_KEYS.COURSE_ID) || 'german_pimsleur';
      const savedLevelId = localStorage.getItem(STORAGE_KEYS.LEVEL_ID) || 'level1';
      return { courseId: savedCourseId, levelId: savedLevelId };
    } catch {
      return { courseId: 'german_pimsleur', levelId: 'level1' };
    }
  });

  // Calculate active course with safety checks
  const activeCourse = useMemo<ActiveLanguageState>(() => {
    const course =
      availableCourses.find((c) => c.id === activeCourseState.courseId) ||
      availableCourses.find((c) => c.languageId === 'german') ||
      availableCourses[0];

    const level =
      course.levels.find((l) => l.id === activeCourseState.levelId) ||
      course.levels.find((l) => l.isAvailable) ||
      course.levels[0];

    return {
      courseId: course.id,
      languageId: course.languageId,
      levelId: level.id,
      courseTitle: course.languageName,
      levelTitle: level.name,
      flag: course.flag,
    };
  }, [availableCourses, activeCourseState]);

  const setActiveCourse = useCallback(
    (courseId: string, levelId: string): boolean => {
      const targetCourse = availableCourses.find((c) => c.id === courseId || c.languageId === courseId);
      if (!targetCourse) {
        toast.error(dict.errors.invalidLanguageLevel);
        return false;
      }

      const targetLevel = targetCourse.levels.find((l) => l.id === levelId);
      if (!targetLevel) {
        toast.error(dict.errors.invalidLanguageLevel);
        return false;
      }

      if (!targetLevel.isAvailable) {
        toast.info(`${targetCourse.languageName} - ${dict.languageHub.comingSoonBadge}`, {
          description: dict.languageHub.comingSoonCourses,
        });
        return false;
      }

      setActiveCourseState({ courseId: targetCourse.id, levelId: targetLevel.id });

      try {
        localStorage.setItem(STORAGE_KEYS.COURSE_ID, targetCourse.id);
        localStorage.setItem(STORAGE_KEYS.LANG_ID, targetCourse.languageId);
        localStorage.setItem(STORAGE_KEYS.LEVEL_ID, targetLevel.id);
      } catch {
        // Ignore storage exceptions
      }

      toast.success(dict.languageHub.courseSwitchedToast, {
        description: `${targetCourse.flag} ${targetCourse.languageName} • ${targetLevel.name}`,
      });
      return true;
    },
    [availableCourses, dict]
  );

  // Sync state to storage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COURSE_ID, activeCourse.courseId);
      localStorage.setItem(STORAGE_KEYS.LANG_ID, activeCourse.languageId);
      localStorage.setItem(STORAGE_KEYS.LEVEL_ID, activeCourse.levelId);
    } catch {
      // Ignore
    }
  }, [activeCourse]);

  return (
    <CourseContext.Provider
      value={{
        activeCourse,
        availableCourses,
        setActiveCourse,
        isLoadingCourses,
        refreshCourses: fetchCourses,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export function useCourse(): CourseContextType {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}

