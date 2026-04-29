import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  COUNTRIES, CURRENCIES, MAX_WEIGHT_KG, MAX_PRICE_EUR,
  roundBYN, getWeightPriceUSD,
} from '@/lib/types';
import { DELIVERY_METHODS_V2, getDeliveryCost, getDeliveryLabel } from '@/lib/delivery-config';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { Calculator, TrendingUp, AlertTriangle, Info, RefreshCw, Package, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const CalculatorPage = () => {
  const { rates, loading: ratesLoading, updatedAt, refresh, convertToBYN, convertToEUR } = useExchangeRates();
  const [, forceTick] = useState(0);
  // Re-render every 15s so "обновлено N сек назад" stays accurate
  useState(() => {
    const id = setInterval(() => forceTick(t => t + 1), 15000);
    return () => clearInterval(id);
  });

  const formatAgo = (ts: number | null) => {
    if (!ts) return 'только что';
    const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (sec < 60) return `${sec} сек назад`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} мин назад`;
    const h = Math.floor(min / 60);
    return `${h} ч назад`;
  };
  const updatedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [country, setCountry] = useState('');
  const [delivery, setDelivery] = useState('courier_minsk');
  const [result, setResult] = useState<null | {
    total: number;
    breakdown: { item: string; cost: number; note?: string }[];
  }>(null);

  const priceNum = parseFloat(price) || 0;
  const weightNum = parseFloat(weight) || 0;
  const priceEUR = convertToEUR(priceNum, currency);
  const priceBYN = convertToBYN(priceNum, currency);
  const overWeight = weightNum > MAX_WEIGHT_KG;
  const overPrice = priceEUR > MAX_PRICE_EUR;

  const calculate = () => {
    if (overWeight || overPrice) return;

    const weightCostUSD = getWeightPriceUSD(weightNum);
    const weightCostBYN = roundBYN(weightCostUSD * rates.USD);
    const percentCost = roundBYN(priceBYN * 0.22);
    const serviceCost = Math.max(percentCost, weightCostBYN);
    const deliveryCost = getDeliveryCost(delivery, weightNum);
    const total = roundBYN(priceBYN + serviceCost + deliveryCost);

    const isPercentHigher = percentCost >= weightCostBYN;

    setResult({
      total,
      breakdown: [
        { item: 'Стоимость товара', cost: roundBYN(priceBYN) },
        {
          item: isPercentHigher ? 'Сервис (22% от стоимости)' : `Сервис (по весу: ${weightNum} кг)`,
          cost: roundBYN(serviceCost),
          note: isPercentHigher
            ? `22% = ${percentCost} BYN > по весу ${weightCostBYN} BYN`
            : `По весу ${weightCostBYN} BYN > 22% = ${percentCost} BYN`,
        },
        { item: `Доставка (${DELIVERY_METHODS_V2.find(d => d.id === delivery)?.name || ''})`, cost: deliveryCost, note: delivery === 'sdek' ? 'Стоимость уточняется менеджером' : undefined },
      ],
    });
  };

  return (
    <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center glow-primary">
          <Calculator size={20} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Калькулятор</h1>
          <p className="text-xs text-muted-foreground">Рассчитайте примерную стоимость</p>
        </div>
      </motion.div>

      {ratesLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <RefreshCw size={12} className="animate-spin" /> Загрузка курсов валют...
        </div>
      )}

      {!ratesLoading && (
        <div className="glass rounded-2xl p-3 mb-4 border-glow space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/90">
              <TrendingUp size={12} className="text-primary" />
              Актуальные курсы валют
            </div>
            <button
              onClick={refresh}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
              title="Обновить курсы"
            >
              <RefreshCw size={10} className={ratesLoading ? 'animate-spin' : ''} />
              Обновить
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { code: 'USD', val: rates.USD },
              { code: 'EUR', val: rates.EUR },
              { code: 'PLN', val: rates.PLN },
            ].map(r => (
              <div key={r.code} className="rounded-xl bg-primary/5 border border-primary/10 px-2 py-1.5 text-center">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">1 {r.code}</div>
                <div className="text-xs font-bold text-foreground">{roundBYN(r.val)} BYN</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Обновлено в {updatedTime}
            </span>
            <span>{formatAgo(updatedAt)}</span>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1.5 block text-muted-foreground">Стоимость товара</Label>
            <Input type="number" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)}
              className="glass border-glow bg-transparent h-11 rounded-xl" />
            {overPrice && (
              <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                <AlertTriangle size={10} /> Макс. 500 EUR ({roundBYN(priceEUR)} EUR)
              </p>
            )}
          </div>
          <div>
            <Label className="text-xs mb-1.5 block text-muted-foreground">Валюта</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="glass border-glow bg-transparent h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent className="glass-strong rounded-xl">
                {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {priceNum > 0 && (
          <div className="glass rounded-xl p-3 text-xs space-y-1 border-glow">
            <div className="flex justify-between"><span className="text-muted-foreground">В BYN</span><span className="font-medium">{roundBYN(priceBYN)} BYN</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">В EUR</span><span className={`font-medium ${overPrice ? 'text-destructive' : ''}`}>{roundBYN(priceEUR)} EUR</span></div>
          </div>
        )}

        <div>
          <Label className="text-xs mb-1.5 block text-muted-foreground">Вес (кг)</Label>
          <Input type="number" placeholder="0.5" value={weight} onChange={e => setWeight(e.target.value)}
            className="glass border-glow bg-transparent h-11 rounded-xl" />
          {overWeight && (
            <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
              <AlertTriangle size={10} /> Макс. {MAX_WEIGHT_KG} кг
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs mb-1.5 block text-muted-foreground">Страна</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="glass border-glow bg-transparent h-11 rounded-xl"><SelectValue placeholder="Выберите страну" /></SelectTrigger>
            <SelectContent className="glass-strong rounded-xl">
              {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs mb-1.5 block text-muted-foreground">Способ доставки</Label>
          <div className="space-y-2">
            {DELIVERY_METHODS_V2.map(dm => (
              <button key={dm.id} onClick={() => setDelivery(dm.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 ${delivery === dm.id ? 'glass border-glow shadow-glow' : 'glass hover:border-glow'}`}>
                <div className="text-left">
                  <div className="text-sm font-medium">{dm.name}</div>
                  <div className="text-[11px] text-muted-foreground">{dm.desc}</div>
                </div>
                <span className={`text-sm font-display font-bold ${delivery === dm.id ? 'text-gradient' : 'text-muted-foreground'}`}>
                  {getDeliveryLabel(dm.id, weightNum)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={calculate} disabled={overWeight || overPrice || !priceNum}
          className="w-full gradient-primary glow-primary text-primary-foreground font-semibold h-12 rounded-xl border-0 hover:opacity-90 transition-opacity disabled:opacity-40">
          <TrendingUp size={18} className="mr-2" /> Рассчитать стоимость
        </Button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4 }}
            className="glass rounded-2xl p-5 border-glow shadow-glow space-y-3">
            <h3 className="font-display font-bold text-lg">Примерный расчёт</h3>
            <div className="space-y-2.5">
              {result.breakdown.map(({ item, cost, note }) => (
                <div key={item}>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item}</span>
                    <span className="font-medium">{cost > 0 ? `${cost} BYN` : delivery === 'sdek' ? 'Индивидуально' : 'Бесплатно'}</span>
                  </div>
                  {note && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Info size={9} /> {note}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="font-semibold">Примерный итого</span>
              <span className="text-2xl font-display font-bold text-gradient">{result.total} BYN</span>
            </div>
            <p className="text-[10px] text-muted-foreground">* Точную сумму подтвердит менеджер</p>
          </motion.div>
        )}

        {/* Delivery CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5 border-glow text-center mt-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Package size={18} className="text-primary" />
            <h3 className="font-display font-bold text-sm">Товар уже куплен?</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Нужна только доставка? Напишите нам в Telegram</p>
          <a href="https://t.me/kirillmr" target="_blank" rel="noopener noreferrer">
            <Button className="gradient-primary glow-primary text-primary-foreground font-semibold h-10 rounded-xl border-0 px-6">
              <Send size={14} className="mr-2" /> Написать @kirillmr
            </Button>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CalculatorPage;
