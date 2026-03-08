import { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { getReviews, saveReview } from '@/lib/store';
import { Review } from '@/lib/types';
import { toast } from 'sonner';

const ReviewsPage = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    setReviews(getReviews());
  }, []);

  const handleSubmit = () => {
    if (!name.trim() || !text.trim()) {
      toast.error('Заполните имя и текст отзыва');
      return;
    }
    const review: Review = {
      id: Date.now().toString(),
      name: name.trim(),
      rating,
      text: text.trim(),
      date: new Date().toISOString().split('T')[0],
    };
    saveReview(review);
    setReviews(getReviews());
    setName('');
    setText('');
    setRating(5);
    setShowForm(false);
    toast.success('Спасибо за отзыв!');
  };

  return (
    <div className="pb-20 px-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl glass border-glow flex items-center justify-center">
              <ArrowLeft size={16} className="text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold">Все отзывы</h1>
              <p className="text-xs text-muted-foreground">{reviews.length} отзывов</p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="glass border-glow text-foreground hover:bg-primary/5 rounded-xl text-xs h-8 gap-1.5"
              variant="outline"
            >
              <MessageSquare size={14} />
              Написать
            </Button>
          </motion.div>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="glass rounded-2xl p-4 border-glow space-y-3">
                <Input
                  placeholder="Ваше имя"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="glass border-glow bg-transparent h-10 rounded-xl"
                />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                      <Star size={20} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'} />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Ваш отзыв..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="glass border-glow bg-transparent rounded-xl min-h-[70px] text-sm"
                />
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground w-full h-10 rounded-xl border-0 gap-2">
                    <Send size={14} /> Отправить
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {reviews.map((r) => (
            <motion.div
              key={r.id}
              variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
              className="glass rounded-2xl p-4 border-glow hover:shadow-glow transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-sm font-semibold">{r.name}</span>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={10} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/20'} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">{r.date}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{r.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ReviewsPage;
