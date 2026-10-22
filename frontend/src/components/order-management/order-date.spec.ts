import { FormBuilder } from '@angular/forms';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ClientService } from '../../app/services/client.service';
import { ProductService } from '../../app/services/product.service';
import { OrderService } from '../../app/services/order.service';
import { PdfService } from '../../app/services/pdf.service';
import { AddOrderDialogComponent } from './add-order-dialog/add-order-dialog.component';
import { EditOrderDialogComponent } from './edit-order-dialog/edit-order-dialog.component';
import { OrderManagementComponent } from './order-management.component';

describe('Order dates', () => {
  it('defaults a new order to the local current date', () => {
    jasmine.clock().install();
    try {
      const today = new Date(2026, 9, 20, 23, 30);
      jasmine.clock().mockDate(today);
      const dialog = new AddOrderDialogComponent(new FormBuilder(), null!, null!, null!, null!, null!);
      expect(dialog.orderForm.get('orderDate')?.value).toEqual(today);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('loads existing order and delivery dates as the same local calendar day', () => {
    const dialog = new EditOrderDialogComponent(
      new FormBuilder(), null!, { orderDate: '2000-02-29', deliveryDate: '2000-02-29' }, null!, null!
    );
    for (const field of ['orderDate', 'deliveryDate']) {
      const date = dialog.orderForm.get(field)?.value as Date;
      expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2000, 1, 29]);
    }
  });

  describe('delivery date inputs', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AddOrderDialogComponent, EditOrderDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: { close: () => {} } },
          { provide: MAT_DIALOG_DATA, useValue: { orderDate: '2026-10-20', deliveryDate: '2026-11-01' } },
          { provide: ClientService, useValue: { getClients: () => of([]) } },
          { provide: ProductService, useValue: { getAllProducts: () => of([]) } },
          { provide: OrderService, useValue: {} },
          { provide: PdfService, useValue: {} }
        ]
      }).compileComponents();
    });

    for (const dialogComponent of [AddOrderDialogComponent, EditOrderDialogComponent]) {
      it(`accepts past and future delivery dates in ${dialogComponent.name}`, fakeAsync(() => {
        const fixture = TestBed.createComponent<AddOrderDialogComponent | EditOrderDialogComponent>(dialogComponent);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const control = fixture.componentInstance.orderForm.get('deliveryDate')!;
        control.markAsDirty();
        for (const date of [new Date(2000, 1, 29), new Date(2099, 11, 31)]) {
          control.setValue(date);
          fixture.detectChanges();
          expect(control.valid).toBeTrue();
        }
        control.setValue(null);
        expect(control.hasError('required')).toBeTrue();
      }));
    }
  });

  it('requires an order date and accepts both past and future dates in both dialogs', () => {
    const dialogs = [
      new AddOrderDialogComponent(new FormBuilder(), null!, null!, null!, null!, null!),
      new EditOrderDialogComponent(new FormBuilder(), null!, { orderDate: '2026-10-20' }, null!, null!)
    ];
    for (const dialog of dialogs) {
      const control = dialog.orderForm.get('orderDate')!;
      control.setValue(null);
      expect(control.hasError('required')).toBeTrue();
      for (const date of [new Date(2000, 1, 29), new Date(2099, 11, 31)]) {
        control.setValue(date);
        expect(control.valid).toBeTrue();
      }
    }
  });

  describe('request serialization', () => {
    let orderService: jasmine.SpyObj<any>;
    let dialogService: jasmine.SpyObj<any>;
    let management: OrderManagementComponent;

    beforeEach(() => {
      orderService = jasmine.createSpyObj('OrderService', ['createOrder', 'updateOrder', 'getAllOrders']);
      orderService.createOrder.and.returnValue(of({ id: 1 }));
      orderService.updateOrder.and.returnValue(of({}));
      orderService.getAllOrders.and.returnValue(of([]));
      dialogService = jasmine.createSpyObj('MatDialog', ['open']);
      management = new OrderManagementComponent(
        orderService, dialogService, null!, jasmine.createSpyObj('MatSnackBar', ['open']), null!
      );
    });

    for (const hour of [0, 23]) {
      it(`sends the selected local calendar day on create and update at hour ${hour}`, () => {
        const formValue = () => ({
          orderDate: new Date(2026, 9, 20, hour, 30),
          deliveryDate: new Date(2000, 1, 29, hour, 30),
          products: [{ productId: 3, quantity: 1 }]
        });
        dialogService.open.and.returnValue({ afterClosed: () => of({ orderData: formValue() }) });
        management.openAddDialog();
        expect(orderService.createOrder.calls.mostRecent().args[0].orderDate).toBe('2026-10-20');
        expect(orderService.createOrder.calls.mostRecent().args[0].deliveryDate).toBe('2000-02-29');

        dialogService.open.and.returnValue({ afterClosed: () => of(formValue()) });
        management.openEditDialog({ id: 1, seller: { id: 2 } });
        expect(orderService.updateOrder.calls.mostRecent().args[1].orderDate).toBe('2026-10-20');
        expect(orderService.updateOrder.calls.mostRecent().args[1].deliveryDate).toBe('2000-02-29');
      });
    }

    it('filters today using the stored calendar date', () => {
      jasmine.clock().install();
      try {
        jasmine.clock().mockDate(new Date(2026, 9, 20, 12));
        management.dataSource.data = [
          { orderDate: '2026-10-19' }, { orderDate: '2026-10-20' }, { orderDate: '2026-10-21' }
        ];
        management.applyColumnFilter('orderDate');
        expect(management.dataSource.filteredData).toEqual([{ orderDate: '2026-10-20' }]);
      } finally {
        jasmine.clock().uninstall();
      }
    });
  });
});
