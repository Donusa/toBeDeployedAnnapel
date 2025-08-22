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
    const doc = new jsPDF({
      format: 'a5',
      orientation: 'portrait'
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const logoPath = 'assets/logos/logo.png';
    const logoWidth = 25;
    const logoHeight = 25;
    const logoX = pageWidth - logoWidth - 5;
    const logoY = 5;
    doc.addImage(logoPath, 'PNG', logoX, logoY, logoWidth, logoHeight);

    doc.setFontSize(16);
    doc.text('Ticket de Compra', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Orden #: ${ticket.orderId}`, 10, 25);
    doc.text(`Fecha: ${new Date(ticket.orderDate).toLocaleDateString()}`, 10, 30);
    doc.text(`Estado de pago: ${ticket.paid ? 'Pagado' : 'Pendiente'}`, 10, 35);
    doc.text(`Método de pago: ${this.paymentMethodMap[ticket.paymentMethodName] || ticket.paymentMethodName}`, 10, 40);
    
    doc.setFontSize(12);
    doc.text('Datos del Cliente', 10, 50);
    doc.setFontSize(10);
    doc.text(`Cliente: ${ticket.client.name}`, 10, 55);
    doc.text(`Teléfono: ${ticket.client.phone}`, 10, 60);
    if (ticket.client.dni) {
      doc.text(`DNI: ${ticket.client.dni}`, 10, 65);
    }
    if (ticket.client.address) {
      doc.text(`Dirección: ${ticket.client.address}`, 10, ticket.client.dni ? 70 : 65);
    }
    
    let nextY = ticket.client.address ? (ticket.client.dni ? 75 : 70) : (ticket.client.dni ? 70 : 65);
    doc.text(`Descuento del cliente: ${ticket.client.discount || 0}%`, 10, nextY);
    nextY += 5;
    
    
    doc.text(`Descuento aplicado: ${ticket.discount ? ticket.discount : (ticket.client.discount || 0)}%`, 10, nextY);
    
    doc.setFontSize(12);
    doc.text('Vendedor', 10, nextY + 10);
    doc.setFontSize(10);
    doc.text(`Nombre: ${ticket.seller.username}`, 10, nextY + 15);

    const tableColumn = ['Producto', 'Código', 'Cantidad', 'Precio', 'Subtotal'];
    const tableRows: any[] = [];
    
    const clientDiscount = ticket.client.discount || 0;
    
    ticket.products.forEach(product => {
      const productSubtotal = product.price * product.amount;
      
      const discountedSubtotal = clientDiscount > 0 ? 
        productSubtotal * (1 - clientDiscount / 100) : 
        productSubtotal;
      
      const productData = [
        product.name,
        product.code,
        product.amount,
        `$${product.price.toFixed(2)}`,
        `$${discountedSubtotal.toFixed(2)}`
      ];
      tableRows.push(productData);
    });
    
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: nextY + 20,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [66, 66, 66]
      },
      margin: { left: 5, right: 5 }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(9);
    doc.text(`Subtotal: $${ticket.subtotal.toFixed(2)}`,pageWidth - 45, finalY);
    doc.setFontSize(9);
    doc.text(`Costo de envío: $${ticket.shippingCost.toFixed(2)}`, pageWidth - 45, finalY + 5);
    doc.setFontSize(11);
    doc.text(`Total: $${ticket.total.toFixed(2)}`, pageWidth - 45, finalY + 11);

    doc.setFontSize(8);
    
    doc.save(`ticket_${ticket.client}_${ticket.orderDate}_${ticket.orderId}.pdf`);
  }
}