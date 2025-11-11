/**
 * Thai Calendar Utilities
 * Converts dates between Gregorian (CE) and Buddhist Era (BE)
 * Buddhist Era = Gregorian Year + 543
 */

/**
 * Format a date to Thai Buddhist calendar with 24-hour time
 * @param date - Date string or Date object
 * @param options - Format options
 * @returns Formatted date string in Thai Buddhist calendar
 */
export function formatThaiDate(
  date: string | Date,
  options: {
    includeTime?: boolean;
    shortFormat?: boolean;
    locale?: 'th' | 'en';
  } = {}
): string {
  const {
    includeTime = false,
    shortFormat = false,
    locale = 'th'
  } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  // Convert year to Buddhist Era (BE)
  const beYear = dateObj.getFullYear() + 543;
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();

  // Month names in Thai
  const thaiMonthsFull = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const thaiMonthsShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const englishMonthsFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const englishMonthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const monthNames = locale === 'th'
    ? (shortFormat ? thaiMonthsShort : thaiMonthsFull)
    : (shortFormat ? englishMonthsShort : englishMonthsFull);

  const monthName = monthNames[dateObj.getMonth()];

  // Format date part
  let formatted = `${day} ${monthName} ${beYear}`;

  // Add time if requested (24-hour format)
  if (includeTime) {
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    formatted += ` ${formattedHours}:${formattedMinutes}`;
  }

  return formatted;
}

/**
 * Format date for datetime-local input (keeps in CE for form compatibility)
 * @param date - Date string or Date object
 * @returns ISO format for datetime-local input (YYYY-MM-DDTHH:mm)
 */
export function formatDateTimeLocal(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get current date in Buddhist Era year
 * @returns Current BE year
 */
export function getCurrentBEYear(): number {
  return new Date().getFullYear() + 543;
}

/**
 * Convert Buddhist Era year to Gregorian year
 * @param beYear - Buddhist Era year
 * @returns Gregorian year
 */
export function beToGregorian(beYear: number): number {
  return beYear - 543;
}

/**
 * Convert Gregorian year to Buddhist Era year
 * @param gregorianYear - Gregorian year
 * @returns Buddhist Era year
 */
export function gregorianToBE(gregorianYear: number): number {
  return gregorianYear + 543;
}

/**
 * Format relative time in Thai
 * @param date - Date string or Date object
 * @param locale - Language locale
 * @returns Relative time string (e.g., "2 ชั่วโมงที่แล้ว")
 */
export function formatRelativeTime(
  date: string | Date,
  locale: 'th' | 'en' = 'th'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (locale === 'th') {
    if (diffSec < 60) return 'เมื่อสักครู่';
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
    if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} สัปดาห์ที่แล้ว`;
    if (diffDay < 365) return `${Math.floor(diffDay / 30)} เดือนที่แล้ว`;
    return `${Math.floor(diffDay / 365)} ปีที่แล้ว`;
  } else {
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`;
    if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) > 1 ? 's' : ''} ago`;
  }
}

/**
 * Format time in 24-hour format
 * @param date - Date string or Date object
 * @returns Time string in 24-hour format (HH:mm)
 */
export function formatTime24(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '--:--';
  }

  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Format date for display with Thai locale preference
 * @param date - Date string or Date object
 * @param format - Format type
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  switch (format) {
    case 'short':
      return formatThaiDate(date, { shortFormat: true });
    case 'medium':
      return formatThaiDate(date, { shortFormat: false });
    case 'long':
      return formatThaiDate(date, { includeTime: true, shortFormat: false });
    case 'full':
      return formatThaiDate(date, { includeTime: true, shortFormat: false });
    default:
      return formatThaiDate(date);
  }
}
