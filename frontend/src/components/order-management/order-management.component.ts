import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { OrderService } from 'src/app/services/order.service';
import { PdfService } from 'src/app/services/pdf.service';
import { AddOrderDialogComponent } from './add-order-dialog/add-order-dialog.component';
import { EditOrderDialogComponent } from './edit-order-dialog/edit-order-dialog.component';
import { ViewOrderDialogComponent } from './view-order-dialog/view-order-dialog.component';

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.css'],
  standalone: true,
  imports: [
    MatTableModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    DatePipe,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule
  ]
})
export class OrderManagementComponent implements OnInit {
  displayedColumns: string[] = [
    'clientName',
    'deliveryDate',
    'orderDate',
    'delivered',
    'paid',
    'paymentMethod',
    'amountDue',
    'shippingMethod',
    'seller',
    'actions'
  ];
  dataSource = new MatTableDataSource<any>();
  searchText: string = '';
  currentFilterColumn: string = '';
  
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private orderService: OrderService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar,
    private pdfService: PdfService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }
  
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.setupCustomSorting();
  }
  
  setupCustomSorting() {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch(property) {
        case 'clientName': return item.client.name.toLowerCase();
        case 'amountDue': return item.client.currentAccount;
        case 'paymentMethod': return item.paymentMethod.name;
        case 'delivered': return item.delivered ? 1 : 0;
        case 'paid': return item.paid ? 1 : 0;
        case 'seller': return item.seller.username.toLowerCase();
        default: return item[property];
      }
    };
  }
  
  applyColumnFilter(column: string) {
    if (this.dataSource.filter === 'true' && this.currentFilterColumn === column) {
      this.clearFilters();
      return;
    }
    
    let filterValue = '';
    this.currentFilterColumn = column;
    
    switch(column) {
      case 'delivered':
        this.dataSource.filterPredicate = (data: any, filter: string) => {
          return data.delivered === (filter === 'true');
        };
        filterValue = 'true';
        break;
      case 'paid':
        this.dataSource.filterPredicate = (data: any, filter: string) => {
          return data.paid === (filter === 'true');
        };
        filterValue = 'true';
        break;
      case 'amountDue':
        this.dataSource.filterPredicate = (data: any, filter: string) => {
          return data.amountDue > 0;
        };
        filterValue = 'true';
        break;
      case 'orderDate':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.dataSource.filterPredicate = (data: any, filter: string) => {
          const orderDate = new Date(data.orderDate);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        };
        filterValue = 'true';
        break;
      default:
        this.dataSource.filter = '';
        return;
    }
    
    this.dataSource.filter = filterValue;
  }

  loadOrders(): void {
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        console.log('[OrderManagement] Información de pedidos recibida:', orders);
        orders.forEach(order => {
          if (order.paymentMethod === null) {
            if (order.paymentMethod === 1) {
              order.paymentMethod = { id: 1, name: 'Efectivo' };
            } else if (order.paymentMethod === 2) {
              order.paymentMethod = { id: 2, name: 'Tarjeta' };
            } else if (order.paymentMethod === 3) {
              order.paymentMethod = { id: 3, name: 'Transferencia' };
            }
          }
        });
        
        orders.sort((a, b) => {
          if (a.delivered !== b.delivered) {
            return a.delivered ? 1 : -1;
          }
          return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
        });
        
        this.dataSource.data = orders;
      },
      error: (error) => {
        this.snackBar.open('Error al cargar los pedidos', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      return data.client.name.toLowerCase().includes(filter.toLowerCase()) ||
             data.id.toString().includes(filter);
    };
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  
  clearFilters(): void {
    this.dataSource.filter = '';
    this.currentFilterColumn = '';
    const input = document.querySelector('input[matInput]') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddOrderDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const orderData = result.orderData || result;
        const downloadTicketCallback = result.downloadTicket;
        
        if (orderData.deliveryDate) {
          orderData.deliveryDate = orderData.deliveryDate.toISOString().split('T')[0];
        }
        
        const orderRequest = {
          ...orderData,
          orderItems: orderData.products.map((p: { productId: number; quantity: number }) => ({
            productId: p.productId,
            quantity: p.quantity
          })),
          sellerId: Number(localStorage.getItem('id'))
        };
        delete orderRequest.products;
        
        this.orderService.createOrder(orderRequest).subscribe({
          next: (response) => {
            this.snackBar.open('Pedido creado con éxito', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadOrders();
            
            if (downloadTicketCallback && response && response.id) {
              downloadTicketCallback(response.id);
            }
          },
          error: (error) => {
            this.snackBar.open('Error al crear el pedido', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  openEditDialog(order: any): void {
    const dialogRef = this.dialog.open(EditOrderDialogComponent, {
      width: '600px',
      data: order
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.deliveryDate) {
          result.deliveryDate = result.deliveryDate.toISOString().split('T')[0];
        }

        const orderRequest = {
          ...result,
          orderItems: result.products.map((p: { productId: number; quantity: number }) => ({
            productId: p.productId,
            quantity: p.quantity
          })),
          sellerId: order.seller.id 
        };
        delete orderRequest.products;

        this.orderService.updateOrder(order.id, orderRequest).subscribe({
          next: () => {
            this.snackBar.open('Pedido actualizado con éxito', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadOrders();
          },
          error: (error) => {
            this.snackBar.open('Error al actualizar el pedido', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  openViewDialog(order: any): void {
    const dialogRef = this.dialog.open(ViewOrderDialogComponent, {
      width: '600px',
      data: order
    });
  }

  deleteOrder(id: number): void {
    if (confirm('¿Está seguro que desea eliminar este pedido?')) {
      this.orderService.deleteOrder(id).subscribe({
        next: () => {
          this.snackBar.open('Pedido eliminado con éxito', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadOrders();
        },
        error: (error) => {
          this.snackBar.open('Error al eliminar el pedido', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  printTicket(orderId: number): void {
    
    this.orderService.getTicket(orderId).subscribe({
      next: (response) => {
        try {
          this.pdfService.generateTicketPdf(response);
        } catch (error) {
          console.error('[OrderManagement] Error al generar el PDF:', error);
          this.snackBar.open('Error al generar el PDF del ticket', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('[OrderManagement] Error al obtener el ticket del servidor:', error);
        this.snackBar.open('Error al generar el ticket', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}