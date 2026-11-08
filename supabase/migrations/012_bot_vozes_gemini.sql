-- Bot diário das vozes do Gemini: todo dia às 08:15 UTC (05:15 em Brasília, logo depois que a cota grátis
-- do Google zera à meia-noite do Pacífico) chama a função `voz` com {acao:"lote"}. Ela gera as 10 falas
-- fixas mais prováveis que ainda faltam e guarda no bucket "vozes-cache". A chave usada é a anon (pública,
-- já vai no app); o lote não precisa de sessão e roda no máximo uma vez por dia.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('vozes-gemini-diario') where exists (select 1 from cron.job where jobname = 'vozes-gemini-diario');

select cron.schedule(
  'vozes-gemini-diario',
  '15 8 * * *',
  $$
  select net.http_post(
    url := 'https://xwqgyvqofxdqdbhltdzf.supabase.co/functions/v1/voz',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cWd5dnFvZnhkcWRiaGx0ZHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MjkxMzEsImV4cCI6MjEwNzMwNTEzMX0.VnUFG1QLb2UZ8DHrBhHZDqX_YLuA3EVBkgC69yPOUcc'
    ),
    body := '{"acao":"lote"}'::jsonb,
    timeout_milliseconds := 10000
  );
  $$
);
