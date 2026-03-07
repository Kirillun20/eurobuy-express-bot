import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, CURRENCIES, DELIVERY_METHODS } from '@/lib/types';
import { Calculator, Package, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const EXCHANGE_RATES: Record<string, number> = {
  EUR: 100, USD: 92, GBP: 116, CHF: 104, PLN: 23, CZK: 4.1, SEK: 8.8,
};

const CalculatorPage = () => {
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [country, setCountry] = useState('');
  const [delivery, setDelivery] = useState('standard');
  const [result, setResult] = useState<null | { total: number; breakdown: { item: string; cost: number }[] }>(null);

  const calculate = () => {
    const w = parseFloat(weight) || 0;
    const p = parseFloat(price) || 0;
    const rate = EXCHANGE_RATES[currency] || 100;
    const priceEur = (p * rate) / 100;
    const dm = DELIVERY_METHODS.find(d => d.id === delivery)!;

    const serviceFee = priceEur * 0.1;
    const shippingCost = dm.price + w * 3;
    const customsFee = priceEur > 200 ? priceEur * 0.05 : 0;
    const total = priceEur + serviceFee + shippingCost + customsFee;

    setResult({
      total: Math.round(total * 100) / 100,
      breakdown: [
        { item: 'Стоимость товара', cost: Math.round(priceEur * 100) / 100 },
        { item: 'Сервисный сбор (10%)', cost: Math.round(serviceFee * 100) / 100 },
        { item: `Доставка (${dm.name})`, cost: Math.round(shippingCost * 100) / 100 },
        ...(customsFee > 0 ? [{ item: 'Таможенный сбор (5%)', cost: Math.round(customsFee * 100) / 100 }] : []),
      ],
    });
  };

  return (
    <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center glow-primary">
          <Calculator size={20} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Калькулятор</h1>
          <p className="text-xs text-muted-foreground">Рассчитайте стоимость доставки</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1.5 block text-muted-foreground">Стоимость товара</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="glass border-glow bg-transparent h-11 rounded-xl"
            />
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

        <div>
          <Label className="text-xs mb-1.5 block text-muted-foreground">Вес (кг)</Label>
          <Input
            type="number"
            placeholder="0.5"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            className="glass border-glow bg-transparent h-11 rounded-xl"
          />
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
            {DELIVERY_METHODS.map(dm => (
              <button
                key={dm.id}
                onClick={() => setDelivery(dm.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 ${
                  delivery === dm.id
                    ? 'glass border-glow shadow-glow'
                    : 'glass hover:border-glow'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package size={16} className={delivery === dm.id ? 'text-primary' : 'text-muted-foreground'} />
                  <div className="text-left">
                    <div className="text-sm font-medium">{dm.name}</div>
                    <div className="text-[11px] text-muted-foreground">{dm.days}</div>
                  </div>
                </div>
                <span className={`text-sm font-display font-bold ${delivery === dm.id ? 'text-gradient' : 'text-muted-foreground'}`}>
                  от €{dm.price}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={calculate}
          className="w-full gradient-primary glow-primary text-primary-foreground font-semibold h-12 rounded-xl border-0 hover:opacity-90 transition-opacity"
        >
          <TrendingUp size={18} className="mr-2" />
          Рассчитать стоимость
        </Button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="glass rounded-2xl p-5 border-glow shadow-glow space-y-3"
          >
            <h3 className="font-display font-bold text-lg">Расчёт стоимости</h3>
            <div className="space-y-2.5">
              {result.breakdown.map(({ item, cost }) => (
                <div key={item} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item}</span>
                  <span className="font-medium">€{cost}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="font-semibold">Итого</span>
              <span className="text-2xl font-display font-bold text-gradient">€{result.total}</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CalculatorPage;
