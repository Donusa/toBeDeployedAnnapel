import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-sales-details-dialog',
  templateUrl: './sales-details-dialog.component.html',
  styleUrls: ['./sales-details-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    CurrencyPipe
  ]
})
export class SalesDetailsDialogComponent {
  displayedColumns: string[] = ['id', 'clientName', 'orderDate', 'amountDue', 'paymentMethod'];
  dataSource = new MatTableDataSource<any>();
  sellerName: string = '';
  totalSales: number = 0;
  
  constructor(
    public dialogRef: MatDialogRef<SalesDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.sellerName = data.sellerName;
    this.dataSource.data = data.orders || [];
    this.calculateTotalSales();
  }

  calculateTotalSales(): void {
    this.totalSales = this.dataSource.data
      .reduce((total, order) => total + (order.amountDue || 0), 0);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}