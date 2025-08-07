/**
 * MedGuard SA - Date formatting utilities for South African locale
 * Provides consistent date/time formatting across the application
 * Supports both English (en-ZA) and Afrikaans (af-ZA) locales
 */

import { format, formatDistance, formatRelative, isToday, isTomorrow, isYesterday, 
         differenceInDays, differenceInHours, differenceInMinutes, addDays, 
         startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { enZA, af } from 'date-fns/locale';

export type SupportedLocale = 'en-ZA' | 'af-ZA';

/**
 * Get date-fns locale object based on locale string
 */
const getDateFnsLocale = (locale: SupportedLocale) => {
  return locale === 'af-ZA' ? af : enZA;
};

/**
 * Format date according to South African standards
 */
export const formatDate = (
  date: Date, 
  formatStr: string = 'dd/MM/yyyy',
  locale: SupportedLocale = 'en-ZA'
): string => {
  return format(date, formatStr, { locale: getDateFnsLocale(locale) });
};

/**
 * Format time according to South African standards (24-hour format)
 */
export const formatTime = (
  date: Date,
  format24Hour: boolean = true,
  locale: SupportedLocale = 'en-ZA'
): string => {
  const formatStr = format24Hour ? 'HH:mm' : 'h:mm a';
  return format(date, formatStr, { locale: getDateFnsLocale(locale) });
};

/**
 * Format date and time together
 */
export const formatDateTime = (
  date: Date,
  locale: SupportedLocale = 'en-ZA',
  format24Hour: boolean = true
): string => {
  const dateStr = formatDate(date, 'dd/MM/yyyy', locale);
  const timeStr = formatTime(date, format24Hour, locale);
  return `${dateStr} ${timeStr}`;
};

/**
 * Format date in a user-friendly way (Today, Tomorrow, Yesterday, or date)
 */
export const formatFriendlyDate = (
  date: Date,
  locale: SupportedLocale = 'en-ZA'
): string => {
  const translations = {
    'en-ZA': {
      today: 'Today',
      tomorrow: 'Tomorrow',
      yesterday: 'Yesterday',
    },
    'af-ZA': {
      today: 'Vandag',
      tomorrow: 'Môre',
      yesterday: 'Gister',
    },
  };

  const t = translations[locale];

  if (isToday(date)) {
    return t.today;
  }
  
  if (isTomorrow(date)) {
    return t.tomorrow;
  }
  
  if (isYesterday(date)) {
    return t.yesterday;
  }
  
  // For other dates, use short format
  return formatDate(date, 'dd MMM', locale);
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export const formatRelativeTime = (
  date: Date,
  baseDate: Date = new Date(),
  locale: SupportedLocale = 'en-ZA'
): string => {
  return formatDistance(date, baseDate, {
    addSuffix: true,
    locale: getDateFnsLocale(locale),
  });
};

/**
 * Format time until next dose
 */
export const formatTimeUntilDose = (
  doseTime: Date,
  locale: SupportedLocale = 'en-ZA'
): string => {
  const now = new Date();
  const minutesUntil = differenceInMinutes(doseTime, now);
  const hoursUntil = differenceInHours(doseTime, now);
  const daysUntil = differenceInDays(doseTime, now);

  const translations = {
    'en-ZA': {
      now: 'Now',
      minutesAgo: (min: number) => `${min} minute${min === 1 ? '' : 's'} ago`,
      minutesFrom: (min: number) => `in ${min} minute${min === 1 ? '' : 's'}`,
      hoursAgo: (hrs: number) => `${hrs} hour${hrs === 1 ? '' : 's'} ago`,
      hoursFrom: (hrs: number) => `in ${hrs} hour${hrs === 1 ? '' : 's'}`,
      daysAgo: (days: number) => `${days} day${days === 1 ? '' : 's'} ago`,
      daysFrom: (days: number) => `in ${days} day${days === 1 ? '' : 's'}`,
    },
    'af-ZA': {
      now: 'Nou',
      minutesAgo: (min: number) => `${min} minuu${min === 1 ? 't' : 'te'} gelede`,
      minutesFrom: (min: number) => `oor ${min} minuu${min === 1 ? 't' : 'te'}`,
      hoursAgo: (hrs: number) => `${hrs} uu${hrs === 1 ? 'r' : 're'} gelede`,
      hoursFrom: (hrs: number) => `oor ${hrs} uu${hrs === 1 ? 'r' : 're'}`,
      daysAgo: (days: number) => `${days} da${days === 1 ? 'g' : 'e'} gelede`,
      daysFrom: (days: number) => `oor ${days} da${days === 1 ? 'g' : 'e'}`,
    },
  };

  const t = translations[locale];

  if (Math.abs(minutesUntil) < 1) {
    return t.now;
  }

  if (Math.abs(minutesUntil) < 60) {
    return minutesUntil < 0 ? t.minutesAgo(Math.abs(minutesUntil)) : t.minutesFrom(minutesUntil);
  }

  if (Math.abs(hoursUntil) < 24) {
    return hoursUntil < 0 ? t.hoursAgo(Math.abs(hoursUntil)) : t.hoursFrom(hoursUntil);
  }

  return daysUntil < 0 ? t.daysAgo(Math.abs(daysUntil)) : t.daysFrom(daysUntil);
};

/**
 * Format medication schedule timing
 */
export const formatScheduleTiming = (
  timing: 'morning' | 'noon' | 'evening' | 'night' | 'custom',
  customTime?: string,
  locale: SupportedLocale = 'en-ZA'
): string => {
  const translations = {
    'en-ZA': {
      morning: 'Morning',
      noon: 'Noon',
      evening: 'Evening',
      night: 'Night',
    },
    'af-ZA': {
      morning: 'Oggend',
      noon: 'Middag',
      evening: 'Aand',
      night: 'Nag',
    },
  };

  if (timing === 'custom' && customTime) {
    return customTime;
  }

  return translations[locale][timing] || timing;
};

/**
 * Get day names for the current locale
 */
export const getDayNames = (
  locale: SupportedLocale = 'en-ZA',
  abbreviated: boolean = false
): string[] => {
  const translations = {
    'en-ZA': {
      full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
    'af-ZA': {
      full: ['Sondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrydag', 'Saterdag'],
      short: ['So', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Sa'],
    },
  };

  return abbreviated ? translations[locale].short : translations[locale].full;
};

/**
 * Get month names for the current locale
 */
export const getMonthNames = (
  locale: SupportedLocale = 'en-ZA',
  abbreviated: boolean = false
): string[] => {
  const translations = {
    'en-ZA': {
      full: ['January', 'February', 'March', 'April', 'May', 'June',
             'July', 'August', 'September', 'October', 'November', 'December'],
      short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
    'af-ZA': {
      full: ['Januarie', 'Februarie', 'Maart', 'April', 'Mei', 'Junie',
             'Julie', 'Augustus', 'September', 'Oktober', 'November', 'Desember'],
      short: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun',
              'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'],
    },
  };

  return abbreviated ? translations[locale].short : translations[locale].full;
};

/**
 * Parse time string (HH:mm) to Date object for today
 */
export const parseTimeString = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Get date range for analytics periods
 */
export const getDateRange = (
  period: 'today' | 'week' | 'month' | 'year'
): { start: Date; end: Date } => {
  const now = new Date();

  switch (period) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }), // Monday start
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case 'year':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      };
    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
  }
};

/**
 * Check if a time is within business hours (for pharmacy contact)
 */
export const isBusinessHours = (date: Date = new Date()): boolean => {
  const hour = date.getHours();
  const day = date.getDay();
  
  // Monday to Friday: 8 AM to 6 PM
  // Saturday: 8 AM to 1 PM
  // Sunday: Closed
  
  if (day === 0) return false; // Sunday
  
  if (day === 6) {
    return hour >= 8 && hour < 13; // Saturday until 1 PM
  }
  
  return hour >= 8 && hour < 18; // Weekdays until 6 PM
};

/**
 * Format duration in a human-readable way
 */
export const formatDuration = (
  minutes: number,
  locale: SupportedLocale = 'en-ZA'
): string => {
  const translations = {
    'en-ZA': {
      minute: 'minute',
      minutes: 'minutes',
      hour: 'hour',
      hours: 'hours',
      day: 'day',
      days: 'days',
    },
    'af-ZA': {
      minute: 'minuut',
      minutes: 'minute',
      hour: 'uur',
      hours: 'ure',
      day: 'dag',
      days: 'dae',
    },
  };

  const t = translations[locale];

  if (minutes < 60) {
    return minutes === 1 ? `1 ${t.minute}` : `${minutes} ${t.minutes}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    const hourStr = hours === 1 ? `1 ${t.hour}` : `${hours} ${t.hours}`;
    if (remainingMinutes === 0) {
      return hourStr;
    }
    const minuteStr = remainingMinutes === 1 ? `1 ${t.minute}` : `${remainingMinutes} ${t.minutes}`;
    return `${hourStr} ${minuteStr}`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  const dayStr = days === 1 ? `1 ${t.day}` : `${days} ${t.days}`;
  if (remainingHours === 0) {
    return dayStr;
  }
  const hourStr = remainingHours === 1 ? `1 ${t.hour}` : `${remainingHours} ${t.hours}`;
  return `${dayStr} ${hourStr}`;
};

/**
 * Get next business day (excluding weekends)
 */
export const getNextBusinessDay = (date: Date = new Date()): Date => {
  let nextDay = addDays(date, 1);
  
  // Skip weekends
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay = addDays(nextDay, 1);
  }
  
  return nextDay;
};

/**
 * Validate date string format (dd/mm/yyyy)
 */
export const validateDateFormat = (dateStr: string): boolean => {
  const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateStr.match(datePattern);
  
  if (!match) return false;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  // Basic validation
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Check if the date is valid
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
};

/**
 * Convert 12-hour time format to 24-hour format
 */
export const convertTo24Hour = (time12h: string): string => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier === 'PM' || modifier === 'pm') {
    hours = (parseInt(hours, 10) + 12).toString();
  }
  
  return `${hours.padStart(2, '0')}:${minutes}`;
};

/**
 * Convert 24-hour time format to 12-hour format
 */
export const convertTo12Hour = (time24h: string): string => {
  const [hours, minutes] = time24h.split(':');
  const hour24 = parseInt(hours, 10);
  
  if (hour24 === 0) {
    return `12:${minutes} AM`;
  } else if (hour24 < 12) {
    return `${hour24}:${minutes} AM`;
  } else if (hour24 === 12) {
    return `12:${minutes} PM`;
  } else {
    return `${hour24 - 12}:${minutes} PM`;
  }
};

/**
 * Memoized medication expiration date formatter
 * Optimized for frequent re-renders in FlatList components
 */
const medicationDateCache = new Map<string, string>();

export const formatMedicationDate = (
  expirationDate: string | undefined,
  locale: SupportedLocale = 'en-ZA'
): string => {
  if (!expirationDate) return '';
  
  const cacheKey = `${expirationDate}-${locale}`;
  
  if (medicationDateCache.has(cacheKey)) {
    return medicationDateCache.get(cacheKey)!;
  }
  
  try {
    const expDate = new Date(expirationDate);
    const now = new Date();
    
    let formattedDate: string;
    
    if (isAfter(now, expDate)) {
      // Expired
      formattedDate = locale === 'af-ZA' 
        ? `Verval: ${formatDate(expDate, 'dd/MM/yyyy', locale)}`
        : `Expired: ${formatDate(expDate, 'dd/MM/yyyy', locale)}`;
    } else {
      const daysUntilExpiry = differenceInDays(expDate, now);
      
      if (daysUntilExpiry <= 30) {
        // Expiring soon
        const expiryText = locale === 'af-ZA' 
          ? `Verval oor ${daysUntilExpiry} dag${daysUntilExpiry !== 1 ? 'e' : ''}`
          : `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`;
        formattedDate = expiryText;
      } else {
        // Normal expiry date
        const expiryPrefix = locale === 'af-ZA' ? 'Verval:' : 'Expires:';
        formattedDate = `${expiryPrefix} ${formatDate(expDate, 'dd/MM/yyyy', locale)}`;
      }
    }
    
    // Cache the result (limit cache size to prevent memory issues)
    if (medicationDateCache.size > 1000) {
      const firstKey = medicationDateCache.keys().next().value;
      medicationDateCache.delete(firstKey);
    }
    
    medicationDateCache.set(cacheKey, formattedDate);
    return formattedDate;
  } catch (error) {
    console.warn('Error formatting medication date:', error);
    return expirationDate;
  }
};

/**
 * Clear the medication date cache (useful for locale changes)
 */
export const clearMedicationDateCache = (): void => {
  medicationDateCache.clear();
};