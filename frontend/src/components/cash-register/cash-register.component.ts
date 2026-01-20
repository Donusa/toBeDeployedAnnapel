import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { MatDialog } from '@angular/material/dialog';
import { SalesDetailsDialogComponent } from './sales-details-dialog/sales-details-dialog.component';
import { ReportService } from 'src/app/services/report.service';
import { DailyCashRegisterResponse } from 'src/responses/dailyCashRegisterResponse.interface';
import { ProductRankingResponse } from 'src/responses/productRankingResponse.interface';

@Component({
  selector: 'app-cash-register',
  templateUrl: './cash-register.component.html',
  styleUrls: ['./cash-register.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    CurrencyPipe
  ]
})
export class CashRegisterComponent implements OnInit {
  displayedColumns: string[] = ['date', 'user', 'sales', 'commission'];
  dataSource = new MatTableDataSource<any>();
  totalDailySales: number = 0;
  totalDailyCommissions: number = 0;
  totalCommissions: number = 0;
  isAdmin: boolean = false;
  userCommission: number = 0;
  userSales: number = 0;
  selectedDate: Date = new Date();
  userSalesData: any[] = [];

  // Product ranking properties
  productRankingColumns: string[] = ['ranking', 'product', 'quantity', 'orders'];
  productRankingDataSource = new MatTableDataSource<ProductRankingResponse>();
  startDate: Date = new Date();
  endDate: Date = new Date();

  // Commission history properties
  // commissionStartDate and commissionEndDate removed as we default to last 30 days


  constructor(
    private reportService: ReportService,
    private authService: AuthenticationService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadCashRegisterData();
    if (this.isAdmin) {
      this.loadProductRanking();
    }
  }

  loadCashRegisterData(): void {
    this.reportService.getDailyCashRegister(this.selectedDate).subscribe({
      next: (response: DailyCashRegisterResponse) => {
        this.totalDailySales = response.totalIncome;
        this.totalDailyCommissions = response.commissionAmount;
        // this.totalCommissions will be calculated in loadUserSalesData for the period
        this.loadUserSalesData();
      },
      error: (error) => {
        this.handleError(error, 'Error al cargar los datos de caja diaria');
      }
    });
  }

  loadUserSalesData(): void {
    // Calling without arguments triggers backend default (last month)
    this.reportService.getUserSalesReport().subscribe({
      next: (response) => {
        this.userSalesData = response;
        
        let tableData = response.map(userSales => ({
          date: userSales.date,
          user: userSales.user.username,
          sales: userSales.totalSales,
          commission: userSales.totalCommission,
          details: userSales
        }));

        this.totalCommissions = response.reduce((total, userSales) => {
          return total + (userSales.totalCommission || 0);
        }, 0);

        if (!this.isAdmin) {
          const currentUser = this.authService.getCurrentUser();
          tableData = tableData.filter(d => d.details.user.id === currentUser?.id);
          
          const mySales = response.filter(sale => sale.user.id === currentUser?.id);
          this.userCommission = mySales.reduce((acc, curr) => acc + (curr.totalCommission || 0), 0);
          this.userSales = mySales.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
        }
        
        this.dataSource.data = tableData;
      },
      error: (error) => {
        this.handleError(error, 'Error al cargar el reporte de ventas por usuario');
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

  loadProductRanking(): void {
    this.reportService.getProductRankingByDateRange(this.startDate, this.endDate).subscribe({
      next: (response: ProductRankingResponse[]) => {
        this.productRankingDataSource.data = response;
      },
      error: (error) => {
        this.handleError(error, 'Error al cargar el ranking de productos');
      }
    });
  }

  onDateRangeChange(): void {
    // Si la fecha hasta es anterior a la fecha desde, ajustarla automáticamente
    if (this.endDate < this.startDate) {
      this.endDate = new Date(this.startDate);
    }
    this.loadProductRanking();
  }

  onStartDateChange(): void {
    // Si la fecha hasta es anterior a la nueva fecha desde, ajustarla
    if (this.endDate < this.startDate) {
      this.endDate = new Date(this.startDate);
    }
    this.loadProductRanking();
  }
}