import { ArrowRight, Shield, Truck, Clock, Globe, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const advantages = [
  { icon: Shield, title: 'Надёжность', desc: 'Гарантия безопасной доставки и страхование каждого заказа' },
  { icon: Truck, title: 'Быстрая доставка', desc: 'От 3 дней из любой страны Европы прямо к вашей двери' },
  { icon: Globe, title: '15+ стран', desc: 'Выкупаем товары из Германии, Франции, Италии и других стран' },
  { icon: Clock, title: '24/7 поддержка', desc: 'Мы всегда на связи и готовы помочь с любым вопросом' },
  { icon: Star, title: 'Лучшие цены', desc: 'Прозрачное ценообразование без скрытых комиссий' },
  { icon: Zap, title: 'Простота', desc: 'Оформите заказ за 2 минуты — мы сделаем всё остальное' },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden gradient-navy text-primary-foreground px-4 py-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-40 h-40 rounded-full bg-gold blur-3xl" />
          <div className="absolute bottom-4 left-4 w-32 h-32 rounded-full bg-gold-light blur-3xl" />
        </div>
        <div className="relative max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-medium mb-4">
            <Star size={12} /> Премиум сервис
          </div>
          <h1 className="text-3xl font-display font-bold mb-3 leading-tight">
            Доставка товаров<br />из <span className="text-gold">Европы</span>
          </h1>
          <p className="text-sm opacity-80 mb-6 leading-relaxed max-w-xs">
            Выкупим и доставим любой товар из Европы. Быстро, надёжно и по лучшим ценам.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/order')}
              className="bg-gold hover:bg-gold-dark text-accent-foreground font-semibold px-6"
            >
              Заказать <ArrowRight size={16} className="ml-1" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/calculator')}
              className="border-gold/40 text-gold hover:bg-gold/10"
            >
              Калькулятор
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 -mt-6 relative z-10 max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-3">
          {[
            { num: '10K+', label: 'Заказов' },
            { num: '15+', label: 'Стран' },
            { num: '4.9', label: 'Рейтинг' },
          ].map(({ num, label }) => (
            <div key={label} className="bg-card rounded-xl p-3 text-center shadow-card">
              <div className="text-lg font-display font-bold text-gold">{num}</div>
              <div className="text-[11px] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Advantages */}
      <section className="px-4 mt-8 max-w-lg mx-auto">
        <h2 className="text-xl font-display font-bold mb-4">Почему EuroBuy?</h2>
        <div className="grid grid-cols-2 gap-3">
          {advantages.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-card rounded-xl p-4 shadow-card hover:shadow-elevated transition-shadow group"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3 group-hover:bg-gold/20 transition-colors">
                <Icon size={20} className="text-primary group-hover:text-gold transition-colors" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 mt-8 max-w-lg mx-auto">
        <h2 className="text-xl font-display font-bold mb-4">Как это работает?</h2>
        <div className="space-y-3">
          {[
            { step: '01', title: 'Отправьте ссылку', desc: 'Вставьте ссылку на товар или укажите название' },
            { step: '02', title: 'Мы выкупаем', desc: 'Наши агенты покупают товар в Европе' },
            { step: '03', title: 'Доставляем вам', desc: 'Отправляем удобным для вас способом' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-4 bg-card rounded-xl p-4 shadow-card">
              <span className="text-2xl font-display font-bold text-gold">{step}</span>
              <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-[11px] text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 mt-8 max-w-lg mx-auto">
        <div className="gradient-gold rounded-2xl p-6 text-center">
          <h2 className="text-xl font-display font-bold text-accent-foreground mb-2">
            Готовы сделать заказ?
          </h2>
          <p className="text-sm text-accent-foreground/80 mb-4">
            Оформите заявку прямо сейчас
          </p>
          <Button
            onClick={() => navigate('/order')}
            className="bg-card text-foreground hover:bg-card/90 font-semibold px-8"
          >
            Начать заказ <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
