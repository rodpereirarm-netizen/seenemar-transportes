import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { moeda, num2, primeiroNome } from '../lib/format';
import type { AtividadeView, ContratacaoView } from '../lib/types';

interface Evento { rotulo: string; texto: string; contratacao?: string }

const ABERTA = (a: AtividadeView) => a.status !== 'concluida' && a.status !== 'nao_se_aplica';

/** Letreiro “AO VIVO · GT”: eventos do próprio sistema, com link para a contratação. Pausa ao passar o mouse. */
export function Letreiro({ contratacoes, atividades }: { contratacoes: ContratacaoView[]; atividades: AtividadeView[] }) {
  const nav = useNavigate();
  const [recentes, setRecentes] = useState<{ contratacao_id: string; texto: string; created_at: string }[]>([]);

  useEffect(() => {
    const desde = new Date(Date.now() - 7 * 86400000).toISOString();
    supabase.from('andamentos').select('contratacao_id, texto, created_at').neq('tipo', 'sistema')
      .gte('created_at', desde).order('created_at', { ascending: false }).limit(12)
      .then(({ data }) => setRecentes(data ?? []));
  }, []);

  const porId = new Map(contratacoes.map((c) => [c.id, c]));
  const ref = (id: string) => { const c = porId.get(id); return c ? `${num2(c.numero)} · ${c.titulo}` : ''; };
  const ev: Evento[] = [];
  atividades.filter((a) => ABERTA(a) && a.situacao_prazo === 'vencido' && porId.has(a.contratacao_id))
    .forEach((a) => ev.push({ rotulo: 'PRAZO VENCIDO', texto: `${ref(a.contratacao_id)} — ${a.nome}`, contratacao: a.contratacao_id }));
  atividades.filter((a) => ABERTA(a) && a.situacao_prazo === 'atencao' && porId.has(a.contratacao_id))
    .forEach((a) => ev.push({ rotulo: a.dias_restantes != null ? `VENCE EM ${a.dias_restantes} DIA(S)` : 'PRAZO PRÓXIMO', texto: `${ref(a.contratacao_id)} — ${a.nome}`, contratacao: a.contratacao_id }));
  contratacoes.filter((c) => c.situacao === 'Devolvida' || c.situacao === 'Divergência')
    .forEach((c) => ev.push({ rotulo: c.situacao.toUpperCase(), texto: `${num2(c.numero)} · ${c.titulo}`, contratacao: c.id }));
  recentes.forEach((r) => porId.has(r.contratacao_id) && ev.push({ rotulo: 'ANDAMENTO', texto: `${ref(r.contratacao_id)} — ${r.texto.length > 90 ? r.texto.slice(0, 90) + '…' : r.texto}`, contratacao: r.contratacao_id }));
  contratacoes.filter((c) => c.atividade_atual_responsavel_nome && c.atividade_atual_status === 'em_andamento')
    .forEach((c) => ev.push({ rotulo: 'EM ANDAMENTO', texto: `${num2(c.numero)} · ${c.titulo} — ${c.atividade_atual_nome} com ${primeiroNome(c.atividade_atual_responsavel_nome)}`, contratacao: c.id }));
  const valor = contratacoes.reduce((s, c) => s + Number(c.valor_estimado ?? 0), 0);
  ev.push({ rotulo: 'CARTEIRA', texto: `${contratacoes.length} demandas · ${moeda(valor, true)} em valor informado` });
  const semJust = contratacoes.filter((c) => !c.justificativa_recebida).length;
  if (semJust) ev.push({ rotulo: 'ATENÇÃO', texto: `${semJust} demanda(s) sem justificativa da área técnica` });

  const duracao = Math.max(40, ev.length * 7);
  return (
    <div className="letreiro nao-imprimir" aria-label="Letreiro de eventos do sistema">
      <div className="rotulo">AO VIVO · GT</div>
      <div className="janela">
        <div className="fita" style={{ animationDuration: `${duracao}s` }}>
          {ev.map((e, i) => (
            <button key={i} type="button" className="item" disabled={!e.contratacao} onClick={() => e.contratacao && nav(`/contratacoes/${e.contratacao}`)}>
              <b>{e.rotulo}</b>{e.texto}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
