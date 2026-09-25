import type { SVGProps } from 'react';

const base = (d: React.ReactNode) => (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    {d}
  </svg>
);

export const IcPainel = base(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>);
export const IcLista = base(<><path d="M4 6h16M4 12h16M4 18h10" /></>);
export const IcCheck = base(<><rect x="3" y="3" width="18" height="18" rx="3" /><path d="m8 12 3 3 5-6" /></>);
export const IcDoc = base(<><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" /><path d="M14 3v5h5" /></>);
export const IcBarras = base(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>);
export const IcEquipe = base(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14c2.8 0 5 2.2 5 5" /></>);
export const IcEscudo = base(<><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></>);
export const IcEngrenagem = base(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>);
export const IcSino = base(<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></>);
export const IcUpload = base(<><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></>);
export const IcLixo = base(<><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>);
export const IcBaixar = base(<><path d="M12 4v12M7 11l5 5 5-5M5 20h14" /></>);
export const IcMais = base(<path d="M12 5v14M5 12h14" />);
export const IcMenu = base(<path d="M4 6h16M4 12h16M4 18h16" />);
export const IcX = base(<path d="M6 6l12 12M18 6 6 18" />);
export const IcLapis = base(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>);
export const IcNota = base(<><path d="M4 5h16v11H8l-4 4z" /></>);
export const IcRelogio = base(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const IcSeta = base(<path d="m9 6 6 6-6 6" />);
export const IcImprimir = base(<><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2" /><rect x="6" y="14" width="12" height="7" /></>);
export const IcOlho = base(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>);
export const IcOlhoFechado = base(<><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6A17.4 17.4 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" /></>);
export const IcMensagem = base(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />);
export const IcAgenda = base(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>);
export const IcEvolucao = base(<><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>);
