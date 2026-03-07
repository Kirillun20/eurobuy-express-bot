import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, CURRENCIES, DELIVERY_METHODS, PAYMENT_METHODS, Order } from '@/lib/types';
import { saveOrder, getUser } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Link, Package, CreditCard, ShoppingBag } from 'lucide-react';

const STEPS = ['Товар', 'Детали', 'Доставка', 'Оплата'];

const OrderPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    link: '', name: '', quantity: '1', weight: '', price: '', currency: 'EUR',
    country: '', deliveryMethod: 'standard', paymentMethod: 'card',
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const user = getUser();

  const submit = () => {
    if (!user) {
      toast.error('Войдите в аккаунт для оформления заказа');
      navigate('/profile');
      return;
    }

    const order: Order = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      link: form.link,
      name: form.name,
      quantity: parseInt(form.quantity) || 1,
      weight: parseFloat(form.weight) || 0,
      price: parseFloat(form.price) || 0,
      currency: form.currency,
      country: form.country,
      deliveryMethod: form.deliveryMethod,
      paymentMethod: form.paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 14 * 86400000).toISOString(),
    };

    saveOrder(order);
    toast.success('Заказ успешно оформлен!');
    navigate('/profile');
  };

  const canNext = () => {
    if (step === 0) return form.link || form.name;
    if (step === 1) return form.quantity && form.price && form.country;
    return true;
  };

  const stepIcons = [Link, Package, ShoppingBag, CreditCard];

  return (
    <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => {
          const Icon = stepIcons[i];
          return (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  i < step ? 'bg-gold text-accent-foreground'
                    : i === step ? 'gradient-gold text-primary-foreground shadow-card'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {i < step ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span className={`text-[10px] mt-1 ${i === step ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 mt-[-12px] ${i < step ? 'bg-gold' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="min-h-[300px]">
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-display font-bold">Что хотите заказать?</h2>
            <p className="text-sm text-muted-foreground">Вставьте ссылку на товар или укажите название</p>
            <div>
              <Label className="text-xs mb-1.5 block">Ссылка на товар</Label>
              <Input placeholder="https://..." value={form.link} onChange={e => update('link', e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">или</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Название товара</Label>
              <Input placeholder="Кроссовки Nike Air Max..." value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-display font-bold">Детали заказа</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Количество</Label>
                <Input type="number" min="1" value={form.quantity} onChange={e => update('quantity', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Вес (кг)</Label>
                <Input type="number" placeholder="0.5" value={form.weight} onChange={e => update('weight', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Стоимость</Label>
                <Input type="number" placeholder="0.00" value={form.price} onChange={e => update('price', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Валюта</Label>
                <Select value={form.currency} onValueChange={v => update('currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Страна</Label>
              <Select value={form.country} onValueChange={v => update('country', v)}>
                <SelectTrigger><SelectValue placeholder="Выберите страну" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-display font-bold">Способ доставки</h2>
            <div className="space-y-3">
              {DELIVERY_METHODS.map(dm => (
                <button
                  key={dm.id}
                  onClick={() => update('deliveryMethod', dm.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    form.deliveryMethod === dm.id
                      ? 'border-primary bg-primary/5 shadow-card'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">{dm.name}</div>
                    <div className="text-[11px] text-muted-foreground">{dm.days}</div>
                  </div>
                  <span className="font-display font-bold text-gold">€{dm.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-display font-bold">Способ оплаты</h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.id}
                  onClick={() => update('paymentMethod', pm.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    form.paymentMethod === pm.id
                      ? 'border-primary bg-primary/5 shadow-card'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <CreditCard size={20} className={form.paymentMethod === pm.id ? 'text-primary' : 'text-muted-foreground'} />
                  <span className="font-medium text-sm">{pm.name}</span>
                </button>
              ))}
            </div>

            {/* Order summary */}
            <div className="bg-card rounded-2xl p-4 shadow-card mt-6">
              <h3 className="font-display font-bold mb-3">Сводка заказа</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Товар</span>
                  <span className="font-medium">{form.name || form.link.slice(0, 30) + '...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Кол-во</span>
                  <span>{form.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Стоимость</span>
                  <span>{form.price} {form.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Страна</span>
                  <span>{form.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Доставка</span>
                  <span>{DELIVERY_METHODS.find(d => d.id === form.deliveryMethod)?.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            <ArrowLeft size={16} className="mr-1" /> Назад
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="flex-1 bg-primary hover:bg-primary/90 font-semibold"
          >
            Далее <ArrowRight size={16} className="ml-1" />
          </Button>
        ) : (
          <Button
            onClick={submit}
            className="flex-1 bg-gold hover:bg-gold-dark text-accent-foreground font-semibold"
          >
            Оформить заказ <Check size={16} className="ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderPage;
