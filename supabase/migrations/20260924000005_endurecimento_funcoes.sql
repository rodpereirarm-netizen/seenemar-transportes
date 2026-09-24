-- =============================================================================
-- Migration 05 · Endurecimento das funções (Supabase Security Advisor)
--
-- · Funções de trigger: ninguém chama pela API. Triggers disparam sem EXECUTE.
-- · fn_sincronizar_checklist: só é chamada pelo trigger de modalidade.
-- · Funções usadas nas políticas RLS: continuam executáveis por `authenticated`
--   (o Postgres avalia a política com o papel de quem consulta), mas não por `anon`.
-- =============================================================================

revoke execute on function public.fn_andamento_inserido()          from public, anon, authenticated;
revoke execute on function public.fn_atividade_depois_gravar()     from public, anon, authenticated;
revoke execute on function public.fn_atividade_antes_gravar()      from public, anon, authenticated;
revoke execute on function public.fn_auditoria()                   from public, anon, authenticated;
revoke execute on function public.fn_contratacao_checklist()       from public, anon, authenticated;
revoke execute on function public.fn_definir_autor()               from public, anon, authenticated;
revoke execute on function public.fn_integrante_vincular_conta()   from public, anon, authenticated;
revoke execute on function public.fn_propagar_responsavel_etapa()  from public, anon, authenticated;
revoke execute on function public.fn_vincular_usuario()            from public, anon, authenticated;
revoke execute on function public.fn_proteger_ultimo_admin()       from public, anon, authenticated;
revoke execute on function public.fn_touch_updated_at()            from public, anon, authenticated;
revoke execute on function public.fn_sincronizar_checklist(uuid)   from public, anon, authenticated;

-- Funções das políticas RLS: somente usuários autenticados
revoke execute on function public.fn_meu_integrante()                        from public, anon;
revoke execute on function public.fn_meu_papel()                             from public, anon;
revoke execute on function public.fn_tem_papel(text[])                       from public, anon;
revoke execute on function public.fn_integrante_ativo()                      from public, anon;
revoke execute on function public.fn_pode_operar()                           from public, anon;
revoke execute on function public.fn_pode_editar_contratacao(uuid)           from public, anon;
revoke execute on function public.fn_pode_editar_atividade(int, uuid)        from public, anon;
grant  execute on function public.fn_meu_integrante()                        to authenticated;
grant  execute on function public.fn_meu_papel()                             to authenticated;
grant  execute on function public.fn_tem_papel(text[])                       to authenticated;
grant  execute on function public.fn_integrante_ativo()                      to authenticated;
grant  execute on function public.fn_pode_operar()                           to authenticated;
grant  execute on function public.fn_pode_editar_contratacao(uuid)           to authenticated;
grant  execute on function public.fn_pode_editar_atividade(int, uuid)        to authenticated;
