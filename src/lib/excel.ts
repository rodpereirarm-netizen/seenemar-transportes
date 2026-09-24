export interface ColunaExcel<T> {
  titulo: string;
  valor: (linha: T) => string | number | null | undefined | Date;
  largura?: number;
  formato?: string;
}

export interface AbaExcel<T = any> {
  nome: string;
  titulo?: string;
  subtitulo?: string;
  colunas: ColunaExcel<T>[];
  linhas: T[];
}

/** Gera e baixa um .xlsx com uma ou mais abas (exceljs carregado sob demanda). */
export async function exportarExcel(arquivo: string, abas: AbaExcel[]) {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'GT PROPAG · Compras Públicas';
  wb.created = new Date();

  for (const aba of abas) {
    const ws = wb.addWorksheet(aba.nome.slice(0, 31));
    let linhaInicial = 1;
    if (aba.titulo) {
      ws.getCell(1, 1).value = aba.titulo;
      ws.getCell(1, 1).font = { bold: true, size: 14, color: { argb: 'FF16284D' } };
      linhaInicial = 2;
      if (aba.subtitulo) {
        ws.getCell(2, 1).value = aba.subtitulo;
        ws.getCell(2, 1).font = { italic: true, size: 10, color: { argb: 'FF6B6456' } };
        linhaInicial = 3;
      }
      linhaInicial += 1;
    }
    const cab = ws.getRow(linhaInicial);
    aba.colunas.forEach((c, i) => {
      const cell = cab.getCell(i + 1);
      cell.value = c.titulo;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16284D' } };
      cell.alignment = { vertical: 'middle', wrapText: true };
      ws.getColumn(i + 1).width = c.largura ?? 18;
      if (c.formato) ws.getColumn(i + 1).numFmt = c.formato;
    });
    cab.height = 28;
    aba.linhas.forEach((l, r) => {
      const row = ws.getRow(linhaInicial + 1 + r);
      aba.colunas.forEach((c, i) => {
        const v = c.valor(l);
        row.getCell(i + 1).value = v === undefined ? null : v;
        row.getCell(i + 1).alignment = { vertical: 'top', wrapText: true };
      });
    });
    ws.views = [{ state: 'frozen', ySplit: linhaInicial }];
    ws.autoFilter = {
      from: { row: linhaInicial, column: 1 },
      to: { row: linhaInicial, column: aba.colunas.length },
    };
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = arquivo.endsWith('.xlsx') ? arquivo : `${arquivo}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
