\set ON_ERROR_STOP 1
-- Réplica local: auditoria idêntica à da produção (carga em 24/09 17:33 UTC + 6 alterações de integrantes)
set session_replication_role = replica;
update auditoria set created_at = '2026-09-24 17:33:08.879324+00';
delete from auditoria where tabela = 'integrantes' and operacao = 'UPDATE';
insert into auditoria (created_at, tabela, operacao, registro_id, usuario_nome, campos_alterados, dados_anteriores, dados_novos, integrante_id)
select v.created_at::timestamptz, 'integrantes', 'UPDATE', i.id::text, v.usuario, v.campos::text[],
       to_jsonb(i) || v.antes::jsonb, to_jsonb(i) || v.depois::jsonb,
       case when v.autor then (select id from integrantes where papel = 'admin') end
from (values
 ('2026-09-24 17:38:36.509016+00', 'admin',  'Sistema',                  '{email}',                 '{"nome":"Administrador do sistema","email":"admin@gtpropag.local","orgao":"FAETEC","modelo_trabalho":"Presencial","user_id":null}', '{"nome":"Administrador do sistema","email":"rodrigo.maul@desenvolvimento.rj.gov.br","orgao":"FAETEC","modelo_trabalho":"Presencial","user_id":null}', false),
 ('2026-09-24 18:07:33.798695+00', 'admin',  'Sistema',                  '{user_id}',               '{"nome":"Administrador do sistema","email":"rodrigo.maul@desenvolvimento.rj.gov.br","orgao":"FAETEC","modelo_trabalho":"Presencial","user_id":null}', '{"nome":"Administrador do sistema","email":"rodrigo.maul@desenvolvimento.rj.gov.br","orgao":"FAETEC","modelo_trabalho":"Presencial"}', false),
 ('2026-09-24 18:10:59.293254+00', 'admin',  'Administrador do sistema', '{modelo_trabalho,orgao}', '{"nome":"Administrador do sistema","orgao":"FAETEC","modelo_trabalho":"Presencial"}', '{"nome":"Administrador do sistema","orgao":"SEDES","modelo_trabalho":"Remoto"}', true),
 ('2026-09-24 18:30:35.082821+00', 'karina', 'Administrador do sistema', '{email}',                 '{"email":null,"user_id":null}', '{"email":"karina.ferrarez@desenvolvimento.rj.gov.br","user_id":null}', true),
 ('2026-09-24 18:40:01.811576+00', 'karina', 'Sistema',                  '{user_id}',               '{"email":"karina.ferrarez@desenvolvimento.rj.gov.br","user_id":null}', '{"email":"karina.ferrarez@desenvolvimento.rj.gov.br"}', false),
 ('2026-09-24 19:00:44.368068+00', 'admin',  'Rodrigo Maul',             '{nome}',                  '{"nome":"Administrador do sistema","orgao":"SEDES","modelo_trabalho":"Remoto"}', '{"nome":"Rodrigo Maul","orgao":"SEDES","modelo_trabalho":"Remoto"}', true)
) as v(created_at, quem, usuario, campos, antes, depois, autor)
join integrantes i on (v.quem = 'admin' and i.papel = 'admin') or (v.quem = 'karina' and i.nome like 'Karina%');
-- Vínculo de login local (somente na réplica, sem gerar auditoria) para capturar a tela de cada perfil
insert into auth.users(id, email) values
 ('00000000-0000-0000-0000-000000000011', 'vinicius@local'), ('00000000-0000-0000-0000-000000000012', 'elias@local'),
 ('00000000-0000-0000-0000-000000000013', 'andressa@local'), ('00000000-0000-0000-0000-000000000014', 'gibson@local'),
 ('00000000-0000-0000-0000-000000000015', 'luene@local') on conflict do nothing;
update integrantes set user_id = '00000000-0000-0000-0000-000000000011' where nome like 'Vinicius%';
update integrantes set user_id = '00000000-0000-0000-0000-000000000012' where nome like 'Elias%';
update integrantes set user_id = '00000000-0000-0000-0000-000000000013' where nome like 'Andressa%';
update integrantes set user_id = '00000000-0000-0000-0000-000000000014' where nome like 'Gibson%';
update integrantes set user_id = '00000000-0000-0000-0000-000000000015' where nome like 'Luene%';
update integrantes set updated_at = '2026-09-24 17:33:08.879324+00' where papel <> 'admin' and nome not like 'Karina%';
set session_replication_role = origin;
