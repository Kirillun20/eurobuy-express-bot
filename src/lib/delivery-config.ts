// =================== EUROPOST WEIGHT TIERS ===================

export const EUROPOST_WEIGHT_TIERS = [
  { minKg: 0.01, maxKg: 1, priceBYN: 5.6 },
  { minKg: 1.01, maxKg: 2, priceBYN: 6.4 },
  { minKg: 2.01, maxKg: 5, priceBYN: 7.4 },
  { minKg: 5.01, maxKg: 10, priceBYN: 11 },
  { minKg: 10.01, maxKg: 15, priceBYN: 16.5 },
  { minKg: 15.01, maxKg: 20, priceBYN: 22 },
  { minKg: 20.01, maxKg: 25, priceBYN: 27.3 },
];

export function getEuropostCost(weightKg: number): number {
  if (weightKg <= 0) return 0;
  const tier = EUROPOST_WEIGHT_TIERS.find(t => weightKg >= t.minKg && weightKg <= t.maxKg);
  return tier?.priceBYN || 27.3;
}

// =================== PACKAGING OPTIONS ===================

export interface PackagingOption {
  id: string;
  name: string;
  size: string;
  price: number;
}

export interface PackagingCategory {
  name: string;
  icon: string;
  items: PackagingOption[];
}

export const PACKAGING_OPTIONS: PackagingCategory[] = [
  {
    name: 'Картонные коробки',
    icon: '📦',
    items: [
      { id: 'box_165', name: 'Картонная коробка', size: '165 × 115 × 50 мм', price: 1.00 },
      { id: 'box_200', name: 'Картонная коробка', size: '200 × 150 × 100 мм', price: 1.25 },
      { id: 'box_270', name: 'Картонная коробка', size: '270 × 175 × 60 мм', price: 1.60 },
      { id: 'box_240', name: 'Картонная коробка', size: '240 × 240 × 200 мм', price: 2.00 },
      { id: 'box_300a', name: 'Картонная коробка', size: '300 × 125 × 120 мм', price: 1.25 },
      { id: 'box_300b', name: 'Картонная коробка', size: '300 × 200 × 100 мм', price: 2.25 },
      { id: 'box_400', name: 'Картонная коробка', size: '400 × 300 × 200 мм', price: 3.50 },
    ],
  },
  {
    name: 'Повышенная прочность',
    icon: '🛡️',
    items: [
      { id: 'rbox_350', name: 'Коробка повыш. прочности', size: '350 × 250 × 250 мм', price: 4.00 },
      { id: 'rbox_400a', name: 'Коробка повыш. прочности', size: '400 × 300 × 200 мм', price: 4.50 },
      { id: 'rbox_400b', name: 'Коробка повыш. прочности', size: '400 × 400 × 400 мм', price: 5.20 },
      { id: 'rbox_500', name: 'Коробка повыш. прочности', size: '500 × 300 × 80 мм', price: 4.50 },
      { id: 'rbox_600a', name: 'Коробка повыш. прочности', size: '600 × 400 × 200 мм', price: 6.80 },
      { id: 'rbox_600b', name: 'Коробка повыш. прочности', size: '600 × 600 × 400 мм', price: 9.00 },
    ],
  },
  {
    name: 'Тубусы',
    icon: '📜',
    items: [
      { id: 'tube_600', name: 'Тубус картонный', size: '600 × 150 × 100 мм', price: 2.50 },
      { id: 'tube_900', name: 'Тубус картонный', size: '900 × 200 × 150 мм', price: 3.50 },
    ],
  },
  {
    name: 'Пузырчатые пакеты',
    icon: '💨',
    items: [
      { id: 'bubble_cd', name: 'Пакет пузырчатый CD', size: '160 × 180 мм', price: 0.80 },
      { id: 'bubble_d1', name: 'Пакет пузырчатый D/1', size: '180 × 260 мм', price: 1.10 },
      { id: 'bubble_g4', name: 'Пакет пузырчатый G/4', size: '240 × 330 мм', price: 1.40 },
      { id: 'bubble_k7', name: 'Пакет пузырчатый K/7', size: '350 × 470 мм', price: 2.20 },
    ],
  },
  {
    name: 'Курьерские пакеты',
    icon: '✉️',
    items: [
      { id: 'courier_180', name: 'Курьерский пакет', size: '180 × 110 мм', price: 0.30 },
      { id: 'courier_220', name: 'Курьерский пакет', size: '220 × 150 мм', price: 0.45 },
      { id: 'courier_350', name: 'Курьерский пакет', size: '350 × 250 мм', price: 0.60 },
      { id: 'courier_450', name: 'Курьерский пакет', size: '450 × 350 мм', price: 0.80 },
    ],
  },
  {
    name: 'Другое',
    icon: '📋',
    items: [
      { id: 'gofro_600', name: 'Гофролист картонный', size: '600 × 600 мм', price: 2.00 },
    ],
  },
];

// =================== DELIVERY METHODS ===================

export interface DeliveryMethodV2 {
  id: string;
  name: string;
  desc: string;
  priceBYN: number;
  type: 'fixed' | 'weight' | 'individual';
}

export const DELIVERY_METHODS_V2: DeliveryMethodV2[] = [
  { id: 'courier_minsk', name: 'Курьером по Минску', desc: '1-2 дня', priceBYN: 10, type: 'fixed' },
  { id: 'pickup_minsk', name: 'Самовывоз (Минск)', desc: 'После получения', priceBYN: 0, type: 'fixed' },
  { id: 'pickup_moscow', name: 'Самовывоз (Москва)', desc: 'После получения', priceBYN: 0, type: 'fixed' },
  { id: 'europost', name: 'Европочта', desc: '5-10 дней', priceBYN: 0, type: 'weight' },
  { id: 'sdek', name: 'СДЭК', desc: '3-7 дней', priceBYN: 0, type: 'individual' },
];

export function getDeliveryCost(methodId: string, weightKg: number): number {
  const method = DELIVERY_METHODS_V2.find(m => m.id === methodId);
  if (!method) return 0;
  if (method.type === 'fixed') return method.priceBYN;
  if (method.type === 'weight') return getEuropostCost(weightKg);
  return 0; // individual - determined by manager
}

export function getDeliveryLabel(methodId: string, weightKg: number): string {
  const method = DELIVERY_METHODS_V2.find(m => m.id === methodId);
  if (!method) return '';
  if (method.type === 'fixed') return method.priceBYN > 0 ? `${method.priceBYN} BYN` : 'Бесплатно';
  if (method.type === 'weight') {
    const cost = getEuropostCost(weightKg);
    return weightKg > 0 ? `${cost} BYN` : 'По весу';
  }
  return 'Индивидуально';
}

// =================== PAYMENT METHODS ===================

export interface PaymentMethodV2 {
  id: string;
  name: string;
  desc?: string;
  europostOnly?: boolean;
}

export const PAYMENT_METHODS_V2: PaymentMethodV2[] = [
  { id: 'cash', name: 'Наличные' },
  { id: 'transfer', name: 'Перевод на карту' },
  { id: 'cod', name: 'Наложенный платёж', desc: '+1.5% от стоимости', europostOnly: true },
  { id: 'telegram_stars', name: 'Звёзды Telegram' },
  { id: 'crypto', name: 'Криптовалюта' },
];

export function getCodSurcharge(totalPriceBYN: number): number {
  return Math.round(totalPriceBYN * 0.015 * 100) / 100;
}

// =================== BANK REQUISITES (default, overridden by DB) ===================

export interface BankInfo {
  id: string;
  name: string;
  card: string;
}

export const DEFAULT_BANKS: Record<'by' | 'ru', BankInfo[]> = {
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
