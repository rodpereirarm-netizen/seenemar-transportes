import { useState, type InputHTMLAttributes } from 'react';
import { IcOlho, IcOlhoFechado } from './Icones';

/** Campo de senha com botão para mostrar ou ocultar o conteúdo digitado. */
export function InputSenha(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visivel, setVisivel] = useState(false);
  const rotulo = visivel ? 'Ocultar senha' : 'Mostrar senha';
  return (
    <div className="senha-campo">
      <input {...props} className={`input ${props.className ?? ''}`.trim()} type={visivel ? 'text' : 'password'} />
      <button type="button" className="senha-olho" onClick={() => setVisivel((v) => !v)} aria-label={rotulo} aria-pressed={visivel} title={rotulo}>
        {visivel ? <IcOlhoFechado width={18} /> : <IcOlho width={18} />}
      </button>
    </div>
  );
}
