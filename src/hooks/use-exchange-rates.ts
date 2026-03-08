import { useState, useEffect } from 'react';
import { EXCHANGE_RATES_TO_BYN } from '@/lib/types';

export interface ExchangeRates {
  BYN: number;
  USD: number;
  EUR: number;
  PLN: number;
  RUB: number;
}

const CACHE_KEY = 'eurobuy_rates';
const CACHE_TTL = 3600000; // 1 hour

interface CachedRates {
  rates: ExchangeRates;
  timestamp: number;
}

function getCachedRates(): ExchangeRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedRates = JSON.parse(raw);
    if (Date.now() - cached.timestamp < CACHE_TTL) return cached.rates;
  } catch {}
  return null;
}

function setCachedRates(rates: ExchangeRates) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
}

/**
 * Fetches live exchange rates from open.er-api.com
 * Returns rates as "1 unit of currency = X BYN"
 */
export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRates>({
    BYN: 1,
    USD: EXCHANGE_RATES_TO_BYN['USD'],
    EUR: EXCHANGE_RATES_TO_BYN['EUR'],
    PLN: EXCHANGE_RATES_TO_BYN['PLN'],
    RUB: EXCHANGE_RATES_TO_BYN['RUB'],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getCachedRates();
    if (cached) {
      setRates(cached);
      setLoading(false);
      return;
    }

    // Fetch BYN rates via USD base (free API)
    fetch('https://open.er-api.com/v6/latest/BYN')
      .then(r => r.json())
      .then(data => {
        if (data.result === 'success' && data.rates) {
          // data.rates has "1 BYN = X other_currency"
          // We need "1 other_currency = X BYN" → invert
          const toBYN: ExchangeRates = {
            BYN: 1,
            USD: data.rates.USD ? 1 / data.rates.USD : EXCHANGE_RATES_TO_BYN['USD'],
            EUR: data.rates.EUR ? 1 / data.rates.EUR : EXCHANGE_RATES_TO_BYN['EUR'],
            PLN: data.rates.PLN ? 1 / data.rates.PLN : EXCHANGE_RATES_TO_BYN['PLN'],
            RUB: data.rates.RUB ? 1 / data.rates.RUB : EXCHANGE_RATES_TO_BYN['RUB'],
          };
          setRates(toBYN);
          setCachedRates(toBYN);
        }
      })
      .catch(() => {
        // Keep fallback static rates
      })
      .finally(() => setLoading(false));
  }, []);

  const convertToBYN = (amount: number, currency: string): number => {
    return amount * (rates[currency as keyof ExchangeRates] || 1);
  };

  const convertToEUR = (amount: number, currency: string): number => {
    const amountBYN = convertToBYN(amount, currency);
    return rates.EUR > 0 ? amountBYN / rates.EUR : amountBYN / 3.55;
  };

  return { rates, loading, convertToBYN, convertToEUR };
}
