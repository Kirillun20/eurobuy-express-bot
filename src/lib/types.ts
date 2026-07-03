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
  profileId?: string;
  paymentDetails?: PaymentDetails;
  promoCode?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  appliesTo: 'total' | 'service' | 'delivery';
  minOrderByn: number;
  maxDiscountByn: number | null;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  description: string | null;
}

export interface PaymentDetails {
  bank?: string;
  cardNumber?: string;
  amount?: number;
  transferNote?: string;
}

export const BANKS = {
  by: [
    { id: 'belarusbank', name: 'Беларусбанк', card: '4255 1234 5678 9012' },
    { id: 'prior', name: 'Приорбанк', card: '4585 9876 5432 1098' },
    { id: 'alfa_by', name: 'Альфа-Банк BY', card: '4279 1111 2222 3333' },
    { id: 'mtbank', name: 'МТБанк', card: '5351 4444 5555 6666' },
    { id: 'bsb', name: 'БСБ Банк', card: '4255 7777 8888 9999' },
  ],
  ru: [
    { id: 'sber', name: 'Сбербанк', card: '2202 2061 1234 5678' },
    { id: 'tinkoff', name: 'Тинькофф', card: '2200 7001 2345 6789' },
    { id: 'alfa_ru', name: 'Альфа-Банк RU', card: '4584 3456 7890 1234' },
    { id: 'vtb', name: 'ВТБ', card: '2200 0201 2345 6780' },
  ],
};

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
  delivered: 'Доставлен (готов к выдаче)',
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'Ваш заказ принят и ожидает подтверждения менеджером',
  confirmed: 'Менеджер подтвердил заказ, начинаем выкуп товара',
  purchased: 'Товар успешно выкуплен и готовится к отправке',
  shipped: 'Посылка отправлена и находится в пути к вам',
  customs: 'Посылка проходит таможенное оформление',
  delivered: 'Заказ доставлен и готов к выдаче! Спасибо за покупку',
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
  { id: 'europost', name: 'Европочта', desc: '5-10 дней', priceBYN: 0 },
  { id: 'sdek', name: 'СДЭК', desc: '3-7 дней', priceBYN: 0 },
];

export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Наличные' },
  { id: 'transfer', name: 'Перевод на карту' },
  { id: 'cod', name: 'Наложенный платёж (+1.5%)' },
  { id: 'telegram_stars', name: 'Звёзды Telegram' },
  { id: 'crypto', name: 'Криптовалюта' },
];

export const MAX_WEIGHT_KG = 25;
export const MAX_PRICE_EUR = 500;

/**
 * Calculate service cost per weight tier in USD:
 * 0.5kg=$6, 1kg=$8, 2kg=$12, 3kg=$16, ..., up to 25kg with step +$4/kg
 */
export function getWeightPriceUSD(weightKg: number): number {
  if (weightKg <= 0) return 0;
  if (weightKg <= 0.5) return 8;
  if (weightKg <= 1) return 10;
  if (weightKg <= 2) return 15;
  const extraKg = Math.ceil(weightKg - 2);
  return 15 + extraKg * 5;
}

/**
 * Calculate service cost in BYN.
 * Compare 18% of item price (in BYN) vs weight-based price (USD→BYN).
 * Take the higher one.
 */
export function calculateServiceCostBYN(priceBYN: number, weightKg: number): number {
  const percentCost = priceBYN * 0.22;
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
  { id: 'delivery_10', name: 'Скидка на доставку 10 BYN', description: 'Полная скидка на доставку курьером', cost: 5, type: 'delivery_discount', value: 10 },
  { id: 'discount_2', name: 'Скидка 2%', description: 'На стоимость товаров', cost: 10, type: 'percent_discount', value: 2 },
  { id: 'discount_3', name: 'Скидка 3%', description: 'На стоимость товаров', cost: 20, type: 'percent_discount', value: 3 },
  { id: 'discount_5', name: 'Скидка 5%', description: 'На стоимость товаров', cost: 40, type: 'percent_discount', value: 5 },
  { id: 'discount_10', name: 'Скидка 10%', description: 'На стоимость товаров', cost: 80, type: 'percent_discount', value: 10 },
];

// Points earned per order: 1 point per 10 BYN spent
export function calculatePointsEarned(totalBYN: number): number {
  return Math.floor(totalBYN / 10);
}
