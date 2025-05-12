import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { TicketResponse } from 'src/responses/ticketResponse.interface';
import { OrderItemResponse } from 'src/responses/orderItemResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  private paymentMethodMap: { [key: string]: string } = {
    'CASH': 'Efectivo',
    'CARD': 'Tarjeta',
    'TRANSFER': 'Transferencia'
  };

  constructor() { }

  /**
   * Genera un PDF a partir de los datos del ticket y lo descarga
   * @param ticket Datos del ticket a convertir en PDF
   */
  generateTicketPdf(ticket: TicketResponse): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const logoPath = 'assets/logos/logo.png';
    const logoWidth = 40;
    const logoHeight = 40;
    const logoX = pageWidth - logoWidth - 10;
    const logoY = 10;
    doc.addImage(logoPath, 'PNG', logoX, logoY, logoWidth, logoHeight);

    doc.setFontSize(18);
    doc.text('Ticket de Compra', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Orden #: ${ticket.orderId}`, 20, 35);
    doc.text(`Fecha: ${new Date(ticket.orderDate).toLocaleDateString()}`, 20, 42);
    doc.text(`Estado de pago: ${ticket.paid ? 'Pagado' : 'Pendiente'}`, 20, 49);
    doc.text(`Método de pago: ${this.paymentMethodMap[ticket.paymentMethodName] || ticket.paymentMethodName}`, 20, 56);
    
    doc.setFontSize(14);
    doc.text('Datos del Cliente', 20, 70);
    doc.setFontSize(12);
    doc.text(`Cliente: ${ticket.client.name}`, 20, 77);
    doc.text(`Teléfono: ${ticket.client.phone}`, 20, 84);
    if (ticket.client.address) {
      doc.text(`Dirección: ${ticket.client.address}`, 20, 91);
    }
    
    doc.setFontSize(14);
    doc.text('Vendedor', 20, 105);
    doc.setFontSize(12);
    doc.text(`Nombre: ${ticket.seller.username}`, 20, 112);

    const tableColumn = ['Producto', 'Código', 'Cantidad', 'Precio', 'Subtotal'];
    const tableRows: any[] = [];
    
    ticket.products.forEach(product => {
      const productData = [
        product.name,
        product.code,
        product.amount,
        `$${product.price.toFixed(2)}`,
        `$${ticket.subtotal.toFixed(2)}`
      ];
      tableRows.push(productData);
    });
    
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 125,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [66, 66, 66]
      }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Subtotal: $${ticket.subtotal.toFixed(2)}`, pageWidth - 60, finalY);
    doc.text(`Costo de envío: $${ticket.shippingCost.toFixed(2)}`, pageWidth - 60, finalY + 7);
    doc.setFontSize(14);
    doc.text(`Total: $${ticket.total.toFixed(2)}`, pageWidth - 60, finalY + 15);

    doc.setFontSize(10);
    
    doc.save(`ticket_${ticket.client}_${ticket.orderDate}_${ticket.orderId}.pdf`);
  }
}