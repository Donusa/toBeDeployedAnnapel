import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { ProductRankingResponse } from 'src/responses/productRankingResponse.interface';
import { UserCommissionResponse } from 'src/responses/userCommissionResponse.interface';
import { forkJoin, Subscription } from 'rxjs';

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
export class CashRegisterComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['date', 'user', 'gross', 'net', 'commission'];
  dataSource = new MatTableDataSource<any>();
  totalDailyGrossSales: number = 0;
  totalDailyDiscounts: number = 0;
  totalDailyNetSales: number = 0;
  totalDailyCommissions: number = 0;
  isAdmin: boolean = false;
  userCommission: number = 0;
  userSales: number = 0;
  cashStartDate: Date | null = new Date();
  cashEndDate: Date | null = new Date();
  appliedCashStartDate: Date | null = null;
  appliedCashEndDate: Date | null = null;
  cashRangeError: string = '';
  cashRegisterError: string = '';
  isLoadingCashRegister: boolean = false;
  hasCashRegisterData: boolean = false;
  userSalesData: UserCommissionResponse[] = [];
  private cashRegisterSubscription?: Subscription;

  // Product ranking properties
  productRankingColumns: string[] = ['ranking', 'product', 'quantity', 'orders'];
  productRankingDataSource = new MatTableDataSource<ProductRankingResponse>();
  startDate: Date = new Date();
  endDate: Date = new Date();

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
    this.cashRangeError = '';
    if (!(this.cashStartDate instanceof Date) || isNaN(this.cashStartDate.getTime()) ||
        !(this.cashEndDate instanceof Date) || isNaN(this.cashEndDate.getTime())) {
      this.cashRangeError = 'Ingresá una fecha desde y una fecha hasta válidas.';
      return;
    }

    const startDate = new Date(this.cashStartDate.getFullYear(), this.cashStartDate.getMonth(), this.cashStartDate.getDate());
    const endDate = new Date(this.cashEndDate.getFullYear(), this.cashEndDate.getMonth(), this.cashEndDate.getDate());
    if (endDate < startDate) {
      this.cashRangeError = 'La fecha hasta debe ser igual o posterior a la fecha desde.';
      return;
    }

    this.cashRegisterSubscription?.unsubscribe();
    this.isLoadingCashRegister = true;
    this.hasCashRegisterData = false;
    this.cashRegisterError = '';
    this.cashRegisterSubscription = forkJoin({
      cashRegister: this.reportService.getCashRegisterByDateRange(startDate, endDate),
      userSales: this.reportService.getUserSalesReport(undefined, startDate, endDate)
    }).subscribe({
      next: ({ cashRegister: response, userSales }) => {
        this.totalDailyGrossSales = response.grossIncome;
        this.totalDailyDiscounts = response.discountAmount;
        this.totalDailyNetSales = response.netIncome;
        this.totalDailyCommissions = response.commissionAmount;
        this.loadUserSalesData(userSales);
        this.appliedCashStartDate = startDate;
        this.appliedCashEndDate = endDate;
        this.isLoadingCashRegister = false;
        this.hasCashRegisterData = true;
      },
      error: (error) => {
        this.isLoadingCashRegister = false;
        this.cashRegisterError = 'No se pudo cargar la caja del período. Volvé a intentar.';
        this.handleError(error, 'Error al cargar los datos de caja del período');
      }
    });
  }

  applyCashDateRange(): void {
    this.loadCashRegisterData();
  }

  ngOnDestroy(): void {
    this.cashRegisterSubscription?.unsubscribe();
  }

  loadUserSalesData(response: UserCommissionResponse[]): void {
    this.userSalesData = response;

    let tableData = response.map(userSales => {
      const gross = (userSales.orders || []).reduce((accOrder, order) => {
        const orderGross = (order.orderItems || []).reduce((accItem, item) => accItem + ((item.price || 0) * (item.quantity || 0)), 0);
        return accOrder + orderGross;
      }, 0);

      return {
        date: userSales.date,
        user: userSales.user.username,
        sales: userSales.totalSales,
        gross: gross,
        commission: userSales.totalCommission,
        details: userSales
      };
    });

    if (!this.isAdmin) {
      const currentUser = this.authService.getCurrentUser();
      tableData = tableData.filter(d => d.details.user.id === currentUser?.id);

      const mySales = response.filter(sale => sale.user.id === currentUser?.id);
      this.userCommission = mySales.reduce((acc, curr) => acc + (curr.totalCommission || 0), 0);
      this.userSales = mySales.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
    }

    this.dataSource.data = tableData;
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
