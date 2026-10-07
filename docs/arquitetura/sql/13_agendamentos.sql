-- =============================================================================
-- SIGC · 13 · Agendamentos (pg_cron, disponível no Supabase)
-- Horários em UTC: 10:00 UTC = 07:00 em Brasília.
-- O envio de e-mail (07:15) e o relatório semanal ficam em Edge Functions que leem
-- notificacoes (canal = 'email', enviada_em nulo) e as views do painel.
-- =============================================================================

create extension if not exists pg_cron;

select cron.schedule('sigc-rotina-diaria', '0 10 * * *', $$select public.fn_rotina_diaria()$$);
