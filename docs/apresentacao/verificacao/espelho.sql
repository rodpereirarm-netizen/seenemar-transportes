\set ON_ERROR_STOP 1
-- Espelho local da produção (1ª carga): só os ajustes de integrantes feitos em produção + vínculo de login
do $$ begin if not exists (select 1 from pg_roles where rolname='authenticator') then create role authenticator login noinherit; end if; end $$;
grant anon, authenticated to authenticator;
update integrantes set nome='Rodrigo Maul', email='rodrigo.maul@desenvolvimento.rj.gov.br', orgao='SEDES', modelo_trabalho='Remoto' where papel='admin';
update integrantes set email='karina.ferrarez@desenvolvimento.rj.gov.br' where nome like 'Karina%';
insert into auth.users(id,email) values ('00000000-0000-0000-0000-000000000001','rodrigo.maul@desenvolvimento.rj.gov.br');
-- Datas idênticas às da produção (carga aplicada em 24/09/2026 17:33 UTC)
set session_replication_role = replica;
update atividades set data_conclusao='2026-09-24' where data_conclusao is not null;
update atividades set created_at='2026-09-24 17:33:08.879324+00', updated_at='2026-09-24 17:33:08.879324+00';
update contratacoes set created_at='2026-09-24 17:33:08.879324+00', updated_at='2026-09-24 17:33:08.879324+00';
update andamentos set created_at='2026-09-24 17:33:08.879324+00';
set session_replication_role = origin;
