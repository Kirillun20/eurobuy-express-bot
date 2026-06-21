import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/lib/types';

interface Props {
  authLoading: boolean;
  user: User | null;
}

export default function AdminLogin({ authLoading, user }: Props) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) {
      toast.error('Введите пароль');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: { password },
      });
      if (error || !data?.access_token) {
        toast.error('Неверный пароль');
        return;
      }
      const { error: setErr } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (setErr) {
        toast.error('Не удалось установить сессию');
        return;
      }
      toast.success('Добро пожаловать');
    } catch {
      toast.error('Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success('Вы вышли');
  };

  return (
    <div className="px-4 py-6 pb-20 max-w-md mx-auto flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full glass rounded-2xl p-6 border-glow"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 glow-primary">
            <Shield size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">Админ-панель</h1>
          <p className="text-xs text-muted-foreground mt-1">Введите пароль администратора</p>
        </div>

        {authLoading ? (
          <p className="text-center text-sm text-muted-foreground py-6">Проверка доступа...</p>
        ) : user ? (
          <div className="text-center space-y-4">
            <p className="text-xs text-muted-foreground break-all">Вы вошли как {user.email}, но без прав админа</p>
            <div className="flex gap-2">
              <Button onClick={signOut} variant="outline" className="flex-1 glass h-11 rounded-xl">
                <LogOut size={14} className="mr-2" /> Выйти
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1 glass h-11 rounded-xl">
                На главную
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Пароль</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-11 glass border-glow rounded-xl"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full gradient-primary glow-primary text-primary-foreground font-semibold h-11 rounded-xl border-0"
            >
              {loading ? 'Вход...' : (<><Lock size={16} className="mr-2" /> Войти</>)}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
