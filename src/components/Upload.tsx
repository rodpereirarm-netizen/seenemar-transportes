import { useRef, useState } from 'react';
import { supabase, BUCKET_DOCUMENTOS, traduzirErro } from '../lib/supabase';
import { useApp } from '../lib/app';
import { tamanhoArquivo } from '../lib/format';
import { IcUpload } from './Icones';

export const EXTENSOES = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
export const LIMITE_BYTES = 50 * 1024 * 1024;

export function extensao(nome: string) {
  return nome.split('.').pop()?.toLowerCase() ?? '';
}

export function validarArquivo(f: File): string | null {
  if (!EXTENSOES.includes(extensao(f.name))) return `${f.name}: apenas PDF, Word (.doc/.docx) ou Excel (.xls/.xlsx).`;
  if (f.size > LIMITE_BYTES) return `${f.name}: excede 50 MB.`;
  return null;
}

/** Envia um arquivo ao Storage e registra na tabela documentos. */
export async function enviarDocumento(
  f: File,
  contratacaoId: string,
  opts: { tipo: string; atividadeId?: string | null; descricao?: string | null; integranteId: string },
) {
  const erro = validarArquivo(f);
  if (erro) throw new Error(erro);
  const seguro = f.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\-]+/g, '_');
  const path = `${contratacaoId}/${crypto.randomUUID()}-${seguro}`;
  const up = await supabase.storage.from(BUCKET_DOCUMENTOS).upload(path, f, { contentType: f.type || undefined });
  if (up.error) throw new Error(traduzirErro(up.error.message));
  const ins = await supabase.from('documentos').insert({
    contratacao_id: contratacaoId,
    atividade_id: opts.atividadeId ?? null,
    tipo_documento: opts.tipo,
    nome_arquivo: f.name,
    storage_path: path,
    mime_type: f.type || null,
    tamanho_bytes: f.size,
    descricao: opts.descricao ?? null,
    enviado_por: opts.integranteId,
  });
  if (ins.error) {
    await supabase.storage.from(BUCKET_DOCUMENTOS).remove([path]);
    throw new Error(traduzirErro(ins.error.message));
  }
}

export async function baixarDocumento(path: string, nome: string) {
  const { data, error } = await supabase.storage.from(BUCKET_DOCUMENTOS).createSignedUrl(path, 120, { download: nome });
  if (error) throw new Error(traduzirErro(error.message));
  window.open(data.signedUrl, '_blank', 'noopener');
}

export function Dropzone({
  onArquivos, texto = 'Arraste arquivos ou clique para anexar', disabled,
}: { onArquivos: (fs: File[]) => void; texto?: string; disabled?: boolean }) {
  const inp = useRef<HTMLInputElement>(null);
  const [sobre, setSobre] = useState(false);
  return (
    <div
      className={`dropzone ${sobre ? 'sobre' : ''}`}
      onClick={() => !disabled && inp.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setSobre(true);
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSobre(false);
        if (!disabled) onArquivos(Array.from(e.dataTransfer.files));
      }}
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
    >
      <IcUpload />
      <strong>{texto}</strong>
      <span className="small muted">PDF, DOCX ou XLSX · até 50 MB por arquivo</span>
      <input
        ref={inp}
        type="file"
        hidden
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        onChange={(e) => {
          onArquivos(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function IconeExt({ nome }: { nome: string }) {
  const e = extensao(nome);
  return <span className={`ext ${e}`}>{e.toUpperCase()}</span>;
}

export function ListaArquivosPendentes({
  arquivos, tipos, onTipo, onRemover,
}: { arquivos: { file: File; tipo: string }[]; tipos?: boolean; onTipo?: (i: number, t: string) => void; onRemover: (i: number) => void }) {
  const { lista } = useApp();
  if (!arquivos.length) return null;
  return (
    <ul className="arquivos">
      {arquivos.map((a, i) => (
        <li key={i}>
          <IconeExt nome={a.file.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.file.name}</div>
            <div className="xs muted">{tamanhoArquivo(a.file.size)}</div>
          </div>
          {tipos && onTipo && (
            <select className="input" style={{ width: 210 }} value={a.tipo} onChange={(e) => onTipo(i, e.target.value)}>
              {lista('tipo_documento').map((o) => (
                <option key={o.id}>{o.valor}</option>
              ))}
            </select>
          )}
          <button type="button" className="btn pequeno perigo" onClick={() => onRemover(i)}>
            Remover
          </button>
        </li>
      ))}
    </ul>
  );
}
