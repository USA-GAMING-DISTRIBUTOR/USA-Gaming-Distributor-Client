export function formatCurrency(value: number, currency: string = 'USD', locale: string = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
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
