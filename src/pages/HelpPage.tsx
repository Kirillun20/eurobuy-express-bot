import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, HelpCircle, MessageCircle, Phone, Mail, MapPin, Clock,
  ChevronDown, ChevronUp, Send, ShoppingBag, Calculator, CreditCard,
  Truck, Package, Star, Sparkles, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { getChatMessages, sendChatMessage, ChatMessage } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';

const faqItems = [
  { q: 'Как сделать заказ?', a: 'Перейдите на страницу "Заказ", вставьте ссылку на товар или укажите название, заполните параметры (вес, цена, страна) и выберите способ доставки и оплаты. После оформления вы получите трек-номер для отслеживания.', icon: ShoppingBag },
  { q: 'Как рассчитать стоимость?', a: 'Воспользуйтесь калькулятором — укажите стоимость товара, вес и способ доставки. Комиссия составляет 22% от стоимости товара или фиксированная цена за вес (выбирается большее). Лимиты: 500 EUR и 25 кг. Точную сумму подтвердит менеджер.', icon: Calculator },
  { q: 'Какие способы оплаты доступны?', a: 'Мы принимаем банковские карты (в тестовом режиме), банковские переводы (белорусские и российские банки) и оплату наличными при получении.', icon: CreditCard },
  { q: 'Сколько времени занимает доставка?', a: 'Курьером по Минску — 1-2 дня, СДЭК — 3-7 дней, Европочтой — 5-10 дней. Самовывоз доступен сразу после получения. Точные сроки зависят от страны отправления.', icon: Truck },
  { q: 'Как отследить заказ?', a: 'После оформления заказа вы получите трек-номер. Введите его на главной странице в блоке "Отследить заказ" или зайдите в личный кабинет для подробной информации.', icon: Package },
  { q: 'Что такое ЕвроБаллы?', a: 'ЕвроБаллы — это программа лояльности. За каждые 10 BYN в заказе вы получаете 1 балл. Баллы можно обменять на скидку на доставку или процентные скидки от 2% до 10%.', icon: Star },
];

const steps = [
  { num: '01', title: 'Найдите товар', desc: 'Скопируйте ссылку на товар из любого европейского магазина или опишите что хотите' },
  { num: '02', title: 'Оформите заказ', desc: 'Вставьте ссылку, укажите параметры товара, выберите доставку и оплату' },
  { num: '03', title: 'Мы выкупаем', desc: 'Наши агенты в Европе купят товар по лучшей цене и подготовят к отправке' },
  { num: '04', title: 'Получите товар', desc: 'Отслеживайте статус в кабинете и получите посылку удобным способом' },
];

function getSessionId(): string {
  let id = localStorage.getItem('chat_session_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('chat_session_id', id); }
  return id;
}

const HelpPage = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const sessionId = useRef(getSessionId()).current;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showChat) return;
    setLoadingChat(true);
    getChatMessages(sessionId).then(msgs => {
      if (msgs.length === 0) {
        // Send initial greeting
        sendChatMessage(sessionId, 'Здравствуйте! Я ваш помощник EuroBuy. Чем могу помочь? 😊', false).then(m => {
          if (m) setChatMessages([m]);
        });
      } else {
        setChatMessages(msgs);
      }
      setLoadingChat(false);
    });
  }, [showChat, sessionId]);

  // Realtime subscription
  useEffect(() => {
    if (!showChat) return;
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const m = payload.new as any;
          const msg: ChatMessage = { id: m.id, sessionId: m.session_id, text: m.text, isUser: m.is_user, isAdmin: m.is_admin, createdAt: m.created_at };
          setChatMessages(prev => {
            if (prev.some(p => p.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [showChat, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    await sendChatMessage(sessionId, text, true);
  };

  return (
    <div className="pb-20 overflow-hidden">
      <div className="px-4 py-6 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl glass border-glow flex items-center justify-center">
            <ArrowLeft size={16} className="text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center glow-primary">
              <HelpCircle size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Помощь</h1>
              <p className="text-xs text-muted-foreground">FAQ, контакты и поддержка</p>
            </div>
          </div>
        </motion.div>

        {/* Chat with support - moved to top for visibility */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
          <button onClick={() => setShowChat(!showChat)}
            className="w-full glass rounded-2xl p-4 border-glow hover:shadow-glow transition-all flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
                <MessageCircle size={18} className="text-primary-foreground" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-sm">Чат с поддержкой</h3>
                <p className="text-[10px] text-muted-foreground">Напишите нам — ответим быстро!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-medium">Онлайн</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </button>

          <AnimatePresence>
            {showChat && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="glass rounded-2xl border-glow overflow-hidden">
                  <div className="gradient-primary px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                      <MessageCircle size={14} className="text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary-foreground">EuroBuy Support</p>
                      <p className="text-[10px] text-primary-foreground/70">Обычно отвечаем в течение 5 минут</p>
                    </div>
                  </div>

                  <div className="h-72 overflow-y-auto p-4 space-y-3">
                    {loadingChat && <p className="text-xs text-muted-foreground text-center">Загрузка...</p>}
                    {chatMessages.map((msg) => (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                          msg.isUser ? 'gradient-primary text-primary-foreground rounded-br-md' : 'glass border-glow rounded-bl-md'
                        }`}>
                          {msg.isAdmin && <p className="text-[9px] font-semibold mb-0.5 opacity-70">Поддержка</p>}
                          <p className="text-xs leading-relaxed">{msg.text}</p>
                          <p className={`text-[9px] mt-1 ${msg.isUser ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 border-t border-border flex gap-2">
                    <Input placeholder="Введите сообщение..." value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()} className="glass border-glow bg-transparent h-10 rounded-xl text-xs flex-1" />
                    <Button onClick={handleSend} size="icon" className="gradient-primary text-primary-foreground h-10 w-10 rounded-xl border-0"><Send size={16} /></Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* How to order */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />Как заказать товар
          </h2>
          <div className="space-y-3 mb-8">
            {steps.map((s, idx) => (
              <motion.div key={s.num} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + idx * 0.08 }}
                className="flex items-start gap-4 glass rounded-2xl p-4 border-glow group hover:shadow-glow transition-all">
                <span className="text-2xl font-display font-bold text-gradient shrink-0">{s.num}</span>
                <div><h3 className="font-display font-semibold text-sm">{s.title}</h3><p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p></div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2"><HelpCircle size={18} className="text-primary" />Частые вопросы</h2>
          <div className="space-y-2 mb-8">
            {faqItems.map((item, idx) => {
              const Icon = item.icon;
              const isOpen = expandedFaq === idx;
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + idx * 0.05 }}
                  className="glass rounded-xl border-glow overflow-hidden">
                  <button onClick={() => setExpandedFaq(isOpen ? null : idx)} className="w-full p-4 text-left flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon size={16} className="text-primary" /></div>
                    <span className="text-sm font-medium flex-1">{item.q}</span>
                    {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed ml-11">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Contacts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2"><Phone size={18} className="text-primary" />Контакты</h2>
          <div className="glass rounded-2xl p-5 border-glow shadow-glow space-y-4 mb-8">
            {[
              { icon: MessageCircle, label: 'Telegram', value: '@kirillmr', href: 'https://t.me/kirillmr', color: 'text-blue-400' },
              { icon: Phone, label: 'Телефон', value: '+375 (29) 349-40-80', href: 'tel:+375293494080', color: 'text-emerald-400' },
              { icon: Mail, label: 'Email', value: 'support@eurobuy.by', href: 'mailto:support@eurobuy.by', color: 'text-purple-400' },
              { icon: MapPin, label: 'Адрес', value: 'Минск, Беларусь', color: 'text-orange-400' },
              { icon: Clock, label: 'Режим работы', value: 'Пн-Вс: 9:00 — 21:00', color: 'text-yellow-400' },
            ].map(({ icon: Icon, label, value, href, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon size={16} className={color} /></div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">{value} <ExternalLink size={10} /></a>
                  ) : (
                    <p className="text-sm font-medium">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpPage;
