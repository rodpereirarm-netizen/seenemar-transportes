import { useApp } from '../lib/app';
import { CAMPOS, IGNORAR_CAMPOS } from '../lib/rotulos';
import { STATUS_ATIVIDADE, moeda } from '../lib/format';
import type { RegistroAuditoria, StatusAtividade } from '../lib/types';

export function useFormatarValor() {
  const { integrante, cat } = useApp();
  return (campo: string, v: unknown): string => {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
    if (['responsavel_id', 'responsavel_geral_id', 'integrante_id', 'enviado_por', 'created_by'].includes(campo))
      return integrante(String(v))?.nome ?? String(v);
    if (campo === 'area_demandante_id') return cat.areas.find((a) => a.id === Number(v))?.nome ?? String(v);
    if (campo === 'ata_id') return cat.atas.find((a) => a.id === v)?.numero ?? String(v);
    if (campo === 'modalidade') return cat.modalidades.find((m) => m.codigo === v)?.nome ?? String(v);
    if (campo === 'status' && typeof v === 'string' && v in STATUS_ATIVIDADE) return STATUS_ATIVIDADE[v as StatusAtividade].rotulo;
    if (campo === 'valor_estimado') return moeda(Number(v));
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v.split('-').reverse().join('/');
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleString('pt-BR');
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };
}

export function resumoRegistro(r: RegistroAuditoria): string {
  const d = (r.dados_novos ?? r.dados_anteriores ?? {}) as Record<string, unknown>;
  return String(d.titulo ?? d.nome ?? d.numero ?? d.nome_arquivo ?? d.valor ?? d.descricao ?? (d.texto as string)?.slice(0, 80) ?? r.registro_id ?? '');
}

export default function DiffAuditoria({ r }: { r: RegistroAuditoria }) {
  const fmt = useFormatarValor();
  const antes = (r.dados_anteriores ?? {}) as Record<string, unknown>;
  const depois = (r.dados_novos ?? {}) as Record<string, unknown>;
  const campos =
    r.operacao === 'UPDATE'
      ? (r.campos_alterados ?? [])
      : Object.keys(r.operacao === 'INSERT' ? depois : antes).filter(
          (k) => !IGNORAR_CAMPOS.has(k) && (r.operacao === 'INSERT' ? depois[k] : antes[k]) != null,
        );
  return (
    <table className="diff">
      <thead>
        <tr>
          <th style={{ width: '26%' }}>Campo</th>
          {r.operacao !== 'INSERT' && <th>Antes</th>}
          {r.operacao !== 'DELETE' && <th>Depois</th>}
        </tr>
      </thead>
      <tbody>
        {campos.map((k) => (
          <tr key={k}>
            <td><strong>{CAMPOS[k] ?? k}</strong></td>
            {r.operacao !== 'INSERT' && <td className="antes">{fmt(k, antes[k])}</td>}
            {r.operacao !== 'DELETE' && <td className="depois">{fmt(k, depois[k])}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
