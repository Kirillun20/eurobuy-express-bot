import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllOrders, getAllReviews, deleteReviewById, getAllProfiles, updateOrderStatus as dbUpdateStatus, updateOrderEstimate as dbUpdateEstimate, deleteOrderById, getAllChatSessions, getChatMessages, sendChatMessage, ChatMessage } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import {
  Order, Review, ORDER_STATUS_LABELS, ORDER_STATUS_DESCRIPTIONS, ALL_STATUSES, OrderStatus,
  DELIVERY_METHODS, PAYMENT_METHODS, roundBYN, User, StatusUpdate,
} from '@/lib/types';
import { toast } from 'sonner';
import {
  Shield, Lock, Eye, EyeOff, Package, Star, Users, BarChart3,
  Search, Trash2, ChevronDown, ChevronUp, TrendingUp, DollarSign,
  Clock, CheckCircle2, Truck, MapPin, ShieldCheck, ArrowLeft,
  MessageSquare, Filter, Edit3, Phone, Mail, MessageCircle, Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ADMIN_PASSWORD = 'eurobuy2026';

const STATUS_ICONS: Record<string, typeof Package> = {
  pending: Clock, confirmed: CheckCircle2, purchased: ShieldCheck,
  shipped: Truck, customs: MapPin, delivered: CheckCircle2,
};

type Tab = 'stats' | 'orders' | 'reviews' | 'users' | 'chat';

const AdminPage = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [reviewSearch, setReviewSearch] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<{ sessionId: string; lastMessage: string; lastTime: string; unread: number }[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [adminReply, setAdminReply] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authenticated) {
      setLoading(true);
      Promise.all([getAllOrders(), getAllReviews(), getAllProfiles()]).then(([o, r, p]) => {
        setOrders(o); setReviews(r); setProfiles(p); setLoading(false);
      });
    }
  }, [authenticated]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) { setAuthenticated(true); toast.success('Вход выполнен'); }
    else toast.error('Неверный пароль');
  };

  const updateOrderStatusHandler = async (orderId: string, newStatus: OrderStatus, comment?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const newHistory: StatusUpdate[] = [...(order.statusHistory || []), { status: newStatus, date: new Date().toISOString(), comment: comment || 'Обновлено администратором' }];
    await dbUpdateStatus(orderId, newStatus, newHistory);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, statusHistory: newHistory } : o));
    toast.success(`Статус обновлён: ${ORDER_STATUS_LABELS[newStatus]}`);
  };

  const updateOrderEstimateHandler = async (orderId: string, days: number) => {
    const est = new Date(Date.now() + days * 86400000).toISOString();
    await dbUpdateEstimate(orderId, est);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, estimatedDelivery: est } : o));
    toast.success(`Срок доставки: ~${days} дней`);
  };

  const deleteOrder = async (orderId: string) => {
    await deleteOrderById(orderId);
    setOrders(prev => prev.filter(o => o.id !== orderId));
    toast.success('Заказ удалён');
  };

  const deleteReview = async (reviewId: string) => {
    await deleteReviewById(reviewId);
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    toast.success('Отзыв удалён');
  };

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + roundBYN((o.totalPriceBYN || 0) + (o.totalServiceBYN || 0) + (o.deliveryCostBYN || 0)), 0);
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0';
    const statusCounts = ALL_STATUSES.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc; }, {} as Record<string, number>);
    return { totalRevenue, avgRating, statusCounts, totalOrders: orders.length, totalReviews: reviews.length, totalClients: profiles.length };
  }, [orders, reviews, profiles]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (orderSearch) { const q = orderSearch.toLowerCase(); result = result.filter(o => o.trackNumber?.toLowerCase().includes(q) || o.id.includes(q)); }
    if (orderStatusFilter !== 'all') result = result.filter(o => o.status === orderStatusFilter);
    return result;
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredReviews = useMemo(() => {
    if (!reviewSearch) return reviews;
    const q = reviewSearch.toLowerCase();
    return reviews.filter(r => r.name.toLowerCase().includes(q) || r.text.toLowerCase().includes(q));
  }, [reviews, reviewSearch]);

  if (!authenticated) {
    return (
      <div className="px-4 py-6 pb-20 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 glow-primary"><Shield size={28} className="text-primary-foreground" /></div>
            <h1 className="text-2xl font-display font-bold">Админ-панель</h1>
            <p className="text-sm text-muted-foreground mt-1">Введите пароль для доступа</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Label className="text-xs mb-1.5 block text-muted-foreground">Пароль</Label>
              <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="glass border-glow bg-transparent h-11 rounded-xl pr-10" />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[34px] text-muted-foreground">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            <Button onClick={handleLogin} className="w-full gradient-primary glow-primary text-primary-foreground font-semibold h-12 rounded-xl border-0"><Lock size={16} className="mr-2" /> Войти</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: 'stats', label: 'Статистика', icon: BarChart3 },
    { id: 'orders', label: 'Заказы', icon: Package },
    { id: 'reviews', label: 'Отзывы', icon: Star },
    { id: 'users', label: 'Клиенты', icon: Users },
    { id: 'chat', label: 'Чат', icon: MessageCircle },
  ];

  // Load chat sessions when tab is selected
  useEffect(() => {
    if (activeTab === 'chat' && authenticated) {
      getAllChatSessions().then(setChatSessions);
    }
  }, [activeTab, authenticated]);

  // Load messages for selected session
  useEffect(() => {
    if (!selectedSession) return;
    getChatMessages(selectedSession).then(setSessionMessages);
  }, [selectedSession]);

  // Realtime for admin chat
  useEffect(() => {
    if (!selectedSession) return;
    const channel = supabase
      .channel(`admin-chat-${selectedSession}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${selectedSession}` },
        (payload) => {
          const m = payload.new as any;
          const msg: ChatMessage = { id: m.id, sessionId: m.session_id, text: m.text, isUser: m.is_user, isAdmin: m.is_admin, createdAt: m.created_at };
          setSessionMessages(prev => prev.some(p => p.id === msg.id) ? prev : [...prev, msg]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedSession]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [sessionMessages]);

  const handleAdminReply = async () => {
    if (!adminReply.trim() || !selectedSession) return;
    await sendChatMessage(selectedSession, adminReply.trim(), false, true);
    setAdminReply('');
  };

  return (
    <div className="px-4 py-6 pb-20 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl glass hover:border-glow"><ArrowLeft size={18} /></button>
          <div><h1 className="text-xl font-display font-bold">Админ-панель</h1><p className="text-xs text-muted-foreground">Управление EuroBuy</p></div>
        </div>
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary"><Shield size={18} className="text-primary-foreground" /></div>
      </motion.div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map(tab => { const Icon = tab.icon; return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'gradient-primary text-primary-foreground glow-primary' : 'glass text-muted-foreground hover:text-foreground'}`}>
            <Icon size={14} />{tab.label}
          </button>
        ); })}
      </div>

      {loading ? <div className="text-center py-12 text-muted-foreground">Загрузка...</div> : (
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {/* STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Заказов', value: stats.totalOrders, icon: Package, color: 'text-blue-400' },
                  { label: 'Выручка (BYN)', value: roundBYN(stats.totalRevenue), icon: DollarSign, color: 'text-emerald-400' },
                  { label: 'Клиентов', value: stats.totalClients, icon: Users, color: 'text-purple-400' },
                  { label: 'Средний рейтинг', value: stats.avgRating, icon: Star, color: 'text-yellow-400' },
                ].map(s => { const Icon = s.icon; return (
                  <div key={s.label} className="glass rounded-xl p-4 border-glow">
                    <Icon size={18} className={`${s.color} mb-2`} />
                    <div className="text-xl font-display font-bold">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground">{s.label}</div>
                  </div>
                ); })}
              </div>
              <div className="glass rounded-xl p-4 border-glow">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-primary" /> По статусам</h3>
                <div className="space-y-2">
                  {ALL_STATUSES.map(status => {
                    const count = stats.statusCounts[status] || 0;
                    const pct = stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0;
                    const Icon = STATUS_ICONS[status] || Package;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <Icon size={14} className="text-muted-foreground shrink-0" />
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1"><span>{ORDER_STATUS_LABELS[status]}</span><span className="text-muted-foreground">{count}</span></div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-primary" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Поиск по трек-номеру..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="glass border-glow bg-transparent h-9 rounded-xl pl-9 text-xs" />
                </div>
                <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                  <SelectTrigger className="glass border-glow bg-transparent h-9 rounded-xl w-[140px] text-xs"><Filter size={12} className="mr-1" /><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong rounded-xl">
                    <SelectItem value="all">Все статусы</SelectItem>
                    {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">{filteredOrders.length} заказ(ов)</p>
              <div className="space-y-2">
                {filteredOrders.map(order => {
                  const isExpanded = expandedOrder === order.id;
                  const grandTotal = roundBYN((order.totalPriceBYN || 0) + (order.totalServiceBYN || 0) + (order.deliveryCostBYN || 0));
                  const profile = profiles.find(p => p.id === order.profileId);
                  return (
                    <div key={order.id} className="glass rounded-xl overflow-hidden border-glow">
                      <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} className="w-full p-3 text-left">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold font-display text-gradient">{order.trackNumber}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {profile ? `${profile.name} · ` : ''}{order.items?.[0]?.name || 'Заказ'} · {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{grandTotal} BYN</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </div>
                        </div>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-3 pb-3 space-y-3">
                              {/* Client info */}
                              {profile && (
                                <div className="glass rounded-lg p-2.5">
                                  <p className="text-[10px] text-muted-foreground mb-1">Клиент</p>
                                  <p className="text-xs font-medium">{profile.name}</p>
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail size={9} />{profile.email}</p>
                                  {profile.phone && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone size={9} />{profile.phone}</p>}
                                </div>
                              )}
                              {/* Status change */}
                              <div>
                                <Label className="text-[10px] text-muted-foreground mb-1 block">Изменить статус</Label>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {ALL_STATUSES.map(s => {
                                    const Icon = STATUS_ICONS[s];
                                    const isActive = order.status === s;
                                    return (
                                      <button key={s} onClick={() => {
                                        if (!isActive) {
                                          if (editingComment === order.id) {
                                            updateOrderStatusHandler(order.id, s, commentText || undefined);
                                            setEditingComment(null); setCommentText('');
                                          } else updateOrderStatusHandler(order.id, s);
                                        }
                                      }}
                                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${isActive ? 'gradient-primary text-primary-foreground' : 'glass hover:border-glow text-muted-foreground'}`}>
                                        <Icon size={10} />{ORDER_STATUS_LABELS[s].split(' ')[0]}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              {/* Comment */}
                              <div>
                                {editingComment === order.id ? (
                                  <div className="space-y-2">
                                    <Textarea placeholder="Комментарий..." value={commentText} onChange={e => setCommentText(e.target.value)} className="glass border-glow bg-transparent rounded-lg text-xs min-h-[50px]" />
                                    <Button size="sm" onClick={() => { setEditingComment(null); setCommentText(''); }} variant="outline" className="glass border-glow h-7 text-[10px] rounded-lg">Отмена</Button>
                                  </div>
                                ) : (
                                  <button onClick={() => setEditingComment(order.id)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"><Edit3 size={10} /> Комментарий при смене статуса</button>
                                )}
                              </div>
                              {/* Estimate */}
                              <div>
                                <Label className="text-[10px] text-muted-foreground mb-1 block">Срок доставки</Label>
                                <div className="flex gap-1.5">
                                  {[3, 5, 7, 10, 14, 21].map(d => (
                                    <button key={d} onClick={() => updateOrderEstimateHandler(order.id, d)} className="px-2 py-1 rounded-lg glass text-[10px] hover:border-glow">{d} дн</button>
                                  ))}
                                </div>
                              </div>
                              {/* Items */}
                              <div className="text-xs space-y-1">
                                {order.items?.map((item, i) => (
                                  <div key={i} className="glass rounded-lg p-2">
                                    <p className="font-medium truncate text-[11px]">{item.name || item.link}</p>
                                    <p className="text-[10px] text-muted-foreground">{item.quantity} шт · {item.weight} кг · {item.priceBYN} BYN · {item.country}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="text-[10px] text-muted-foreground space-y-0.5">
                                <p>Доставка: {DELIVERY_METHODS.find(d => d.id === order.deliveryMethod)?.name || order.deliveryMethod} ({order.deliveryCostBYN} BYN)</p>
                                <p>Оплата: {PAYMENT_METHODS.find(p => p.id === order.paymentMethod)?.name || order.paymentMethod}</p>
                                <p className="font-bold text-foreground">Итого: {grandTotal} BYN</p>
                              </div>
                              {/* History */}
                              {order.statusHistory?.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-medium mb-1">История</p>
                                  <div className="space-y-1">
                                    {order.statusHistory.map((h, hi) => (
                                      <div key={hi} className="text-[9px] text-muted-foreground flex items-start gap-1.5">
                                        <span className="shrink-0">{new Date(h.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                        <span>— {ORDER_STATUS_LABELS[h.status]}</span>
                                        {h.comment && <span className="text-foreground/60">({h.comment})</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <button onClick={() => deleteOrder(order.id)} className="flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80"><Trash2 size={10} /> Удалить заказ</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                {filteredOrders.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">Заказов не найдено</div>}
              </div>
            </div>
          )}

          {/* REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Поиск..." value={reviewSearch} onChange={e => setReviewSearch(e.target.value)} className="glass border-glow bg-transparent h-9 rounded-xl pl-9 text-xs" />
              </div>
              <p className="text-xs text-muted-foreground">{filteredReviews.length} отзыв(ов)</p>
              <div className="space-y-2">
                {filteredReviews.map(review => (
                  <div key={review.id} className="glass rounded-xl p-3 border-glow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">{review.name}</span>
                          <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted'} />)}</div>
                          <span className="text-[10px] text-muted-foreground">{review.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{review.text}</p>
                      </div>
                      <button onClick={() => deleteReview(review.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 shrink-0 ml-2"><Trash2 size={13} className="text-destructive" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">{profiles.length} клиент(ов)</p>
              <div className="space-y-2">
                {profiles.map(p => (
                  <div key={p.id} className="glass rounded-xl p-3 border-glow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground">{p.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail size={9} />{p.email}</p>
                          {p.phone && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone size={9} />{p.phone}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-display font-bold text-yellow-400">{p.euroPoints || 0} баллов</p>
                        <p className="text-[10px] text-muted-foreground">{orders.filter(o => o.profileId === p.id).length} заказов</p>
                      </div>
                    </div>
                  </div>
                ))}
                {profiles.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">Нет клиентов</div>}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      )}
    </div>
  );
};

export default AdminPage;
