export interface OrderItem {
  link: string;
  name: string;
  quantity: number;
  weight: number;
  price: number;
  currency: string;
  country: string;
  priceBYN: number;
  serviceCostBYN: number;
  notes?: string;
}

export interface Order {
  id: string;
  trackNumber: string;
  items: OrderItem[];
  totalWeight: number;
  totalPriceBYN: number;
  totalServiceBYN: number;
  deliveryMethod: string;
  deliveryCostBYN: number;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery?: string;
  statusHistory: StatusUpdate[];
}

export interface StatusUpdate {
  status: OrderStatus;
  date: string;
  comment?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'purchased' | 'shipped' | 'customs' | 'delivered';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждён',
  purchased: 'Выкуплен',
  shipped: 'Отправлен',
  customs: 'На таможне',
  delivered: 'Доставлен',
};

export const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'purchased', 'shipped', 'customs', 'delivered'];

export const COUNTRIES = [
  'Германия', 'Франция', 'Италия', 'Испания', 'Великобритания',
  'Нидерланды', 'Бельгия', 'Австрия', 'Польша', 'Чехия',
  'Португалия', 'Швеция', 'Финляндия', 'Дания', 'Швейцария',
];

export const CURRENCIES = ['BYN', 'USD', 'EUR', 'PLN', 'RUB'];

// Approximate official rates to BYN (myfin.by-like)
export const EXCHANGE_RATES_TO_BYN: Record<string, number> = {
  BYN: 1,
  USD: 3.27,
  EUR: 3.55,
  PLN: 0.82,
  RUB: 0.035,
};

// To EUR for limit checking
export const EXCHANGE_RATES_TO_EUR: Record<string, number> = {
  BYN: 1 / 3.55,
  USD: 3.27 / 3.55,
  EUR: 1,
  PLN: 0.82 / 3.55,
  RUB: 0.035 / 3.55,
};

export const DELIVERY_METHODS = [
  { id: 'courier_minsk', name: 'Курьером по Минску', desc: '1-2 дня', priceBYN: 10 },
  { id: 'pickup_minsk', name: 'Самовывоз (Минск)', desc: 'После получения', priceBYN: 0 },
  { id: 'pickup_moscow', name: 'Самовывоз (Москва)', desc: 'После получения', priceBYN: 0 },
  { id: 'sdek', name: 'СДЭК', desc: '3-7 дней', priceBYN: 15 },
  { id: 'europost', name: 'Европочта', desc: '5-10 дней', priceBYN: 12 },
];

export const PAYMENT_METHODS = [
  { id: 'card', name: 'Банковская карта' },
  { id: 'cash', name: 'Наличные' },
  { id: 'transfer', name: 'Банковский перевод' },
];

export const MAX_WEIGHT_KG = 25;
export const MAX_PRICE_EUR = 500;

/**
 * Calculate service cost per weight tier in USD:
 * 0.5kg=$6, 1kg=$8, 2kg=$12, 3kg=$16, ..., up to 25kg with step +$4/kg
 */
export function getWeightPriceUSD(weightKg: number): number {
  if (weightKg <= 0) return 0;
  if (weightKg <= 0.5) return 6;
  if (weightKg <= 1) return 8;
  const extraKg = Math.ceil(weightKg - 1);
  return 8 + extraKg * 4;
}

/**
 * Calculate service cost in BYN.
 * Compare 18% of item price (in BYN) vs weight-based price (USD→BYN).
 * Take the higher one.
 */
export function calculateServiceCostBYN(priceBYN: number, weightKg: number): number {
  const percentCost = priceBYN * 0.18;
  const weightCostUSD = getWeightPriceUSD(weightKg);
  const weightCostBYN = weightCostUSD * EXCHANGE_RATES_TO_BYN['USD'];
  return Math.max(percentCost, weightCostBYN);
}

export function convertToBYN(amount: number, currency: string): number {
  return amount * (EXCHANGE_RATES_TO_BYN[currency] || 1);
}

export function convertToEUR(amount: number, currency: string): number {
  return amount * (EXCHANGE_RATES_TO_EUR[currency] || 1);
}

export function generateTrackNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefix = 'EB';
  const mid = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 26)]).join('');
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${mid}${num}`;
}

export function roundBYN(val: number): number {
  return Math.round(val * 100) / 100;
}
