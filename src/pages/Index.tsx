import { ArrowRight, Shield, Truck, Clock, Globe, Star, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const advantages = [
  { icon: Shield, title: 'Надёжность', desc: 'Гарантия безопасной доставки и страхование' },
  { icon: Truck, title: 'Быстро', desc: 'От 3 дней из любой страны Европы' },
  { icon: Globe, title: '15+ стран', desc: 'Германия, Франция, Италия и другие' },
  { icon: Clock, title: '24/7', desc: 'Поддержка всегда на связи' },
  { icon: Star, title: 'Лучшие цены', desc: 'Без скрытых комиссий' },
  { icon: Zap, title: 'Просто', desc: 'Заказ за 2 минуты' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-20 overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-4 py-16">
        {/* Glow orbs */}
        <div className="absolute inset-0 gradient-mesh pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-glow-primary/10 blur-[120px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 w-[200px] h-[200px] rounded-full bg-glow-secondary/10 blur-[80px] pointer-events-none animate-float" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center max-w-lg mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-glow mb-6"
          >
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Премиум сервис доставки</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4 leading-tight tracking-tight">
            Доставка из{' '}
            <span className="text-gradient">Европы</span>
            <br />к вашей двери
          </h1>

          <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">
            Выкупим и доставим любой товар из Европы. Быстро, надёжно и по лучшим ценам.
          </p>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => navigate('/order')}
              className="gradient-primary glow-primary text-primary-foreground font-semibold px-6 h-11 rounded-xl border-0 hover:opacity-90 transition-opacity"
            >
              Заказать <ArrowRight size={16} className="ml-1.5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/calculator')}
              className="glass border-glow text-foreground hover:bg-primary/5 h-11 rounded-xl"
            >
              Калькулятор
            </Button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="grid grid-cols-3 gap-3 mt-10"
          >
            {[
              { num: '10K+', label: 'Заказов' },
              { num: '15+', label: 'Стран' },
              { num: '4.9★', label: 'Рейтинг' },
            ].map(({ num, label }) => (
              <div key={label} className="glass rounded-2xl p-3 text-center shadow-glow">
                <div className="text-xl font-display font-bold text-gradient">{num}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Advantages */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-display font-bold mb-1">Почему EuroBuy?</h2>
          <p className="text-sm text-muted-foreground mb-6">Ваш надёжный партнёр в Европе</p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-3"
        >
          {advantages.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={item}
              className="glass rounded-2xl p-4 hover:border-glow hover:shadow-glow transition-all duration-500 group cursor-default"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors duration-300">
                <Icon size={20} className="text-primary" />
              </div>
              <h3 className="font-display font-semibold text-sm mb-1">{title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-display font-bold mb-6">Как это работает?</h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="space-y-3"
        >
          {[
            { step: '01', title: 'Отправьте ссылку', desc: 'Вставьте ссылку на товар или укажите название' },
            { step: '02', title: 'Мы выкупаем', desc: 'Наши агенты покупают товар в Европе' },
            { step: '03', title: 'Доставляем вам', desc: 'Отправляем удобным для вас способом' },
          ].map(({ step, title, desc }) => (
            <motion.div
              key={step}
              variants={item}
              className="flex items-start gap-4 glass rounded-2xl p-4 hover:border-glow transition-all duration-500"
            >
              <span className="text-3xl font-display font-bold text-gradient">{step}</span>
              <div>
                <h3 className="font-display font-semibold text-sm">{title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden gradient-primary rounded-3xl p-8 text-center glow-primary"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-glow-secondary/30 rounded-full blur-[60px]" />
          <div className="relative">
            <h2 className="text-2xl font-display font-bold text-primary-foreground mb-2">
              Готовы сделать заказ?
            </h2>
            <p className="text-sm text-primary-foreground/70 mb-6">
              Оформите заявку прямо сейчас
            </p>
            <Button
              onClick={() => navigate('/order')}
              className="bg-background text-foreground hover:bg-background/90 font-semibold px-8 h-11 rounded-xl"
            >
              Начать заказ <ArrowRight size={16} className="ml-1.5" />
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
