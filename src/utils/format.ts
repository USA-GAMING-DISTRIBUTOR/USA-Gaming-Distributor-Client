export function formatCurrency(value: number, currency: string = 'USD', locale: string = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  } catch {
    // Fallback if Intl fails
    return `$${value.toFixed(4).replace(/\.?0+$/, '')}`;
  }
}

export function formatDateTime(iso: string, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions) {
  try {
    const date = new Date(iso);
    return date.toLocaleString(locale, options);
  } catch {
    return iso;
  }
}

export function formatNumber(value: number, locale: string = 'en-US') {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return String(value);
  }
}
