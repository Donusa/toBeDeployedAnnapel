import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { ClientResponse } from '../../../responses/clientResponse.interface';

@Component({
  selector: 'app-edit-client-dialog',
  templateUrl: './edit-client-dialog.component.html',
  styleUrls: ['./edit-client-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ]
})
export class EditClientDialogComponent {
  clientForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditClientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClientResponse
  ) {
    this.clientForm = this.fb.group({
      name: [data.name, [Validators.required, Validators.minLength(3)]],
      address: [data.address],
      phone: [data.phone, [Validators.required]],
      dni: [data.dni],
      email: [data.email, [Validators.email]],
      currentAccount: [data.currentAccount],
      discount: [data.discount, [Validators.min(0), Validators.max(100)]],
      location: [data.location, [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.clientForm.valid) {
      const formValues = this.clientForm.value;
      const processedValues = Object.keys(formValues).reduce((result, key) => {
        result[key] = formValues[key] === '' ? null : formValues[key];
        return result;
      }, {} as any);
      
      const formData = {
        ...processedValues,
        id: this.data.id
      };
      this.dialogRef.close(formData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(controlName: string): string {
    const control = this.clientForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    if (control?.hasError('minlength')) {
      return 'El nombre debe tener al menos 3 caracteres';
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