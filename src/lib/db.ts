import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem, User, Review, StatusUpdate } from './types';

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

export async function getProfileByEmail(email: string): Promise<User | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
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

export async function createProfile(user: { name: string; email: string; phone: string }): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ name: user.name, email: user.email, phone: user.phone, euro_points: 0 })
    .select()
    .single();
  if (error || !data) return null;
  return { id: data.id, name: data.name, email: data.email, phone: data.phone || '', euroPoints: 0 };
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
  };
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
  const { data } = await supabase
    .from('orders')
    .select('*')
    .ilike('track_number', trackNumber)
    .single();
  if (!data) return null;
  return dbOrderToOrder(data);
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
