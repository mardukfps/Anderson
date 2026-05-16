import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OvertimeEntry, AppSettings, EntryType } from '../types';
import { formatCurrency, getBrazilDate, parseLocalDate } from './utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateSalarySummary } from './calculations';

export function generatePDF(entries: OvertimeEntry[], settings: AppSettings) {
  const doc = new jsPDF();
  const now = new Date();
  
  // Format current time in Brazil
  const brazilTimeStr = now.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const brazilDateISO = getBrazilDate();
  
  // --- HEADER DESIGN ---
  // Background deco
  doc.setFillColor(59, 130, 246); // App Accent (Blue 500)
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Hora Certa', 15, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório Consolidado de Horas Extras', 15, 33);
  
  doc.setFontSize(8);
  doc.text(`Gerado em: ${brazilTimeStr}`, 195, 25, { align: 'right' });

  // --- SUMMARY CARDS ---
  let pontoHours = 0;
  let pontoValue = 0;
  let cartaoHours = 0;
  let cartaoValue = 0;

  entries.forEach(e => {
    if (e.type === EntryType.PONTO) {
      pontoHours += e.calculatedHours;
      pontoValue += e.calculatedValue;
    } else {
      cartaoHours += e.calculatedHours;
      cartaoValue += e.calculatedValue;
    }
  });

  const totalHours = pontoHours + cartaoHours;
  const totalValue = pontoValue + cartaoValue;

  // Card background
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(230, 230, 230);
  doc.roundedRect(15, 50, 180, 45, 3, 3, 'FD');

  // Labels
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('RESUMO GERAL', 20, 60);

  doc.setFontSize(8);
  doc.text('HORAS EXTRAS (TOTAL)', 20, 70);
  doc.text('GANHO LÍQUIDO EXTRA', 85, 70);
  doc.text('HORAS: PONTO / CARTÃO', 145, 70);

  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(`${totalHours.toFixed(1)}h`, 20, 80);
  
  doc.setTextColor(16, 185, 129); // Emerald 500
  doc.text(formatCurrency(totalValue), 85, 80);
  
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(`${pontoHours.toFixed(1)}h / ${cartaoHours.toFixed(1)}h`, 145, 80);

  // --- FINANCIAL PROJECTION ---
  if (settings.baseSalary > 0) {
    const summary = calculateSalarySummary(settings.baseSalary, pontoValue);

    doc.setFillColor(248, 250, 252); // Slate 50
    doc.roundedRect(15, 105, 180, 45, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text('PROJEÇÃO FINANCEIRA (ESTE CICLO)', 20, 113);

    doc.setFontSize(8);
    doc.text('Salário Bruto Total:', 25, 122);
    doc.text(formatCurrency(summary.totalGross), 65, 122, { align: 'right' });

    doc.text('Desconto INSS:', 25, 128);
    doc.text(`- ${formatCurrency(summary.inss)}`, 65, 128, { align: 'right' });

    if (summary.irrf > 0) {
      doc.text('Desconto IRRF:', 25, 134);
      doc.text(`- ${formatCurrency(summary.irrf)}`, 65, 134, { align: 'right' });
    }

    doc.text('Benefício FGTS:', 25, 140);
    doc.text(`+ ${formatCurrency(summary.fgts)}`, 65, 140, { align: 'right' });

    doc.setFillColor(16, 185, 129);
    doc.rect(85, 118, 100, 25, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('RECEBIMENTO LÍQUIDO PREVISTO', 135, 128, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(summary.netSalary), 135, 137, { align: 'center' });
  }

  // --- VISUALIZATION (Simple Chart) ---
  const vizY = settings.baseSalary > 0 ? 155 : 100;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('DISTRIBUIÇÃO DE HORAS', 15, vizY);

  const chartWidth = 180;
  const chartHeight = 8;
  const pontoWidth = totalHours > 0 ? (pontoHours / totalHours) * chartWidth : 0;
  const cartaoWidth = totalHours > 0 ? (cartaoHours / totalHours) * chartWidth : 0;

  // Background track
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, vizY + 4, chartWidth, chartHeight, 2, 2, 'F');

  // Ponto segment
  if (pontoWidth > 0) {
    doc.setFillColor(59, 130, 246); // Blue
    doc.roundedRect(15, vizY + 4, pontoWidth, chartHeight, 2, 2, 'F');
  }

  // Cartao segment (drawn on top or after, but let's just draw the second part)
  if (cartaoWidth > 0) {
    doc.setFillColor(16, 185, 129); // Emerald
    doc.roundedRect(15 + pontoWidth, vizY + 4, cartaoWidth, chartHeight, 2, 2, 'F');
  }

  // Legend
  doc.setFontSize(7);
  doc.setFillColor(59, 130, 246);
  doc.rect(15, vizY + 16, 3, 3, 'F');
  doc.setTextColor(100, 116, 139);
  doc.text(`Ponto (${pontoHours.toFixed(1)}h)`, 20, vizY + 18.5);

  doc.setFillColor(16, 185, 129);
  doc.rect(55, vizY + 16, 3, 3, 'F');
  doc.text(`Cartão (${cartaoHours.toFixed(1)}h)`, 60, vizY + 18.5);

  // --- ENTRIES TABLE ---
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalhamento de Registros', 15, vizY + 28);

  const tableData = entries.map(entry => [
    format(parseLocalDate(entry.date), 'dd/MM/yy'),
    entry.type === EntryType.PONTO ? 'PONTO' : 'CARTÃO',
    `${entry.entryTime} - ${entry.exitTime}`,
    `${entry.calculatedHours.toFixed(2)}h`,
    entry.multiplier === 1.0 ? '50%' : '100%',
    formatCurrency(entry.calculatedValue),
    entry.notes || '-'
  ]);

  autoTable(doc, {
    startY: vizY + 33,
    head: [['Data', 'Tipo', 'Período', 'Horas', 'Mult.', 'Valor', 'Notas']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [59, 130, 246], 
      fontSize: 8,
      cellPadding: 3
    },
    bodyStyles: { 
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      6: { cellWidth: 40 }
    },
    styles: {
      valign: 'middle'
    }
  });

  // --- FOOTER AND PAGE NUMBERS ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    
    // Line above footer
    doc.setDrawColor(241, 245, 249);
    doc.line(15, doc.internal.pageSize.height - 15, 195, doc.internal.pageSize.height - 15);
    
    doc.text(
      `Hora Certa | Controle Inteligente de Horas Extras`,
      15,
      doc.internal.pageSize.height - 10
    );
    
    doc.text(
      `Página ${i} de ${pageCount}`,
      195,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }

  doc.save(`relatorio-horas-extras-${brazilDateISO}.pdf`);
}

