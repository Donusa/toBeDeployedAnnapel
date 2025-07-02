import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-add-customer-dialog',
  templateUrl: './add-client-dialog.component.html',
  styleUrls: ['./add-client-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class AddCustomerDialogComponent implements OnInit {
  customerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddCustomerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      address: [''],
      phone: ['', Validators.required],
      dni: [''],
      email: ['', [Validators.email]],
      currentAccount: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      location: ['', Validators.required]
    });

    if (data) {
      this.customerForm.patchValue(data);
    }
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.customerForm.valid) {
      const formValues = this.customerForm.value;
      const clientData = Object.keys(formValues).reduce((result, key) => {
        result[key] = formValues[key] === '' ? null : formValues[key];
        return result;
      }, {} as any);
      
      this.dialogRef.close(clientData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(controlName: string): string {
    const control = this.customerForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    if (control?.hasError('min')) {
      return 'El valor no puede ser menor a 0';
    }
    if (control?.hasError('max')) {
      return 'El descuento no puede ser mayor a 100%';
    }
    return '';
  }
}