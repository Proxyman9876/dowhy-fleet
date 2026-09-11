/**
 * Format a number with commas (e.g. 45200 -> "45,200")
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format mileage with "mi" suffix (e.g. 45200 -> "45,200 mi")
 */
export function formatMileage(miles: number): string {
  return `${formatNumber(miles)} mi`;
}

/**
 * Format hours with "hrs" suffix (e.g. 1234.5 -> "1,234.5 hrs")
 */
export function formatHours(hours: number): string {
  return `${formatNumber(hours)} hrs`;
}

/**
 * Format currency (e.g. 42.5 -> "$42.50")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format a date string to locale display (e.g. "Sep 11, 2026")
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to relative time (e.g. "3 days ago")
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
