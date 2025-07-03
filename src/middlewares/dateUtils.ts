// d:/KODE TECH/New Laravel Projects/advance-event-platform/src/middlewares/dateUtils.ts

import { fromZonedTime } from 'date-fns-tz'; // Or whatever date-fns-tz function you're using

const ASIA_COLOMBO_TZ = 'Asia/Colombo';

/**
 * Converts a date string (local Colombo time) to a UTC Date object for Prisma.
 * @param dateStr - A string like "2025-07-03" or "2025-07-03T14:30"
 * @returns Date object in UTC suitable for Prisma
 */
export function convertToUTCFromColombo(dateStr: string): Date {
  return fromZonedTime(dateStr, ASIA_COLOMBO_TZ);
}