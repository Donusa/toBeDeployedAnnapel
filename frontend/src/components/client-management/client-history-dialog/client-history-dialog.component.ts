import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from 'src/app/services/order.service';
import { OrderResponse } from 'src/responses/orderResponse.interface';

@Component({
  selector: 'app-client-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './client-history-dialog.component.html',
  styleUrls: ['./client-history-dialog.component.css']
})
export class ClientHistoryDialogComponent implements OnInit {
  displayedColumns: string[] = ['date', 'id', 'total', 'debt', 'discount', 'status'];
  dataSource = new MatTableDataSource<OrderResponse>();
  clientName: string = '';

  constructor(
    public dialogRef: MatDialogRef<ClientHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { clientId: number, clientName: string },
    private orderService: OrderService
  ) {
    this.clientName = data.clientName;
  }

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.orderService.getOrdersByClient(this.data.clientId).subscribe({
      next: (orders) => {
        // Sort by date descending
        orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        this.dataSource.data = orders;
      },
      error: (error) => {
        console.error('Error loading client history:', error);
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  getDebt(order: OrderResponse): number {
    return !order.paid ? order.amountDue : 0;
  }
}
