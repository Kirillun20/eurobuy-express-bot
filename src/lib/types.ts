export interface Order {
  id: string;
  link: string;
  name: string;
  quantity: number;
  weight: number;
  price: number;
  currency: string;
  country: string;
  deliveryMethod: string;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery?: string;
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

export const COUNTRIES = [
  'Германия', 'Франция', 'Италия', 'Испания', 'Великобритания',
  'Нидерланды', 'Бельгия', 'Австрия', 'Польша', 'Чехия',
  'Португалия', 'Швеция', 'Финляндия', 'Дания', 'Швейцария',
];

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'PLN', 'CZK', 'SEK'];

export const DELIVERY_METHODS = [
  { id: 'standard', name: 'Стандартная доставка', days: '10-14 дней', price: 15 },
  { id: 'express', name: 'Экспресс доставка', days: '5-7 дней', price: 35 },
  { id: 'premium', name: 'Премиум доставка', days: '3-5 дней', price: 55 },
];

export const PAYMENT_METHODS = [
  { id: 'card', name: 'Банковская карта' },
  { id: 'transfer', name: 'Банковский перевод' },
  { id: 'crypto', name: 'Криптовалюта' },
];
