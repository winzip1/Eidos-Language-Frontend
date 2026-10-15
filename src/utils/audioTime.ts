/**
 * Eidos Language OS - Audio Time & Progress Calculation Engine
 * Pure, deterministic mathematical utilities with zero external dependencies and 100% fail-safe bounds.
 */

/**
 * Format elapsed milliseconds into mm:ss (or hh:mm:ss for audio > 1hr).
 * Guaranteed to return a valid string, never NaN or undefined.
 */
export function formatElapsed(ms: number): string {
  if (typeof ms !== 'number' || isNaN(ms) || !isFinite(ms) || ms <= 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Format remaining audio time into -mm:ss (or -hh:mm:ss).
 * Single Source of Truth: remaining = duration - current.
 */
export function formatRemaining(currentMs: number, durationMs: number, prefix: string = '-'): string {
  if (typeof durationMs !== 'number' || isNaN(durationMs) || !isFinite(durationMs) || durationMs <= 0) {
    return `${prefix}00:00`;
  }

  const safeCurrent = typeof currentMs === 'number' && !isNaN(currentMs) && isFinite(currentMs) ? Math.max(0, currentMs) : 0;
  const remainingMs = Math.max(0, durationMs - safeCurrent);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${prefix}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${prefix}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Calculate progress percentage strictly clamped between 0 and 100.
 */
export function calculateProgressPercent(currentMs: number, durationMs: number): number {
  if (typeof durationMs !== 'number' || isNaN(durationMs) || !isFinite(durationMs) || durationMs <= 0) {
    return 0;
  }
  const safeCurrent = typeof currentMs === 'number' && !isNaN(currentMs) && isFinite(currentMs) ? Math.max(0, currentMs) : 0;
  const percent = (safeCurrent / durationMs) * 100;
  return Math.max(0, Math.min(100, percent));
}

/**
 * Convert a click or touch clientX event into target seek milliseconds.
 * Strictly clamps between 0 and durationMs.
 */
export function calculateSeekMsFromClientX(clientX: number, rect: { left: number; width: number }, durationMs: number): number {
  if (!rect || rect.width <= 0 || typeof durationMs !== 'number' || isNaN(durationMs) || durationMs <= 0) {
    return 0;
  }

  const rawOffset = clientX - rect.left;
  const clampedOffset = Math.max(0, Math.min(rect.width, rawOffset));
  const ratio = clampedOffset / rect.width;
  return Math.round(ratio * durationMs);
}

/**
 * Architectural alias: formatRemainingTime mapping to formatRemaining.
 */
export const formatRemainingTime = formatRemaining;

/**
 * Calculate relative segment dot percentage clamped strictly between 0 and 100.
 */
export function calculateSegmentPercent(startMs: number, durationMs: number): number {
  if (typeof durationMs !== 'number' || isNaN(durationMs) || !isFinite(durationMs) || durationMs <= 0) {
    return 0;
  }
  const safeStart = typeof startMs === 'number' && !isNaN(startMs) && isFinite(startMs) ? Math.max(0, startMs) : 0;
  const percent = (safeStart / durationMs) * 100;
  return Math.max(0, Math.min(100, percent));
}

/**
 * Resolves the deterministic duration in minutes.
 * If audioDurationMs > 0, calculates minutes.
 * If 0 or missing, uses estimatedDurationMinutes (if > 0) or falls back to standard 30 min.
 * Strictly prevents misleading fake '1 dk' fallback!
 */
export function getDeterministicDurationMinutes(
  audioDurationMs?: number,
  estimatedDurationMinutes?: number
): number {
  if (typeof audioDurationMs === 'number' && !isNaN(audioDurationMs) && isFinite(audioDurationMs) && audioDurationMs > 0) {
    return Math.max(1, Math.round(audioDurationMs / 60000));
  }
  if (typeof estimatedDurationMinutes === 'number' && !isNaN(estimatedDurationMinutes) && isFinite(estimatedDurationMinutes) && estimatedDurationMinutes > 0) {
    return Math.round(estimatedDurationMinutes);
  }
  return 30;
}

/**
 * Resolves the deterministic duration in milliseconds.
 * If audioDurationMs > 0, returns audioDurationMs.
 * If 0 or missing, converts estimatedDurationMinutes (or default 30 min) to milliseconds.
 */
export function getDeterministicDurationMs(
  audioDurationMs?: number,
  estimatedDurationMinutes?: number
): number {
  if (typeof audioDurationMs === 'number' && !isNaN(audioDurationMs) && isFinite(audioDurationMs) && audioDurationMs > 0) {
    return Math.round(audioDurationMs);
  }
  const mins = typeof estimatedDurationMinutes === 'number' && !isNaN(estimatedDurationMinutes) && isFinite(estimatedDurationMinutes) && estimatedDurationMinutes > 0
    ? estimatedDurationMinutes
    : 30;
  return Math.round(mins * 60000);
}

/**
 * Calculates lesson progress percentage clamped between 0 and 100.
 * Single Source of Truth for all lesson cards, rows, and study grid items.
 * If completed: returns 100.
 * If in progress: clamps between 1 and 99 (never hits 100 until explicitly completed).
 * If not started or invalid: returns 0.
 */
export function calculateLessonProgressPct(
  lastPositionMs: number | undefined,
  audioDurationMs: number | undefined,
  estimatedDurationMinutes: number | undefined,
  isCompleted: boolean
): number {
  if (isCompleted) return 100;
  const safePosition = typeof lastPositionMs === 'number' && !isNaN(lastPositionMs) && isFinite(lastPositionMs)
    ? Math.max(0, lastPositionMs)
    : 0;
  if (safePosition <= 0) return 0;

  const durationMs = getDeterministicDurationMs(audioDurationMs, estimatedDurationMinutes);
  if (durationMs <= 0) return 0;

  const rawPct = Math.round((safePosition / durationMs) * 100);
  return Math.min(99, Math.max(1, rawPct));
}

/**
 * Formats duration label honestly based on transcript status and available duration.
 * If audioDurationMs > 0, returns "~{mins} {minutesFormatStr}".
 * If audioDurationMs === 0, returns template (e.g. "~{mins} dk (Tam Kayıt)") with dynamic minutes replaced.
 */
export function formatUnitDurationLabel(
  audioDurationMs: number | undefined,
  estimatedDurationMinutes: number | undefined,
  minutesFormatStr: string = 'dk',
  audioEstimatedDurationTemplate?: string
): string {
  if (typeof audioDurationMs === 'number' && !isNaN(audioDurationMs) && isFinite(audioDurationMs) && audioDurationMs > 0) {
    const mins = Math.max(1, Math.round(audioDurationMs / 60000));
    return `~${mins} ${minutesFormatStr}`;
  }
  const rawMins = typeof estimatedDurationMinutes === 'number' && !isNaN(estimatedDurationMinutes) && isFinite(estimatedDurationMinutes) && estimatedDurationMinutes > 0
    ? Math.round(estimatedDurationMinutes)
    : 30;
  const mins = Math.max(1, rawMins);
  if (audioEstimatedDurationTemplate && typeof audioEstimatedDurationTemplate === 'string') {
    if (audioEstimatedDurationTemplate.includes('{mins}')) {
      return audioEstimatedDurationTemplate.replace('{mins}', String(mins));
    }
    return `${audioEstimatedDurationTemplate} (~${mins} ${minutesFormatStr})`;
  }
  return `~${mins} ${minutesFormatStr}`;
}


