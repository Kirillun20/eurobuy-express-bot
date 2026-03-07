import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, CURRENCIES, DELIVERY_METHODS, PAYMENT_METHODS, Order } from '@/lib/types';
import { saveOrder, getUser } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Link, Package, CreditCard, ShoppingBag, Wallet, Banknote, Bitcoin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = ['Товар', 'Детали', 'Доставка', 'Оплата'];
const STEP_ICONS = [Link, Package, ShoppingBag, CreditCard];

const PAYMENT_ICONS: Record<string, typeof CreditCard> = {
  card: CreditCard,
  transfer: Banknote,
  crypto: Bitcoin,
};

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
      link: form.link, name: form.name,
      quantity: parseInt(form.quantity) || 1,
      weight: parseFloat(form.weight) || 0,
      price: parseFloat(form.price) || 0,
      currency: form.currency, country: form.country,
      deliveryMethod: form.deliveryMethod, paymentMethod: form.paymentMethod,
      status: 'pending', createdAt: new Date().toISOString(),
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

  const inputClass = "glass border-glow bg-transparent h-11 rounded-xl";

  return (
    <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        {STEPS.map((s, i) => {
          const Icon = STEP_ICONS[i];
          return (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                  i < step ? 'gradient-primary text-primary-foreground glow-primary'
                    : i === step ? 'gradient-primary text-primary-foreground glow-primary'
                    : 'glass text-muted-foreground'
                }`}>
                  {i < step ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span className={`text-[10px] mt-1.5 font-medium ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 mx-1 mt-[-14px] rounded-full transition-colors duration-500 ${
                  i < step ? 'bg-primary' : 'bg-border'
                }`} />
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="min-h-[320px]"
        >
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold">Что хотите заказать?</h2>
              <p className="text-sm text-muted-foreground">Вставьте ссылку или укажите название</p>
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Ссылка на товар</Label>
                <Input placeholder="https://..." value={form.link} onChange={e => update('link', e.target.value)} className={inputClass} />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">или</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Название товара</Label>
                <Input placeholder="Кроссовки Nike Air Max..." value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold">Детали заказа</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block text-muted-foreground">Количество</Label>
                  <Input type="number" min="1" value={form.quantity} onChange={e => update('quantity', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block text-muted-foreground">Вес (кг)</Label>
                  <Input type="number" placeholder="0.5" value={form.weight} onChange={e => update('weight', e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block text-muted-foreground">Стоимость</Label>
                  <Input type="number" placeholder="0.00" value={form.price} onChange={e => update('price', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block text-muted-foreground">Валюта</Label>
                  <Select value={form.currency} onValueChange={v => update('currency', v)}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent className="glass-strong rounded-xl">
                      {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Страна</Label>
                <Select value={form.country} onValueChange={v => update('country', v)}>
                  <SelectTrigger className={inputClass}><SelectValue placeholder="Выберите страну" /></SelectTrigger>
                  <SelectContent className="glass-strong rounded-xl">
                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold">Способ доставки</h2>
              <div className="space-y-3">
                {DELIVERY_METHODS.map(dm => (
                  <button
                    key={dm.id}
                    onClick={() => update('deliveryMethod', dm.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                      form.deliveryMethod === dm.id
                        ? 'glass border-glow shadow-glow'
                        : 'glass hover:border-glow'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">{dm.name}</div>
                      <div className="text-[11px] text-muted-foreground">{dm.days}</div>
                    </div>
                    <span className={`font-display font-bold ${
                      form.deliveryMethod === dm.id ? 'text-gradient' : 'text-muted-foreground'
                    }`}>€{dm.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold">Способ оплаты</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(pm => {
                  const PmIcon = PAYMENT_ICONS[pm.id] || Wallet;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => update('paymentMethod', pm.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${
                        form.paymentMethod === pm.id
                          ? 'glass border-glow shadow-glow'
                          : 'glass hover:border-glow'
                      }`}
                    >
                      <PmIcon size={20} className={form.paymentMethod === pm.id ? 'text-primary' : 'text-muted-foreground'} />
                      <span className="font-medium text-sm">{pm.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="glass rounded-2xl p-5 border-glow mt-4">
                <h3 className="font-display font-bold mb-3">Сводка заказа</h3>
                <div className="space-y-2 text-sm">
                  {[
                    ['Товар', form.name || (form.link.length > 30 ? form.link.slice(0, 30) + '...' : form.link)],
                    ['Кол-во', form.quantity],
                    ['Стоимость', `${form.price} ${form.currency}`],
                    ['Страна', form.country],
                    ['Доставка', DELIVERY_METHODS.find(d => d.id === form.deliveryMethod)?.name || ''],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="flex-1 glass border-glow h-12 rounded-xl hover:bg-primary/5"
          >
            <ArrowLeft size={16} className="mr-1.5" /> Назад
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="flex-1 gradient-primary glow-primary text-primary-foreground font-semibold h-12 rounded-xl border-0 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Далее <ArrowRight size={16} className="ml-1.5" />
          </Button>
        ) : (
          <Button
            onClick={submit}
            className="flex-1 gradient-primary glow-primary text-primary-foreground font-semibold h-12 rounded-xl border-0 hover:opacity-90 transition-opacity"
          >
            Оформить заказ <Check size={16} className="ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderPage;
