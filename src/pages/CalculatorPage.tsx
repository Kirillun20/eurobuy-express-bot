import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, CURRENCIES, DELIVERY_METHODS } from '@/lib/types';
import { Calculator, Package } from 'lucide-react';

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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
          <Calculator size={20} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Калькулятор</h1>
          <p className="text-xs text-muted-foreground">Рассчитайте стоимость доставки</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1.5 block">Стоимость товара</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Валюта</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs mb-1.5 block">Вес (кг)</Label>
          <Input
            type="number"
            placeholder="0.5"
            value={weight}
            onChange={e => setWeight(e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs mb-1.5 block">Страна</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue placeholder="Выберите страну" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs mb-1.5 block">Способ доставки</Label>
          <div className="space-y-2">
            {DELIVERY_METHODS.map(dm => (
              <button
                key={dm.id}
                onClick={() => setDelivery(dm.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  delivery === dm.id
                    ? 'border-primary bg-primary/5 shadow-card'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package size={16} className={delivery === dm.id ? 'text-primary' : 'text-muted-foreground'} />
                  <div className="text-left">
                    <div className="text-sm font-medium">{dm.name}</div>
                    <div className="text-[11px] text-muted-foreground">{dm.days}</div>
                  </div>
                </div>
                <span className="text-sm font-semibold">от €{dm.price}</span>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={calculate} className="w-full bg-primary hover:bg-primary/90 font-semibold">
          Рассчитать стоимость
        </Button>

        {result && (
          <div className="bg-card rounded-2xl p-5 shadow-elevated space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="font-display font-bold text-lg">Расчёт стоимости</h3>
            <div className="space-y-2">
              {result.breakdown.map(({ item, cost }) => (
                <div key={item} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item}</span>
                  <span className="font-medium">€{cost}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold">Итого</span>
              <span className="text-xl font-display font-bold text-gold">€{result.total}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculatorPage;
