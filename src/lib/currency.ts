export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar (USD - $)', symbol: '$' },
  { code: 'PKR', name: 'Pakistani Rupee (PKR - Rs)', symbol: 'Rs' },
  { code: 'EUR', name: 'Euro (EUR - €)', symbol: '€' },
  { code: 'GBP', name: 'British Pound (GBP - £)', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee (INR - ₹)', symbol: '₹' },
  { code: 'CAD', name: 'Canadian Dollar (CAD - CA$)', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar (AUD - A$)', symbol: 'A$' },
  { code: 'AED', name: 'UAE Dirham (AED)', symbol: 'AED ' },
  { code: 'SAR', name: 'Saudi Riyal (SAR)', symbol: 'SAR ' },
  { code: 'JPY', name: 'Japanese Yen (JPY - ¥)', symbol: '¥' },
];

export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  PKR: 277.8,
  EUR: 0.92,
  GBP: 0.78,
  INR: 83.5,
  CAD: 1.38,
  AUD: 1.52,
  AED: 3.67,
  SAR: 3.75,
  JPY: 155.0,
};

export function getUserCurrency(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('prospectos_currency') || 'USD';
  }
  return 'USD';
}

export function getUserTheme(): 'dark' | 'light' {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('prospectos_theme') as 'dark' | 'light') || 'dark';
  }
  return 'dark';
}

export function getCurrencySymbol(code?: string): string {
  const targetCode = (code || getUserCurrency() || 'USD').toUpperCase();
  const match = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === targetCode);
  if (match) return match.symbol.trim();
  if (targetCode === 'PKR') return 'Rs';
  return '$';
}

export function convertCurrency(amountInUSD: number, currencyCode?: string): number {
  const code = (currencyCode || getUserCurrency() || 'USD').toUpperCase();
  const rate = EXCHANGE_RATES[code] || 1;
  return (amountInUSD || 0) * rate;
}

export function formatCurrency(amountInUSD: number, currencyCode?: string): string {
  const code = (currencyCode || getUserCurrency() || 'USD').toUpperCase();
  const convertedAmount = convertCurrency(amountInUSD, code);
  const num = Math.round(convertedAmount);
  const formattedNum = num.toLocaleString('en-US');

  const symbol = getCurrencySymbol(code);

  if (code === 'PKR') {
    return `Rs ${formattedNum}`;
  }

  if (code === 'AED' || code === 'SAR') {
    return `${symbol} ${formattedNum}`;
  }

  return `${symbol}${formattedNum}`;
}
