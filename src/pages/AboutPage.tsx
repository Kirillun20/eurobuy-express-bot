import { motion } from 'framer-motion';
import { Globe, Shield, Users, Heart, MapPin, Clock, Package, Truck, AlertCircle, Scale, CreditCard, FileText, CheckCircle2 } from 'lucide-react';

const stats = [
  { icon: Package, value: '10,000+', label: 'Заказов выполнено' },
  { icon: Globe, value: '15+', label: 'Стран Европы' },
  { icon: Users, value: '5,000+', label: 'Довольных клиентов' },
  { icon: Clock, value: '3+', label: 'Года опыта' },
];

const values = [
  { icon: Shield, title: 'Надёжность', desc: 'Каждый заказ застрахован. Мы берём на себя все риски доставки.' },
  { icon: Heart, title: 'Забота', desc: 'Индивидуальный подход к каждому клиенту и его потребностям.' },
  { icon: Globe, title: 'Доступность', desc: 'Делаем европейские товары доступными для каждого.' },
];

const deliveryTerms = [
  {
    icon: Truck,
    title: 'Сроки доставки',
    items: [
      'Европа → Минск: 5–14 рабочих дней',
      'Россия → Минск: 3–7 рабочих дней',
      'Курьером по Минску: 1–2 дня после получения',
      'СДЭК / Европочта: 3–10 рабочих дней',
    ],
  },
  {
    icon: Scale,
    title: 'Ограничения',
    items: [
      'Максимальный вес одной посылки: 25 кг',
      'Максимальная стоимость товара: 500 EUR',
      'Запрещено: оружие, наркотические вещества, контрафакт',
      'Батарейки и аккумуляторы — уточняйте у менеджера',
    ],
  },
  {
    icon: CreditCard,
    title: 'Оплата и стоимость',
    items: [
      'Сервисный сбор: 15–18% от стоимости товара',
      'Минимальный сбор определяется по весу (от $6)',
      'Оплата: карта, перевод (BY/RU банки), наличные',
      'Оплата при получении доступна для Минска',
    ],
  },
  {
    icon: Shield,
    title: 'Гарантии и возврат',
    items: [
      'Все посылки застрахованы на полную стоимость',
      'При повреждении — полная компенсация',
      'Если товар не соответствует описанию — решаем вопрос',
      'Фотоотчёт товара до отправки по запросу',
    ],
  },
  {
    icon: FileText,
    title: 'Таможня',
    items: [
      'Беспошлинный ввоз до 200 EUR / 31 кг в месяц',
      'При превышении — таможенная пошлина 30%',
      'Мы помогаем с таможенным оформлением',
      'Декларирование включено в сервис',
    ],
  },
  {
    icon: CheckCircle2,
    title: 'Программа лояльности',
    items: [
      '1 ЕвроБалл за каждые 50 BYN заказа',
      'Баллы можно обменять на скидки до 10%',
      'Скидка на доставку за 1 балл',
      'Баллы не сгорают и накапливаются',
    ],
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const AboutPage = () => {
  return (
    <div className="pb-20 overflow-hidden">
      {/* Hero */}
      <section className="relative px-4 py-12 max-w-lg mx-auto text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] gradient-primary opacity-[0.08] blur-[80px] pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5 glow-primary"
          >
            <Package size={28} className="text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold mb-3">О нас</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            EuroBuy — ваш надёжный партнёр в доставке товаров из Европы. 
            Мы помогаем тысячам клиентов получать любимые бренды по лучшим ценам.
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="px-4 py-6 max-w-lg mx-auto">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 gap-3">
          {stats.map(({ icon: Icon, value, label }) => (
            <motion.div key={label} variants={item} className="glass rounded-2xl p-4 text-center border-glow">
              <Icon size={22} className="text-primary mx-auto mb-2" />
              <div className="text-xl font-display font-bold text-gradient">{value}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Story */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-display font-bold mb-4">Наша история</h2>
          <div className="glass rounded-2xl p-5 border-glow space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              EuroBuy был основан в 2022 году с простой идеей — сделать европейские товары 
              доступными для каждого. Начав с небольшой команды и нескольких маршрутов, 
              мы выросли в сервис, обслуживающий тысячи клиентов ежемесячно.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Сегодня мы работаем с более чем 15 странами Европы, имеем 
              агентов в ключевых городах и предлагаем самые выгодные условия доставки.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Values */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-display font-bold mb-4">Наши ценности</h2>
        </motion.div>
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-3">
          {values.map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} variants={item} className="glass rounded-2xl p-4 border-glow flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm">{title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Delivery Terms */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-display font-bold mb-2">Условия доставки</h2>
          <p className="text-sm text-muted-foreground mb-6">Всё, что нужно знать перед заказом</p>
        </motion.div>
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-3">
          {deliveryTerms.map(({ icon: Icon, title, items: termItems }) => (
            <motion.div key={title} variants={item} className="glass rounded-2xl p-5 border-glow hover:shadow-glow transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-display font-bold text-sm">{title}</h3>
              </div>
              <div className="space-y-2 ml-[52px]">
                {termItems.map((text, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 shrink-0" />
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Contact */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-5 border-glow shadow-glow"
        >
          <h2 className="text-lg font-display font-bold mb-3">Контакты</h2>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">Минск, Беларусь</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">Пн-Вс: 9:00 — 21:00</span>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutPage;
