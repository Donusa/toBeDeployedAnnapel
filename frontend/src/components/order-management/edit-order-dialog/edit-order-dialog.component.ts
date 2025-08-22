import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormControl, ValidatorFn, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ClientService } from '../../../app/services/client.service';
import { ProductService } from '../../../app/services/product.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-edit-order-dialog',
  templateUrl: './edit-order-dialog.component.html',
  styleUrls: ['./edit-order-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatSlideToggleModule
  ]
})
export class EditOrderDialogComponent implements OnInit {
  orderForm: FormGroup;
  clients: any[] = [];
  products: any[] = [];
  shippingMethods: string[] = ['RETIRA_SIN_COSTO', 'ENVIO_DOMICILIO', 'ENVIO_CORREO'];
  minDate: Date | null = null;
  
  clientSearchControl = new FormControl();
  productSearchControls: FormControl[] = [];
  filteredClients: Observable<any[]>;
  filteredProducts: Observable<any[]>[] = [];
  
  isPaidDisabled: boolean = false;
  isDeliveredDisabled: boolean = false;
  useCustomDiscount: boolean = false;
  selectedClient: any = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditOrderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private clientService: ClientService,
    private productService: ProductService
  ) {
   
    const deliveryDate = data.deliveryDate ? this.fixTimezoneIssue(new Date(data.deliveryDate)) : null;
    
    this.orderForm = this.fb.group({
      clientId: [data.client?.id || data.clientId, Validators.required],
      products: this.fb.array([]),
      deliveryDate: [deliveryDate, [Validators.required, this.dateValidator()]],
      shippingMethod: [data.shippingMethod || '', Validators.required],
      paid: [data.paid || false],
      delivered: [data.delivered || false],
      paymentMethodId: [data.paymentMethod?.id || 1, Validators.required],
      shippingCost: [data.shippingCost || 0],
      amountDue: [data.amountDue || 0],
      customDiscount: [data.customDiscount || null, [Validators.min(0), Validators.max(100)]]
    });
    
    // Inicializar useCustomDiscount basado en si hay un descuento personalizado
    this.useCustomDiscount = data.customDiscount !== undefined && data.customDiscount !== null;

    this.filteredClients = this.clientSearchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterClients(value))
    );
  }

  ngOnInit(): void {
    this.isPaidDisabled = this.data.paid === true;
    this.isDeliveredDisabled = this.data.delivered === true;
    
    this.clientService.getClients().subscribe(clients => {
      this.clients = clients;
      const selectedClient = this.clients.find(c => c.id === (this.data?.client?.id || this.data?.clientId));
      if (selectedClient) {
        this.selectedClient = selectedClient;
        this.clientSearchControl.setValue(selectedClient, { emitEvent: false });
      }
    });
    
    this.clientSearchControl.valueChanges.subscribe(client => {
      if (client && client.id) {
        this.selectedClient = client;
      }
    });
    
    this.productService.getAllProducts().subscribe(products => {
      this.products = products;
      
      if (this.data.orderItems && this.data.orderItems.length > 0) {
        this.data.orderItems.forEach((orderItem: any) => {
          const productForm = this.fb.group({
            productId: [orderItem.productId, Validators.required],
            quantity: [orderItem.quantity, [Validators.required, Validators.min(1)]]
          });
          
          this.productForms.push(productForm);
          
          const selectedProduct = this.products.find(p => p.id === orderItem.productId);
          if (selectedProduct) {
            const control = this.getProductSearchControl(this.productForms.length - 1);
            control.setValue(selectedProduct, { emitEvent: false });
          }
        });
      } else {
        this.addProduct();
      }
    });

    setTimeout(() => {
      const values = {
        deliveryDate: this.data.deliveryDate ? this.fixTimezoneIssue(new Date(this.data.deliveryDate)) : null,
        shippingMethod: this.data.shippingMethod || null,
        shippingCost: this.data.shippingCost || 0,
        amountDue: this.data.amountDue || 0,
        paymentMethodId: this.data.paymentMethod?.id || 1,
        paid: this.data.paid || false,
        delivered: this.data.delivered || false
      };
      
      this.orderForm.patchValue(values);
      
      if (this.isPaidDisabled) {
        this.orderForm.get('paid')?.disable();
      }
      if (this.isDeliveredDisabled) {
        this.orderForm.get('delivered')?.disable();
      }
      
      this.orderForm.get('paid')?.valueChanges.subscribe(value => {
        if (value === true) {
          this.isPaidDisabled = true;
          this.orderForm.get('paid')?.disable();
        }
      });
      
      this.orderForm.get('delivered')?.valueChanges.subscribe(value => {
        if (value === true) {
          this.isDeliveredDisabled = true;
          this.orderForm.get('delivered')?.disable();
        }
      });
    });
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

  loadClients(): void {
    this.clientService.getClients().subscribe(clients => {
      this.clients = clients;
    });
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe(products => {
      this.products = products;
    });
  }

  get productForms() {
    return this.orderForm.get('products') as FormArray;
  }

  addProduct(product?: any): void {
    const selectedProductIds = this.productForms.controls
      .map(group => (group as FormGroup).get('productId')?.value)
      .filter(id => id);
    
    const availableProducts = this.products.filter(p => !selectedProductIds.includes(p.id));
    if (availableProducts.length === 0) return;

    const productForm = this.fb.group({
      productId: [product ? product.productId : '', [Validators.required, this.duplicateProductValidator()]],
      quantity: [product ? product.quantity : 1, [Validators.required, Validators.min(1), this.stockValidator()]]
    });
    this.productForms.push(productForm);
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

  hasAvailableProducts(): boolean {
    
    if (!this.products || this.products.length === 0) {
      return false;
    }
    
    const selectedProductIds = this.productForms.controls
      .map(group => (group as FormGroup).get('productId')?.value)
      .filter(id => id);
    
    const availableProducts = this.products.filter(product => !selectedProductIds.includes(product.id));
    return availableProducts.length > 0;
  }

  private dateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const initialValue = this.data.deliveryDate;
      const currentValue = control.value;
  
      if (this.data.id && initialValue) {
        const initialDate = new Date(initialValue).getTime();
        const currentDate = currentValue ? new Date(currentValue).getTime() : null;
        
        if (initialDate === currentDate) {
          return null;
        }
      }
      

      if (currentValue && control.dirty && new Date(currentValue) < new Date()) {
        return { pastDate: true };
      }
      
      return null;
    };
  }

  onSubmit(): void {
    if (this.orderForm.valid) {
      // Incluir valores de campos deshabilitados usando getRawValue()
      const rawFormValue = this.orderForm.getRawValue();
      const formData = {
        ...rawFormValue,
        id: this.data.id,
        clientId: this.clientSearchControl.value?.id || this.data.client?.id,
        products: this.productForms.value,
        // Si no se usa descuento personalizado, enviamos null para que use el del cliente
        customDiscount: this.useCustomDiscount ? rawFormValue.customDiscount : null
      };
      this.dialogRef.close(formData);
    } else {
      Object.keys(this.orderForm.controls).forEach(key => {
        const control = this.orderForm.get(key);
        if (control?.errors) {
          control.markAsTouched();
        }
      });
    }
  }
  
  getClientDiscount(): number {
    return this.selectedClient?.discount || 0;
  }
  
  getAppliedDiscount(): number {
    if (this.useCustomDiscount) {
      return this.orderForm.get('customDiscount')?.value || 0;
    }
    return this.getClientDiscount();
  }
  
  onDiscountTypeChange(): void {
    if (this.useCustomDiscount) {
      this.orderForm.get('customDiscount')?.setValidators([Validators.min(0), Validators.max(100)]);
    } else {
      this.orderForm.get('customDiscount')?.clearValidators();
      this.orderForm.get('customDiscount')?.setValue(null);
    }
    this.orderForm.get('customDiscount')?.updateValueAndValidity();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private fixTimezoneIssue(date: Date): Date {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() + offset);
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
}
