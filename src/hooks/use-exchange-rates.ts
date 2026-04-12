import { useState, useEffect } from 'react';
import { EXCHANGE_RATES_TO_BYN, getWeightPriceUSD } from '@/lib/types';

export interface ExchangeRates {
  BYN: number;
  USD: number;
  EUR: number;
  PLN: number;
  RUB: number;
}

const CACHE_KEY = 'eurobuy_rates';
const CACHE_TTL = 300000; // 5 minutes

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
 * Updates every 5 minutes
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

  const fetchRates = () => {
    const cached = getCachedRates();
    if (cached) {
      setRates(cached);
      setLoading(false);
      return;
    }

    fetch('https://open.er-api.com/v6/latest/BYN')
      .then(r => r.json())
      .then(data => {
        if (data.result === 'success' && data.rates) {
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
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRates();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      localStorage.removeItem(CACHE_KEY);
      fetchRates();
    }, CACHE_TTL);
    return () => clearInterval(interval);
  }, []);

  const convertToBYN = (amount: number, currency: string): number => {
    return amount * (rates[currency as keyof ExchangeRates] || 1);
  };

  const convertToEUR = (amount: number, currency: string): number => {
    const amountBYN = convertToBYN(amount, currency);
    return rates.EUR > 0 ? amountBYN / rates.EUR : amountBYN / 3.55;
  };

  const calcServiceCostBYN = (priceBYN: number, weightKg: number): number => {
    const percentCost = priceBYN * 0.22;
    const weightCostUSD = getWeightPriceUSD(weightKg);
    const weightCostBYN = weightCostUSD * rates.USD;
    return Math.max(percentCost, weightCostBYN);
  };

  return { rates, loading, convertToBYN, convertToEUR, calcServiceCostBYN };
}
