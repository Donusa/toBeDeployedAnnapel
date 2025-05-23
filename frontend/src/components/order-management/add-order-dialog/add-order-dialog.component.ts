import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ClientService } from '../../../app/services/client.service';
import { ProductService } from '../../../app/services/product.service';
import { OrderService } from '../../../app/services/order.service';
import { PdfService } from '../../../app/services/pdf.service';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Product } from '../../../interfaces/product.interface'; 

@Component({
  selector: 'app-add-order-dialog',
  templateUrl: './add-order-dialog.component.html',
  styleUrls: ['./add-order-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatAutocompleteModule
  ]
})
export class AddOrderDialogComponent implements OnInit {
  orderForm: FormGroup;
  clients: any[] = [];
  products: any[] = [];
  shippingMethods: string[] = ['RETIRA_SIN_COSTO', 'ENVIO_DOMICILIO', 'ENVIO_CORREO'];
  minDate: Date = new Date();
  
  clientSearchControl = new FormControl();
  productSearchControls: FormControl[] = [];
  filteredClients: Observable<any[]>;
  filteredProducts: Observable<any[]>[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddOrderDialogComponent>,
    private clientService: ClientService,
    private productService: ProductService,
    private orderService: OrderService,
    private pdfService: PdfService
  ) {
    this.orderForm = this.fb.group({
      clientId: ['', Validators.required],
      products: this.fb.array([]),
      deliveryDate: ['', Validators.required],
      shippingMethod: ['', Validators.required],
      delivered: [false],
      paid: [false],
      amountDue: [0.0],
      paymentMethodId: [null, Validators.required],
      shippingCost: [0.0],
      sellerId: [localStorage.getItem('id')]
    });

    this.filteredClients = this.clientSearchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterClients(value))
    );
  }

  private _filterClients(value: any): any[] {
    if (!value) return this.clients;
    
    const filterValue = typeof value === 'string' ? value.toLowerCase() : value.name?.toLowerCase() || '';
    return this.clients.filter(client => 
      client.name.toLowerCase().includes(filterValue) ||
      client.phone.toLowerCase().includes(filterValue) ||
      (client.dni ? client.dni.toLowerCase().includes(filterValue) : false)
    );
  }

  private _filterProducts(value: any): any[] {
    if (!value) {
      const currentIndex = this.productSearchControls.findIndex(control => control.value === value);
      const selectedProductIds = this.productForms.controls
        .filter((_, index) => index !== currentIndex)
        .map(group => (group as FormGroup).get('productId')?.value)
        .filter(id => id);
      return this.products.filter(product => !selectedProductIds.includes(product.id));
    }
    
    const filterValue = typeof value === 'string' ? value.toLowerCase() : value.name?.toLowerCase() || '';
    const currentIndex = this.productSearchControls.findIndex(control => control.value === value);
    
    const selectedProductIds = this.productForms.controls
      .filter((_, index) => index !== currentIndex)
      .map(group => (group as FormGroup).get('productId')?.value)
      .filter(id => id);
    
    return this.products
      .filter(product => !selectedProductIds.includes(product.id))
      .filter(product => 
        product.name.toLowerCase().includes(filterValue) ||
        (product.code && product.code.toLowerCase().includes(filterValue))
      );
  }

  getProductSearchControl(index: number): FormControl {
    if (!this.productSearchControls[index]) {
      this.productSearchControls[index] = new FormControl();
      this.filteredProducts[index] = this.productSearchControls[index].valueChanges.pipe(
        startWith(''),
        map(value => this._filterProducts(value))
      );

      this.productSearchControls[index].valueChanges.subscribe(product => {
        if (product && product.id) {
          const productGroup = (this.productForms.at(index) as FormGroup);
          productGroup.patchValue({
            productId: product.id
          });
        }
      });
    }
    return this.productSearchControls[index];
  }

  displayClientFn(client: any): string {
    return client ? client.name : '';
  }

  displayProductFn(product: any): string {
    return product ? product.name : '';
  }

  hasAvailableProducts(): boolean {
    if (!this.products || this.products.length === 0) {
      return false;
    }
    
    const selectedProductIds = this.productForms.controls
      .map(group => (group as FormGroup).get('productId')?.value)
      .filter(id => id);
    
    return this.products.some(product => !selectedProductIds.includes(product.id));
  }

  addProduct(): void {
    if (!this.hasAvailableProducts()) {
      return;
    }

    const lastProductForm = this.productForms.length > 0 ? this.productForms.at(this.productForms.length - 1) as FormGroup : null;
    if (lastProductForm && !lastProductForm.valid) {
      return;
    }

    const productForm = this.fb.group({
      productId: ['', [Validators.required, this.duplicateProductValidator()]],
      quantity: [0, [Validators.required, Validators.min(1), this.stockValidator()]]
    });
    this.productForms.push(productForm);
  }

  duplicateProductValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const productId = control.value;
      
      if (!productId) {
        return null;
      }

      const currentGroup = control.parent as FormGroup;
      if (!currentGroup) {
        return null;
      }

      const currentIndex = this.productForms.controls.findIndex(group => group === currentGroup);
      
      if (currentIndex === -1) {
        return null;
      }
      
      const existingProducts = this.productForms.controls
        .filter((_, index) => index !== currentIndex)
        .map(group => (group as FormGroup).get('productId')?.value);

      if (existingProducts.includes(productId)) {
        return { duplicateProduct: true };
      }
      return null;
    };
  }
  

  stockValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const quantity = control.value;
      const productGroup = control.parent;
      if (!productGroup) return null;
      
      const productId = productGroup.get('productId')?.value;
      const product = this.products.find(p => p.id === productId);
      
      if (product && quantity > product.currentStock) {
        return { stockExceeded: true };
      }
      return null;
    };
  }

  removeProduct(index: number): void {
    if (this.productForms.length > 1) {
      if (this.productSearchControls[index]) {
        this.productSearchControls[index].setValue(null);
        this.productSearchControls.splice(index, 1);
        this.filteredProducts.splice(index, 1);
      }
      
      this.productForms.removeAt(index);
      
      this.productForms.controls.forEach((control) => {
        const productIdControl = (control as FormGroup).get('productId');
        if (productIdControl) {
          productIdControl.updateValueAndValidity();
        }
      });
      
      this.orderForm.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.orderForm.valid) {
      this.dialogRef.close({
        orderData: this.orderForm.value,
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get productForms() {
    return this.orderForm.get('products') as FormArray;
  }

  ngOnInit() {
    this.clientService.getClients().subscribe(clients => {
      this.clients = clients;
    });

    this.productService.getAllProducts().subscribe((products: Product[]) => {
      this.products = products;
    });

    this.clientSearchControl.valueChanges.subscribe(client => {
      if (client && client.id) {
        this.orderForm.patchValue({
          clientId: client.id
        });
      }
    });

    this.addProduct();
    this.orderForm.setValidators(this.atLeastOneProductValidator());
    this.orderForm.updateValueAndValidity();
  }

  ngAfterViewInit() {
    const textFields = document.getElementsByClassName('mat-mdc-text-field-wrapper');
    Array.from(textFields).forEach((n) => {
      (n as HTMLElement).style.setProperty('height','55px','important');
      })
    }

  private atLeastOneProductValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const products = (formGroup as FormGroup).get('products') as FormArray;
      if (!products || products.length === 0) {
        return { noProducts: true };
      }
      
      const hasValidProduct = products.controls.some(product => {
        const productId = product.get('productId')?.value;
        const quantity = product.get('quantity')?.value;
        return productId && quantity && quantity > 0;
      });
      
      return hasValidProduct ? null : { noProducts: true };
    };
  }
}