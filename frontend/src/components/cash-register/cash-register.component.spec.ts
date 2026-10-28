import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AuthenticationService } from '../../app/services/authentication.service';
import { ReportService } from '../../app/services/report.service';
import { DailyCashRegisterResponse } from '../../responses/dailyCashRegisterResponse.interface';
import { UserCommissionResponse } from '../../responses/userCommissionResponse.interface';
import { CashRegisterComponent } from './cash-register.component';

describe('Cash register date ranges', () => {
  let reports: jasmine.SpyObj<ReportService>;
  let auth: jasmine.SpyObj<AuthenticationService>;
  let component: CashRegisterComponent;

  const summary = (grossIncome = 300, netIncome = 270): DailyCashRegisterResponse => ({
    productsSold: [], cashIncome: netIncome, cardIncome: 0, transferIncome: 0,
    totalIncome: netIncome, grossIncome, discountAmount: grossIncome - netIncome,
    netIncome, commissionPercentage: 0, commissionAmount: 27, shippingPayments: 0
  });

  const employeeSales = (): UserCommissionResponse[] => [
    { user: { id: 1, username: 'Ana' }, orders: [{ orderItems: [{ price: 100, quantity: 1 }] }],
      totalSales: 90, totalCommission: 9, date: '2026-10-01' },
    { user: { id: 2, username: 'Bea' }, orders: [{ orderItems: [{ price: 100, quantity: 2 }] }],
      totalSales: 180, totalCommission: 18, date: '2026-10-27' }
  ] as UserCommissionResponse[];

  beforeEach(() => {
    reports = jasmine.createSpyObj('ReportService', [
      'getCashRegisterByDateRange', 'getUserSalesReport', 'getProductRankingByDateRange'
    ]);
    reports.getCashRegisterByDateRange.and.returnValue(of(summary()));
    reports.getUserSalesReport.and.returnValue(of(employeeSales()));
    reports.getProductRankingByDateRange.and.returnValue(of([]));
    auth = jasmine.createSpyObj('AuthenticationService', ['isAdmin', 'getCurrentUser']);
    auth.isAdmin.and.returnValue(false);
    auth.getCurrentUser.and.returnValue({ id: 1 });
    component = new CashRegisterComponent(reports, auth, null!, null!);
    component.cashStartDate = new Date(2026, 9, 1);
    component.cashEndDate = new Date(2026, 9, 27);
  });

  it('queries totals and employee details for the same selected range', () => {
    component.applyCashDateRange();
    const [start, end] = reports.getCashRegisterByDateRange.calls.mostRecent().args;
    expect(start).toEqual(new Date(2026, 9, 1));
    expect(end).toEqual(new Date(2026, 9, 27));
    expect(reports.getUserSalesReport).toHaveBeenCalledWith(undefined, start, end);
    expect(component.totalDailyGrossSales).toBe(300);
    expect(component.totalDailyNetSales).toBe(270);
    expect(component.hasCashRegisterData).toBeTrue();
    expect(component.isLoadingCashRegister).toBeFalse();
  });

  it('keeps all employee totals while showing the current employee own sales and commission', () => {
    component.applyCashDateRange();
    expect(component.totalDailyGrossSales).toBe(300);
    expect(component.totalDailyNetSales).toBe(270);
    expect(component.dataSource.data.map(row => row.user)).toEqual(['Ana']);
    expect(component.userSales).toBe(90);
    expect(component.userCommission).toBe(9);
  });

  it('shows all employee rows to administrators', () => {
    component.isAdmin = true;
    component.applyCashDateRange();
    expect(component.dataSource.data.map(row => row.user)).toEqual(['Ana', 'Bea']);
    expect(component.totalDailyCommissions).toBe(27);
  });

  for (const invalid of ['missing start', 'missing end', 'invalid date', 'reversed dates']) {
    it(`rejects ${invalid} before requesting a report`, () => {
      if (invalid === 'missing start') component.cashStartDate = null;
      if (invalid === 'missing end') component.cashEndDate = null;
      if (invalid === 'invalid date') component.cashStartDate = new Date(NaN);
      if (invalid === 'reversed dates') component.cashEndDate = new Date(2026, 8, 30);
      component.applyCashDateRange();
      expect(component.cashRangeError).toBeTruthy();
      expect(reports.getCashRegisterByDateRange).not.toHaveBeenCalled();
      expect(reports.getUserSalesReport).not.toHaveBeenCalled();
    });
  }

  it('allows the same start and end date', () => {
    component.cashEndDate = new Date(component.cashStartDate!);
    component.applyCashDateRange();
    expect(component.cashRangeError).toBeFalsy();
    expect(reports.getCashRegisterByDateRange).toHaveBeenCalled();
  });

  it('replaces previous results with zeros and no rows when a range has no sales', () => {
    component.applyCashDateRange();
    reports.getCashRegisterByDateRange.and.returnValue(of(summary(0, 0)));
    reports.getUserSalesReport.and.returnValue(of([]));
    component.applyCashDateRange();
    expect(component.totalDailyGrossSales).toBe(0);
    expect(component.totalDailyNetSales).toBe(0);
    expect(component.dataSource.data).toEqual([]);
    expect(component.userSales).toBe(0);
    expect(component.userCommission).toBe(0);
    expect(component.hasCashRegisterData).toBeTrue();
  });

  it('shows a loading state while the selected report is pending', () => {
    const pending = new Subject<DailyCashRegisterResponse>();
    reports.getCashRegisterByDateRange.and.returnValue(pending);
    component.applyCashDateRange();
    expect(component.isLoadingCashRegister).toBeTrue();
    pending.next(summary());
    pending.complete();
    expect(component.isLoadingCashRegister).toBeFalse();
  });

  it('does not present a failed range as a successful report', () => {
    spyOn(console, 'error');
    component.applyCashDateRange();
    reports.getCashRegisterByDateRange.and.returnValue(throwError(() => new Error('offline')));
    component.applyCashDateRange();
    expect(component.isLoadingCashRegister).toBeFalse();
    expect(component.hasCashRegisterData).toBeFalse();
    expect(component.cashRegisterError).toBeTruthy();
  });

  it('does not show totals for a range whose employee details failed to load', () => {
    spyOn(console, 'error');
    reports.getUserSalesReport.and.returnValue(throwError(() => new Error('offline')));
    component.applyCashDateRange();
    expect(component.hasCashRegisterData).toBeFalse();
    expect(component.cashRegisterError).toBeTruthy();
    expect(component.isLoadingCashRegister).toBeFalse();
  });

  it('keeps the displayed range tied to the successful request until a new range is applied', () => {
    component.applyCashDateRange();
    component.cashStartDate = new Date(2026, 8, 1);
    component.cashEndDate = new Date(2026, 8, 30);
    expect(component.appliedCashStartDate).toEqual(new Date(2026, 9, 1));
    expect(component.appliedCashEndDate).toEqual(new Date(2026, 9, 27));
    expect(reports.getCashRegisterByDateRange).toHaveBeenCalledTimes(1);
  });

  it('prevents an older pending request from overwriting the last selected range', () => {
    const earlier = new Subject<DailyCashRegisterResponse>();
    reports.getCashRegisterByDateRange.and.returnValue(earlier);
    component.applyCashDateRange();
    reports.getCashRegisterByDateRange.and.returnValue(of(summary(500, 450)));
    component.cashStartDate = new Date(2026, 8, 1);
    component.cashEndDate = new Date(2026, 8, 30);
    component.applyCashDateRange();
    earlier.next(summary(100, 90));
    earlier.complete();
    expect(component.totalDailyGrossSales).toBe(500);
    expect(component.totalDailyNetSales).toBe(450);
    expect(component.appliedCashStartDate).toEqual(new Date(2026, 8, 1));
    expect(component.appliedCashEndDate).toEqual(new Date(2026, 8, 30));
  });

  describe('summary visibility', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [CashRegisterComponent, NoopAnimationsModule],
        providers: [
          { provide: ReportService, useValue: reports },
          { provide: AuthenticationService, useValue: auth },
          { provide: Router, useValue: {} },
          { provide: MatDialog, useValue: {} }
        ]
      }).compileComponents();
    });

    for (const isAdmin of [false, true]) {
      it(`shows gross and net totals for ${isAdmin ? 'administrators' : 'employees'}`, () => {
        auth.isAdmin.and.returnValue(isAdmin);
        const fixture = TestBed.createComponent(CashRegisterComponent);
        fixture.detectChanges();
        const cards: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('mat-card'));
        const gross = cards.find(card => /brut/i.test(card.querySelector('mat-card-title')?.textContent || ''));
        const net = cards.find(card => /net/i.test(card.querySelector('mat-card-title')?.textContent || ''));
        expect(gross?.textContent).toContain('300');
        expect(net?.textContent).toContain('270');
      });
    }
  });
});
