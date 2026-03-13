
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.site_settings FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update settings" ON public.site_settings FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can insert settings" ON public.site_settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete settings" ON public.site_settings FOR DELETE TO public USING (true);

INSERT INTO public.site_settings (key, value) VALUES ('bank_requisites', '{
  "by": [
    {"id": "belarusbank", "name": "Беларусбанк", "card": "4255 1234 5678 9012"},
    {"id": "prior", "name": "Приорбанк", "card": "4585 9876 5432 1098"},
    {"id": "alfa_by", "name": "Альфа-Банк BY", "card": "4279 1111 2222 3333"},
    {"id": "mtbank", "name": "МТБанк", "card": "5351 4444 5555 6666"},
    {"id": "bsb", "name": "БСБ Банк", "card": "4255 7777 8888 9999"}
  ],
  "ru": [
    {"id": "sber", "name": "Сбербанк", "card": "2202 2061 1234 5678"},
    {"id": "tinkoff", "name": "Тинькофф", "card": "2200 7001 2345 6789"},
    {"id": "alfa_ru", "name": "Альфа-Банк RU", "card": "4584 3456 7890 1234"},
    {"id": "vtb", "name": "ВТБ", "card": "2200 0201 2345 6780"}
  ]
}'::jsonb);
