import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Order, OrderItem, MAX_WEIGHT_KG,
  roundBYN, generateTrackNumber,
  getWeightPriceUSD, calculatePointsEarned, User, PaymentDetails,
} from '@/lib/types';
import {
  DELIVERY_METHODS_V2, PAYMENT_METHODS_V2, PACKAGING_OPTIONS,
  getDeliveryCost, getDeliveryLabel, getCodSurcharge, DEFAULT_BANKS, BankInfo,
} from '@/lib/delivery-config';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { createOrder, createProfile, getProfileByEmail, addEuroPointsDb, getBankRequisites } from '@/lib/db';
import { saveUser, getUser } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, Package, CreditCard,
  ShoppingBag, Wallet, Banknote, Plus, Trash2, AlertTriangle, Sparkles, Copy,
  RefreshCw, Info, Coins, User as UserIcon, Building2, Eye, EyeOff, ShoppingCart,
  Star, Bitcoin, Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RUSSIAN_PLATFORMS = [
  { id: 'avito', name: 'Авито', icon: '🛒', desc: 'Крупнейшая площадка объявлений' },
  { id: 'yandex_market', name: 'Яндекс Маркет', icon: '🟡', desc: 'Маркетплейс от Яндекса' },
  { id: 'other', name: 'Другая платформа', icon: '🌐', desc: 'Любой магазин или сервис РФ' },
];

type Step = 'platform' | 'item' | 'confirm_more' | 'delivery' | 'payment' | 'payment_details' | 'register' | 'done';

const PAYMENT_ICONS: Record<string, typeof CreditCard> = {
  cash: Wallet, transfer: Banknote, cod: Package, telegram_stars: Star, crypto: Bitcoin,
};

const emptyItem = () => ({ link: '', name: '', quantity: '1', weight: '', price: '', currency: 'RUB', notes: '' });

const AvitoOrderPage = () => {
  const navigate = useNavigate();
  const { rates, loading: ratesLoading, convertToBYN } = useExchangeRates();
  const [step, setStep] = useState<Step>('platform');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [currentItem, setCurrentItem] = useState(emptyItem());
  const [items, setItems] = useState<OrderItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState('courier_minsk');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [bankRegion, setBankRegion] = useState<'by' | 'ru'>('by');
  const [showCard, setShowCard] = useState(false);
  const [selectedBox, setSelectedBox] = useState('');
  const [expandedBoxCategory, setExpandedBoxCategory] = useState<string | null>(null);
  const [banks, setBanks] = useState<Record<'by' | 'ru', BankInfo[]>>(DEFAULT_BANKS);

  useEffect(() => {
    getBankRequisites().then(data => { if (data) setBanks(data); });
  }, []);

  const update = (key: string, value: string) => setCurrentItem(prev => ({ ...prev, [key]: value }));
  const user = getUser();

  const priceNum = parseFloat(currentItem.price) || 0;
  const weightNum = parseFloat(currentItem.weight) || 0;
  const priceBYN = convertToBYN(priceNum, currentItem.currency);
  const overWeight = weightNum > MAX_WEIGHT_KG;

  const serviceCostBYN = (() => {
    const percentCost = priceBYN * 0.22;
    const weightCostUSD = getWeightPriceUSD(weightNum);
    const weightCostBYN = weightCostUSD * rates.USD;
    return Math.max(percentCost, weightCostBYN);
  })();

  const canAddItem = () => (currentItem.link || currentItem.name) && currentItem.price && !overWeight;
  const platformName = RUSSIAN_PLATFORMS.find(p => p.id === selectedPlatform)?.name || 'Россия';

  const addItem = () => {
    const item: OrderItem = {
      link: currentItem.link, name: currentItem.name,
      quantity: parseInt(currentItem.quantity) || 1, weight: weightNum,
      price: priceNum, currency: currentItem.currency, country: `Россия (${platformName})`,
      priceBYN: roundBYN(priceBYN), serviceCostBYN: roundBYN(serviceCostBYN),
      notes: currentItem.notes || undefined,
    };
    setItems(prev => [...prev, item]);
    setCurrentItem(emptyItem());
    setStep('confirm_more');
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const totalPriceBYN = items.reduce((s, i) => s + i.priceBYN, 0);
  const totalServiceBYN = items.reduce((s, i) => s + i.serviceCostBYN, 0);
  const deliveryCostBYN = getDeliveryCost(deliveryMethod, totalWeight);
  const selectedBoxInfo = PACKAGING_OPTIONS.flatMap(c => c.items).find(b => b.id === selectedBox);
  const boxCostBYN = deliveryMethod === 'europost' && selectedBoxInfo ? selectedBoxInfo.price : 0;
  const codSurcharge = paymentMethod === 'cod' ? getCodSurcharge(totalPriceBYN) : 0;
  const grandTotal = roundBYN(totalPriceBYN + totalServiceBYN + deliveryCostBYN + boxCostBYN + codSurcharge);

  const handleRegister = async () => {
    if (!regForm.name.trim() || !regForm.email.trim() || !regForm.phone.trim()) { toast.error('Заполните все поля'); return; }
    setSubmitting(true);
    try {
      let profile = await getProfileByEmail(regForm.email.trim());
      if (!profile) profile = await createProfile({ name: regForm.name.trim(), email: regForm.email.trim(), phone: regForm.phone.trim() });
      if (profile) {
        const localUser: User = { id: profile.id, name: profile.name, email: profile.email, phone: profile.phone, euroPoints: profile.euroPoints };
        saveUser(localUser);
        toast.success('Регистрация успешна!');
        await finalizeOrder(localUser);
      }
    } catch { toast.error('Ошибка регистрации'); }
    finally { setSubmitting(false); }
  };

  const submit = () => { const u = getUser(); if (!u) { setStep('register'); return; } finalizeOrder(u); };

  const buildPaymentDetails = (): PaymentDetails | undefined => {
    if (paymentMethod === 'transfer') {
      const bank = banks[bankRegion].find(b => b.id === selectedBank);
      return { bank: bank?.name || selectedBank, cardNumber: bank?.card, amount: grandTotal, transferNote: `Перевод на ${bank?.name || 'банк'}` };
    }
    if (paymentMethod === 'cash') return { amount: grandTotal, transferNote: 'Оплата наличными' };
    if (paymentMethod === 'cod') return { amount: grandTotal, transferNote: `Наложенный платёж (+${codSurcharge} BYN)` };
    if (paymentMethod === 'telegram_stars') return { amount: grandTotal, transferNote: 'Звёзды Telegram' };
    if (paymentMethod === 'crypto') return { amount: grandTotal, transferNote: 'Криптовалюта' };
    return undefined;
  };

  const finalizeOrder = async (orderUser: User) => {
    setSubmitting(true);
    try {
      const pointsEarned = calculatePointsEarned(grandTotal);
      const order: Order = {
        id: '', trackNumber: generateTrackNumber(), items,
        totalWeight: roundBYN(totalWeight), totalPriceBYN: roundBYN(totalPriceBYN),
        totalServiceBYN: roundBYN(totalServiceBYN), deliveryMethod,
        deliveryCostBYN: roundBYN(deliveryCostBYN + boxCostBYN), paymentMethod,
        status: 'pending', createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 10 * 86400000).toISOString(),
        statusHistory: [{ status: 'pending', date: new Date().toISOString(), comment: `Заказ с ${platformName}` }],
        pointsEarned, profileId: orderUser.id, paymentDetails: buildPaymentDetails(),
      };
      const created = await createOrder(order, orderUser.id);
      if (created) {
        if (pointsEarned > 0) {
          await addEuroPointsDb(orderUser.id, pointsEarned);
          const u = getUser(); if (u) { u.euroPoints = (u.euroPoints || 0) + pointsEarned; saveUser(u); }
        }
        setCompletedOrder({ ...order, id: created.id }); setStep('done');
        toast.success('Заказ успешно оформлен!');
      } else toast.error('Ошибка при создании заказа');
    } catch { toast.error('Ошибка при создании заказа'); }
    finally { setSubmitting(false); }
  };

  const goBack = () => {
    if (step === 'register') setStep('payment_details');
    else if (step === 'payment_details') setStep('payment');
    else if (step === 'payment') setStep('delivery');
    else if (step === 'delivery' && items.length > 0) setStep('confirm_more');
    else if (step === 'confirm_more') setStep('item');
    else if (step === 'item') setStep('platform');
  };

  const progressSteps = ['Платформа', 'Товары', 'Доставка', 'Оплата'];
  const progressIdx = step === 'platform' ? 0 : step === 'item' || step === 'confirm_more' ? 1 : step === 'delivery' ? 2 : 3;
  const inputClass = "glass border-glow bg-transparent h-11 rounded-xl";
  const selectedBankInfo = banks[bankRegion].find(b => b.id === selectedBank);
  const availablePayments = PAYMENT_METHODS_V2.filter(pm => !pm.europostOnly || deliveryMethod === 'europost');

  if (step === 'done' && completedOrder) {
    return (
      <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
            <Sparkles size={36} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">Заказ оформлен!</h1>
          <p className="text-sm text-muted-foreground mb-6">Трек-номер для отслеживания</p>
          <div className="glass rounded-2xl p-6 border-glow shadow-glow mb-6">
            <p className="text-xs text-muted-foreground mb-2">Трек-номер</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-display font-bold text-gradient tracking-wider">{completedOrder.trackNumber}</span>
              <button onClick={() => { navigator.clipboard.writeText(completedOrder.trackNumber); toast.success('Скопирован!'); }}
                className="p-2 rounded-lg glass hover:border-glow transition-all"><Copy size={16} className="text-muted-foreground" /></button>
            </div>
          </div>
          {completedOrder.pointsEarned && completedOrder.pointsEarned > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-4 border-glow mb-6">
              <div className="flex items-center justify-center gap-2">
                <Coins size={20} className="text-yellow-400" />
                <span className="text-sm font-display font-bold text-yellow-400">+{completedOrder.pointsEarned} ЕвроБалл(ов)</span>
              </div>
            </motion.div>
          )}
          <div className="flex gap-3">
            <Button onClick={() => navigate('/profile')} className="flex-1 gradient-primary glow-primary text-primary-foreground font-semibold h-12 rounded-xl border-0">Мои заказы</Button>
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1 glass border-glow h-12 rounded-xl">На главную</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
      {ratesLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <RefreshCw size={12} className="animate-spin" /> Загрузка курсов...
        </div>
      )}
      {step !== 'register' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          {progressSteps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-500 ${i <= progressIdx ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-primary-foreground shadow-lg shadow-emerald-500/30' : 'glass text-muted-foreground'}`}>
                  {i < progressIdx ? <Check size={16} /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1.5 font-medium ${i === progressIdx ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
              </div>
              {i < progressSteps.length - 1 && <div className={`w-6 h-0.5 mx-1 mt-[-14px] rounded-full transition-colors duration-500 ${i < progressIdx ? 'bg-emerald-500' : 'bg-border'}`} />}
            </div>
          ))}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="min-h-[320px]">

          {/* PLATFORM STEP */}
          {step === 'platform' && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart size={28} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-display font-bold">Заказ из России</h2>
                <p className="text-sm text-muted-foreground mt-1">Выберите платформу для заказа</p>
              </div>
              <div className="space-y-2">
                {RUSSIAN_PLATFORMS.map(platform => (
                  <motion.button key={platform.id} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${selectedPlatform === platform.id ? 'glass border border-emerald-500/40 shadow-lg shadow-emerald-500/10' : 'glass hover:border-glow'}`}>
                    <span className="text-2xl">{platform.icon}</span>
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold">{platform.name}</p>
                      <p className="text-[11px] text-muted-foreground">{platform.desc}</p>
                    </div>
                    {selectedPlatform === platform.id && <Check size={18} className="text-emerald-500" />}
                  </motion.button>
                ))}
              </div>
              <Button onClick={() => { if (selectedPlatform) setStep('item'); else toast.error('Выберите платформу'); }}
                disabled={!selectedPlatform}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-primary-foreground font-semibold h-12 rounded-xl border-0 shadow-lg shadow-emerald-500/30 disabled:opacity-50">
                Далее <ArrowRight size={16} className="ml-1.5" />
              </Button>
            </div>
          )}

          {/* ITEM STEP */}
          {step === 'item' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold">{items.length > 0 ? 'Добавить ещё товар' : 'Что хотите заказать?'}</h2>
              <p className="text-sm text-muted-foreground">Платформа: <span className="text-emerald-500 font-medium">{platformName}</span></p>
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Ссылка на товар</Label>
                <Input placeholder="https://avito.ru/..." value={currentItem.link} onChange={e => update('link', e.target.value)} className={inputClass} />
              </div>
              <div className="flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">или</span><div className="h-px flex-1 bg-border" /></div>
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Название товара</Label>
                <Input placeholder="Описание товара..." value={currentItem.name} onChange={e => update('name', e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block text-muted-foreground">Количество</Label>
                  <Input type="number" min="1" value={currentItem.quantity} onChange={e => update('quantity', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block text-muted-foreground">Вес (кг)</Label>
                  <Input type="number" placeholder="0.5" value={currentItem.weight} onChange={e => update('weight', e.target.value)} className={inputClass} />
                  {overWeight && <p className="text-[10px] text-destructive flex items-center gap-1 mt-1"><AlertTriangle size={10} /> Макс. {MAX_WEIGHT_KG} кг</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block text-muted-foreground">Стоимость</Label>
                  <Input type="number" placeholder="0" value={currentItem.price} onChange={e => update('price', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block text-muted-foreground">Валюта</Label>
                  <Select value={currentItem.currency} onValueChange={v => update('currency', v)}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent className="glass-strong rounded-xl">
                      {['RUB', 'BYN', 'USD'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {priceNum > 0 && (
                <div className="glass rounded-xl p-3 border-glow text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">В BYN</span><span className="font-medium">{roundBYN(priceBYN)} BYN</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Сервис (примерно)</span><span className="font-medium">{roundBYN(serviceCostBYN)} BYN</span></div>
                  {!ratesLoading && (
                    <p className="text-[9px] text-muted-foreground/60 flex items-center gap-1 pt-1">
                      <Info size={8} /> Курс: 1 RUB = {roundBYN(rates.RUB || 0.035)} BYN
                    </p>
                  )}
                </div>
              )}
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Подробности <span className="text-muted-foreground/50">(необязательно)</span></Label>
                <Textarea placeholder="Размер, цвет, артикул..." value={currentItem.notes} onChange={e => update('notes', e.target.value)} className="glass border-glow bg-transparent rounded-xl min-h-[70px] text-sm resize-none" rows={2} />
              </div>
            </div>
          )}

          {/* CONFIRM MORE */}
          {step === 'confirm_more' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold">Ваши товары</h2>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 border-glow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name || item.link}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{item.quantity} шт · {item.weight} кг · {item.price} {item.currency}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-display font-bold text-gradient">{item.priceBYN} BYN</span>
                        <button onClick={() => removeItem(idx)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 size={14} className="text-destructive" /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="glass rounded-2xl p-5 border-glow shadow-glow text-center">
                <Sparkles size={24} className="text-emerald-500 mx-auto mb-3" />
                <h3 className="font-display font-bold text-lg mb-1">Хотите добавить ещё?</h3>
                <p className="text-xs text-muted-foreground mb-4">Несколько товаров в одной заявке</p>
                <div className="flex gap-3">
                  <Button onClick={() => setStep('item')} variant="outline" className="flex-1 glass border-glow h-11 rounded-xl"><Plus size={16} className="mr-1.5" /> Добавить</Button>
                  <Button onClick={() => setStep('delivery')} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-primary-foreground font-semibold h-11 rounded-xl border-0">Далее <ArrowRight size={16} className="ml-1.5" /></Button>
                </div>
              </div>
            </div>
          )}

          {/* DELIVERY */}
          {step === 'delivery' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold">Способ доставки</h2>
              <div className="space-y-3">
                {DELIVERY_METHODS_V2.map(d => (
                  <button key={d.id} onClick={() => { setDeliveryMethod(d.id); if (d.id !== 'europost') setSelectedBox(''); }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${deliveryMethod === d.id ? 'glass border-glow shadow-glow' : 'glass hover:border-glow'}`}>
                    <div className="text-left"><div className="font-medium text-sm">{d.name}</div><div className="text-[11px] text-muted-foreground">{d.desc}</div></div>
                    <span className={`font-display font-bold text-sm ${deliveryMethod === d.id ? 'text-gradient' : 'text-muted-foreground'}`}>
                      {getDeliveryLabel(d.id, totalWeight)}
                    </span>
                  </button>
                ))}
              </div>

              {deliveryMethod === 'europost' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 border-glow space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Info size={14} className="text-emerald-500" /> Тарифы Европочты</h3>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      { range: '0.01 – 1 кг', price: '5.6 BYN' },
                      { range: '1.01 – 2 кг', price: '6.4 BYN' },
                      { range: '2.01 – 5 кг', price: '7.4 BYN' },
                      { range: '5.01 – 10 кг', price: '11 BYN' },
                      { range: '10.01 – 15 кг', price: '16.5 BYN' },
                      { range: '15.01 – 20 кг', price: '22 BYN' },
                      { range: '20.01 – 25 кг', price: '27.3 BYN' },
                    ].map(t => (
                      <div key={t.range} className="flex justify-between glass rounded-lg p-2">
                        <span className="text-muted-foreground">{t.range}</span>
                        <span className="font-medium">{t.price}</span>
                      </div>
                    ))}
                  </div>
                  {totalWeight > 0 && (
                    <div className="glass rounded-lg p-3 text-center border-glow">
                      <p className="text-xs text-muted-foreground">Ваш вес: {roundBYN(totalWeight)} кг</p>
                      <p className="text-lg font-display font-bold text-gradient">{getDeliveryCost('europost', totalWeight)} BYN</p>
                    </div>
                  )}
                </motion.div>
              )}

              {deliveryMethod === 'sdek' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 border-glow">
                  <div className="flex items-center gap-2 text-sm">
                    <Info size={14} className="text-emerald-500" />
                    <p className="text-muted-foreground">Стоимость доставки СДЭК рассчитывается индивидуально. Менеджер уточнит стоимость.</p>
                  </div>
                </motion.div>
              )}

              {deliveryMethod === 'europost' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Package size={14} className="text-emerald-500" /> Упаковка (необязательно)</h3>
                  {PACKAGING_OPTIONS.map(category => (
                    <div key={category.name} className="glass rounded-xl overflow-hidden border-glow">
                      <button onClick={() => setExpandedBoxCategory(expandedBoxCategory === category.name ? null : category.name)}
                        className="w-full flex items-center justify-between p-3 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{category.icon}</span>
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className="text-[10px] text-muted-foreground">({category.items.length})</span>
                        </div>
                        <motion.div animate={{ rotate: expandedBoxCategory === category.name ? 180 : 0 }}>
                          <ArrowRight size={14} className="text-muted-foreground rotate-90" />
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {expandedBoxCategory === category.name && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-3 pb-3 space-y-1.5">
                              {category.items.map(box => (
                                <button key={box.id} onClick={() => setSelectedBox(selectedBox === box.id ? '' : box.id)}
                                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${selectedBox === box.id ? 'glass border-glow shadow-glow' : 'hover:bg-muted/30'}`}>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{box.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{box.size}</p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    <span className={`text-xs font-bold ${selectedBox === box.id ? 'text-gradient' : 'text-muted-foreground'}`}>{box.price.toFixed(2)} BYN</span>
                                    {selectedBox === box.id && <Check size={14} className="text-emerald-500" />}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  {selectedBoxInfo && (
                    <div className="glass rounded-lg p-3 border-glow flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">{selectedBoxInfo.name}</p>
                        <p className="text-[10px] text-muted-foreground">{selectedBoxInfo.size}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gradient">{selectedBoxInfo.price.toFixed(2)} BYN</span>
                        <button onClick={() => setSelectedBox('')} className="p-1 rounded hover:bg-destructive/10"><Trash2 size={12} className="text-destructive" /></button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* PAYMENT METHOD */}
          {step === 'payment' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold">Способ оплаты</h2>
              <div className="space-y-3">
                {availablePayments.map(pm => {
                  const PmIcon = PAYMENT_ICONS[pm.id] || Wallet;
                  return (
                    <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${paymentMethod === pm.id ? 'glass border-glow shadow-glow' : 'glass hover:border-glow'}`}>
                      <PmIcon size={20} className={paymentMethod === pm.id ? 'text-emerald-500' : 'text-muted-foreground'} />
                      <div className="text-left flex-1">
                        <span className="font-medium text-sm">{pm.name}</span>
                        {pm.desc && <p className="text-[10px] text-muted-foreground">{pm.desc}</p>}
                      </div>
                      {paymentMethod === pm.id && <Check size={16} className="text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
              <div className="glass rounded-2xl p-5 border-glow shadow-glow mt-4">
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><ShoppingBag size={18} className="text-emerald-500" /> Сводка</h3>
                <div className="space-y-3 mb-4">
                  {items.map((item, idx) => (
                    <div key={idx} className="glass rounded-xl p-3">
                      <p className="text-sm font-medium truncate">{item.name || item.link}</p>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{item.quantity} шт · {item.weight} кг</span>
                        <span className="font-medium text-foreground">{item.priceBYN} BYN</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Товары</span><span>{roundBYN(totalPriceBYN)} BYN</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Сервис (22%)</span><span>{roundBYN(totalServiceBYN)} BYN</span></div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Доставка ({DELIVERY_METHODS_V2.find(d => d.id === deliveryMethod)?.name})</span>
                    <span>{deliveryCostBYN > 0 ? `${roundBYN(deliveryCostBYN)} BYN` : deliveryMethod === 'sdek' ? 'Индивидуально' : 'Бесплатно'}</span>
                  </div>
                  {boxCostBYN > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Упаковка</span><span>{boxCostBYN.toFixed(2)} BYN</span></div>}
                  {codSurcharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Наложенный платёж (+1.5%)</span><span>{codSurcharge} BYN</span></div>}
                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <span className="font-semibold">Итого</span>
                    <span className="text-xl font-display font-bold text-gradient">{grandTotal} BYN</span>
                  </div>
                  {grandTotal >= 10 && (
                    <p className="text-[10px] text-yellow-400 flex items-center gap-1"><Coins size={10} /> +{calculatePointsEarned(grandTotal)} ЕвроБалл(ов)</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT DETAILS */}
          {step === 'payment_details' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold">Детали оплаты</h2>
              {paymentMethod === 'transfer' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs mb-2 block text-muted-foreground">Регион банка</Label>
                    <div className="flex gap-2">
                      {([['by', '🇧🇾 Беларусь'], ['ru', '🇷🇺 Россия']] as const).map(([key, label]) => (
                        <button key={key} onClick={() => { setBankRegion(key); setSelectedBank(''); }}
                          className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${bankRegion === key ? 'glass border-glow shadow-glow' : 'glass hover:border-glow'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-2 block text-muted-foreground">Выберите банк</Label>
                    <div className="space-y-2">
                      {banks[bankRegion].map(bank => (
                        <button key={bank.id} onClick={() => setSelectedBank(bank.id)}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${selectedBank === bank.id ? 'glass border-glow shadow-glow' : 'glass hover:border-glow'}`}>
                          <Building2 size={18} className={selectedBank === bank.id ? 'text-emerald-500' : 'text-muted-foreground'} />
                          <p className="text-sm font-medium flex-1 text-left">{bank.name}</p>
                          {selectedBank === bank.id && <Check size={16} className="text-emerald-500" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedBankInfo && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 border-glow shadow-glow">
                      <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                        <CreditCard size={16} className="text-emerald-500" /> Реквизиты для перевода
                      </h3>
                      <div className="space-y-3">
                        <div className="glass rounded-xl p-3">
                          <p className="text-[10px] text-muted-foreground mb-1">Номер карты</p>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm">{showCard ? selectedBankInfo.card : '•••• •••• •••• ' + selectedBankInfo.card.slice(-4)}</span>
                            <div className="flex gap-1.5">
                              <button onClick={() => setShowCard(!showCard)} className="p-1.5 rounded-lg glass hover:border-glow">{showCard ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                              <button onClick={() => { navigator.clipboard.writeText(selectedBankInfo.card.replace(/\s/g, '')); toast.success('Скопирован!'); }}
                                className="p-1.5 rounded-lg glass hover:border-glow"><Copy size={12} /></button>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Сумма</span><span className="font-display font-bold text-gradient">{grandTotal} BYN</span></div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              {paymentMethod === 'cash' && (
                <div className="glass rounded-2xl p-5 border-glow shadow-glow">
                  <div className="flex items-center gap-2 mb-3"><Wallet size={18} className="text-emerald-500" /><h3 className="font-display font-bold text-sm">Оплата наличными</h3></div>
                  <p className="text-xs text-muted-foreground mb-3">Оплата при получении заказа.</p>
                  <div className="glass rounded-xl p-4 border-glow text-center">
                    <p className="text-xs text-muted-foreground">Сумма к оплате</p>
                    <p className="text-2xl font-display font-bold text-gradient">{grandTotal} BYN</p>
                  </div>
                </div>
              )}
              {paymentMethod === 'cod' && (
                <div className="glass rounded-2xl p-5 border-glow shadow-glow">
                  <div className="flex items-center gap-2 mb-3"><Package size={18} className="text-emerald-500" /><h3 className="font-display font-bold text-sm">Наложенный платёж</h3></div>
                  <p className="text-xs text-muted-foreground mb-3">Оплата при получении через Европочту. +1.5% от стоимости товара.</p>
                  <div className="glass rounded-xl p-4 border-glow text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Комиссия</p>
                    <p className="text-sm font-medium">{codSurcharge} BYN</p>
                    <p className="text-xs text-muted-foreground">Итого</p>
                    <p className="text-2xl font-display font-bold text-gradient">{grandTotal} BYN</p>
                  </div>
                </div>
              )}
              {paymentMethod === 'telegram_stars' && (
                <div className="glass rounded-2xl p-5 border-glow shadow-glow">
                  <div className="flex items-center gap-2 mb-3"><Star size={18} className="text-emerald-500" /><h3 className="font-display font-bold text-sm">Звёзды Telegram</h3></div>
                  <p className="text-xs text-muted-foreground mb-3">Менеджер свяжется для уточнения деталей.</p>
                  <div className="glass rounded-xl p-4 border-glow text-center">
                    <p className="text-xs text-muted-foreground">Сумма</p>
                    <p className="text-2xl font-display font-bold text-gradient">{grandTotal} BYN</p>
                  </div>
                </div>
              )}
              {paymentMethod === 'crypto' && (
                <div className="glass rounded-2xl p-5 border-glow shadow-glow">
                  <div className="flex items-center gap-2 mb-3"><Bitcoin size={18} className="text-emerald-500" /><h3 className="font-display font-bold text-sm">Криптовалюта</h3></div>
                  <p className="text-xs text-muted-foreground mb-3">Менеджер свяжется для уточнения адреса кошелька.</p>
                  <div className="glass rounded-xl p-4 border-glow text-center">
                    <p className="text-xs text-muted-foreground">Сумма</p>
                    <p className="text-2xl font-display font-bold text-gradient">{grandTotal} BYN</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REGISTER */}
          {step === 'register' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                  <UserIcon size={28} className="text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-display font-bold">Почти готово!</h2>
                <p className="text-sm text-muted-foreground mt-1">Заполните данные для оформления</p>
              </div>
              <div><Label className="text-xs mb-1.5 block text-muted-foreground">Ваше имя</Label><Input placeholder="Иван Иванов" value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} className={inputClass} /></div>
              <div><Label className="text-xs mb-1.5 block text-muted-foreground">Телефон</Label><Input type="tel" placeholder="+375..." value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} /></div>
              <div><Label className="text-xs mb-1.5 block text-muted-foreground">Email</Label><Input type="email" placeholder="email@example.com" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} className={inputClass} /></div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom buttons */}
      {step !== 'done' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-3 mt-6">
          {step !== 'platform' && (
            <Button variant="outline" onClick={goBack} className="glass border-glow h-12 rounded-xl"><ArrowLeft size={16} /></Button>
          )}
          {step === 'item' && (
            <Button disabled={!canAddItem()} onClick={addItem} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-primary-foreground font-semibold h-12 rounded-xl border-0 shadow-lg shadow-emerald-500/30 disabled:opacity-50">
              Добавить товар <ArrowRight size={16} className="ml-1.5" />
            </Button>
          )}
          {step === 'delivery' && (
            <Button onClick={() => setStep('payment')} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-primary-foreground font-semibold h-12 rounded-xl border-0">
              Далее <ArrowRight size={16} className="ml-1.5" />
            </Button>
          )}
          {step === 'payment' && (
            <Button onClick={() => setStep('payment_details')} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-primary-foreground font-semibold h-12 rounded-xl border-0">
              Далее <ArrowRight size={16} className="ml-1.5" />
            </Button>
          )}
          {step === 'payment_details' && (
            <Button onClick={submit} disabled={submitting || (paymentMethod === 'transfer' && !selectedBank)}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-primary-foreground font-semibold h-12 rounded-xl border-0 shadow-lg shadow-emerald-500/30 disabled:opacity-50">
              {submitting ? 'Оформляем...' : 'Оформить заказ'} <Check size={16} className="ml-1.5" />
            </Button>
          )}
          {step === 'register' && (
            <Button onClick={handleRegister} disabled={submitting}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-primary-foreground font-semibold h-12 rounded-xl border-0 shadow-lg shadow-emerald-500/30">
              {submitting ? 'Регистрация...' : 'Зарегистрироваться и оформить'} <Check size={16} className="ml-1.5" />
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AvitoOrderPage;
