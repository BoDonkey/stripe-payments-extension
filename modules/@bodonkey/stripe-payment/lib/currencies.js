export const CURRENCY_CONFIG = {
  usd: { decimals: 2, min: 0.01, symbol: '$', label: 'stripePayment:currency.choices.usDollar' },
  eur: { decimals: 2, min: 0.01, symbol: '€', label: 'stripePayment:currency.choices.euro' },
  gbp: { decimals: 2, min: 0.01, symbol: '£', label: 'stripePayment:currency.choices.britishPound' },
  jpy: { decimals: 0, min: 1, symbol: '¥', label: 'stripePayment:currency.choices.japaneseYen' },
  cad: { decimals: 2, min: 0.01, symbol: 'C$', label: 'stripePayment:currency.choices.canadianDollar' },
  aud: { decimals: 2, min: 0.01, symbol: 'A$', label: 'stripePayment:currency.choices.australianDollar' },
  krw: { decimals: 0, min: 1, symbol: '₩', label: 'stripePayment:currency.choices.southKoreanWon' },
  chf: { decimals: 2, min: 0.01, symbol: 'CHF', label: 'stripePayment:currency.choices.swissFranc' },
  cny: { decimals: 2, min: 0.01, symbol: '¥', label: 'stripePayment:currency.choices.chineseYuan' }
};