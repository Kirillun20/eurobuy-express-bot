import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem, User, Review, StatusUpdate, PromoCode } from './types';

// =================== PROFILES ===================

export async function getProfile(profileId: string): Promise<User | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    euroPoints: data.euro_points || 0,
  };
}

export async function getProfileByUserId(userId: string): Promise<User | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    euroPoints: data.euro_points || 0,
  };
}

export async function updateProfileInfo(profileId: string, updates: { name?: string; phone?: string }): Promise<void> {
  await supabase.from('profiles').update(updates).eq('id', profileId);
}

export async function updateProfilePoints(profileId: string, points: number): Promise<void> {
  await supabase.from('profiles').update({ euro_points: points }).eq('id', profileId);
}

export async function getAllProfiles(): Promise<User[]> {
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone || '',
    euroPoints: p.euro_points || 0,
  }));
}

// =================== ORDERS ===================

function dbOrderToOrder(d: any): Order {
  return {
    id: d.id,
    trackNumber: d.track_number,
    items: (d.items as any[] || []) as OrderItem[],
    totalWeight: Number(d.total_weight),
    totalPriceBYN: Number(d.total_price_byn),
    totalServiceBYN: Number(d.total_service_byn),
    deliveryMethod: d.delivery_method,
    deliveryCostBYN: Number(d.delivery_cost_byn),
    paymentMethod: d.payment_method,
    status: d.status as any,
    createdAt: d.created_at,
    estimatedDelivery: d.estimated_delivery || undefined,
    statusHistory: (d.status_history as any[] || []) as StatusUpdate[],
    pointsEarned: d.points_earned || 0,
    discountApplied: Number(d.discount_applied) || 0,
    profileId: d.profile_id || undefined,
    paymentDetails: d.payment_details || undefined,
    promoCode: d.promo_code || undefined,
  };
}

// =================== PROMO CODES ===================

function dbPromo(p: any): PromoCode {
  return {
    id: p.id,
    code: p.code,
    discountType: p.discount_type,
    discountValue: Number(p.discount_value),
    appliesTo: p.applies_to,
    minOrderByn: Number(p.min_order_byn),
    maxDiscountByn: p.max_discount_byn != null ? Number(p.max_discount_byn) : null,
    usageLimit: p.usage_limit,
    usedCount: p.used_count,
    active: p.active,
    expiresAt: p.expires_at,
    description: p.description,
  };
}

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
  return (data || []).map(dbPromo);
}

export async function validatePromoCode(code: string): Promise<PromoCode | null> {
  const { data } = await supabase.from('promo_codes').select('*').eq('code', code.toUpperCase()).maybeSingle();
  if (!data) return null;
  const p = dbPromo(data);
  if (!p.active) return null;
  if (p.expiresAt && new Date(p.expiresAt) < new Date()) return null;
  if (p.usageLimit != null && p.usedCount >= p.usageLimit) return null;
  return p;
}

export async function consumePromoCode(code: string): Promise<boolean> {
  const { data } = await (supabase as any).rpc('consume_promo_code', { _code: code.toUpperCase() });
  return !!data;
}

export async function createPromoCode(input: Omit<PromoCode, 'id' | 'usedCount'>): Promise<PromoCode | null> {
  const { data, error } = await supabase.from('promo_codes').insert({
    code: input.code.toUpperCase(),
    discount_type: input.discountType,
    discount_value: input.discountValue,
    applies_to: input.appliesTo,
    min_order_byn: input.minOrderByn,
    max_discount_byn: input.maxDiscountByn,
    usage_limit: input.usageLimit,
    active: input.active,
    expires_at: input.expiresAt,
    description: input.description,
  }).select().single();
  if (error || !data) return null;
  return dbPromo(data);
}

export async function updatePromoCode(id: string, patch: Partial<PromoCode>): Promise<void> {
  const dbPatch: any = {};
  if (patch.code !== undefined) dbPatch.code = patch.code.toUpperCase();
  if (patch.discountType !== undefined) dbPatch.discount_type = patch.discountType;
  if (patch.discountValue !== undefined) dbPatch.discount_value = patch.discountValue;
  if (patch.appliesTo !== undefined) dbPatch.applies_to = patch.appliesTo;
  if (patch.minOrderByn !== undefined) dbPatch.min_order_byn = patch.minOrderByn;
  if (patch.maxDiscountByn !== undefined) dbPatch.max_discount_byn = patch.maxDiscountByn;
  if (patch.usageLimit !== undefined) dbPatch.usage_limit = patch.usageLimit;
  if (patch.active !== undefined) dbPatch.active = patch.active;
  if (patch.expiresAt !== undefined) dbPatch.expires_at = patch.expiresAt;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  await supabase.from('promo_codes').update(dbPatch).eq('id', id);
}

export async function deletePromoCode(id: string): Promise<void> {
  await supabase.from('promo_codes').delete().eq('id', id);
}

export function computePromoDiscount(
  promo: PromoCode,
  totals: { totalPriceBYN: number; totalServiceBYN: number; deliveryCostBYN: number }
): number {
  const grand = totals.totalPriceBYN + totals.totalServiceBYN + totals.deliveryCostBYN;
  if (grand < promo.minOrderByn) return 0;
  const base =
    promo.appliesTo === 'service' ? totals.totalServiceBYN :
    promo.appliesTo === 'delivery' ? totals.deliveryCostBYN :
    grand;
  let d = promo.discountType === 'percent' ? base * (promo.discountValue / 100) : promo.discountValue;
  if (promo.maxDiscountByn != null) d = Math.min(d, promo.maxDiscountByn);
  return Math.min(Math.max(d, 0), base);
}

export async function createOrder(order: Order, profileId?: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      track_number: order.trackNumber,
      profile_id: profileId || null,
      items: order.items as any,
      total_weight: order.totalWeight,
      total_price_byn: order.totalPriceBYN,
      total_service_byn: order.totalServiceBYN,
      delivery_method: order.deliveryMethod,
      delivery_cost_byn: order.deliveryCostBYN,
      payment_method: order.paymentMethod,
      status: order.status,
      estimated_delivery: order.estimatedDelivery || null,
      status_history: order.statusHistory as any,
      points_earned: order.pointsEarned || 0,
      discount_applied: order.discountApplied || 0,
      payment_details: (order as any).paymentDetails || null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return dbOrderToOrder(data);
}

export async function getAllOrders(): Promise<Order[]> {
  const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  return (data || []).map(dbOrderToOrder);
}

export async function getOrdersByProfile(profileId: string): Promise<Order[]> {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  return (data || []).map(dbOrderToOrder);
}

export async function getOrderByTrackNumber(trackNumber: string): Promise<Order | null> {
  // Use SECURITY DEFINER RPC so guests can look up orders by track number
  const { data } = await (supabase as any).rpc('get_order_by_track', { _track: trackNumber });
  if (!data || !data.length) return null;
  return dbOrderToOrder(data[0]);
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  statusHistory: StatusUpdate[]
): Promise<void> {
  await supabase
    .from('orders')
    .update({ status: newStatus, status_history: statusHistory as any })
    .eq('id', orderId);
}

export async function updateOrderEstimate(orderId: string, estimatedDelivery: string): Promise<void> {
  await supabase.from('orders').update({ estimated_delivery: estimatedDelivery }).eq('id', orderId);
}

export async function deleteOrderById(orderId: string): Promise<void> {
  await supabase.from('orders').delete().eq('id', orderId);
}

// =================== REVIEWS ===================

export async function getAllReviews(): Promise<Review[]> {
  const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
  return (data || []).map(r => ({
    id: r.id,
    name: r.name,
    rating: r.rating,
    text: r.text,
    date: r.date,
  }));
}

export async function createReview(review: { name: string; rating: number; text: string; date: string }): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({ name: review.name, rating: review.rating, text: review.text, date: review.date })
    .select()
    .single();
  if (error || !data) return null;
  return { id: data.id, name: data.name, rating: data.rating, text: data.text, date: data.date };
}

export async function deleteReviewById(reviewId: string): Promise<void> {
  await supabase.from('reviews').delete().eq('id', reviewId);
}

// =================== POINTS ===================

export async function addPointsTransaction(profileId: string, amount: number, type: 'earned' | 'spent', description: string): Promise<void> {
  await supabase.from('points_transactions').insert({
    profile_id: profileId,
    amount,
    type,
    description,
  });
}

export async function addEuroPointsDb(profileId: string, points: number): Promise<void> {
  const profile = await getProfile(profileId);
  if (!profile) return;
  const newPoints = (profile.euroPoints || 0) + points;
  await updateProfilePoints(profileId, newPoints);
  await addPointsTransaction(profileId, points, 'earned', `Начислено за заказ`);
}

export async function spendEuroPointsDb(profileId: string, points: number): Promise<boolean> {
  const profile = await getProfile(profileId);
  if (!profile || (profile.euroPoints || 0) < points) return false;
  const newPoints = (profile.euroPoints || 0) - points;
  await updateProfilePoints(profileId, newPoints);
  await addPointsTransaction(profileId, points, 'spent', `Обменяно на скидку`);
  return true;
}

// =================== CHAT ===================

export interface ChatMessage {
  id: string;
  sessionId: string;
  text: string;
  isUser: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  return (data || []).map((m: any) => ({
    id: m.id,
    sessionId: m.session_id,
    text: m.text,
    isUser: m.is_user,
    isAdmin: m.is_admin,
    createdAt: m.created_at,
  }));
}

export async function sendChatMessage(sessionId: string, text: string, isUser: boolean, isAdmin: boolean = false): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ session_id: sessionId, text, is_user: isUser, is_admin: isAdmin })
    .select()
    .single();
  if (error || !data) return null;
  return { id: data.id, sessionId: data.session_id, text: data.text, isUser: data.is_user, isAdmin: data.is_admin, createdAt: data.created_at };
}

export async function getAllChatSessions(): Promise<{ sessionId: string; lastMessage: string; lastTime: string; unread: number }[]> {
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (!data) return [];
  const sessions = new Map<string, { lastMessage: string; lastTime: string; unread: number }>();
  for (const m of data) {
    if (!sessions.has(m.session_id)) {
      sessions.set(m.session_id, { lastMessage: m.text, lastTime: m.created_at, unread: 0 });
    }
    if (m.is_user && !m.is_admin) {
      const s = sessions.get(m.session_id)!;
      s.unread++;
    }
  }
  return Array.from(sessions.entries()).map(([sessionId, info]) => ({ sessionId, ...info }));
}

// =================== SITE SETTINGS ===================

export async function getSetting(key: string): Promise<any> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value || null;
}

export async function updateSetting(key: string, value: any): Promise<void> {
  const { data: existing } = await supabase
    .from('site_settings')
    .select('id')
    .eq('key', key)
    .single();
  if (existing) {
    await supabase.from('site_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
  } else {
    await supabase.from('site_settings').insert({ key, value });
  }
}

export async function getBankRequisites(): Promise<{ by: { id: string; name: string; card: string }[]; ru: { id: string; name: string; card: string }[] } | null> {
  const value = await getSetting('bank_requisites');
  return value as any;
}
