import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Shield, Truck, Clock, Globe, Star, Zap, Sparkles, Search, Package, MessageSquare, Send, ShoppingCart } from 'lucide-react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { getOrderByTrackNumber, getAllReviews, createReview } from '@/lib/db';
import { ORDER_STATUS_LABELS, Review } from '@/lib/types';
import { toast } from 'sonner';

// Define a custom hook for counting animation
const useCounter = (end: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration]);
  return { count, start: () => setStarted(true) };
};

const Particles = () => {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i, size: Math.random() * 4 + 2, left: Math.random() * 100,
    delay: Math.random() * 8, duration: Math.random() * 10 + 12, opacity: Math.random() * 0.4 + 0.1
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => <div key={p.id} className="particle bg-glow-primary" style={{ width: p.size, height: p.size, left: `${p.left}%`, bottom: '-10px', opacity: p.opacity, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }} />)}
    </div>
  );
};

const advantages = [
  { icon: Shield, title: 'Надёжность', desc: 'Гарантия безопасной доставки и страхование', color: 'from-blue-500/20 to-indigo-500/20' },
  { icon: Truck, title: 'Быстро', desc: 'От 3 дней из любой страны Европы', color: 'from-green-500/20 to-emerald-500/20' },
  { icon: Globe, title: '15+ стран', desc: 'Германия, Франция, Италия и другие', color: 'from-purple-500/20 to-violet-500/20' },
  { icon: Clock, title: '24/7', desc: 'Поддержка всегда на связи', color: 'from-orange-500/20 to-amber-500/20' },
  { icon: Star, title: 'Лучшие цены', desc: 'Без скрытых комиссий', color: 'from-pink-500/20 to-rose-500/20' },
  { icon: Zap, title: 'Просто', desc: 'Заказ за 2 минуты', color: 'from-cyan-500/20 to-teal-500/20' },
];

const chartData = [
  { name: 'Скорость', value: 95, icon: '⚡', color: 'from-blue-500 to-cyan-400' },
  { name: 'Надёжность', value: 99, icon: '🛡️', color: 'from-violet-500 to-purple-400' },
  { name: 'Цена', value: 88, icon: '💰', color: 'from-emerald-500 to-green-400' },
  { name: 'Поддержка', value: 97, icon: '💬', color: 'from-orange-500 to-amber-400' },
  { name: 'Удобство', value: 92, icon: '✨', color: 'from-pink-500 to-rose-400' },
];

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 30, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6 } } };

const TiltCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });
  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  return (
    <motion.div ref={ref} style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} onMouseMove={handleMouse} onMouseLeave={() => { x.set(0); y.set(0); }} className={className}>
      {children}
    </motion.div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [trackInput, setTrackInput] = useState('');
  const [trackResult, setTrackResult] = useState<null | { found: boolean; status?: string; track?: string }>(null);
  const ordersCounter = useCounter(10000, 2500);
  const countriesCounter = useCounter(15, 1500);
  const ratingCounter = useCounter(49, 2000);

  const searchTrack = async () => {
    if (!trackInput.trim()) return;
    const order = await getOrderByTrackNumber(trackInput.trim());
    if (order) {
      setTrackResult({ found: true, status: ORDER_STATUS_LABELS[order.status], track: order.trackNumber });
    } else {
      setTrackResult({ found: false });
      toast.error('Заказ не найден');
    }
  };

  return (
    <div className="pb-20 overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="absolute inset-0 gradient-mesh pointer-events-none" />
        <Particles />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] gradient-primary opacity-[0.12] blur-[80px] animate-morph pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none">
          <div className="animate-orbit"><div className="w-2 h-2 rounded-full bg-glow-primary/40" /></div>
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative text-center max-w-lg mx-auto py-0 my-0 -mt-12">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-glow mb-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
            <Sparkles size={14} className="text-primary relative z-10" />
            <span className="text-xs font-medium text-muted-foreground relative z-10">Премиум сервис доставки</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl sm:text-5xl font-display font-bold mb-4 leading-tight tracking-tight">
            Доставка и выкуп товаров из{' '}
            <span className="text-gradient inline-block relative">Европы
              <motion.span className="absolute -bottom-1 left-0 right-0 h-0.5 gradient-primary rounded-full" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8 }} style={{ originX: 0 }} />
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">
            Выкупим и доставим любой товар из Европы в РБ и РФ. Быстро, надёжно и по лучшим ценам.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex gap-3 justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button onClick={() => navigate('/order')} className="gradient-primary glow-primary text-primary-foreground font-semibold px-6 h-11 rounded-xl border-0 relative overflow-hidden group">
                <span className="relative z-10 flex items-center">Заказать <ArrowRight size={16} className="ml-1.5 group-hover:translate-x-1 transition-transform" /></span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button variant="outline" onClick={() => navigate('/calculator')} className="glass border-glow text-foreground hover:bg-primary/5 h-11 rounded-xl">Калькулятор</Button>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            onViewportEnter={() => { ordersCounter.start(); countriesCounter.start(); ratingCounter.start(); }}
            className="grid grid-cols-3 gap-3 mt-10">
            {[
              { count: ordersCounter.count, suffix: '+', label: 'Заказов', format: (n: number) => n >= 1000 ? `${Math.floor(n / 1000)}K` : n },
              { count: countriesCounter.count, suffix: '+', label: 'Стран', format: (n: number) => n },
              { count: ratingCounter.count, suffix: '★', label: 'Рейтинг', format: (n: number) => `${(n / 10).toFixed(1)}` },
            ].map(({ count, suffix, label, format }) => (
              <TiltCard key={label} className="glass rounded-2xl p-3 text-center shadow-glow cursor-default">
                <div className="text-xl font-display font-bold text-gradient">{format(count)}{suffix}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
              </TiltCard>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Track */}
      <section className="px-4 py-6 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-5 border-glow shadow-glow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-glow-accent/10 rounded-full blur-[40px] pointer-events-none" />
          <div className="flex items-center gap-3 mb-4 relative">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Package size={20} className="text-primary" /></div>
            <div><h3 className="font-display font-bold text-sm">Отследить заказ</h3><p className="text-[11px] text-muted-foreground">Введите трек-номер</p></div>
          </div>
          <div className="flex gap-2 relative">
            <Input placeholder="EBXXXX123456" value={trackInput} onChange={e => setTrackInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchTrack()} className="glass border-glow bg-transparent h-11 rounded-xl flex-1" />
            <Button onClick={searchTrack} className="gradient-primary glow-primary text-primary-foreground h-11 rounded-xl border-0 px-4"><Search size={18} /></Button>
          </div>
          <AnimatePresence>
            {trackResult?.found && (
              <motion.div initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} className="mt-3 glass rounded-xl p-3 border-glow overflow-hidden">
                <div className="flex justify-between items-center">
                  <div><p className="text-[10px] text-muted-foreground">Трек: {trackResult.track}</p><p className="text-sm font-medium mt-0.5">Статус: <span className="text-gradient font-display font-bold">{trackResult.status}</span></p></div>
                  <Button size="sm" variant="outline" onClick={() => navigate('/profile')} className="glass border-glow rounded-lg text-xs h-8">Подробнее</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Avito & Russia */}
      <section className="px-4 py-2 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="glass rounded-2xl p-4 border-glow relative overflow-hidden group cursor-default">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <ShoppingCart size={20} className="text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-sm">Заказывайте с Авито</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">Выкупаем и доставляем товары с Авито и любых платформ России</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </motion.div>
      </section>

      {/* Advantages */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-display font-bold mb-1">Почему EuroBuy?</h2>
          <p className="text-sm text-muted-foreground mb-6">Ваш надёжный партнёр в Европе</p>
        </motion.div>
        <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 gap-3">
          {advantages.map(({ icon: Icon, title, desc, color }) => (
            <motion.div key={title} variants={itemVariants}>
              <TiltCard className="glass rounded-2xl p-4 magnetic-card group cursor-default h-full relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors"><Icon size={20} className="text-primary" /></div>
                  <h3 className="font-display font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-display font-bold mb-6">Как это работает?</h2>
        </motion.div>
        <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-3">
          {[
            { step: '01', title: 'Отправьте ссылку', desc: 'Вставьте ссылку на товар или укажите название' },
            { step: '02', title: 'Мы выкупаем', desc: 'Наши агенты покупают товар в Европе' },
            { step: '03', title: 'Доставляем вам', desc: 'Отправляем удобным для вас способом' },
          ].map(({ step, title, desc }) => (
            <motion.div key={step} variants={itemVariants} whileHover={{ x: 8 }} className="flex items-start gap-4 glass rounded-2xl p-4 magnetic-card cursor-default relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 gradient-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top rounded-full" />
              <span className="text-3xl font-display font-bold text-gradient">{step}</span>
              <div><h3 className="font-display font-semibold text-sm">{title}</h3><p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p></div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Reviews */}
      <ReviewsSection navigate={navigate} />

      {/* Chart */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-display font-bold mb-1">Наши показатели</h2>
          <p className="text-sm text-muted-foreground mb-5">Оценка клиентов</p>
        </motion.div>
        <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-3">
          {chartData.map(({ name, value, icon, color }) => (
            <motion.div key={name} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }} className="glass rounded-2xl p-4 border-glow group hover:shadow-glow transition-all">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5"><span className="text-lg">{icon}</span><span className="text-sm font-semibold">{name}</span></div>
                <span className="text-sm font-display font-bold text-gradient">{value}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted/30 overflow-hidden">
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${value}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.2 }} className={`h-full rounded-full bg-gradient-to-r ${color}`} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ scale: 1.02 }}
          className="relative overflow-hidden gradient-primary rounded-3xl p-8 text-center glow-primary cursor-default">
          <div className="absolute top-0 right-0 w-32 h-32 bg-glow-secondary/30 rounded-full blur-[60px] animate-pulse-glow" />
          <div className="relative">
            <h2 className="text-2xl font-display font-bold text-primary-foreground mb-2">Готовы сделать заказ?</h2>
            <p className="text-sm text-primary-foreground/70 mb-6">Оформите заявку прямо сейчас</p>
            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => navigate('/order')} className="bg-background text-foreground hover:bg-background/90 font-semibold px-8 h-11 rounded-xl">Начать заказ <ArrowRight size={16} className="ml-1.5" /></Button>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

// Reviews Section
const ReviewsSection = ({ navigate }: { navigate: NavigateFunction }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => { getAllReviews().then(r => setReviews(r)); }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim()) { toast.error('Заполните имя и текст'); return; }
    const review = await createReview({ name: name.trim(), rating, text: text.trim(), date: new Date().toISOString().split('T')[0] });
    if (review) {
      setReviews(prev => [review, ...prev]);
      setName(''); setText(''); setRating(5); setShowForm(false);
      toast.success('Спасибо за отзыв!');
    }
  };

  return (
    <section className="px-4 py-8 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="flex items-center justify-between mb-5">
          <div><h2 className="text-2xl font-display font-bold">Отзывы</h2><p className="text-sm text-muted-foreground">Что говорят наши клиенты</p></div>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="glass border-glow text-foreground hover:bg-primary/5 rounded-xl text-xs h-8 gap-1.5" variant="outline">
            <MessageSquare size={14} />Оставить
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="glass rounded-2xl p-4 border-glow space-y-3">
              <Input placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} className="glass border-glow bg-transparent h-10 rounded-xl" />
              <div className="flex gap-1">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110"><Star size={20} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'} /></button>)}</div>
              <Textarea placeholder="Ваш отзыв..." value={text} onChange={e => setText(e.target.value)} className="glass border-glow bg-transparent rounded-xl min-h-[70px] text-sm" />
              <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground w-full h-10 rounded-xl border-0 gap-2"><Send size={14} /> Отправить</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-3">
        {reviews.slice(0, 3).map(r => (
          <motion.div key={r.id} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { duration: 0.4 } } }}
            className="glass rounded-2xl p-4 border-glow group hover:shadow-glow transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{r.name.charAt(0)}</div>
                <div><span className="text-sm font-semibold">{r.name}</span><div className="flex gap-0.5 mt-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={10} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/20'} />)}</div></div>
              </div>
              <span className="text-[10px] text-muted-foreground">{r.date}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{r.text}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-5 text-center">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={() => navigate('/reviews')} className="gradient-primary glow-primary text-primary-foreground rounded-xl text-sm h-11 px-8 gap-2 font-semibold border-0">
            <Star size={16} />Посмотреть все отзывы<ArrowRight size={16} />
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Index;
