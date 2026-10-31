/**
 * Eidos Language OS - Pure Deterministic Formatting Utilities
 * ZERO HARDCODE & ZERO MOCK: Standard formatting for file sizes, uptimes, dates, and numbers.
 */

/**
  * Format byte values into human-readable B, KB, MB, GB, TB strings with precision.
  * Deterministic, safe against NaN, negative, or infinite values.
  */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (typeof bytes !== 'number' || isNaN(bytes) || !isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(i, sizes.length - 1);
  const val = bytes / Math.pow(k, safeIndex);

  return `${val.toFixed(dm)} ${sizes[safeIndex]}`;
}

/**
  * Format uptime seconds into human-readable duration (days, hours, minutes).
  */
export function formatUptime(
  seconds: number,
  labels: { d?: string; h?: string; m?: string; s?: string } = {
    d: 'g',
    h: 'sa',
    m: 'dk',
    s: 'sn',
  }
): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || !isFinite(seconds) || seconds <= 0) {
    return `0${labels.s || 'sn'}`;
  }

  const totalSecs = Math.floor(seconds);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}${labels.d || 'g'}`);
  if (hours > 0 || days > 0) parts.push(`${hours}${labels.h || 'sa'}`);
  if (minutes > 0 || (hours === 0 && days === 0)) parts.push(`${minutes}${labels.m || 'dk'}`);
  if (parts.length === 0) parts.push(`${secs}${labels.s || 'sn'}`);

  return parts.join(' ');
}

/**
  * Format an ISO timestamp or date string into human-friendly format.
  */
export function formatRelativeTime(isoDate: string | null | undefined, emptyLabel: string = '-'): string {
  if (!isoDate) return emptyLabel;

  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return emptyLabel;

    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) {
      return 'Az önce';
    }
    if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      return `${mins} dk önce`;
    }
    if (diffSec < 86400) {
      const hrs = Math.floor(diffSec / 3600);
      return `${hrs} saat önce`;
    }
    if (diffSec < 172800) {
      return `Dün ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString([], {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return emptyLabel;
  }
}

/**
  * Formats integer with localized thousand separators.
  */
export function formatNumber(num: number): string {
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return '0';
  return num.toLocaleString();
}
