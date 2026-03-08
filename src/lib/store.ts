import { Order, User, Review } from './types';

const ORDERS_KEY = 'eurobuy_orders';
const USER_KEY = 'eurobuy_user';
const THEME_KEY = 'eurobuy_theme';

export const getOrders = (): Order[] => {
  const data = localStorage.getItem(ORDERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveOrder = (order: Order) => {
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const getOrderByTrack = (trackNumber: string): Order | undefined => {
  return getOrders().find(o => o.trackNumber.toLowerCase() === trackNumber.toLowerCase());
};

export const getUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveUser = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem(USER_KEY);
};

export const getTheme = (): 'light' | 'dark' => {
  return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'dark';
};

export const setTheme = (theme: 'light' | 'dark') => {
  localStorage.setItem(THEME_KEY, theme);
  if (theme === 'light') {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }
};

const REVIEWS_KEY = 'eurobuy_reviews';

const DEFAULT_REVIEWS: Review[] = [
  { id: '1', name: 'Анна К.', rating: 5, text: 'Заказывала кроссовки из Германии. Доставили за 5 дней, всё отлично!', date: '2025-12-10' },
  { id: '2', name: 'Дмитрий М.', rating: 5, text: 'Лучший сервис. Уже 4-й раз заказываю, всегда всё чётко.', date: '2026-01-15' },
  { id: '3', name: 'Елена П.', rating: 4, text: 'Быстро и недорого. Рекомендую всем друзьям!', date: '2026-02-20' },
];

export const getReviews = (): Review[] => {
  const data = localStorage.getItem(REVIEWS_KEY);
  if (!data) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(DEFAULT_REVIEWS));
    return DEFAULT_REVIEWS;
  }
  return JSON.parse(data);
};

export const saveReview = (review: Review) => {
  const reviews = getReviews();
  reviews.unshift(review);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
};
