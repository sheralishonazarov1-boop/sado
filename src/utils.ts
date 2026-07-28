/**
 * SADO Shared Formatting Utilities
 */

/**
 * Formats phone numbers into grouped segments: +998 93 162 67 78
 */
export function formatPhone(phone: string | number | undefined): string {
  if (!phone) return "";
  let cleaned = String(phone).replace(/\D/g, "");
  // Ensure we have a leading +998 or similar
  if (cleaned.length === 9) {
    cleaned = "998" + cleaned;
  }
  if (!cleaned.startsWith("998") && cleaned.length === 12) {
    // If it's another 12-digit number, treat it accordingly
  }
  
  if (cleaned.length === 12) {
    const country = cleaned.substring(0, 3);
    const code = cleaned.substring(3, 5);
    const part1 = cleaned.substring(5, 8);
    const part2 = cleaned.substring(8, 10);
    const part3 = cleaned.substring(10, 12);
    return `+${country} ${code} ${part1} ${part2} ${part3}`;
  }
  
  // Fallback
  return phone ? `+${phone}` : "";
}

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun", 
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"
];

/**
 * Formats dates into human-friendly strings:
 * - < 24 hours old: relative ("2 soat oldin", "5 daqiqa oldin", "hozirgina")
 * - dense: "28.07.2026"
 * - default user-facing: "28-iyul, 2026"
 */
export function formatDate(dateInput: string | Date | undefined, dense: boolean = false): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);

  // If under 24 hours old, return relative formatting
  if (diffSec >= 0 && diffHrs < 24) {
    if (diffSec < 60) {
      return "hozirgina";
    }
    if (diffMin < 60) {
      return `${diffMin} daqiqa oldin`;
    }
    return `${diffHrs} soat oldin`;
  }

  const day = d.getDate();
  const monthIdx = d.getMonth();
  const year = d.getFullYear();

  if (dense) {
    const dd = String(day).padStart(2, "0");
    const mm = String(monthIdx + 1).padStart(2, "0");
    return `${dd}.${mm}.${year}`;
  }

  const monthName = UZ_MONTHS[monthIdx];
  return `${day}-${monthName}, ${year}`;
}

/**
 * Formats time: 14:32
 */
export function formatTime(dateInput: string | Date | undefined): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Formats numbers separating thousands by a narrow space: 1 254
 */
export function formatNumber(num: number | undefined): string {
  if (num === undefined) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Formats counts using Uzbek counter words:
 * - 12 ta murojaat
 * - 8 kishi
 * - 4.2 kun
 */
export function formatAppealsCount(count: number): string {
  return `${formatNumber(count)} ta murojaat`;
}

export function formatPeopleCount(count: number): string {
  return `${formatNumber(count)} kishi`;
}

export function formatDaysCount(count: number): string {
  return `${count.toFixed(1)} kun`;
}
