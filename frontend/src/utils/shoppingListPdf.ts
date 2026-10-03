import { jsPDF } from 'jspdf';
import { ShoppingListItem } from '../api/client';

const MARGIN = 20;
const LINE_HEIGHT = 9;
const PAGE_BOTTOM = 280;

export function exportShoppingListPdf(title: string, items: ShoppingListItem[]) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Cesta de la compra', MARGIN, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text(title, MARGIN, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`Generada el ${new Date().toLocaleDateString('es-ES')}`, MARGIN, y);
  doc.setTextColor(0);
  y += 12;

  if (items.length === 0) {
    doc.setFontSize(12);
    doc.text('No hay productos en esta lista.', MARGIN, y);
  }

  doc.setFontSize(12);
  for (const item of items) {
    if (y > PAGE_BOTTOM) {
      doc.addPage();
      y = 25;
    }
    doc.rect(MARGIN, y - 4, 4, 4);
    const label = item.quantity > 1 ? `${item.consumable.name} ×${item.quantity}` : item.consumable.name;
    doc.text(label, MARGIN + 8, y);
    y += LINE_HEIGHT;
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lista';
  doc.save(`cesta-${slug}.pdf`);
}
