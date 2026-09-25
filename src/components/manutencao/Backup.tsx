import { useState } from 'react';
import { useApp } from '../../lib/app';
import { supabase } from '../../lib/supabase';
import { dataHora } from '../../lib/format';
import { toast } from '../ui';

/** Tabelas exportadas. Mensagens e notificações ficam de fora por serem comunicações privadas de cada integrante. */
const TABELAS = [
  'integrantes', 'etapas', 'modalidades', 'atividades_modelo', 'feriados', 'areas_demandantes', 'opcoes_lista',
  'atas', 'contratacoes', 'contratacao_responsaveis', 'atividades', 'andamentos', 'documentos', 'auditoria',
] as const;
const PAGINA = 1000;

async function lerTudo(tabela: string) {
  const linhas: unknown[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await supabase.from(tabela).select('*').range(de, de + PAGINA - 1);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    linhas.push(...(data ?? []));
    if (!data || data.length < PAGINA) return linhas;
  }
}

export default function Backup() {
  const { eu } = useApp();
  const [andamento, setAndamento] = useState<string | null>(null);
  const [ultimo, setUltimo] = useState<{ quando: string; contagens: Record<string, number> } | null>(null);

  async function exportar() {
    try {
      const tabelas: Record<string, unknown[]> = {};
      for (const [i, t] of TABELAS.entries()) {
        setAndamento(`Lendo ${t} (${i + 1} de ${TABELAS.length})…`);
        tabelas[t] = await lerTudo(t);
      }
      const quando = new Date().toISOString();
      const contagens = Object.fromEntries(Object.entries(tabelas).map(([k, v]) => [k, v.length]));
      const arquivo = {
        sistema: 'GT PROPAG · Sistema de Controle de Contratações', gerado_em: quando, gerado_por: eu?.nome ?? null,
        observacao: 'Cópia de segurança em JSON. Arquivos anexados não incluídos (apenas a lista em “documentos”). Mensagens e notificações não incluídas (comunicações privadas).',
        contagens, tabelas,
      };
      const blob = new Blob([JSON.stringify(arquivo, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `backup_gt_propag_${quando.slice(0, 16).replace(/[:T]/g, '-')}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setUltimo({ quando, contagens });
      toast('Backup gerado.');
    } catch (e) {
      toast(`Não foi possível gerar o backup: ${(e as Error).message}`, true);
    } finally {
      setAndamento(null);
    }
  }

  return (
    <div className="card">
      <h2 className="card-titulo">Backup de dados em JSON</h2>
      <p className="muted">
        Exporta as tabelas do sistema em um arquivo JSON, com data, hora e responsável pela exportação. Complementa o backup automático
        diário do Supabase (plano Pro, guardado por 7 dias). Os arquivos anexados não entram no JSON, apenas a lista deles; mensagens e
        notificações também não entram, por serem comunicações privadas.
      </p>
      <div className="linha">
        <button className="btn primario" onClick={exportar} disabled={!!andamento}>{andamento ?? 'Exportar backup (JSON)'}</button>
      </div>
      {ultimo && (
        <div className="aviso ok mt">
          Backup gerado em {dataHora(ultimo.quando)} ·{' '}
          {Object.entries(ultimo.contagens).map(([k, v]) => `${k}: ${v}`).join(' · ')}
        </div>
      )}
    </div>
  );
}
