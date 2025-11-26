/**
 * Validate time format HH:MM
 */
export const isValidTime = (time: string): boolean => {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};

/**
 * Normalize time to HH:MM format (zero-padded hours)
 */
export const normalizeTime = (time: string): string => {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
