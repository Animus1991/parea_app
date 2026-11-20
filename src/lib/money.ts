const FORMATS = new Map<string, Intl.NumberFormat>();

/**
 * Euro amounts the way each language writes them: «55 €» and «345,50 €» in
 * Greek, «€55» and «€345.50» in English. Cents show only when there are any,
 * unless `cents` asks for them (ledgers and balances).
 */
export function formatEur(amount: number, language: 'el' | 'en', cents = !Number.isInteger(amount)): string {
  const key = `${language}:${cents}`;
  let format = FORMATS.get(key);
  if (!format) {
    format = new Intl.NumberFormat(language === 'el' ? 'el-GR' : 'en-IE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: 2,
    });
    FORMATS.set(key, format);
  }
  return format.format(amount);
}
