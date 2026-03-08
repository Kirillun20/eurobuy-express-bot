import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  COUNTRIES, CURRENCIES, DELIVERY_METHODS, PAYMENT_METHODS,
  Order, OrderItem, MAX_WEIGHT_KG, MAX_PRICE_EUR,
  calculateServiceCostBYN, roundBYN, generateTrackNumber,
  getWeightPriceUSD, EXCHANGE_RATES_TO_BYN,
} from '@/lib/types';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { saveOrder, getUser } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, Link as LinkIcon, Package, CreditCard,
  ShoppingBag, Wallet, Banknote, Plus, Trash2, AlertTriangle, Sparkles, Copy,
  FileText, RefreshCw, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'item' | 'confirm_more' | 'delivery' | 'payment' | 'done';

const STEP_ORDER: Step[] = ['item', 'confirm_more', 'delivery', 'payment', 'done'];

const PAYMENT_ICONS: Record<string, typeof CreditCard> = {
  card: CreditCard, cash: Wallet, transfer: Banknote,
};

const emptyItem = () => ({
  link: '', name: '', quantity: '1', weight: '', price: '', currency: 'EUR', country: '', notes: '',
});

const OrderPage = () => {
  const navigate = useNavigate();
  const { rates, loading: ratesLoading, convertToBYN, convertToEUR } = useExchangeRates();
  const [step, setStep] = useState<Step>('item');
  const [currentItem, setCurrentItem] = useState(emptyItem());
  const [items, setItems] = useState<OrderItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState('courier_minsk');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const update = (key: string, value: string) => setCurrentItem(prev => ({ ...prev, [key]: value }));
  const user = getUser();

  const priceNum = parseFloat(currentItem.price) || 0;
  const weightNum = parseFloat(currentItem.weight) || 0;
  const priceEUR = convertToEUR(priceNum, currentItem.currency);
  const priceBYN = convertToBYN(priceNum, currentItem.currency);
  const overWeight = weightNum > MAX_WEIGHT_KG;
  const overPrice = priceEUR > MAX_PRICE_EUR;

  // Use live rates for service cost calculation
  const serviceCostBYN = (() => {
    const percentCost = priceBYN * 0.18;
    const weightCostUSD = getWeightPriceUSD(weightNum);
    const weightCostBYN = weightCostUSD * rates.USD;
    return Math.max(percentCost, weightCostBYN);
  })();

  const canAddItem = () => {
    return (currentItem.link || currentItem.name) && currentItem.price && currentItem.country && !overWeight && !overPrice;
  };

  const addItem = () => {
    const item: OrderItem = {
      link: currentItem.link,
      name: currentItem.name,
      quantity: parseInt(currentItem.quantity) || 1,
      weight: weightNum,
      price: priceNum,
      currency: currentItem.currency,
      country: currentItem.country,
      priceBYN: roundBYN(priceBYN),
      serviceCostBYN: roundBYN(serviceCostBYN),
      notes: currentItem.notes || undefined,
    };
    setItems(prev => [...prev, item]);
    setCurrentItem(emptyItem());
    setStep('confirm_more');
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const totalPriceBYN = items.reduce((s, i) => s + i.priceBYN, 0);
  const totalServiceBYN = items.reduce((s, i) => s + i.serviceCostBYN, 0);
  const dm = DELIVERY_METHODS.find(d => d.id === deliveryMethod)!;
  // Delivery cost is in BYN already in DELIVERY_METHODS
  const deliveryCostBYN = dm?.priceBYN || 0;
  const grandTotal = roundBYN(totalPriceBYN + totalServiceBYN + deliveryCostBYN);

  const submit = () => {
    if (!user) {
      toast.error('Войдите в аккаунт для оформления заказа');
      navigate('/profile');
      return;
    }

    const order: Order = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      trackNumber: generateTrackNumber(),
      items,
      totalWeight: roundBYN(totalWeight),
      totalPriceBYN: roundBYN(totalPriceBYN),
      totalServiceBYN: roundBYN(totalServiceBYN),
      deliveryMethod,
      deliveryCostBYN,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 14 * 86400000).toISOString(),
      statusHistory: [{ status: 'pending', date: new Date().toISOString(), comment: 'Заказ создан' }],
    };

    saveOrder(order);
    setCompletedOrder(order);
    setStep('done');
    toast.success('Заказ успешно оформлен!');
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) {
      if (step === 'delivery' && items.length > 0) setStep('confirm_more');
      else if (step === 'confirm_more') setStep('item');
      else setStep(STEP_ORDER[idx - 1]);
    }
  };

  const progressSteps = ['Товары', 'Доставка', 'Оплата'];
  const progressIdx = step === 'item' || step === 'confirm_more' ? 0 : step === 'delivery' ? 1 : 2;

  const inputClass = "glass border-glow bg-transparent h-11 rounded-xl";

  if (step === 'done' && completedOrder) {
    return (
      <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 glow-primary">
            <Sparkles size={36} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">Заказ оформлен!</h1>
          <p className="text-sm text-muted-foreground mb-6">Ваш трек-номер для отслеживания</p>
          
          <div className="glass rounded-2xl p-6 border-glow shadow-glow mb-6">
            <p className="text-xs text-muted-foreground mb-2">Трек-номер</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-display font-bold text-gradient tracking-wider">
                {completedOrder.trackNumber}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(completedOrder.trackNumber);
                  toast.success('Трек-номер скопирован!');
                }}
                className="p-2 rounded-lg glass hover:border-glow transition-all"
              >
                <Copy size={16} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border-glow text-left mb-6">
            <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary" /> Сводка заказа
            </h3>

            {/* Items list */}
            <div className="space-y-2 mb-4">
              {completedOrder.items.map((item, idx) => (
                <div key={idx} className="glass rounded-xl p-3">
                  <p className="text-sm font-medium truncate">{item.name || item.link}</p>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{item.quantity} шт · {item.weight} кг · {item.country}</span>
                    <span className="font-medium text-foreground">{item.priceBYN} BYN</span>
                  </div>
                  {item.notes && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <FileText size={9} /> {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Товаров</span>
                <span className="font-medium">{completedOrder.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Общий вес</span>
                <span className="font-medium">{completedOrder.totalWeight} кг</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Стоимость товаров</span>
                <span className="font-medium">{completedOrder.totalPriceBYN} BYN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Сервисный сбор</span>
                <span className="font-medium">{completedOrder.totalServiceBYN} BYN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Доставка</span>
                <span className="font-medium">{completedOrder.deliveryCostBYN > 0 ? `${completedOrder.deliveryCostBYN} BYN` : 'Бесплатно'}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-semibold">Итого (примерно)</span>
                <span className="text-lg font-display font-bold text-gradient">
                  {roundBYN(completedOrder.totalPriceBYN + completedOrder.totalServiceBYN + completedOrder.deliveryCostBYN)} BYN
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">* Точную сумму подтвердит менеджер</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/profile')}
              className="flex-1 gradient-primary glow-primary text-primary-foreground font-semibold h-12 rounded-xl border-0"
            >
              Мои заказы
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex-1 glass border-glow h-12 rounded-xl"
            >
              На главную
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
      {/* Rates indicator */}
      {ratesLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <RefreshCw size={12} className="animate-spin" /> Загрузка курсов валют...
        </div>
      )}

      {/* Progress */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        {progressSteps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                i <= progressIdx ? 'gradient-primary text-primary-foreground glow-primary' : 'glass text-muted-foreground'
              }`}>
                {i < progressIdx ? <Check size={16} /> : i + 1}
              </div>
              <span className={`text-[10px] mt-1.5 font-medium ${i === progressIdx ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
            </div>
            {i < progressSteps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 mt-[-14px] rounded-full transition-colors duration-500 ${i < progressIdx ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="min-h-[320px]"
        >
          {/* ITEM STEP */}
          {step === 'item' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold">
                {items.length > 0 ? 'Добавить ещё товар' : 'Что хотите заказать?'}
              </h2>
              <p className="text-sm text-muted-foreground">Вставьте ссылку или укажите название</p>
              
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Ссылка на товар</Label>
                <Input placeholder="https://..." value={currentItem.link} onChange={e => update('link', e.target.value)} className={inputClass} />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">или</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Название товара</Label>
                <Input placeholder="Кроссовки Nike Air Max..." value={currentItem.name} onChange={e => update('name', e.target.value)} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block text-muted-foreground">Количество</Label>
                  <Input type="number" min="1" value={currentItem.quantity} onChange={e => update('quantity', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block text-muted-foreground">Вес (кг)</Label>
                  <Input type="number" placeholder="0.5" value={currentItem.weight} onChange={e => update('weight', e.target.value)} className={inputClass} />
                  {overWeight && (
                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                      <AlertTriangle size={10} /> Макс. {MAX_WEIGHT_KG} кг
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block text-muted-foreground">Стоимость</Label>
                  <Input type="number" placeholder="0.00" value={currentItem.price} onChange={e => update('price', e.target.value)} className={inputClass} />
                  {overPrice && (
                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                      <AlertTriangle size={10} /> Макс. 500 EUR ({roundBYN(priceEUR)} EUR)
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block text-muted-foreground">Валюта</Label>
                  <Select value={currentItem.currency} onValueChange={v => update('currency', v)}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent className="glass-strong rounded-xl">
                      {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {priceNum > 0 && (
                <div className="glass rounded-xl p-3 border-glow text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">В BYN</span>
                    <span className="font-medium">{roundBYN(priceBYN)} BYN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">В EUR (лимит проверки)</span>
                    <span className={`font-medium ${overPrice ? 'text-destructive' : ''}`}>{roundBYN(priceEUR)} EUR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Сервис (примерно)</span>
                    <span className="font-medium">{roundBYN(serviceCostBYN)} BYN</span>
                  </div>
                  {!ratesLoading && (
                    <p className="text-[9px] text-muted-foreground/60 flex items-center gap-1 pt-1">
                      <Info size={8} /> Курс: 1 USD = {roundBYN(rates.USD)} BYN · 1 EUR = {roundBYN(rates.EUR)} BYN
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Страна</Label>
                <Select value={currentItem.country} onValueChange={v => update('country', v)}>
                  <SelectTrigger className={inputClass}><SelectValue placeholder="Выберите страну" /></SelectTrigger>
                  <SelectContent className="glass-strong rounded-xl">
                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes / details field */}
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">
                  <FileText size={10} className="inline mr-1" />
                  Подробности к заказу <span className="text-muted-foreground/50">(необязательно)</span>
                </Label>
                <Textarea
                  placeholder="Размер, цвет, артикул, особые пожелания..."
                  value={currentItem.notes}
                  onChange={e => update('notes', e.target.value)}
                  className="glass border-glow bg-transparent rounded-xl min-h-[70px] text-sm resize-none"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* CONFIRM MORE */}
          {step === 'confirm_more' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold">Ваши товары</h2>
              
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-4 border-glow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name || item.link}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {item.quantity} шт · {item.weight} кг · {item.price} {item.currency}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{item.country}</p>
                        {item.notes && (
                          <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                            <FileText size={9} /> {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-display font-bold text-gradient">{item.priceBYN} BYN</span>
                        <button onClick={() => removeItem(idx)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                          <Trash2 size={14} className="text-destructive" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="glass rounded-2xl p-5 border-glow shadow-glow text-center">
                <Sparkles size={24} className="text-primary mx-auto mb-3" />
                <h3 className="font-display font-bold text-lg mb-1">Хотите добавить ещё товар?</h3>
                <p className="text-xs text-muted-foreground mb-4">Вы можете заказать несколько товаров в одной заявке</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep('item')}
                    variant="outline"
                    className="flex-1 glass border-glow h-11 rounded-xl hover:bg-primary/5"
                  >
                    <Plus size={16} className="mr-1.5" /> Добавить
                  </Button>
                  <Button
                    onClick={() => setStep('delivery')}
                    className="flex-1 gradient-primary glow-primary text-primary-foreground font-semibold h-11 rounded-xl border-0"
                  >
                    Далее <ArrowRight size={16} className="ml-1.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* DELIVERY STEP */}
          {step === 'delivery' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold">Способ доставки</h2>
              <div className="space-y-3">
                {DELIVERY_METHODS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDeliveryMethod(d.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                      deliveryMethod === d.id ? 'glass border-glow shadow-glow' : 'glass hover:border-glow'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">{d.name}</div>
                      <div className="text-[11px] text-muted-foreground">{d.desc}</div>
                    </div>
                    <span className={`font-display font-bold ${deliveryMethod === d.id ? 'text-gradient' : 'text-muted-foreground'}`}>
                      {d.priceBYN > 0 ? `${d.priceBYN} BYN` : 'Бесплатно'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PAYMENT STEP */}
          {step === 'payment' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold">Способ оплаты</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(pm => {
                  const PmIcon = PAYMENT_ICONS[pm.id] || Wallet;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${
                        paymentMethod === pm.id ? 'glass border-glow shadow-glow' : 'glass hover:border-glow'
                      }`}
                    >
                      <PmIcon size={20} className={paymentMethod === pm.id ? 'text-primary' : 'text-muted-foreground'} />
                      <span className="font-medium text-sm">{pm.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="glass rounded-2xl p-5 border-glow shadow-glow mt-4">
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-primary" />
                  Сводка заказа
                </h3>
                
                <div className="space-y-3 mb-4">
                  {items.map((item, idx) => (
                    <div key={idx} className="glass rounded-xl p-3">
                      <p className="text-sm font-medium truncate">{item.name || item.link}</p>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{item.quantity} шт · {item.weight} кг · {item.country}</span>
                        <span className="font-medium text-foreground">{item.priceBYN} BYN</span>
                      </div>
                      {item.notes && (
                        <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                          <FileText size={9} /> {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Стоимость товаров</span>
                    <span className="font-medium">{roundBYN(totalPriceBYN)} BYN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Сервисный сбор</span>
                    <span className="font-medium">{roundBYN(totalServiceBYN)} BYN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Доставка ({dm.name})</span>
                    <span className="font-medium">{deliveryCostBYN > 0 ? `${deliveryCostBYN} BYN` : 'Бесплатно'}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <span className="font-semibold">Примерный итого</span>
                    <span className="text-xl font-display font-bold text-gradient">{grandTotal} BYN</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">* Точную сумму подтвердит менеджер</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Telegram delivery note */}
      {step !== 'done' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 glass rounded-xl p-4 border-glow text-center"
        >
          <p className="text-xs text-muted-foreground mb-1">Товар выкуплен? Нужна доставка?</p>
          <a
            href="https://t.me/kirillmr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Написать @kirillmr
          </a>
        </motion.div>
      )}

      {/* Navigation */}
      {step !== 'done' && step !== 'confirm_more' && (
        <div className="flex gap-3 mt-6">
          {step !== 'item' && (
            <Button variant="outline" onClick={goBack} className="flex-1 glass border-glow h-12 rounded-xl hover:bg-primary/5">
              <ArrowLeft size={16} className="mr-1.5" /> Назад
            </Button>
          )}
          {step === 'item' ? (
            <Button
              onClick={addItem}
              disabled={!canAddItem()}
              className="flex-1 gradient-primary glow-primary text-primary-foreground font-semibold h-12 rounded-xl border-0 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {items.length > 0 ? 'Добавить товар' : 'Далее'} <ArrowRight size={16} className="ml-1.5" />
            </Button>
          ) : step === 'delivery' ? (
            <Button
              onClick={() => setStep('payment')}
              className="flex-1 gradient-primary glow-primary text-primary-foreground font-semibold h-12 rounded-xl border-0 hover:opacity-90"
            >
              Далее <ArrowRight size={16} className="ml-1.5" />
            </Button>
          ) : step === 'payment' ? (
            <Button
              onClick={submit}
              className="flex-1 gradient-primary glow-primary text-primary-foreground font-semibold h-12 rounded-xl border-0 hover:opacity-90"
            >
              Оформить заказ <Check size={16} className="ml-1.5" />
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default OrderPage;
