import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OvertimeEntry, AppSettings, EntryType } from '../types';
import { formatCurrency } from './utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function generatePDF(entries: OvertimeEntry[], settings: AppSettings) {
  const doc = new jsPDF();
  const now = new Date();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.text('Jornada+', 15, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Relatório de Horas Extras - Gerado em ${format(now, "dd/MM/yyyy HH:mm")}`, 15, 28);
  
  // Summary Section
  const totalHours = entries.reduce((acc, curr) => acc + curr.calculatedHours, 0);
  const totalValue = entries.reduce((acc, curr) => acc + curr.calculatedValue, 0);
  
  doc.setFillColor(245, 245, 245);
  doc.rect(15, 35, 180, 25, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('TOTAL DE HORAS', 20, 43);
  doc.text('GANHO TOTAL ESTIMADO', 80, 43);
  
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(`${totalHours.toFixed(1)}h`, 20, 52);
  doc.setTextColor(0, 150, 0);
  doc.text(formatCurrency(totalValue), 80, 52);

  // Entries Table
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text('Histórico de Registros', 15, 75);

  const tableData = entries.map(entry => [
    format(parseISO(entry.date), 'dd/MM/yyyy'),
    `${entry.entryTime} - ${entry.exitTime}`,
    `${entry.calculatedHours.toFixed(2)}h`,
    entry.multiplier === 1.0 ? '50%' : '100%',
    formatCurrency(entry.calculatedValue),
    entry.notes || '-'
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['Data', 'Horário', 'Duração', 'Mult.', 'Valor', 'Observações']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [20, 20, 20], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      5: { cellWidth: 50 } // Give more space to notes
    }
  });

  // Footer text
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Jornada+ | Controle Inteligente de Horas | Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`relatorio-jornada-${format(now, 'yyyy-MM-dd')}.pdf`);
}
