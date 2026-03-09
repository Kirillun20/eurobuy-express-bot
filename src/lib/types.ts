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
  pointsEarned?: number;
  discountApplied?: number;
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
  euroPoints?: number;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждён',
  purchased: 'Выкуплен',
  shipped: 'Отправлен',
  customs: 'На таможне',
  delivered: 'Доставлен',
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'Ваш заказ принят и ожидает подтверждения менеджером',
  confirmed: 'Менеджер подтвердил заказ, начинаем выкуп товара',
  purchased: 'Товар успешно выкуплен и готовится к отправке',
  shipped: 'Посылка отправлена и находится в пути к вам',
  customs: 'Посылка проходит таможенное оформление',
  delivered: 'Заказ доставлен! Спасибо за покупку',
};

export const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'purchased', 'shipped', 'customs', 'delivered'];

export const COUNTRIES = [
  'Польша', 'Германия', 'Франция', 'Италия', 'Испания', 'Великобритания',
  'Нидерланды', 'Бельгия', 'Австрия', 'Чехия',
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
  { id: 'europost', name: 'Европочта', desc: '5-10 дней', priceBYN: 10 },
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

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
}

// EuroPoints system
export interface EuroPointsReward {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'delivery_discount' | 'percent_discount';
  value: number; // BYN for delivery, percent for discount
}

export const EUROPOINTS_REWARDS: EuroPointsReward[] = [
  { id: 'delivery_10', name: 'Скидка на доставку 10 BYN', description: 'Полная скидка на доставку курьером', cost: 1, type: 'delivery_discount', value: 10 },
  { id: 'discount_2', name: 'Скидка 2%', description: 'На стоимость товаров', cost: 2, type: 'percent_discount', value: 2 },
  { id: 'discount_3', name: 'Скидка 3%', description: 'На стоимость товаров', cost: 3, type: 'percent_discount', value: 3 },
  { id: 'discount_5', name: 'Скидка 5%', description: 'На стоимость товаров', cost: 5, type: 'percent_discount', value: 5 },
  { id: 'discount_10', name: 'Скидка 10%', description: 'На стоимость товаров', cost: 10, type: 'percent_discount', value: 10 },
];

// Points earned per order: 1 point per 50 BYN spent
export function calculatePointsEarned(totalBYN: number): number {
  return Math.floor(totalBYN / 50);
}
