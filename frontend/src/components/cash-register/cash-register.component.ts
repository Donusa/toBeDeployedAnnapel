import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { MatDialog } from '@angular/material/dialog';
import { SalesDetailsDialogComponent } from './sales-details-dialog/sales-details-dialog.component';
import { ReportService } from 'src/app/services/report.service';
import { DailyCashRegisterResponse } from 'src/responses/dailyCashRegisterResponse.interface';

@Component({
  selector: 'app-cash-register',
  templateUrl: './cash-register.component.html',
  styleUrls: ['./cash-register.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    CurrencyPipe
  ]
})
export class CashRegisterComponent implements OnInit {
  displayedColumns: string[] = ['user', 'sales', 'commission'];
  dataSource = new MatTableDataSource<any>();
  totalDailySales: number = 0;
  totalCommissions: number = 0;
  isAdmin: boolean = false;
  userCommission: number = 0;
  userSales: number = 0;
  selectedDate: Date = new Date();
  userSalesData: any[] = [];

  constructor(
    private reportService: ReportService,
    private authService: AuthenticationService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadCashRegisterData();
  }

  loadCashRegisterData(): void {
    this.reportService.getDailyCashRegister(this.selectedDate).subscribe({
      next: (response: DailyCashRegisterResponse) => {
        this.totalDailySales = response.totalIncome;
        this.totalCommissions = response.commissionAmount;
        this.loadUserSalesData();
      },
      error: (error) => {
        this.handleError(error, 'Error al cargar los datos de caja diaria');
      }
    });
  }

  loadUserSalesData(): void {
    this.reportService.getUserSalesReport(this.selectedDate).subscribe({
      next: (response) => {
        this.userSalesData = response;
        this.dataSource.data = response.map(userSales => ({
          user: userSales.user.username,
          sales: userSales.totalSales,
          commission: userSales.totalCommission,
          details: userSales
        }));

        if (!this.isAdmin) {
          const currentUser = this.authService.getCurrentUser();
          const userSalesData = response.find(sale => sale.user.id === currentUser?.id);
          this.userCommission = userSalesData?.totalCommission || 0;
          this.userSales = userSalesData?.totalSales || 0;
        }
      },
      error: (error) => {
        this.handleError(error, 'Error al cargar los datos de comisiones por usuario');
      }
    });
  }

  checkUserRole(): void {
    this.isAdmin = this.authService.isAdmin();
  }


  goToHome(): void {
    this.router.navigate(['/home']);
  }

  handleError(error: Error, message: string): void {
    console.error(message, error);
  }

  openSalesDetailsDialog(row: any): void {
    this.dialog.open(SalesDetailsDialogComponent, {
      width: '800px',
      data: row.details
    });
  }
   
}