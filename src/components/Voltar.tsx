import { Link, useLocation, useNavigate } from 'react-router-dom';
import { nomeDaRota, rotaAnterior } from '../lib/navegacao';

/** “← Voltar para …”: retorna à tela de origem; sem histórico, vai para a tela principal da seção. */
export function Voltar({ padrao, rotuloPadrao }: { padrao: string; rotuloPadrao: string }) {
  const nav = useNavigate();
  const loc = useLocation();
  const ant = rotaAnterior(loc.pathname + loc.search);
  if (ant) return <button type="button" className="voltar nao-imprimir" onClick={() => nav(-1)}>← Voltar para {nomeDaRota(ant)}</button>;
  return <Link className="voltar nao-imprimir" to={padrao}>← Voltar para {rotuloPadrao}</Link>;
}
