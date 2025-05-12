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
      phone: [data.phone, [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      dni: [data.dni],
      email: [data.email, [Validators.email]],
      currentAccount: [data.currentAccount],
      discount: [data.discount],
      location: [data.location, [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.clientForm.valid) {
      const formData = {
        ...this.clientForm.value,
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
    if (control?.hasError('pattern')) {
      return 'Número de teléfono inválido (10 dígitos requeridos)';
    }
    return '';
  }
}